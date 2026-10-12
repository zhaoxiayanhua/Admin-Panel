# ShipAny Template Two - SHEIN 订单管理系统

基于 SHEIN 开放平台 API 构建的订单管理系统，支持订单查询、退货管理等功能。

## ✨ 功能特性

### 📦 订单管理
- **待揽收订单** - 查询待揽收状态的订单（状态码 7）
- **已发货订单** - 查询已发货状态的订单（状态码 4）
- **订单详情** - 查看订单完整信息

### 🔄 退货管理
- **退货单列表** - 按状态筛选退货订单
- **退货单详情** - 查看退货物流、时间线等

### 🔐 安全授权
- **OAuth 2.0 授权流程** - 安全获取店铺访问权限
- **AES-128-CBC 加密** - 自动解密 API 返回的密钥
- **HMAC-SHA256 签名** - 所有 API 请求自动签名

### 🌍 多语言支持
- 中文（默认）
- 英文

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制环境变量示例文件并填写配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 SHEIN 应用信息：

```bash
# SHEIN 应用配置
SHEIN_APP_ID=your_app_id_here
SHEIN_APP_SECRET_KEY=your_app_secret_key_here

# 使用测试环境
SHEIN_API_BASE_URL=https://openapi-test01.sheincorp.cn
```

### 3. 启动开发服务器

```bash
pnpm dev
```

### 4. 完成店铺授权

访问 http://localhost:3000/admin/shein-auth 完成授权流程。

详细步骤请查看 [快速启动指南](./docs/QUICK_START.md)。

## 📖 文档

- [快速启动指南](./docs/QUICK_START.md) - 5分钟快速上手
- [授权配置指南](./docs/SHEIN_AUTH_GUIDE.md) - 详细授权流程
- [SHEIN 开放平台文档](https://open.shein.com/)

## 🏗️ 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **SHEIN Open API** - 订单数据

## 📁 核心功能

```
src/
├── lib/shein/                    # SHEIN 工具类
│   ├── aes-tools.ts             # AES 加解密
│   └── auth-utils.ts            # 授权工具
├── app/api/shein/               # SHEIN API 路由
│   ├── auth/                    # 授权相关
│   ├── orders/                  # 订单相关
│   └── returns/                 # 退货相关
└── app/[locale]/(admin)/admin/
    ├── shein-auth/              # 授权页面
    ├── shein-pending-pickup/    # 待揽收订单
    ├── shein-shipped/           # 已发货订单
    └── shein-returns/           # 退货退款
```

## 🔑 环境变量

| 变量名 | 说明 | 必填 |
|-------|------|------|
| `SHEIN_APP_ID` | SHEIN 应用 ID | ✅ |
| `SHEIN_APP_SECRET_KEY` | SHEIN 应用密钥 | ✅ |
| `SHEIN_API_BASE_URL` | SHEIN API 域名 | ✅ |
| `SHEIN_OPEN_KEY_ID` | 店铺密钥（授权后获取） | ✅ |
| `SHEIN_SECRET_KEY` | 店铺密钥（授权后获取） | ✅ |

## ⚠️ 注意事项

- 测试环境和正式环境是两套独立系统，数据不互通
- tempToken 有效期仅 10 分钟
- 请妥善保管密钥，不要提交到 Git

## 🔗 相关链接

- [ShipAny 文档](https://shipany.ai/docs/quick-start)
- [ShipAny 模板](https://shipany.ai/templates)
- [SHEIN 开放平台](https://open.shein.com/)

## Feedback

submit your feedbacks on [Github Issues](https://github.com/shipanyai/shipany-template-two/issues)

## LICENSE

!!! Please do not publicly release ShipAny's Code. Illegal use will be prosecuted

[ShipAny LICENSE](./LICENSE)
