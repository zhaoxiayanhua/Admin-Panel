import { NextRequest, NextResponse } from 'next/server';
import { generateAuthUrl } from '@/lib/shein/auth-utils';

/**
 * 生成 SHEIN 授权链接
 * GET /api/shein/auth/generate-url
 *
 * 查询参数:
 * - redirectUrl: 授权回调地址
 * - state: 可选，自定义状态值
 * - isTest: 可选，是否使用测试环境（默认 false）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirectUrl = searchParams.get('redirectUrl');
    const state = searchParams.get('state') || `AUTH-${Date.now()}`;
    const isTest = searchParams.get('isTest') === 'true';

    const SHEIN_APP_ID = process.env.SHEIN_APP_ID || '';

    // 验证必需参数
    if (!redirectUrl) {
      return NextResponse.json(
        { code: 'INVALID_PARAMS', msg: '缺少必需参数 redirectUrl' },
        { status: 400 }
      );
    }

    if (!SHEIN_APP_ID) {
      return NextResponse.json(
        { code: 'CONFIG_ERROR', msg: 'SHEIN_APP_ID 未配置' },
        { status: 500 }
      );
    }

    // 生成授权链接
    const authUrl = generateAuthUrl(SHEIN_APP_ID, redirectUrl, state, isTest);

    return NextResponse.json({
      code: '0',
      msg: 'OK',
      info: {
        authUrl,
        appId: SHEIN_APP_ID,
        redirectUrl,
        state,
        isTest,
      },
    });
  } catch (error) {
    console.error('生成授权链接失败:', error);
    return NextResponse.json(
      { code: 'SERVER_ERROR', msg: '服务器内部错误' },
      { status: 500 }
    );
  }
}
