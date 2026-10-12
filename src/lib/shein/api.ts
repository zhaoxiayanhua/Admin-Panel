import crypto from 'crypto';

/**
 * SHEIN 开放平台 API 配置
 */
export const SHEIN_CONFIG = {
  // 正式环境
  PROD_BASE_URL: 'https://openapi.sheincorp.com',
  // 测试环境
  TEST_BASE_URL: 'https://openapi-test01.sheincorp.cn',
  // 默认使用测试环境
  BASE_URL: process.env.SHEIN_ENV === 'production'
    ? 'https://openapi.sheincorp.com'
    : 'https://openapi-test01.sheincorp.cn',
  // 从环境变量读取
  OPEN_KEY_ID: process.env.SHEIN_OPEN_KEY_ID || '',
  SECRET_KEY: process.env.SHEIN_SECRET_KEY || '',
};

/**
 * 生成 SHEIN API 签名
 * 按照 SHEIN 开放平台签名规范生成签名
 *
 * @param openKeyId - 开放平台密钥 ID
 * @param secretKey - 密钥
 * @param requestPath - 请求路径（不含域名）
 * @returns 签名和时间戳
 */
export function generateSignature(
  openKeyId: string,
  secretKey: string,
  requestPath: string
): { signature: string; timestamp: string } {
  // 步骤1：生成毫秒级时间戳
  const timestamp = Date.now().toString();

  // 步骤2：生成5位随机字符串
  const randomKey = crypto.randomBytes(3).toString('hex').substring(0, 5);

  // 步骤3：组装签名数据 VALUE = openKeyId + "&" + timestamp + "&" + requestPath
  const value = `${openKeyId}&${timestamp}&${requestPath}`;

  // 步骤4：组装签名密钥 KEY = secretKey + randomKey
  const key = secretKey + randomKey;

  // 步骤5：使用 HMAC-SHA256 加密并转十六进制
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(value);
  const hexSignature = hmac.digest('hex');

  // 步骤6：对十六进制字符串（作为文本）进行 Base64 编码
  const base64Signature = Buffer.from(hexSignature, 'utf-8').toString('base64');

  // 步骤7：拼接 randomKey + base64Signature
  const signature = randomKey + base64Signature;

  return { signature, timestamp };
}

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  PENDING = 1,           // 待处理
  TO_BE_SHIPPED = 2,     // 待发货
  PENDING_SHEIN = 3,     // 待 SHEIN 发货
  SHIPPED = 4,           // 已发货
  DELIVERED = 5,         // 已签收
  REFUND = 6,            // 用户已退款
  TO_BE_COLLECTED = 7,   // 待揽收
  REPORTED_LOST = 8,     // 已报损
  REJECTED = 9,          // 已拒收
}

/**
 * 退货单状态枚举
 */
export enum ReturnOrderStatus {
  CLOSED = 1,                  // 已关闭
  APPLIED = 2,                 // 已申请
  CANCELED = 3,                // 已取消
  RECEIVED = 5,                // 已收货
  DELIVERED = 6,               // 已妥投
  PENDING_HANDOVER = 7,        // 待交接
  WAITING_IN_WAREHOUSE = 8,    // 待 SHEIN 仓中转
  COMPLETED = 9,               // 已完成
}

/**
 * 订单状态文本映射
 */
export const ORDER_STATUS_TEXT: Record<number, string> = {
  [OrderStatus.PENDING]: '待处理',
  [OrderStatus.TO_BE_SHIPPED]: '待发货',
  [OrderStatus.PENDING_SHEIN]: '待 SHEIN 发货',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.DELIVERED]: '已签收',
  [OrderStatus.REFUND]: '用户已退款',
  [OrderStatus.TO_BE_COLLECTED]: '待揽收',
  [OrderStatus.REPORTED_LOST]: '已报损',
  [OrderStatus.REJECTED]: '已拒收',
};

/**
 * 退货单状态文本映射
 */
export const RETURN_ORDER_STATUS_TEXT: Record<number, string> = {
  [ReturnOrderStatus.CLOSED]: '已关闭',
  [ReturnOrderStatus.APPLIED]: '已申请',
  [ReturnOrderStatus.CANCELED]: '已取消',
  [ReturnOrderStatus.RECEIVED]: '已收货',
  [ReturnOrderStatus.DELIVERED]: '已妥投',
  [ReturnOrderStatus.PENDING_HANDOVER]: '待交接',
  [ReturnOrderStatus.WAITING_IN_WAREHOUSE]: '待 SHEIN 仓中转',
  [ReturnOrderStatus.COMPLETED]: '已完成',
};

/**
 * 订单列表查询参数
 */
export interface OrderListParams {
  queryType: 1 | 2;  // 1=根据订单下发时间查询 / 2=根据订单更新时间查询
  startTime: string; // 格式: yyyy-MM-dd HH:mm:ss
  endTime: string;   // 格式: yyyy-MM-dd HH:mm:ss
  page: number;
  pageSize: number;  // 1-30
  orderStatus?: number;
  queryOrderType?: 1 | 2 | 3 | 4;
}

/**
 * 订单详情查询参数
 */
export interface OrderDetailParams {
  orderNoList: string[]; // 最多30条
}

/**
 * 退货单列表查询参数
 */
export interface ReturnOrderListParams {
  queryType: 1 | 2 | 3; // 1=退货单下发时间 / 2=买家申请退货时间 / 3=退货单更新时间
  startTime: string;
  endTime: string;
  page: number;
  pageSize: number;
  returnOrderStatus?: number;
}

/**
 * 退货单详情查询参数
 */
export interface ReturnOrderDetailParams {
  returnOrderNoList: string[]; // 最多30条
}

/**
 * API 响应基础类型
 */
export interface ApiResponse<T = any> {
  code: string;
  msg: string;
  traceId: string;
  info: T;
}

/**
 * 订单列表响应
 */
export interface OrderListResponse {
  count: number;
  orderList: Array<{
    orderNo: string;
    orderStatus: number;
    orderType: number;
    createTime: string;
    updateTime: string;
  }>;
}

/**
 * 订单详情响应
 */
export interface OrderDetailResponse {
  orderNo: string;
  orderStatus: number;
  stockMode: number;
  orderType: number;
  printOrderStatus: number;
  unProcessReason?: number[];
  isOverLimitOrder: number;
}

/**
 * 退货单列表响应
 */
export interface ReturnOrderListResponse {
  count: number;
  returnOrderList: Array<{
    returnOrderNo: string;
    returnOrderStatus: number;
    addTime: string;
    requestReturnTime: string;
    updateTime: string;
  }>;
}

/**
 * 退货单详情响应
 */
export interface ReturnOrderDetailResponse {
  returnOrderNo: string;
  returnOrderStatus: number;
  orderNo: string;
  site: string;
  platformExpressNo: string;
  memberExpressNo: string;
  expressCompanyName: string;
  noReturnGoodsSign: number;
  refundOrderNos: string[];
  performanceCost: number;
  requestReturnTime: string;
  allocateTime: string;
  lastUpdateTime: string;
  sellerSignedTime?: string;
  completedTime?: string;
  checkStatus: number;
}
