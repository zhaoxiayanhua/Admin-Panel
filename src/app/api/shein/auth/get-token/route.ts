import { NextRequest, NextResponse } from 'next/server';
import { generateAuthSignature } from '@/lib/shein/auth-utils';
import { AESTools } from '@/lib/shein/aes-tools';

// SHEIN API 配置
const SHEIN_API_BASE_URL = process.env.SHEIN_API_BASE_URL || 'https://openapi.sheincorp.com';
const SHEIN_APP_ID = process.env.SHEIN_APP_ID || '';
const SHEIN_APP_SECRET_KEY = process.env.SHEIN_APP_SECRET_KEY || '';

/**
 * 通过 tempToken 获取店铺授权密钥
 * POST /api/shein/auth/get-token
 *
 * 请求体: { tempToken: string }
 * 返回: { openKeyId, secretKey, appid, state }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tempToken } = body;

    console.log('===== get-token API 接收到的请求 =====');
    console.log('tempToken:', tempToken);
    console.log('环境变量 SHEIN_APP_ID:', SHEIN_APP_ID);
    console.log('环境变量 SHEIN_APP_SECRET_KEY:', SHEIN_APP_SECRET_KEY ? '已配置' : '未配置');
    console.log('环境变量 SHEIN_API_BASE_URL:', SHEIN_API_BASE_URL);

    // 验证必需参数
    if (!tempToken) {
      return NextResponse.json(
        { code: 'INVALID_PARAMS', msg: '缺少必需参数 tempToken' },
        { status: 400 }
      );
    }

    // 检查 APP 配置
    if (!SHEIN_APP_ID || !SHEIN_APP_SECRET_KEY) {
      console.error('SHEIN APP_ID 或 APP_SECRET_KEY 未配置');
      return NextResponse.json(
        { code: 'CONFIG_ERROR', msg: 'SHEIN 应用配置未完成，请配置 SHEIN_APP_ID 和 SHEIN_APP_SECRET_KEY' },
        { status: 500 }
      );
    }

    const requestPath = '/open-api/auth/get-by-token';

    // 生成签名（使用 APP 的 appId 和 appSecretKey）
    const { signature, timestamp } = generateAuthSignature(
      SHEIN_APP_ID,
      SHEIN_APP_SECRET_KEY,
      requestPath
    );

    console.log('===== 准备调用 SHEIN API =====');
    console.log('请求 URL:', `${SHEIN_API_BASE_URL}${requestPath}`);
    console.log('请求头 x-lt-appid:', SHEIN_APP_ID);
    console.log('请求头 x-lt-timestamp:', timestamp);
    console.log('请求头 x-lt-signature:', signature);
    console.log('请求体:', JSON.stringify({ tempToken }));

    // 调用 SHEIN API
    const response = await fetch(`${SHEIN_API_BASE_URL}${requestPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'x-lt-appid': SHEIN_APP_ID,
        'x-lt-timestamp': timestamp,
        'x-lt-signature': signature,
      },
      body: JSON.stringify({ tempToken }),
    });

    const data = await response.json();

    console.log('===== SHEIN API 响应 =====');
    console.log('HTTP 状态码:', response.status);
    console.log('响应数据:', JSON.stringify(data, null, 2));
    console.log('=========================');

    // 检查响应
    if (data.code !== '0') {
      console.error('获取店铺密钥失败:', data);
      return NextResponse.json({
        code: data.code,
        msg: data.msg || '获取店铺密钥失败',
        traceId: data.traceId,
      });
    }

    // 解密 secretKey
    const encryptedSecretKey = data.info.secretKey;
    let decryptedSecretKey: string;

    try {
      decryptedSecretKey = AESTools.decrypt(encryptedSecretKey, SHEIN_APP_SECRET_KEY);
      console.log('密钥解密成功');
    } catch (error) {
      console.error('密钥解密失败:', error);
      return NextResponse.json(
        { code: 'DECRYPT_ERROR', msg: '密钥解密失败' },
        { status: 500 }
      );
    }

    // 返回解密后的密钥信息
    return NextResponse.json({
      code: '0',
      msg: 'OK',
      traceId: data.traceId,
      info: {
        openKeyId: data.info.openKeyId,
        secretKey: decryptedSecretKey, // 返回解密后的密钥
        appid: data.info.appid,
        state: data.info.state,
      },
    });
  } catch (error) {
    console.error('获取店铺授权密钥失败:', error);
    return NextResponse.json(
      { code: 'SERVER_ERROR', msg: '服务器内部错误' },
      { status: 500 }
    );
  }
}
