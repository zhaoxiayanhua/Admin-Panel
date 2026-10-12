'use client';

import { useState } from 'react';
import { CalendarIcon, Search, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { fetchWithSheinCredentials } from '@/lib/shein/fetch-with-credentials';

import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Badge } from '@/shared/components/ui/badge';

// 订单状态映射（根据 SHEIN 开放平台文档）
const ORDER_STATUS_MAP: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  1: { label: '待处理', variant: 'outline' },
  2: { label: '待发货', variant: 'secondary' },
  3: { label: '待 SHEIN 发货', variant: 'secondary' },
  4: { label: '已发货', variant: 'default' },
  5: { label: '已签收', variant: 'default' },
  6: { label: '用户已退款', variant: 'destructive' },
  7: { label: '待揽收', variant: 'outline' },
  8: { label: '已报损', variant: 'destructive' },
  9: { label: '已拒收', variant: 'destructive' },
};

// 订单类型映射（根据 SHEIN 开放平台文档）
const ORDER_TYPE_MAP: Record<number, string> = {
  1: '正常订单',
  2: '换货订单',
  4: '认证仓转自发货',
  5: '认证仓订单',
};

interface Order {
  orderNo: string;
  orderStatus: number;
  orderType: number;
  createTime: string;
  updateTime: string;
}

interface OrderDetail extends Order {
  stockMode?: number;
  printOrderStatus?: number;
  unProcessReason?: string[];
  isOverLimitOrder?: number;
}

export function SheinShippedPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 查询订单列表 - 固定查询"已发货"状态（orderStatus=4，根据 SHEIN 文档）
  const fetchOrders = async () => {
    if (!startDate || !endDate) {
      alert('请选择开始时间和结束时间');
      return;
    }

    // 验证时间范围不超过48小时
    const diffInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (diffInHours > 48) {
      alert('时间范围不能超过48小时');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithSheinCredentials('/api/shein/orders/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 1,
          startTime: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
          endTime: format(endDate, 'yyyy-MM-dd HH:mm:ss'),
          page: currentPage,
          pageSize,
          orderStatus: 4, // 固定为已发货状态（根据 SHEIN 文档，已发货=4）
        }),
      });

      const data = await response.json();
      if (data.code === '0') {
        setOrders(data.info.orderList || []);
        setTotalCount(data.info.count || 0);
      } else {
        alert(`查询失败: ${data.msg}`);
      }
    } catch (error) {
      console.error('查询订单失败:', error);
      alert('查询订单失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 查询订单详情
  const fetchOrderDetail = async (orderNo: string) => {
    setLoading(true);
    try {
      const response = await fetchWithSheinCredentials('/api/shein/orders/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNoList: [orderNo],
        }),
      });

      const data = await response.json();
      if (data.code === '0' && data.info.length > 0) {
        setSelectedOrder(data.info[0]);
        setDetailDialogOpen(true);
      } else {
        alert(`查询详情失败: ${data.msg}`);
      }
    } catch (error) {
      console.error('查询订单详情失败:', error);
      alert('查询订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>已发货订单</CardTitle>
          <CardDescription>
            查询已发货状态的订单，时间范围限制为48小时
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 筛选栏 */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">开始时间</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">结束时间</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'yyyy-MM-dd HH:mm', { locale: zhCN }) : '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchOrders} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    查询中...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    查询订单
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>订单状态</TableHead>
                  <TableHead>订单类型</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      暂无数据，请选择时间范围后查询
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.orderNo}>
                      <TableCell className="font-mono">{order.orderNo}</TableCell>
                      <TableCell>
                        <Badge variant={ORDER_STATUS_MAP[order.orderStatus]?.variant || 'default'}>
                          {ORDER_STATUS_MAP[order.orderStatus]?.label || '未知状态'}
                        </Badge>
                      </TableCell>
                      <TableCell>{ORDER_TYPE_MAP[order.orderType] || '未知类型'}</TableCell>
                      <TableCell>{order.createTime}</TableCell>
                      <TableCell>{order.updateTime}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchOrderDetail(order.orderNo)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页器 */}
          {totalCount > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {totalCount} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 订单详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>订单号: {selectedOrder?.orderNo}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">订单状态</p>
                  <Badge variant={ORDER_STATUS_MAP[selectedOrder.orderStatus]?.variant}>
                    {ORDER_STATUS_MAP[selectedOrder.orderStatus]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">订单类型</p>
                  <p className="text-sm">{ORDER_TYPE_MAP[selectedOrder.orderType]}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">创建时间</p>
                  <p className="text-sm">{selectedOrder.createTime}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">更新时间</p>
                  <p className="text-sm">{selectedOrder.updateTime}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
