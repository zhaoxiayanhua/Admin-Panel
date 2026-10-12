# SHEIN 订单管理系统 - 快速启动指南

## 🚀 快速开始（测试环境）

### 第一步：配置环境变量

1. 复制环境变量示例文件：
```bash
cp .env.local.example .env.local
```

2. 编辑 `.env.local`，填入你的测试环境应用信息：
```bash
SHEIN_APP_ID=你的测试AppID
SHEIN_APP_SECRET_KEY=你的测试AppSecretKey
SHEIN_API_BASE_URL=https://openapi-test01.sheincorp.cn
```

### 第二步：启动开发服务器

```bash
pnpm install  # 首次运行时安装依赖
pnpm dev      # 启动开发服务器
```

### 第三步：完成店铺授权

1. 访问：http://localhost:3000/admin/shein-auth
2. 确认选择"测试环境"
3. 点击"开始授权"
4. 使用测试店铺主账号登录并授权
5. 授权成功后复制显示的密钥
6. 将密钥粘贴到 `.env.local` 文件：
```bash
SHEIN_OPEN_KEY_ID=复制的openKeyId
SHEIN_SECRET_KEY=复制的secretKey
```
7. 重启开发服务器（Ctrl+C 然后 `pnpm dev`）

### 第四步：开始使用

访问以下页面：
- **待揽收订单**：http://localhost:3000/admin/shein-pending-pickup
- **已发货订单**：http://localhost:3000/admin/shein-shipped
- **退货退款**：http://localhost:3000/admin/shein-returns

## 📋 前置要求

在开始之前，确保已完成：

### 在 SHEIN 开发者门户
- ✅ 注册开发者账号
- ✅ 创建测试环境应用
- ✅ 获取 AppID 和 AppSecretKey
- ✅ 申请 IP 白名单（添加你的服务器 IP）
- ✅ 申请接口权限：
  - 订单列表查询
  - 订单详情查询
  - 退货单列表查询
  - 退货单详情查询
  - 授权接口

### 在本地环境
- ✅ Node.js 18+ 已安装
- ✅ pnpm 已安装（`npm install -g pnpm`）

## 🔑 授权流程图

```
┌─────────────────┐
│  开发者配置     │
│  AppID + Key    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  生成授权链接    │
│  (测试环境)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  商家登录授权    │
│  (店铺主账号)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  获取 tempToken  │
│  (有效期10分钟)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  调用授权接口    │
│  获取并解密密钥  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  保存密钥配置    │
│  开始调用 API    │
└─────────────────┘
```

## 📁 项目结构

```
src/
├── lib/shein/                     # SHEIN 工具类
│   ├── aes-tools.ts              # AES 加解密
│   └── auth-utils.ts             # 授权工具
├── app/api/shein/                # API 路由
│   ├── auth/
│   │   ├── generate-url/         # 生成授权链接
│   │   └── get-token/            # 获取并解密密钥
│   ├── orders/
│   │   ├── list/                 # 订单列表
│   │   └── detail/               # 订单详情
│   └── returns/
│       ├── list/                 # 退货单列表
│       └── detail/               # 退货单详情
└── app/[locale]/(admin)/admin/
    ├── shein-auth/               # 授权页面
    ├── shein-auth-callback/      # 授权回调页面
    ├── shein-pending-pickup/     # 待揽收订单
    ├── shein-shipped/            # 已发货订单
    └── shein-returns/            # 退货退款
```

## 🔧 环境变量说明

| 变量名 | 说明 | 必填 | 获取方式 |
|-------|------|------|---------|
| `SHEIN_APP_ID` | 应用 ID | ✅ | 开发者门户 - 应用管理 |
| `SHEIN_APP_SECRET_KEY` | 应用密钥 | ✅ | 开发者门户 - 应用管理 |
| `SHEIN_API_BASE_URL` | API 域名 | ✅ | 测试:`https://openapi-test01.sheincorp.cn` |
| `SHEIN_OPEN_KEY_ID` | 店铺 openKeyId | ✅ | 通过授权流程获取 |
| `SHEIN_SECRET_KEY` | 店铺密钥（解密后） | ✅ | 通过授权流程获取 |

## ⚠️ 常见问题

### Q1: 授权链接打不开？
**A:** 检查 `SHEIN_APP_ID` 是否正确配置，确认选择了"测试环境"。

### Q2: 授权成功但获取密钥失败？
**A:** 
1. 检查 `SHEIN_APP_SECRET_KEY` 是否正确
2. 查看浏览器控制台错误信息
3. tempToken 可能已过期（10分钟有效期），重新授权

### Q3: API 调用返回签名错误？
**A:**
1. 确认使用的是**解密后**的 `SHEIN_SECRET_KEY`
2. 检查服务器时间是否准确
3. 重启开发服务器使配置生效

### Q4: 查询订单返回空数据？
**A:** 这是正常的！测试环境可能没有订单数据。你可以：
1. 在测试环境创建测试订单
2. 联系 SHEIN 技术支持获取测试数据
3. 切换到正式环境查看真实订单

### Q5: 如何切换到正式环境？
**A:**
1. 修改 `.env.local`：
```bash
# 使用正式环境的 AppID 和 AppSecretKey
SHEIN_APP_ID=正式环境AppID
SHEIN_APP_SECRET_KEY=正式环境AppSecretKey
SHEIN_API_BASE_URL=https://openapi.sheincorp.com
```
2. 清空密钥配置：
```bash
SHEIN_OPEN_KEY_ID=
SHEIN_SECRET_KEY=
```
3. 重启服务器
4. 访问授权页面，选择"正式环境"
5. 重新完成授权流程

## 📞 技术支持

如遇到问题：
1. 查看 [完整授权文档](./SHEIN_AUTH_GUIDE.md)
2. 查看 [API 对接文档](./SHEIN_INTEGRATION.md)
3. 检查浏览器控制台和服务器日志
4. 联系 SHEIN 开发者支持

## 🎯 下一步

完成授权后，你可以：
1. 查询待揽收订单（状态码 7）
2. 查询已发货订单（状态码 4）
3. 查询退货退款订单
4. 查看订单详情
5. 根据需求扩展更多功能

## 📚 相关文档

- [SHEIN 授权配置指南](./SHEIN_AUTH_GUIDE.md) - 详细的授权流程说明
- [SHEIN API 对接文档](./SHEIN_INTEGRATION.md) - 完整的 API 对接说明
- [SHEIN 开放平台官方文档](https://open.shein.com/) - 官方 API 文档

---

**祝你使用愉快！** 🎉
