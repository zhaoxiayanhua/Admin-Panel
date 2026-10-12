import { NextRequest, NextResponse } from 'next/server';
import { generateSignature } from '@/lib/shein/api';

// SHEIN API 配置
const SHEIN_API_BASE_URL = process.env.SHEIN_API_BASE_URL || 'https://openapi.sheincorp.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必需参数
    if (!body.returnOrderNoList || !Array.isArray(body.returnOrderNoList) || body.returnOrderNoList.length === 0) {
      return NextResponse.json(
        { code: 'INVALID_PARAMS', msg: '缺少必需参数 returnOrderNoList' },
        { status: 400 }
      );
    }

    if (body.returnOrderNoList.length > 30) {
      return NextResponse.json(
        { code: 'INVALID_PARAMS', msg: '退货单号列表最多30条' },
        { status: 400 }
      );
    }

    // 从请求头中获取凭证（前端从 localStorage 发送）
    const SHEIN_OPEN_KEY_ID = request.headers.get('x-shein-open-key-id') || process.env.SHEIN_OPEN_KEY_ID || '';
    const SHEIN_SECRET_KEY = request.headers.get('x-shein-secret-key') || process.env.SHEIN_SECRET_KEY || '';

    // 如果没有配置密钥，返回模拟数据
    if (!SHEIN_OPEN_KEY_ID || !SHEIN_SECRET_KEY) {
      console.warn('SHEIN API 密钥未配置，返回模拟数据');
      return NextResponse.json({
        code: '0',
        msg: 'OK (模拟数据)',
        traceId: `mock-${Date.now()}`,
        info: body.returnOrderNoList.map((returnOrderNo: string) => ({
          returnOrderNo,
          returnOrderStatus: 2,
          orderNo: 'MOCK_ORDER_NO',
          site: 'CN',
          platformExpressNo: 'MOCK_EXPRESS_NO',
          memberExpressNo: '',
          expressCompanyName: '模拟物流公司',
          noReturnGoodsSign: 0,
          refundOrderNos: [],
          performanceCost: 0,
          requestReturnTime: new Date().toISOString(),
          allocateTime: new Date().toISOString(),
          lastUpdateTime: new Date().toISOString(),
          checkStatus: 2,
        })),
      });
    }

    const requestPath = '/open-api/return-order/details';
    const { signature, timestamp } = generateSignature(SHEIN_OPEN_KEY_ID, SHEIN_SECRET_KEY, requestPath);

    // 调用 SHEIN API
    const response = await fetch(`${SHEIN_API_BASE_URL}${requestPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'x-lt-openKeyId': SHEIN_OPEN_KEY_ID,
        'x-lt-timestamp': timestamp,
        'x-lt-signature': signature,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('查询退货单详情失败:', error);
    return NextResponse.json(
      { code: 'SERVER_ERROR', msg: '服务器内部错误' },
      { status: 500 }
    );
  }
}
