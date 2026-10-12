# SHEIN 授权配置指南

## 当前使用测试环境

根据你的要求，系统已配置为使用 SHEIN 测试环境。

## 环境配置

### 1. 配置文件设置

在项目根目录的 `.env.local` 文件中添加以下配置：

```bash
# ========================================
# SHEIN 测试环境配置
# ========================================

# 应用配置（从 SHEIN 开发者门户获取）
SHEIN_APP_ID=你的测试环境AppID
SHEIN_APP_SECRET_KEY=你的测试环境AppSecretKey

# API 调用域名（测试环境）
SHEIN_API_BASE_URL=https://openapi-test01.sheincorp.cn

# 店铺授权密钥（通过授权流程自动获取，无需手动填写）
SHEIN_OPEN_KEY_ID=
SHEIN_SECRET_KEY=
```

### 2. 测试环境域名说明

**授权域名（用于生成授权链接）**
- 测试环境：`https://openapi-sem-test01.dotfashion.cn`
- 正式环境：`https://openapi-sem.sheincorp.com`

**API 调用域名（用于调用订单、退货等接口）**
- 测试环境：`https://openapi-test01.sheincorp.cn`
- 正式环境：`https://openapi.sheincorp.com`

⚠️ **重要提示**：授权域名和调用域名不一致！

## 授权流程

### 步骤 1：获取应用凭证

1. 登录 SHEIN 开发者门户（测试环境）
2. 创建或选择测试应用
3. 获取以下信息：
   - **AppID**（应用 ID）
   - **AppSecretKey**（应用密钥）
4. 将这两个值配置到 `.env.local` 文件中

### 步骤 2：申请 IP 白名单

1. 在开发者门户申请 IP 白名单
2. 添加你的服务器 IP 地址
3. 等待审核通过（通常需要 1-2 个工作日）

### 步骤 3：申请接口权限

申请以下接口的权限：
- ✅ 订单列表查询：`/open-api/order/order-list`
- ✅ 订单详情查询：`/open-api/order/order-detail`
- ✅ 退货单列表查询：`/open-api/return-order/list`
- ✅ 退货单详情查询：`/open-api/return-order/details`
- ✅ 授权接口：`/open-api/auth/get-by-token`

### 步骤 4：开始授权

1. 启动开发服务器：
   ```bash
   pnpm dev
   ```

2. 访问授权页面：
   ```
   http://localhost:3000/admin/shein-auth
   ```

3. 选择"测试环境"选项

4. 点击"开始授权"按钮
   - 系统会自动生成授权链接
   - 在新窗口打开 SHEIN 授权页面

5. 使用测试店铺的主账号登录

6. 点击"授权"按钮

7. 授权成功后自动跳转到回调页面
   - 系统会自动获取并解密密钥
   - 显示 `openKeyId` 和 `secretKey`

8. 将获取到的密钥保存到 `.env.local` 文件：
   ```bash
   SHEIN_OPEN_KEY_ID=从回调页面复制的openKeyId
   SHEIN_SECRET_KEY=从回调页面复制的secretKey
   ```

9. 重启开发服务器使配置生效：
   ```bash
   # 按 Ctrl+C 停止服务器
   pnpm dev
   ```

## 技术实现细节

### 1. 授权链接生成

```typescript
// 测试环境授权链接格式
https://openapi-sem-test01.dotfashion.cn/#/empower?appid=${appId}&redirectUrl=${base64EncodedUrl}&state=${state}
```

**参数说明：**
- `appId`: 应用 ID（必填）
- `redirectUrl`: 回调地址的 Base64 编码（必填）
- `state`: 自定义状态值（必填，用于验证）

### 2. 签名生成算法

```typescript
// 步骤 1: 生成 5 位随机字符串
const randomKey = crypto.randomBytes(3).toString('hex').substring(0, 5);

// 步骤 2: 拼接签名字符串
const signString = `${appId}&${timestamp}&${requestPath}`;

// 步骤 3: 随机密钥 = appSecretKey + randomKey
const randomSecretKey = appSecretKey + randomKey;

// 步骤 4: HMAC-SHA256 签名
const hashValue = crypto.createHmac('sha256', randomSecretKey)
  .update(signString)
  .digest('hex');

// 步骤 5: Base64 编码
const base64Value = Buffer.from(hashValue, 'hex').toString('base64');

// 步骤 6: 最终签名 = randomKey + base64Value
const signature = randomKey + base64Value;
```

