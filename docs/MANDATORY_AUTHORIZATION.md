# SHEIN 强制授权实现说明

## 概述

系统已实现强制授权机制，用户必须完成 SHEIN 店铺授权后才能访问管理后台的任何页面。授权凭证会自动保存到本地配置文件，无需手动配置。

## 实现方式

### 1. 代理层拦截 (src/proxy.ts)

在 Next.js 的代理中间件中添加了授权检查逻辑：

```typescript
// SHEIN 授权检查 - 强制要求授权才能访问管理后台
if (pathWithoutLocale.startsWith('/admin')) {
  // 授权相关页面不需要检查，允许访问
  if (
    !pathWithoutLocale.startsWith('/admin/shein-auth') &&
    !pathWithoutLocale.startsWith('/admin/shein-auth-callback')
  ) {
    // 检查环境变量中的授权状态
    const openKeyId = process.env.SHEIN_OPEN_KEY_ID;
    const secretKey = process.env.SHEIN_SECRET_KEY;
    const isAuthorized = !!(
      openKeyId &&
      secretKey &&
      openKeyId.trim() !== '' &&
      secretKey.trim() !== ''
    );

    // 如果未授权，重定向到授权页面
    if (!isAuthorized) {
      const authUrl = new URL(
        isValidLocale ? `/${locale}/admin/shein-auth` : '/admin/shein-auth',
        request.url
      );
      return NextResponse.redirect(authUrl);
    }
  }
}
```

### 2. 授权检查工具 (src/lib/shein/check-auth.ts)

提供了两个实用函数来检查授权状态：

- `isSheinAuthorized()`: 返回布尔值，表示是否已完成授权
- `getAuthorizationStatus()`: 返回详细的授权状态信息

### 3. 自动保存凭证 (src/app/api/shein/auth/save-credentials/route.ts)

提供 API 端点自动保存授权凭证到 `.env.local` 文件：

- 自动读取和更新环境变量文件
- 智能合并现有配置
- 无需手动编辑文件

## 工作流程

### 首次访问

1. 用户访问任意管理后台页面 (例如: `/admin`, `/admin/shein-pending-pickup` 等)
2. 代理中间件检测到 `SHEIN_OPEN_KEY_ID` 和 `SHEIN_SECRET_KEY` 为空
3. 自动重定向到授权页面 `/admin/shein-auth`
4. 用户必须完成授权才能继续

### 授权流程（全自动）

1. **在授权页面选择环境**（测试/生产）
2. **点击"生成授权链接"按钮**
3. **在新窗口中完成 SHEIN 店铺授权**
4. **授权成功后自动跳转到回调页面**
5. **✨ 系统自动获取并解密店铺密钥**
6. **✨ 自动保存 `openKeyId` 和 `secretKey` 到 `.env.local` 文件**
7. **✨ 显示成功页面，提供三个功能模块选项：**
   - 待揽收订单
   - 已发货订单
   - 退货退款
8. **✨ 10 秒后自动跳转到管理后台首页（用户可随时手动选择）**
9. **✨ 页面自动刷新使环境变量生效**

> **注意**：整个流程完全自动化，用户无需手动编辑任何配置文件！

### 授权后访问

1. 用户访问管理后台页面
2. 代理中间件检测到授权凭证存在
3. 允许访问，正常显示页面内容

## 功能模块

授权完成后可以访问以下三个主要功能模块：

### 1. 待揽收订单 (`/admin/shein-pending-pickup`)
管理等待揽收的订单，处理新订单。

### 2. 已发货订单 (`/admin/shein-shipped`)
查看和跟踪已发货订单的物流状态。

### 3. 退货退款 (`/admin/shein-returns`)
处理客户的退货和退款请求。

## 白名单页面

以下页面不需要授权检查，始终可以访问：

- `/admin/shein-auth` - 授权页面
- `/admin/shein-auth-callback` - 授权回调页面

## 环境变量配置

授权凭证会自动存储在 `.env.local` 文件中：

```bash
# SHEIN 应用配置
SHEIN_APP_ID=165CD4A72F002A7089ABF6C17B979
SHEIN_APP_SECRET_KEY=2DC257D4F14549DAB3B1AE93AE352AE0

# SHEIN API 调用域名
SHEIN_API_BASE_URL=https://openapi-test01.sheincorp.cn

# SHEIN 店铺授权密钥（自动获取并保存）
SHEIN_OPEN_KEY_ID=your_open_key_id_here
SHEIN_SECRET_KEY=your_secret_key_here
```

> **重要**：授权流程会自动更新 `SHEIN_OPEN_KEY_ID` 和 `SHEIN_SECRET_KEY`，无需手动编辑。

