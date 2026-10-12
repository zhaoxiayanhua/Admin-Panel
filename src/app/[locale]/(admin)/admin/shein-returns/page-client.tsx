'use client';

import { useState } from 'react';
import { CalendarIcon, Search, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { fetchWithSheinCredentials } from '@/lib/shein/fetch-with-credentials';

import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
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

// 退货单状态映射
const RETURN_STATUS_MAP: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  1: { label: '已关闭', variant: 'destructive' },
  2: { label: '已申请', variant: 'outline' },
  3: { label: '已取消', variant: 'destructive' },
  5: { label: '已收货', variant: 'default' },
  6: { label: '已妥投', variant: 'default' },
  7: { label: '待交接', variant: 'secondary' },
  8: { label: '待 SHEIN 仓中转', variant: 'secondary' },
  9: { label: '已完成', variant: 'default' },
};

interface ReturnOrder {
  returnOrderNo: string;
  returnOrderStatus: number;
  addTime: string;
  requestReturnTime: string;
  updateTime: string;
}

interface ReturnOrderDetail extends ReturnOrder {
  orderNo?: string;
  site?: string;
  platformExpressNo?: string;
  memberExpressNo?: string;
  expressCompanyName?: string;
  noReturnGoodsSign?: number;
  refundOrderNos?: string[];
  performanceCost?: number;
  allocateTime?: string;
  lastUpdateTime?: string;
  sellerSignedTime?: string;
  completedTime?: string;
  checkStatus?: number;
}

