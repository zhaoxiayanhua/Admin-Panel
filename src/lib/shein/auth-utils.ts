// SHEIN 授权签名生成工具
import crypto from 'crypto';

const HMAC_SHA256 = 'sha256';

/**
 * 生成用于 SHEIN API 授权的签名
 * 用于调用 /open-api/auth/get-by-token 接口
 *
 * @param appId 应用 ID
 * @param appSecretKey 应用密钥
 * @param requestPath 请求路径（如 /open-api/auth/get-by-token）
 * @returns 签名信息（包含完整签名和时间戳）
 */
export function generateAuthSignature(
  appId: string,
  appSecretKey: string,
  requestPath: string
): { signature: string; timestamp: string } {
  // 生成毫秒级时间戳
  const timestamp = Date.now().toString();

  // 生成 5 位随机字符串
  const randomKey = crypto.randomBytes(3).toString('hex').substring(0, 5);

  // 拼接签名字符串: appId&timestamp&requestPath
  const signString = `${appId}&${timestamp}&${requestPath}`;

  // 将随机字符串附加到 appSecretKey
  const randomSecretKey = appSecretKey + randomKey;

  console.log('===== 签名生成详细过程 =====');
  console.log('1. 原始 appId:', appId);
  console.log('2. 原始 appSecretKey 长度:', appSecretKey.length);
  console.log('3. timestamp:', timestamp);
  console.log('4. requestPath:', requestPath);
  console.log('5. 随机前缀 randomKey:', randomKey);
  console.log('6. 签名字符串 signString:', signString);
  console.log('7. 加密密钥 randomSecretKey:', `${appSecretKey.substring(0, 10)}...${randomKey}`);

  // 使用 HMAC-SHA256 生成签名
  const hmac = crypto.createHmac(HMAC_SHA256, randomSecretKey);
  hmac.update(signString);
  const hashValue = hmac.digest('hex');
  console.log('8. HMAC-SHA256 hex 结果:', hashValue);

  // Base64 编码（对十六进制字符串本身进行编码，不是对二进制数据）
  const base64Value = Buffer.from(hashValue, 'utf-8').toString('base64');
  console.log('9. Base64 编码结果:', base64Value);

  // 最终签名 = randomKey + base64Value
  const finalSignature = randomKey + base64Value;
  console.log('10. 最终签名:', finalSignature);
  console.log('============================');

  return {
    signature: finalSignature,
    timestamp,
  };
}

/**
 * 生成 SHEIN 授权链接
 *
 * @param appId 应用 ID
 * @param redirectUrl 回调地址（会自动进行 Base64 编码）
 * @param state 自定义状态值（用于回调验证）
 * @param isTest 是否使用测试环境
 * @returns 完整的授权链接
 */
export function generateAuthUrl(
  appId: string,
  redirectUrl: string,
  state: string = `AUTH-${Date.now()}`,
  isTest: boolean = false
): string {
  // 选择域名
  const host = isTest
    ? 'openapi-sem-test01.dotfashion.cn'
    : 'openapi-sem.sheincorp.com';

  // Base64 编码回调地址
  const encodedRedirectUrl = Buffer.from(redirectUrl).toString('base64');

  // 拼接授权链接
  const authUrl = `https://${host}/#/empower?appid=${appId}&redirectUrl=${encodedRedirectUrl}&state=${state}`;

  return authUrl;
}