## 安全考虑

1. **环境变量保护**: 授权密钥存储在服务器端环境变量中，不会暴露给客户端
2. **代理层拦截**: 在请求到达页面之前就进行授权检查，确保未授权用户无法访问任何管理功能
3. **密钥加密**: SHEIN 返回的 secretKey 经过 AES-128-CBC 加密，系统自动解密后使用
4. **自动保存**: 凭证通过服务器端 API 保存，避免客户端泄露风险

## 测试验证

### 测试未授权状态

1. 清空 `.env.local` 中的 `SHEIN_OPEN_KEY_ID` 和 `SHEIN_SECRET_KEY`
2. 重启开发服务器
3. 访问 http://localhost:3000/admin
4. 应该自动重定向到授权页面

### 测试已授权状态

1. 完成授权流程（系统会自动保存凭证）
2. 选择要访问的功能模块或等待自动跳转
3. 页面刷新后环境变量自动生效
4. 可以正常访问管理后台和所有功能模块

## 用户体验优化

### 1. 进度提示
- 授权过程中显示加载状态
- 保存凭证时显示处理状态
- 成功后显示确认信息

### 2. 快速导航
- 授权成功后提供三个主要功能模块的快速入口
- 每个模块都有图标和说明
- 支持手动选择或自动跳转

### 3. 倒计时跳转
- 10 秒倒计时自动跳转到管理后台
- 用户可以随时点击按钮立即跳转
- 避免强制等待，提升用户体验

## 生产环境部署

部署到生产环境时，需要：

1. 切换到生产环境配置：
   ```bash
   SHEIN_API_BASE_URL=https://openapi.sheincorp.com
   SHEIN_APP_ID=your_production_app_id
   SHEIN_APP_SECRET_KEY=your_production_secret_key
   ```
2. 清空测试环境的授权凭证：
   ```bash
   SHEIN_OPEN_KEY_ID=
   SHEIN_SECRET_KEY=
   ```
3. 访问授权页面重新完成生产环境授权
4. 系统会自动保存生产环境凭证
5. 重启应用使配置生效

## 故障排查

### 问题：一直重定向到授权页面

**原因**: 环境变量未正确设置或页面未刷新

**解决方案**:
1. 检查 `.env.local` 文件中的 `SHEIN_OPEN_KEY_ID` 和 `SHEIN_SECRET_KEY` 是否有值
2. 如果是开发环境，确保在授权回调页面点击了按钮或等待自动跳转
3. 页面会自动刷新以使环境变量生效

### 问题：授权后仍然无法访问

**原因**: 浏览器缓存或环境变量格式错误

**解决方案**:
1. 清除浏览器缓存并刷新页面
2. 确保环境变量值前后没有空格
3. 确保环境变量值是正确的字符串格式
4. 如果问题持续，重新完成授权流程

### 问题：凭证保存失败

**原因**: 文件权限或路径问题

**解决方案**:
1. 检查项目根目录的 `.env.local` 文件权限
2. 确保应用有写入权限
3. 查看浏览器控制台的错误信息
4. 如果需要，手动创建 `.env.local` 文件并添加空的凭证行

## 技术细节

### API 端点

**生成授权链接**: `GET /api/shein/auth/generate-url`
- 参数: `environment` (test/production)
- 返回: 授权 URL

**获取授权令牌**: `POST /api/shein/auth/get-token`
- 参数: `tempToken`
- 返回: 解密后的 `openKeyId` 和 `secretKey`

**保存授权凭证**: `POST /api/shein/auth/save-credentials`
- 参数: `openKeyId`, `secretKey`
- 功能: 自动更新 `.env.local` 文件

### 文件结构

```
src/
├── app/
│   ├── api/shein/auth/
│   │   ├── generate-url/route.ts
│   │   ├── get-token/route.ts
│   │   └── save-credentials/route.ts    # 自动保存凭证
│   └── [locale]/(admin)/admin/
│       ├── shein-auth/
│       │   ├── page.tsx
│       │   └── page-client.tsx
│       ├── shein-auth-callback/
│       │   ├── page.tsx
│       │   └── page-client.tsx           # 自动保存和跳转
│       ├── shein-pending-pickup/         # 待揽收订单
│       ├── shein-shipped/                # 已发货订单
│       └── shein-returns/                # 退货退款
├── lib/shein/
│   ├── aes-tools.ts
│   ├── auth-utils.ts
│   └── check-auth.ts
└── proxy.ts                              # 强制授权拦截
```

## 相关文档

- [快速开始指南](./QUICK_START.md)
- [SHEIN 集成文档](./SHEIN_INTEGRATION.md)
- [项目 README](../README.md)
