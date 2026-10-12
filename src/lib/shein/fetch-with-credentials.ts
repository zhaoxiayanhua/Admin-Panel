/**
 * SHEIN API 请求包装器
 * 自动从 localStorage 读取凭证并添加到请求头
 */

export async function fetchWithSheinCredentials(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 从 localStorage 读取凭证
  const openKeyId = typeof window !== 'undefined'
    ? localStorage.getItem('SHEIN_OPEN_KEY_ID')
    : null;
  const secretKey = typeof window !== 'undefined'
    ? localStorage.getItem('SHEIN_SECRET_KEY')
    : null;

  // 合并请求头
  const headers = new Headers(options.headers);

  if (openKeyId) {
    headers.set('x-shein-open-key-id', openKeyId);
  }

  if (secretKey) {
    headers.set('x-shein-secret-key', secretKey);
  }

  // 发送请求
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * 检查是否已配置 SHEIN 凭证
 */
export function hasSheinCredentials(): boolean {
  if (typeof window === 'undefined') return false;

  const openKeyId = localStorage.getItem('SHEIN_OPEN_KEY_ID');
  const secretKey = localStorage.getItem('SHEIN_SECRET_KEY');

  return !!(openKeyId && secretKey);
}

/**
 * 清除 SHEIN 凭证
 */
export function clearSheinCredentials(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('SHEIN_OPEN_KEY_ID');
  localStorage.removeItem('SHEIN_SECRET_KEY');
}

/**
 * 获取 SHEIN 凭证
 */
export function getSheinCredentials(): { openKeyId: string | null; secretKey: string | null } {
  if (typeof window === 'undefined') {
    return { openKeyId: null, secretKey: null };
  }

  return {
    openKeyId: localStorage.getItem('SHEIN_OPEN_KEY_ID'),
    secretKey: localStorage.getItem('SHEIN_SECRET_KEY'),
  };
}
