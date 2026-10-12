# SHEIN API 完整对接文档

本文档详细说明了如何对接 SHEIN 开放平台的订单管理相关 API。

## 目录

1. [认证与签名](#认证与签名)
2. [订单相关 API](#订单相关-api)
3. [退货相关 API](#退货相关-api)
4. [错误处理](#错误处理)
5. [限流规则](#限流规则)

---

## 认证与签名

### 请求域名

| 应用类型 | 正式环境 | 测试环境 |
|---------|---------|---------|
| 传统平台/自主运营 | `https://openapi.sheincorp.com` | `https://openapi-test01.sheincorp.cn` |
| 半托管 | `https://openapi.sheincorp.com` | - |

### 请求头

所有 API 请求必须包含以下请求头：

```typescript
headers: {
  'Content-Type': 'application/json;charset=UTF-8',
  'x-lt-openKeyId': openKeyId,      // 店铺授权获取的 openKeyId
  'x-lt-timestamp': timestamp,       // 毫秒级时间戳
  'x-lt-signature': signature,       // 请求签名
}
```

### 签名生成

签名生成步骤（用于订单/退货 API）：

```typescript
// 1. 拼接待签名字符串
const signString = `${openKeyId}&${timestamp}&${requestPath}`;

// 2. 使用 HMAC-SHA256 生成签名
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(signString);
const signature = hmac.digest('base64');
```

**示例代码**：

```typescript
import crypto from 'crypto';

function generateSignature(
  openKeyId: string,
  secretKey: string,
  requestPath: string
): { signature: string; timestamp: string } {
  const timestamp = Date.now().toString();
  const value = `${openKeyId}&${timestamp}&${requestPath}`;
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(value)
    .digest('base64');
  
  return { signature, timestamp };
}

// 使用示例
const { signature, timestamp } = generateSignature(
  'your_open_key_id',
  'your_secret_key',  // 已解密的密钥
  '/open-api/order/order-list'
);
```

---

## 订单相关 API

### 1. 查询订单列表

**接口路径**：`POST /open-api/order/order-list`

**功能说明**：查询订单列表，支持按订单创建时间和更新时间查询。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `queryType` | integer | ✅ | 查询类型：1=按订单下发时间 / 2=按订单更新时间 |
| `startTime` | string | ✅ | 开始时间，格式 `yyyy-MM-dd HH:mm:ss`（UTC+8） |
| `endTime` | string | ✅ | 结束时间，格式 `yyyy-MM-dd HH:mm:ss`（UTC+8） |
| `page` | integer | ✅ | 页码 |
| `pageSize` | integer | ✅ | 每页条数，1~30 |
| `orderStatus` | integer | ❌ | 订单状态（见状态码表） |
| `queryOrderType` | integer | ❌ | 发货仓类型：1=认证仓 / 2=SHEIN仓 / 3=商家仓 / 4=所有订单 |

**重要限制**：
- ⏰ 时间范围不能超过 **48 小时**
- 📊 查询结果总数限制为 **10000 条**
- 🕐 时区为 **UTC+8（北京时间）**

**订单状态码**：

| 状态码 | 中文 | 说明 |
|-------|------|------|
| 1 | 待处理 | Pending |
| 2 | 待发货 | To Be Shipped |
| 3 | 待 SHEIN 发货 | Pending SHEIN Shipment |
| **4** | **已发货** | **Shipped** ⭐ |
| 5 | 已签收 | Delivered |
| 6 | 用户已退款 | Refund |
| **7** | **待揽收** | **To Be Collected** ⭐ |
| 8 | 已报损 | Reported Lost |
| 9 | 已拒收 | Rejected |

**请求示例**：

```typescript
const response = await fetch('https://openapi-test01.sheincorp.cn/open-api/order/order-list', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'x-lt-openKeyId': openKeyId,
    'x-lt-timestamp': timestamp,
    'x-lt-signature': signature,
  },
  body: JSON.stringify({
    queryType: 1,
    startTime: '2026-10-01 00:00:00',
    endTime: '2026-10-02 23:59:59',
    page: 1,
    pageSize: 20,
    orderStatus: 7,  // 查询待揽收订单
  }),
});

const data = await response.json();
```

**返回示例**：

```json
{
  "code": "0",
  "msg": "OK",
  "traceId": "abc123",
  "info": {
    "count": 2,
    "orderList": [
      {
        "orderNo": "GSHND026A000YW2",
        "orderStatus": 7,
        "orderType": 1,
        "createTime": "2026-10-01 10:30:00",
        "updateTime": "2026-10-01 14:20:00"
      }
    ]
  }
}
```

---

### 2. 查询订单详情

**接口路径**：`POST /open-api/order/order-detail`

**功能说明**：批量查询订单详细信息。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `orderNoList` | string[] | ✅ | 订单号列表，最多 30 条 |

**请求示例**：

```typescript
const response = await fetch('https://openapi-test01.sheincorp.cn/open-api/order/order-detail', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'x-lt-openKeyId': openKeyId,
    'x-lt-timestamp': timestamp,
    'x-lt-signature': signature,
  },
  body: JSON.stringify({
    orderNoList: ['GSHND026A000YW2', 'GSHND026A000YW3'],
  }),
});

const data = await response.json();
```

**返回参数**：

| 参数名 | 类型 | 说明 |
|-------|------|------|
| `orderNo` | string | 订单号 |
| `orderStatus` | integer | 订单状态 |
| `stockMode` | integer | 库存模式：1=SHEIN自营 / 2=入SHEIN仓 / 3=不入SHEIN仓 |
| `orderType` | integer | 订单类型：1=正常 / 2=换货 / 4=认证仓转自发货 / 5=认证仓 |
| `printOrderStatus` | integer | 是否可处理：1=可处理 / 2=不可处理 |
| `isOverLimitOrder` | integer | 是否超限拆包：1=是 / 2=否 |

**⚠️ 重要提示**：开发者仅需处理 `stockMode=3` 的订单。

---

## 退货相关 API

### 3. 查询退货单列表

**接口路径**：`POST /open-api/return-order/list`

**功能说明**：查询退货单列表。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `queryType` | integer | ✅ | 时间维度：1=退货单下发时间 / 2=买家申请时间 / 3=更新时间 |
| `startTime` | string | ✅ | 开始时间，格式 `yyyy-MM-dd HH:mm:ss` |
| `endTime` | string | ✅ | 结束时间，格式 `yyyy-MM-dd HH:mm:ss` |
| `page` | integer | ✅ | 页码 |
| `pageSize` | integer | ✅ | 每页条数，1~30 |
| `returnOrderStatus` | integer | ❌ | 退货单状态 |

**退货单状态码**：

| 状态码 | 中文 | 说明 |
|-------|------|------|
| 1 | 已关闭 | Closed |
| **2** | **已申请** | **Applied** ⭐ |
| 3 | 已取消 | Canceled |
| **5** | **已收货** | **Received** ⭐ |
| 6 | 已妥投 | Delivered |
| 7 | 待交接 | Pending Handover |
| 8 | 待 SHEIN 仓中转 | Waiting in SHEIN Warehouse |
| 9 | 已完成 | Completed |

**请求示例**：

```typescript
const response = await fetch('https://openapi-test01.sheincorp.cn/open-api/return-order/list', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'x-lt-openKeyId': openKeyId,
    'x-lt-timestamp': timestamp,
    'x-lt-signature': signature,
  },
  body: JSON.stringify({
    queryType: 1,
    startTime: '2026-10-01 00:00:00',
    endTime: '2026-10-02 23:59:59',
    page: 1,
    pageSize: 20,
    returnOrderStatus: 2,  // 查询已申请的退货单
  }),
});

const data = await response.json();
```

**返回示例**：

```json
{
  "code": "0",
  "msg": "OK",
  "traceId": "xyz789",
  "info": {
    "count": 1,
    "returnOrderList": [
      {
        "returnOrderNo": "NGGQM0NLE1",
        "returnOrderStatus": 2,
        "addTime": "2026-10-01 10:49:36",
        "requestReturnTime": "2026-10-01 10:49:23",
        "updateTime": "2026-10-01 10:49:37"
      }
    ]
  }
}
```

---

### 4. 查询退货单详情

**接口路径**：`POST /open-api/return-order/details`

**功能说明**：批量查询退货单详细信息。

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `returnOrderNoList` | string[] | ✅ | 退货单号列表，最多 30 条 |

**请求示例**：

```typescript
const response = await fetch('https://openapi-test01.sheincorp.cn/open-api/return-order/details', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
    'x-lt-openKeyId': openKeyId,
    'x-lt-timestamp': timestamp,
    'x-lt-signature': signature,
  },
  body: JSON.stringify({
    returnOrderNoList: ['NGGQM0NLE1'],
  }),
});

const data = await response.json();
```

**返回参数**：

| 参数名 | 类型 | 说明 |
|-------|------|------|
| `returnOrderNo` | string | 退货单号 |
| `returnOrderStatus` | integer | 退货单状态 |
| `orderNo` | string | 关联订单号 |
| `site` | string | 销售站点 |
| `platformExpressNo` | string | 平台物流单号 |
| `memberExpressNo` | string | 买家物流单号 |
| `expressCompanyName` | string | 物流商名称 |
| `noReturnGoodsSign` | integer | 是否无需退货：0=退货 / 1=无需退货 |
| `performanceCost` | integer | 退货履约服务费 |
| `requestReturnTime` | string | 退货申请时间 |
| `allocateTime` | string | 退货单下发时间 |
| `sellerSignedTime` | string | 商家收货时间 |
| `completedTime` | string | 退货完成时间 |
| `checkStatus` | integer | 对账状态：1=已对账 / 2=未对账 |

---

## 错误处理

### 响应格式

所有 API 响应遵循统一格式：

```json
{
  "code": "0",           // "0" 表示成功，其他值表示失败
  "msg": "OK",           // 错误信息描述
  "traceId": "abc123",   // 请求追踪 ID，用于排查问题
  "info": {}             // 响应数据
}
```

### 常见错误码

| 错误码 | 说明 | 处理建议 |
|-------|------|---------|
| `0` | 成功 | - |
| `130002` | IP 限流 | 降低请求频率，实现指数退避重试 |
| `INVALID_PARAMS` | 参数错误 | 检查请求参数 |
| `SIGNATURE_ERROR` | 签名错误 | 检查签名生成算法、时间戳、密钥 |
| `TOKEN_EXPIRED` | Token 过期 | 重新授权获取新密钥 |

### 错误处理示例

```typescript
async function callSheinAPI(url: string, body: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'x-lt-openKeyId': openKeyId,
        'x-lt-timestamp': timestamp,
        'x-lt-signature': signature,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.code === '0') {
      // 成功
      return data.info;
    } else {
      // 失败
      console.error(`API 调用失败: ${data.msg}`, {
        code: data.code,
        traceId: data.traceId,
      });
      throw new Error(data.msg);
    }
  } catch (error) {
    console.error('API 调用异常:', error);
    throw error;
  }
}
```

---

## 限流规则

### 限流配置

| 限制类型 | 限制值 |
|---------|-------|
| 单个开发者接口限流 | 50 次/秒 |
| 单个 IP 限流 | 60 次/分钟 |

### 限流处理

**指数退避重试示例**：

```typescript
async function callAPIWithRetry(
  url: string,
  body: any,
  maxRetries: number = 3
) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await callSheinAPI(url, body);
    } catch (error: any) {
      if (error.code === '130002' && retries < maxRetries - 1) {
        // IP 限流，等待后重试
        const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s...
        console.log(`限流，${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
}
```

---

## 完整示例

### 完整的订单查询示例

```typescript
import crypto from 'crypto';

// 1. 生成签名
function generateSignature(
  openKeyId: string,
  secretKey: string,
  requestPath: string
): { signature: string; timestamp: string } {
  const timestamp = Date.now().toString();
  const value = `${openKeyId}&${timestamp}&${requestPath}`;
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(value)
    .digest('base64');
  
  return { signature, timestamp };
}

// 2. 查询订单列表
async function queryOrders(
  openKeyId: string,
  secretKey: string,
  startTime: string,
  endTime: string,
  orderStatus?: number
) {
  const requestPath = '/open-api/order/order-list';
  const { signature, timestamp } = generateSignature(
    openKeyId,
    secretKey,
    requestPath
  );

  const response = await fetch(
    `https://openapi-test01.sheincorp.cn${requestPath}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'x-lt-openKeyId': openKeyId,
        'x-lt-timestamp': timestamp,
        'x-lt-signature': signature,
      },
      body: JSON.stringify({
        queryType: 1,
        startTime,
        endTime,
        page: 1,
        pageSize: 20,
        orderStatus,
      }),
    }
  );

  const data = await response.json();

  if (data.code === '0') {
    console.log(`查询成功，共 ${data.info.count} 条订单`);
    return data.info.orderList;
  } else {
    throw new Error(`查询失败: ${data.msg}`);
  }
}

// 3. 使用示例
const openKeyId = 'your_open_key_id';
const secretKey = 'your_decrypted_secret_key';

queryOrders(
  openKeyId,
  secretKey,
  '2026-10-01 00:00:00',
  '2026-10-02 23:59:59',
  7  // 查询待揽收订单
)
  .then(orders => {
    console.log('订单列表:', orders);
  })
  .catch(error => {
    console.error('查询失败:', error);
  });
```

---

## 附录

### 时间格式说明

- **格式**：`yyyy-MM-dd HH:mm:ss`
- **时区**：UTC+8（北京时间）
- **示例**：`2026-10-12 14:30:00`

### 分页说明

- `page`：页码，从 1 开始
- `pageSize`：每页条数，1~30
- 总页数 = `Math.ceil(count / pageSize)`

### 相关文档

- [SHEIN 开放平台官方文档](https://open.shein.com/docs/)
- [授权配置指南](./SHEIN_AUTH_GUIDE.md)
- [快速启动指南](./QUICK_START.md)

---

**文档版本**：v1.0.0  
**最后更新**：2026-10-12
