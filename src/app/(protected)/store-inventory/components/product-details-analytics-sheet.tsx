'use client';

import { useEffect, useState } from 'react';
import { useDeleteLoan, useGetLoanById } from '@src/features/loans/hooks';
import { Badge, BadgeDot } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardToolbar,
} from '@src/shared/components/ui/card';
import { ScrollArea } from '@src/shared/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@src/shared/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@src/shared/components/ui/tabs';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@src/shared/components/ui/toggle-group';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { SquarePen, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

export function ProductDetailsAnalyticsSheet({
  open,
  onOpenChange,
  loanId,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId?: string;
  onEdit?: () => void;
}) {
  // Fetch loan data from API
  const { data: loanResponse, isLoading } = useGetLoanById(loanId || '');
  const loan = loanResponse?.data;
  const deleteLoan = useDeleteLoan();

  // Handle delete
  const handleDelete = () => {
    if (!loanId) return;

    if (
      confirm(
        'คุณต้องการลบสินเชื่อนี้ใช่หรือไม่?\n\nการลบจะเปลี่ยนสถานะเป็น CANCELLED และไม่สามารถกู้คืนได้',
      )
    ) {
      deleteLoan.mutate(loanId, {
        onSuccess: () => {
          onOpenChange(false); // ปิด modal หลังลบสำเร็จ
        },
      });
    }
  };

  // Get installments from loan data
  const installments = loan?.installments || [];
  const paidInstallments = installments.filter((inst: any) => inst.isPaid);
  
  // Chart data for Payment History (งวดที่ชำระ) - last 7 paid installments
  const paymentHistoryData = paidInstallments
    .slice(-7)
    .map((inst: any) => ({
      value: Number(inst.paidAmount || 0),
    }));

  // Chart data for Outstanding Balance (ยอดคงเหลือ)
  // Calculate remaining balance after each paid installment
  const outstandingBalanceData = (() => {
    if (!loan) return [];
    
    let balance = Number(loan.principalAmount) * (1 + Number(loan.interestRate) / 100);
    const data = [];
    
    // Get last 7 installments (or all if less than 7)
    const lastInstallments = installments.slice(0, 7);
    
    for (const inst of lastInstallments) {
      if (inst.isPaid) {
        balance -= Number(inst.totalAmount || 0);
      }
      data.push({ value: Math.max(0, balance) });
    }
    
    return data.reverse(); // Reverse to show oldest first
  })();

  // Payment schedule table (ตารางการชำระเงิน) - show all installments
  const paymentSchedule = installments.map((inst: any) => ({
    installment: inst.installmentNumber.toString(),
    dueDate: new Date(inst.dueDate).toLocaleDateString('th-TH', {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
    }),
    amount: `฿${Number(inst.totalAmount).toLocaleString()}`,
    status: inst.isPaid ? 'ชำระแล้ว' : inst.isLate ? 'เกินกำหนด' : 'รอชำระ',
    paidAmount: inst.isPaid
      ? `฿${Number(inst.paidAmount).toLocaleString()}`
      : '-',
    isLate: inst.isLate,
  }));

  // Calculate total paid and average payment
  const totalPaid = paidInstallments.reduce(
    (sum: number, inst: any) => sum + Number(inst.paidAmount || 0),
    0,
  );
  const avgPayment = paidInstallments.length > 0 
    ? totalPaid / paidInstallments.length 
    : 0;
  
  // Calculate percentage change in balance
  const initialBalance = loan 
    ? Number(loan.principalAmount) * (1 + Number(loan.interestRate) / 100)
    : 0;
  const currentBalance = Number(loan?.remainingBalance || 0);
  const balanceChangePercent = initialBalance > 0
    ? ((initialBalance - currentBalance) / initialBalance) * 100
    : 0;

  const [selectedImage, setSelectedImage] = useState('title-deed-example1');
  const [activeTab, setActiveTab] = useState('details');

  // Prevent auto-focus when sheet opens
  useEffect(() => {
    if (open) {
      // Blur any focused element when sheet opens
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 lg:w-[1080px] sm:max-w-none inset-5 border start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle tabIndex={0} className="focus:outline-none font-medium">
            รายละเอียดและวิเคราะห์สินเชื่อ
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between gap-2 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[22px] font-semibold text-foreground leading-none">
                  {isLoading
                    ? 'กำลังโหลด...'
                    : loan
                      ? `${loan.customer?.profile?.firstName || ''} ${loan.customer?.profile?.lastName || ''}`.trim() ||
                        'ไม่ระบุ'
                      : 'ไม่ระบุ'}
                </span>
                <Badge
                  size="sm"
                  variant={
                    loan?.status === 'ACTIVE'
                      ? 'success'
                      : loan?.status === 'COMPLETED'
                        ? 'info'
                        : loan?.status === 'DEFAULTED'
                          ? 'destructive'
                          : 'warning'
                  }
                  appearance="light"
                >
                  {loan?.status === 'ACTIVE'
                    ? 'ยังไม่ถึงกำหนด'
                    : loan?.status === 'COMPLETED'
                      ? 'ปิดบัญชี'
                      : loan?.status === 'DEFAULTED'
                        ? 'เกินกำหนดชำระ'
                        : 'รออนุมัติ'}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-1.5 text-2sm">
                <span className="font-normal text-muted-foreground">
                  เลขที่สินเชื่อ
                </span>
                <span className="font-medium text-foreground/80">
                  {loan?.loanNumber || '-'}
                </span>
                <BadgeDot className="bg-muted-foreground/60 size-1 mx-1" />
                <span className="font-normal text-muted-foreground">
                  วันที่ออกสินเชื่อ
                </span>
                <span className="font-medium text-foreground/80">
                  {loan?.contractDate
                    ? new Date(loan.contractDate).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                </span>
                <BadgeDot className="bg-muted-foreground/60 size-1 mx-1" />
                <span className="font-normal text-muted-foreground">
                  อัปเดตล่าสุด
                </span>
                <span className="font-medium text-foreground/80">
                  {loan?.updatedAt
                    ? new Date(loan.updatedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="ghost">พิมพ์เอกสาร</Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteLoan.isPending}
              >
                {deleteLoan.isPending ? 'กำลังลบ...' : 'ลบ'}
              </Button>
              <Button
                variant="mono"
                onClick={() => {
                  onOpenChange(false);
                  onEdit?.();
                }}
              >
                แก้ไขข้อมูล
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full"
          >
            <div className="border-b border-border px-5">
              <TabsList className="h-auto p-0 bg-transparent border-b-0 border-border rounded-none w-full">
                <div className="flex items-center gap-1 min-w-max">
                  <TabsTrigger
                    value="details"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    รายละเอียดสินเชื่อ
                    {activeTab === 'details' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="contract"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    หนังสือสัญญากู้เงิน
                    {activeTab === 'contract' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="schedule"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    ตารางผ่อนชำระ
                    {activeTab === 'schedule' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    ชำระสินเชื่อ
                    {activeTab === 'payment' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancel"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    ยกเลิกสินเชื่อ
                    {activeTab === 'cancel' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                </div>
              </TabsList>
            </div>

            <TabsContent value="details" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                  <div className="grow lg:border-e border-border lg:pe-5 space-y-5 py-5">
                    {/* Loan Summary */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[34px] bg-accent/50">
                        <CardTitle className="text-2sm">สรุปสินเชื่อ</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start flex-wrap lg:gap-10 gap-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-2sm font-normal text-secondary-foreground">
                              สถานะ
                            </span>
                            <span className="text-2sm font-medium text-foreground">
                              <Badge
                                variant={
                                  loan?.status === 'ACTIVE'
                                    ? 'success'
                                    : loan?.status === 'COMPLETED'
                                      ? 'info'
                                      : loan?.status === 'DEFAULTED'
                                        ? 'destructive'
                                        : 'warning'
                                }
                                appearance="light"
                              >
                                {loan?.status === 'ACTIVE'
                                  ? 'ยังไม่ถึงกำหนด'
                                  : loan?.status === 'COMPLETED'
                                    ? 'ปิดบัญชี'
                                    : loan?.status === 'DEFAULTED'
                                      ? 'เกินกำหนดชำระ'
                                      : 'รออนุมัติ'}
                              </Badge>
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-2sm font-normal text-secondary-foreground">
                              วงเงิน
                            </span>
                            <span className="text-2sm font-medium text-foreground">
                              ฿
                              {loan
                                ? Number(loan.principalAmount).toLocaleString()
                                : '0'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-2sm font-normal text-secondary-foreground">
                              ยอดคงเหลือ
                            </span>
                            <span className="text-2sm font-medium text-foreground">
                              ฿
                              {loan
                                ? Number(loan.remainingBalance).toLocaleString()
                                : '0'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-2sm font-normal text-secondary-foreground">
                              งวดที่ชำระ
                            </span>
                            <span className="text-2sm font-medium text-foreground">
                              <Badge variant="info" appearance="light">
                                {loan
                                  ? `${loan.currentInstallment}/${loan.totalInstallments}`
                                  : '0/0'}
                              </Badge>
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-2sm font-normal text-secondary-foreground">
                              ดอกเบี้ย
                            </span>
                            <span className="text-2sm font-medium text-foreground">
                              {loan
                                ? Number(loan.interestRate).toFixed(2)
                                : '0'}
                              %
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Analytics */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[34px] bg-accent/50">
                        <CardTitle className="text-2sm">การวิเคราะห์</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-5 lg:gap-7.5 pt-4 pb-5">
                        <div className="space-y-1">
                          <div className="text-2sm font-normal text-secondary-foreground">
                            ประวัติการชำระ
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-semibold text-foreground">
                              ฿{Math.round(avgPayment).toLocaleString()}
                            </span>
                            <Badge
                              size="xs"
                              variant={paidInstallments.some((inst: any) => inst.isLate) ? 'warning' : 'success'}
                              appearance="light"
                            >
                              <TrendingUp />
                              {paidInstallments.some((inst: any) => inst.isLate) ? 'มีการชำระล่าช้า' : 'ตรงเวลา'}
                            </Badge>
                          </div>

                          {/* Recharts Area Chart */}
                          <div className="relative">
                            <div className="h-[100px] w-full">
                              {paymentHistoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={paymentHistoryData}
                                    margin={{
                                      top: 5,
                                      right: 5,
                                      left: 5,
                                      bottom: 5,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="paymentHistoryGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor="#16a34a"
                                          stopOpacity={0.15}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#16a34a"
                                          stopOpacity={0.02}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Tooltip
                                      cursor={{
                                        stroke: '#16a34a',
                                        strokeWidth: 1,
                                        strokeDasharray: '2 2',
                                      }}
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const value = payload[0]
                                            .value as number;
                                          return (
                                            <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-lg p-2 pointer-events-none">
                                              <p className="text-sm font-semibold text-foreground">
                                                ฿{value.toLocaleString()}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#16a34a"
                                      fill="url(#paymentHistoryGradient)"
                                      strokeWidth={1}
                                      dot={false}
                                      activeDot={{
                                        r: 4,
                                        fill: '#16a34a',
                                        stroke: 'white',
                                        strokeWidth: 2,
                                      }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                  ยังไม่มีประวัติการชำระ
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-2sm font-normal text-secondary-foreground">
                            ยอดคงเหลือ
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-semibold text-foreground">
                              ฿{Number(loan?.remainingBalance || 0).toLocaleString()}
                            </span>
                            {balanceChangePercent > 0 && (
                              <Badge
                                size="xs"
                                variant="info"
                                appearance="light"
                              >
                                <TrendingDown />
                                -{balanceChangePercent.toFixed(1)}%
                              </Badge>
                            )}
                            <span className="text-2sm font-normal text-secondary-foreground ps-2.5">
                              {loan?.currentInstallment || 0}/{loan?.totalInstallments || 0} งวด
                            </span>
                          </div>

                          {/* Recharts Area Chart */}
                          <div className="relative">
                            <div className="h-[100px] w-full">
                              {outstandingBalanceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={outstandingBalanceData}
                                    margin={{
                                      top: 5,
                                      right: 5,
                                      left: 5,
                                      bottom: 5,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="outstandingBalanceGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor="#4921EA"
                                          stopOpacity={0.15}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#4921EA"
                                          stopOpacity={0.02}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Tooltip
                                      cursor={{
                                        stroke: '#4921EA',
                                        strokeWidth: 1,
                                        strokeDasharray: '2 2',
                                      }}
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const value = payload[0]
                                            .value as number;
                                          return (
                                            <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-lg p-2 pointer-events-none">
                                              <p className="text-sm font-semibold text-foreground">
                                                ฿{value.toLocaleString()}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#4921EA"
                                      fill="url(#outstandingBalanceGradient)"
                                      strokeWidth={1}
                                      dot={false}
                                      activeDot={{
                                        r: 4,
                                        fill: '#4921EA',
                                        stroke: 'white',
                                        strokeWidth: 2,
                                      }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                  ยังไม่มีข้อมูลยอดคงเหลือ
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Schedule table */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[34px] bg-accent/50">
                        <CardTitle className="text-2sm">
                          ตารางการชำระเงิน
                        </CardTitle>
                        <CardToolbar>
                          <Button mode="link" className="text-primary">
                            จัดการการชำระ
                          </Button>
                        </CardToolbar>
                      </CardHeader>

                      <CardContent className="p-0">
                        <Table className="overflow-x-auto">
                          <TableHeader>
                            <TableRow className="text-secondary-foreground font-normal text-2sm">
                              <TableHead className="w-[80px] h-8.5 border-e border-border ps-5">
                                งวดที่
                              </TableHead>
                              <TableHead className="w-[120px] h-8.5 border-e border-border">
                                วันครบกำหนด
                              </TableHead>
                              <TableHead className="w-[120px] h-8.5 border-e border-border">
                                ยอดที่ต้องชำระ
                              </TableHead>
                              <TableHead className="w-[100px] h-8.5 border-e border-border">
                                สถานะ
                              </TableHead>
                              <TableHead className="w-[120px] h-8.5 border-e border-border">
                                ยอดที่ชำระ
                              </TableHead>
                              <TableHead className="w-[50px] h-8.5"></TableHead>
                            </TableRow>
                          </TableHeader>

                          <TableBody>
                            {paymentSchedule.length > 0 ? (
                              paymentSchedule.map((payment, index) => (
                                <TableRow
                                  key={payment.installment}
                                  className={`text-secondary-foreground font-normal text-2sm ${index % 2 === 0 ? 'bg-accent/50' : ''}`}
                                >
                                  <TableCell className="py-1 border-e border-border ps-5">
                                    งวดที่ {payment.installment}
                                  </TableCell>
                                  <TableCell className="py-1 border-e border-border">
                                    {payment.dueDate}
                                  </TableCell>
                                  <TableCell className="py-1 border-e border-border">
                                    {payment.amount}
                                  </TableCell>
                                  <TableCell className="py-1 border-e border-border">
                                    <Badge
                                      variant={
                                        payment.status === 'ชำระแล้ว'
                                          ? 'success'
                                          : payment.isLate
                                            ? 'destructive'
                                            : 'warning'
                                      }
                                      appearance="light"
                                      size="sm"
                                    >
                                      {payment.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-1 border-e border-border">
                                    {payment.paidAmount}
                                  </TableCell>
                                  <TableCell className="text-center py-1">
                                    <Button variant="ghost" mode="icon" size="sm">
                                      <SquarePen />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                  {isLoading ? 'กำลังโหลดข้อมูล...' : 'ยังไม่มีข้อมูลตารางผ่อนชำระ'}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="w-full shrink-0 lg:w-[420px] py-5 lg:ps-5">
                    <div className="mb-5">
                      <Card className="flex items-center justify-center rounded-md bg-accent/50 shadow-none shrink-0 mb-5">
                        <img
                          src={toAbsoluteUrl(`/images/${selectedImage}.jpg`)}
                          className="h-[250px] shrink-0 object-cover w-full rounded-md"
                          alt="รูปหลักประกัน/โฉนด"
                        />
                      </Card>

                      <ToggleGroup
                        className="grid grid-cols-2 gap-4"
                        type="single"
                        value={selectedImage}
                        onValueChange={(newValue) => {
                          if (newValue) setSelectedImage(newValue);
                        }}
                      >
                        {[
                          {
                            id: '1',
                            value: 'title-deed-example1',
                            image: 'title-deed-example1.jpg',
                            alt: 'โฉนด 1',
                          },
                          {
                            id: '2',
                            value: 'title-deed-example2',
                            image: 'title-deed-example2.jpg',
                            alt: 'โฉนด 2',
                          },
                        ].map((item) => (
                          <ToggleGroupItem
                            key={item.id}
                            value={item.value}
                            className="rounded-md border border-border shrink-0 h-[80px] p-0 bg-accent/50 hover:bg-accent/50 data-[state=on]:border-zinc-950 dark:data-[state=on]:border-zinc-50"
                          >
                            <img
                              src={toAbsoluteUrl(`/images/${item.image}`)}
                              className="h-[80px] w-full object-cover rounded-md"
                              alt={item.alt}
                            />
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                    <p className="text-2sm font-normal text-secondary-foreground leading-5 mb-5">
                      สินเชื่อเพื่อธุรกิจโดยใช้ที่ดินเป็นหลักประกัน
                      อนุมัติรวดเร็ว อัตราดอกเบี้ยคงที่ มีความยืดหยุ่นในการชำระ
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center lg:gap-13 gap-5">
                        <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                          ประเภทสินเชื่อ
                        </div>
                        <div className="text-2sm text-secondary-foreground font-medium">
                          {loan?.loanType === 'HOUSE_LAND_MORTGAGE'
                            ? 'จำนองบ้านและที่ดิน'
                            : 'เงินสด'}
                        </div>
                      </div>
                      <div className="flex items-center lg:gap-13 gap-5">
                        <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                          ระยะเวลา
                        </div>
                        <div className="text-2sm text-secondary-foreground font-medium">
                          {loan
                            ? `${loan.termMonths / 12} ปี (${loan.termMonths} งวด)`
                            : '-'}
                        </div>
                      </div>
                      <div className="flex items-center lg:gap-13 gap-5">
                        <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                          อัตราดอกเบี้ย
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="primary" appearance="light">
                            {loan ? Number(loan.interestRate).toFixed(2) : '0'}% ต่อปี
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center lg:gap-13 gap-5">
                        <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                          ความเสี่ยง
                        </div>
                        <div className="flex items-center gap-3.5">
                          <Badge variant="warning" appearance="outline">
                            ความเสี่ยงปานกลาง
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center lg:gap-13 gap-5">
                        <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                          สถานที่
                        </div>
                        <div className="text-2sm text-secondary-foreground font-medium">
                          {loan?.application?.propertyLocation || '-'} 
                          {loan?.application?.propertyArea ? ` (${loan.application.propertyArea})` : ''}
                        </div>
                      </div>
                      <div className="flex items-center lg:gap-13 gap-5">
                        <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                          โฉนด
                        </div>
                        <div className="text-2sm text-secondary-foreground font-medium">
                          {loan?.titleDeedNumber || loan?.application?.landNumber || '-'}
                        </div>
                      </div>
                      <div className="flex items-center lg:gap-13 gap-5">
                        <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                          เจ้าของ
                        </div>
                        <div className="text-2sm text-secondary-foreground font-medium">
                          {loan?.application?.ownerName || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="contract" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex items-center justify-center h-full px-3.5 py-10">
                  <p className="text-muted-foreground text-sm">
                    เนื้อหาหนังสือสัญญากู้เงิน (ยังไม่ได้พัฒนา)
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex items-center justify-center h-full px-3.5 py-10">
                  <p className="text-muted-foreground text-sm">
                    เนื้อหาตารางผ่อนชำระ (ยังไม่ได้พัฒนา)
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="payment" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex items-center justify-center h-full px-3.5 py-10">
                  <p className="text-muted-foreground text-sm">
                    เนื้อหาชำระสินเชื่อ (ยังไม่ได้พัฒนา)
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="cancel" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex items-center justify-center h-full px-3.5 py-10">
                  <p className="text-muted-foreground text-sm">
                    เนื้อหายกเลิกสินเชื่อ (ยังไม่ได้พัฒนา)
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0">
          <Button variant="ghost">พิมพ์เอกสาร</Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteLoan.isPending}
          >
            {deleteLoan.isPending ? 'กำลังลบ...' : 'ลบ'}
          </Button>
          <Button
            variant="mono"
            onClick={() => {
              onOpenChange(false);
              onEdit?.();
            }}
          >
            แก้ไขข้อมูล
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
