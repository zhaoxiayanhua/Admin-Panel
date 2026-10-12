// SHEIN 授权检查工具
export function isSheinAuthorized(): boolean {
  const openKeyId = process.env.SHEIN_OPEN_KEY_ID;
  const secretKey = process.env.SHEIN_SECRET_KEY;

  return !!(openKeyId && secretKey && openKeyId.trim() !== '' && secretKey.trim() !== '');
}

export function getAuthorizationStatus() {
  const appId = process.env.SHEIN_APP_ID;
  const appSecretKey = process.env.SHEIN_APP_SECRET_KEY;
  const openKeyId = process.env.SHEIN_OPEN_KEY_ID;
  const secretKey = process.env.SHEIN_SECRET_KEY;

  return {
    hasAppConfig: !!(appId && appSecretKey),
    hasStoreAuth: !!(openKeyId && secretKey),
    isFullyConfigured: !!(appId && appSecretKey && openKeyId && secretKey),
  };
}