export function SheinReturnsPageClient() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [returnStatus, setReturnStatus] = useState<string>('2');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrderDetail | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 查询退货单列表
  const fetchReturns = async () => {
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
      const response = await fetchWithSheinCredentials('/api/shein/returns/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 1,
          startTime: format(startDate, 'yyyy-MM-dd HH:mm:ss'),
          endTime: format(endDate, 'yyyy-MM-dd HH:mm:ss'),
          page: currentPage,
          pageSize,
          returnOrderStatus: returnStatus ? parseInt(returnStatus) : undefined,
        }),
      });

      const data = await response.json();
      if (data.code === '0') {
        setReturns(data.info.returnOrderList || []);
        setTotalCount(data.info.count || 0);
      } else {
        alert(`查询失败: ${data.msg}`);
      }
    } catch (error) {
      console.error('查询退货单失败:', error);
      alert('查询退货单失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 查询退货单详情
  const fetchReturnDetail = async (returnOrderNo: string) => {
    setLoading(true);
    try {
      const response = await fetchWithSheinCredentials('/api/shein/returns/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnOrderNoList: [returnOrderNo],
        }),
      });

      const data = await response.json();
      if (data.code === '0' && data.info.length > 0) {
        setSelectedReturn(data.info[0]);
        setDetailDialogOpen(true);
      } else {
        alert(`查询详情失败: ${data.msg}`);
      }
    } catch (error) {
      console.error('查询退货单详情失败:', error);
      alert('查询退货单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>SHEIN 退货单管理</CardTitle>
          <CardDescription>
            查询退货退款订单，时间范围限制为48小时
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 筛选栏 */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">退货单状态</label>
              <Select value={returnStatus} onValueChange={setReturnStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">已申请</SelectItem>
                  <SelectItem value="5">已收货</SelectItem>
                  <SelectItem value="7">待交接</SelectItem>
                  <SelectItem value="9">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              <Button onClick={fetchReturns} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    查询中...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    查询退货单
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
                  <TableHead>退货单号</TableHead>
                  <TableHead>退货单状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>下发时间</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      暂无数据，请选择时间范围后查询
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((returnOrder) => (
                    <TableRow key={returnOrder.returnOrderNo}>
                      <TableCell className="font-mono">{returnOrder.returnOrderNo}</TableCell>
                      <TableCell>
                        <Badge variant={RETURN_STATUS_MAP[returnOrder.returnOrderStatus]?.variant || 'default'}>
                          {RETURN_STATUS_MAP[returnOrder.returnOrderStatus]?.label || '未知状态'}
                        </Badge>
                      </TableCell>
                      <TableCell>{returnOrder.requestReturnTime}</TableCell>
                      <TableCell>{returnOrder.addTime}</TableCell>
                      <TableCell>{returnOrder.updateTime}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchReturnDetail(returnOrder.returnOrderNo)}
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

      {/* 退货单详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>退货单详情</DialogTitle>
            <DialogDescription>退货单号: {selectedReturn?.returnOrderNo}</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">退货单状态</p>
                  <Badge variant={RETURN_STATUS_MAP[selectedReturn.returnOrderStatus]?.variant}>
                    {RETURN_STATUS_MAP[selectedReturn.returnOrderStatus]?.label}
                  </Badge>
                </div>
                {selectedReturn.orderNo && (
                  <div>
                    <p className="text-sm font-medium">关联订单号</p>
                    <p className="font-mono text-sm">{selectedReturn.orderNo}</p>
                  </div>
                )}
                {selectedReturn.site && (
                  <div>
                    <p className="text-sm font-medium">销售站点</p>
                    <p className="text-sm">{selectedReturn.site}</p>
                  </div>
                )}
                {selectedReturn.expressCompanyName && (
                  <div>
                    <p className="text-sm font-medium">物流商</p>
                    <p className="text-sm">{selectedReturn.expressCompanyName}</p>
                  </div>
                )}
              </div>

              {/* 物流信息 */}
              {(selectedReturn.platformExpressNo || selectedReturn.memberExpressNo) && (
                <div className="rounded-md border p-4">
                  <h4 className="mb-2 font-medium">物流信息</h4>
                  <div className="grid gap-2">
                    {selectedReturn.platformExpressNo && (
                      <div>
                        <p className="text-sm text-muted-foreground">平台物流单号</p>
                        <p className="font-mono text-sm">{selectedReturn.platformExpressNo}</p>
                      </div>
                    )}
                    {selectedReturn.memberExpressNo && (
                      <div>
                        <p className="text-sm text-muted-foreground">买家物流单号</p>
                        <p className="font-mono text-sm">{selectedReturn.memberExpressNo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 退货标识和费用 */}
              <div className="grid grid-cols-2 gap-4">
                {selectedReturn.noReturnGoodsSign !== undefined && (
                  <div>
                    <p className="text-sm font-medium">是否无需退货</p>
                    <Badge variant={selectedReturn.noReturnGoodsSign === 1 ? 'default' : 'outline'}>
                      {selectedReturn.noReturnGoodsSign === 1 ? '无需退货' : '需要退货'}
                    </Badge>
                  </div>
                )}
                {selectedReturn.performanceCost !== undefined && (
                  <div>
                    <p className="text-sm font-medium">履约服务费</p>
                    <p className="text-sm">{selectedReturn.performanceCost}</p>
                  </div>
                )}
              </div>

              {/* 时间线 */}
              <div className="rounded-md border p-4">
                <h4 className="mb-3 font-medium">时间线</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">申请时间</span>
                    <span>{selectedReturn.requestReturnTime}</span>
                  </div>
                  {selectedReturn.allocateTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">下发时间</span>
                      <span>{selectedReturn.allocateTime}</span>
                    </div>
                  )}
                  {selectedReturn.sellerSignedTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">商家收货时间</span>
                      <span>{selectedReturn.sellerSignedTime}</span>
                    </div>
                  )}
                  {selectedReturn.completedTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">完成时间</span>
                      <span>{selectedReturn.completedTime}</span>
                    </div>
                  )}
                  {selectedReturn.lastUpdateTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">最后更新时间</span>
                      <span>{selectedReturn.lastUpdateTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 对账状态 */}
              {selectedReturn.checkStatus !== undefined && (
                <div>
                  <p className="text-sm font-medium">对账状态</p>
                  <Badge variant={selectedReturn.checkStatus === 1 ? 'default' : 'secondary'}>
                    {selectedReturn.checkStatus === 1 ? '已对账' : '未对账'}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