### 3. SecretKey 解密

使用 AES-128-CBC 算法解密：
- **算法**: AES-128-CBC
- **密钥**: AppSecretKey 的前 16 字节
- **IV**: 固定值 `"space-station-de"` 的前 16 字节
- **编码**: Base64

```typescript
// 解密示例
const decryptedSecretKey = AESTools.decrypt(
  encryptedSecretKey,  // 从 API 返回的加密密钥
  appSecretKey         // 应用密钥
);
```

## 接口调用流程

授权完成后，调用订单 API 的流程：

```typescript
// 1. 使用店铺密钥生成签名
const { signature, timestamp } = generateSignature(
  openKeyId,      // 店铺授权获取的 openKeyId
  secretKey,      // 店铺授权获取的 secretKey（已解密）
  requestPath     // 如 /open-api/order/order-list
);

// 2. 设置请求头
headers: {
  'Content-Type': 'application/json;charset=UTF-8',
  'x-lt-openKeyId': openKeyId,
  'x-lt-timestamp': timestamp,
  'x-lt-signature': signature,
}

// 3. 调用 API
fetch('https://openapi-test01.sheincorp.cn/open-api/order/order-list', {
  method: 'POST',
  headers,
  body: JSON.stringify(requestData)
});
```

## 重要提示

### 测试环境与正式环境

⚠️ **测试环境和正式环境是两套独立系统，数据不互通！**

| 项目 | 测试环境 | 正式环境 |
|------|---------|---------|
| 授权域名 | openapi-sem-test01.dotfashion.cn | openapi-sem.sheincorp.com |
| API 域名 | openapi-test01.sheincorp.cn | openapi.sheincorp.com |
| AppID | 测试环境专用 | 正式环境专用 |
| AppSecretKey | 测试环境专用 | 正式环境专用 |
| 密钥 | 测试环境专用 | 正式环境专用 |

### 安全注意事项

1. **tempToken 有效期**：10 分钟
   - 超时需要重新授权
   - 建议商家在授权页面快速完成操作

2. **密钥保密**：
   - secretKey 仅显示一次
   - 立即保存到 `.env.local` 文件
   - 不要提交到 Git 仓库

3. **签名有效期**：5 分钟
   - 确保服务器时间准确
   - 建议使用 NTP 时间同步

4. **限流规则**：
   - 单个开发者：50 次/秒
   - 单个 IP：60 次/分钟

## 故障排查

### 1. 授权链接无法打开

**可能原因**：
- AppID 配置错误
- 未选择正确的环境（测试/正式）

**解决方法**：
- 检查 `.env.local` 中的 `SHEIN_APP_ID`
- 确认在授权页面选择了"测试环境"

### 2. 授权成功但无法获取密钥

**可能原因**：
- AppSecretKey 配置错误
- 签名生成失败
- tempToken 已过期

**解决方法**：
- 检查 `.env.local` 中的 `SHEIN_APP_SECRET_KEY`
- 查看浏览器控制台错误信息
- 重新进行授权流程

### 3. 密钥解密失败

**可能原因**：
- AppSecretKey 错误
- IV 值不正确

**解决方法**：
- 确认 AppSecretKey 是从测试环境获取的
- 检查解密算法是否使用固定 IV: `"space-station-de"`

### 4. API 调用返回签名错误

**可能原因**：
- 使用了加密的 secretKey（未解密）
- 服务器时间不准确
- 签名算法错误

**解决方法**：
- 确认使用的是解密后的 secretKey
- 检查服务器时间
- 参考文档检查签名生成步骤

## 测试清单

完成授权后，请依次测试以下功能：

- [ ] 授权链接生成成功
- [ ] 商家能够正常登录授权页面
- [ ] 授权后成功跳转到回调页面
- [ ] 成功获取并显示 openKeyId 和 secretKey
- [ ] 密钥保存到 `.env.local` 文件
- [ ] 重启服务器后配置生效
- [ ] 访问 `/admin/shein-pending-pickup` 能够查询订单（可能为空）
- [ ] 访问 `/admin/shein-shipped` 能够查询订单（可能为空）
- [ ] 访问 `/admin/shein-returns` 能够查询退货单（可能为空）

## 联系支持

如遇到无法解决的问题：
1. 查看浏览器控制台错误信息
2. 查看服务器日志
3. 联系 SHEIN 技术支持
4. 提供 traceId 用于问题排查
