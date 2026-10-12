'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Copy, Key } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface AuthResult {
  openKeyId: string;
  secretKey: string;
  appid: string;
  state: string;
}

export function SheinAuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    const tempToken = searchParams.get('tempToken');
    const state = searchParams.get('state');

    // 打印所有 URL 参数到控制台
    console.log('===== SHEIN 授权回调参数 =====');
    console.log('完整 URL 参数:', Object.fromEntries(searchParams.entries()));
    console.log('tempToken:', tempToken);
    console.log('state:', state);
    console.log('================================');

    if (!tempToken) {
      setError('授权失败：未获取到 tempToken');
      setLoading(false);
      return;
    }

    // 调用后端 API 获取密钥
    fetchAuthToken(tempToken, state || '');
  }, [searchParams]);

  const fetchAuthToken = async (tempToken: string, state: string) => {
    try {
      console.log('===== 开始调用 get-token API =====');
      console.log('tempToken:', tempToken);
      console.log('state:', state);

      const response = await fetch('/api/shein/auth/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      });

      const data = await response.json();

      console.log('===== API 响应结果 =====');
      console.log('HTTP 状态码:', response.status);
      console.log('响应数据:', JSON.stringify(data, null, 2));
      console.log('========================');

      if (data.code === '0') {
        setAuthResult(data.info);
        setError(null);

        // 保存凭证到浏览器本地存储
        saveCredentialsToLocalStorage(data.info.openKeyId, data.info.secretKey);
      } else {
        console.error('获取密钥失败:', data);
        setError(`获取密钥失败: ${data.msg}`);
      }
    } catch (err) {
      console.error('获取授权密钥失败:', err);
      setError('获取授权密钥失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const saveCredentialsToLocalStorage = (openKeyId: string, secretKey: string) => {
    try {
      // 保存到 localStorage
      localStorage.setItem('SHEIN_OPEN_KEY_ID', openKeyId);
      localStorage.setItem('SHEIN_SECRET_KEY', secretKey);

      console.log('✅ 凭证已保存到浏览器本地存储');
      setSaveSuccess(true);

      // 开始倒计时自动跳转
      let countdown = 10;
      setRedirectCountdown(countdown);

      const timer = setInterval(() => {
        countdown--;
        setRedirectCountdown(countdown);

        if (countdown <= 0) {
          clearInterval(timer);
          // 默认跳转到管理后台首页
          window.location.href = '/admin';
        }
      }, 1000);
    } catch (err) {
      console.error('保存凭证到本地存储失败:', err);
      setError('保存凭证失败，请手动记录密钥');
    }
  };

  const saveCredentials = async (openKeyId: string, secretKey: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/shein/auth/save-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openKeyId, secretKey }),
      });

      const data = await response.json();

      if (data.code === '0') {
        setSaveSuccess(true);

        // 开始倒计时自动跳转（但用户可以随时手动选择）
        let countdown = 10;
        setRedirectCountdown(countdown);

        const timer = setInterval(() => {
          countdown--;
          setRedirectCountdown(countdown);

          if (countdown <= 0) {
            clearInterval(timer);
            // 默认跳转到管理后台首页
            window.location.href = '/admin';
          }
        }, 1000);
      }
    } catch (err) {
      console.error('保存凭证失败:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">正在获取授权密钥...</p>
              <p className="text-sm text-muted-foreground">
                请稍候，正在处理您的授权请求
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (saving) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">正在保存授权凭证...</p>
              <p className="text-sm text-muted-foreground">
                即将完成授权配置
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div className="text-center">
                <p className="text-2xl font-medium">授权配置成功！</p>
                <p className="text-sm text-muted-foreground mt-2">
                  凭证已保存到浏览器本地存储
                </p>
              </div>

              <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700">
                    {redirectCountdown} 秒后自动跳转到管理后台...
                  </p>
                </div>
              </div>

              <div className="w-full space-y-3">
                <p className="text-sm font-medium text-center">选择要访问的功能模块</p>

                <Button
                  onClick={() => window.location.href = '/admin/shein-pending-pickup'}
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      📦
                    </div>
                    <div className="text-left">
                      <div className="font-medium">待揽收订单</div>
                      <div className="text-xs text-muted-foreground">管理待处理的订单</div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => window.location.href = '/admin/shein-shipped'}
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      🚚
                    </div>
                    <div className="text-left">
                      <div className="font-medium">已发货订单</div>
                      <div className="text-xs text-muted-foreground">查看已发货的订单状态</div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => window.location.href = '/admin/shein-returns'}
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-100 p-2">
                      📤
                    </div>
                    <div className="text-left">
                      <div className="font-medium">退货退款</div>
                      <div className="text-xs text-muted-foreground">处理退货和退款请求</div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => window.location.href = '/admin'}
                  className="w-full"
                >
                  进入管理后台首页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>授权失败</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/admin/shein-auth')} variant="outline">
                返回重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle>授权成功</CardTitle>
          </div>
          <CardDescription>
            已成功获取店铺授权密钥，请妥善保管以下信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OpenKeyId */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">OpenKeyId</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(authResult?.openKeyId || '', 'openKeyId')}
              >
                {copied.openKeyId ? '已复制' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <code className="block break-all rounded bg-muted p-2 text-sm font-mono">
              {authResult?.openKeyId}
            </code>
          </div>

          {/* SecretKey */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-900">SecretKey</span>
                <Badge variant="destructive">机密</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(authResult?.secretKey || '', 'secretKey')}
              >
                {copied.secretKey ? '已复制' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <code className="block break-all rounded bg-white p-2 text-sm font-mono">
              {authResult?.secretKey}
            </code>
            <p className="mt-2 text-xs text-amber-700">
              ⚠️ 此密钥已保存到浏览器本地存储，请勿泄露
            </p>
          </div>

          {/* AppID */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">AppID</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(authResult?.appid || '', 'appid')}
              >
                {copied.appid ? '已复制' : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <code className="block break-all rounded bg-muted p-2 text-sm font-mono">
              {authResult?.appid}
            </code>
          </div>

          {/* State */}
          {authResult?.state && (
            <div className="rounded-lg border p-4">
              <div className="mb-2">
                <span className="text-sm font-medium">State</span>
              </div>
              <code className="block break-all rounded bg-muted p-2 text-sm font-mono">
                {authResult.state}
              </code>
            </div>
          )}

          {/* 配置说明 */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">授权凭证已保存</h4>
            </div>
            <p className="text-xs text-green-700">
              凭证已保存到浏览器本地存储，后续 API 调用将自动使用这些凭证。
              页面将在 <span className="font-bold">{redirectCountdown}</span> 秒后自动跳转到管理后台。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => window.location.href = '/admin'}
              className="flex-1"
            >
              立即进入管理后台
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
