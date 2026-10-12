'use client';

import { useState } from 'react';
import { ExternalLink, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Input } from '@/shared/components/ui/input';

export function SheinAuthPageClient() {
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [isTest, setIsTest] = useState(false);

  const generateAuthUrl = async () => {
    setLoading(true);
    try {
      // 获取当前域名作为回调地址
      const redirectUrl = `${window.location.origin}/admin/shein-auth-callback`;

      const response = await fetch(
        `/api/shein/auth/generate-url?redirectUrl=${encodeURIComponent(redirectUrl)}&isTest=${isTest}`
      );

      const data = await response.json();

      if (data.code === '0') {
        setAuthUrl(data.info.authUrl);
      } else {
        alert(`生成授权链接失败: ${data.msg}`);
      }
    } catch (error) {
      console.error('生成授权链接失败:', error);
      alert('生成授权链接失败，请检查配置');
    } finally {
      setLoading(false);
    }
  };

  const openAuthWindow = () => {
    if (!authUrl) {
      generateAuthUrl().then(() => {
        if (authUrl) {
          window.open(authUrl, '_blank');
        }
      });
    } else {
      window.open(authUrl, '_blank');
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-6 w-6" />
            <CardTitle>SHEIN 店铺授权</CardTitle>
          </div>
          <CardDescription>
            通过 SHEIN 开放平台授权，获取店铺订单和商品数据访问权限
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 授权说明 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>授权流程说明</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <ol className="list-inside list-decimal space-y-1 text-sm">
                <li>点击"开始授权"按钮，将打开 SHEIN 授权页面</li>
                <li>使用店铺主账号登录 SHEIN 卖家后台</li>
                <li>在授权页面点击"授权"按钮</li>
                <li>授权成功后将自动跳转回本系统，并显示密钥信息</li>
                <li>请将获取到的密钥保存到 .env.local 文件中</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* 环境选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">授权环境</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="environment"
                  checked={!isTest}
                  onChange={() => setIsTest(false)}
                  className="h-4 w-4"
                />
                <span className="text-sm">正式环境</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="environment"
                  checked={isTest}
                  onChange={() => setIsTest(true)}
                  className="h-4 w-4"
                />
                <span className="text-sm">测试环境</span>
              </label>
            </div>
          </div>

          {/* 授权链接显示 */}
          {authUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">授权链接（已生成）</label>
              <Input value={authUrl} readOnly className="font-mono text-xs" />
            </div>
          )}

          {/* 授权按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={openAuthWindow}
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              {loading ? (
                '生成授权链接中...'
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  开始授权
                </>
              )}
            </Button>
            {authUrl && (
              <Button
                onClick={() => setAuthUrl('')}
                variant="outline"
                size="lg"
              >
                重新生成
              </Button>
            )}
          </div>

          {/* 配置要求 */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-amber-900">
              ⚠️ 授权前请确保已配置
            </h4>
            <ul className="space-y-1 text-xs text-amber-700">
              <li>✓ SHEIN_APP_ID（应用 ID）</li>
              <li>✓ SHEIN_APP_SECRET_KEY（应用密钥）</li>
              <li>✓ IP 白名单已申请通过</li>
              <li>✓ 订单、退货等接口权限已开通</li>
            </ul>
            <p className="mt-2 text-xs text-amber-600">
              以上配置请在 SHEIN 开发者门户中获取并添加到 .env.local 文件
            </p>
          </div>

          {/* 获取 APP_ID 和 APP_SECRET_KEY 说明 */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-2 text-sm font-medium">如何获取 APP_ID 和 APP_SECRET_KEY？</h4>
            <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
              <li>登录 SHEIN 开发者门户</li>
              <li>进入"应用管理"页面</li>
              <li>创建或选择应用，查看应用详情</li>
              <li>复制 AppID 和 AppSecretKey</li>
              <li>
                添加到项目 .env.local 文件：
                <pre className="mt-2 rounded bg-muted p-2 text-xs">
{`SHEIN_APP_ID=your_app_id_here
SHEIN_APP_SECRET_KEY=your_app_secret_key_here`}
                </pre>
              </li>
            </ol>
          </div>

          {/* 注意事项 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-blue-900">重要提示</h4>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• tempToken 有效期为 10 分钟，请及时完成授权</li>
              <li>• 授权后获取的 secretKey 仅显示一次，请立即保存</li>
              <li>• 测试环境和正式环境的密钥不互通</li>
              <li>• 请使用店铺主账号进行授权</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
