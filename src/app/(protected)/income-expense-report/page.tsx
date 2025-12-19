'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { incomeExpenseReportApi } from '@src/features/documents/api';
import { useGetIncomeExpenseReport } from '@src/features/documents/hooks';
import { format } from 'date-fns';
import {
  Loader2,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { CountingNumber } from '@src/shared/components/ui/counting-number';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Input } from '@src/shared/components/ui/input';
import { ScrollArea } from '@src/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table';
import { Container } from '@src/shared/components/common/container';

// Generate year options (current year and 5 previous years)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

// Format number to Thai currency format
const formatCurrency = (value: number | undefined | null) => {
  const num = value ?? 0;
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Detail Modal Component
interface DetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  loading: boolean;
  type: 'income-operation' | 'income-installment' | 'expense';
}

function DetailModal({
  open,
  onOpenChange,
  title,
  data,
  loading,
  type,
}: DetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || !data) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      if (type === 'income-operation') {
        const loanNumber = (item.loanNumber || '').toLowerCase();
        const customerName = (item.customerName || '').toLowerCase();
        return loanNumber.includes(query) || customerName.includes(query);
      }
      if (type === 'income-installment') {
        const loanNumber = (item.loanNumber || '').toLowerCase();
        const customerName = (item.customerName || '').toLowerCase();
        return loanNumber.includes(query) || customerName.includes(query);
      }
      if (type === 'expense') {
        const docNumber = (item.docNumber || '').toLowerCase();
        const titleStr = (item.title || '').toLowerCase();
        const note = (item.note || '').toLowerCase();
        return (
          docNumber.includes(query) ||
          titleStr.includes(query) ||
          note.includes(query)
        );
      }
      return true;
    });
  }, [data, searchQuery, type]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    if (!filteredData) return 0;
    if (type === 'income-operation') {
      return filteredData.reduce((sum, item) => sum + (item.totalFee || 0), 0);
    }
    return filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredData, type]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
        </div>
      );
    }

    if (!filteredData || filteredData.length === 0) {
      return (
        <div className="py-10 text-center text-gray-500">
          {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล'}
        </div>
      );
    }

    // รายรับ(ค่าดำเนินการ) - from loans
    if (type === 'income-operation') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">วันที่</TableHead>
                <TableHead className="min-w-[120px]">เลขที่สินเชื่อ</TableHead>
                <TableHead className="min-w-[150px]">ชื่อลูกค้า</TableHead>
                <TableHead className="min-w-[120px] text-right">
                  ยอดเงินต้น
                </TableHead>
                <TableHead className="min-w-[100px] text-right">
                  ค่าดำเนินการ
                </TableHead>
                <TableHead className="min-w-[100px] text-right">
                  ค่าโอน
                </TableHead>
                <TableHead className="min-w-[100px] text-right">
                  ค่าอื่นๆ
                </TableHead>
                <TableHead className="min-w-[120px] text-right">
                  รวมค่าธรรมเนียม
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(item.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.loanNumber}
                  </TableCell>
                  <TableCell>{item.customerName || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.principalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.operationFee)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.transferFee)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.otherFee)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-green-600">
                    {formatCurrency(item.totalFee)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    // รายรับ(ค่างวด) - from payments
    if (type === 'income-installment') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">วันที่ชำระ</TableHead>
                <TableHead className="min-w-[120px]">เลขที่สินเชื่อ</TableHead>
                <TableHead className="min-w-[150px]">ชื่อลูกค้า</TableHead>
                <TableHead className="min-w-[80px]">งวดที่</TableHead>
                <TableHead className="min-w-[110px] text-right">
                  เงินต้น
                </TableHead>
                <TableHead className="min-w-[110px] text-right">
                  ดอกเบี้ย
                </TableHead>
                <TableHead className="min-w-[100px] text-right">
                  ค่าธรรมเนียม
                </TableHead>
                <TableHead className="min-w-[120px] text-right">
                  ยอดชำระ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {item.date
                      ? format(new Date(item.date), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.loanNumber}
                  </TableCell>
                  <TableCell>{item.customerName || '-'}</TableCell>
                  <TableCell>
                    {item.installmentNumber
                      ? `งวดที่ ${item.installmentNumber}`
                      : 'ปิดบัญชี'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.principalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.interestAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.feeAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-green-600">
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    // รายจ่าย - from payment vouchers
    if (type === 'expense') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">วันที่</TableHead>
                <TableHead className="min-w-[120px]">เลขที่ใบสำคัญ</TableHead>
                <TableHead className="min-w-[150px]">หมวดหมู่</TableHead>
                <TableHead className="min-w-[120px]">บัญชี</TableHead>
                <TableHead className="min-w-[120px] text-right">
                  จำนวนเงิน
                </TableHead>
                <TableHead className="min-w-[150px]">หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(item.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.docNumber}
                  </TableCell>
                  <TableCell>{item.title || '-'}</TableCell>
                  <TableCell>{item.cashFlowName || '-'}</TableCell>
                  <TableCell className="text-right font-mono font-semibold text-red-600">
                    -{formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2">{item.note || '-'}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
        <DialogHeader className="flex flex-col items-center gap-4 pb-4">
          <div className="flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={
              type === 'expense'
                ? 'ค้นหาเลขที่ใบสำคัญ, หมวดหมู่...'
                : 'ค้นหาเลขที่สินเชื่อ, ชื่อลูกค้า...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[calc(90vh-300px)]">
          {renderContent()}
        </ScrollArea>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-500">
            {searchQuery ? (
              <>
                พบ {filteredData?.length || 0} จาก {data?.length || 0} รายการ
              </>
            ) : (
              <>รวมทั้งหมด {data?.length || 0} รายการ</>
            )}
          </div>
          <div className="text-lg font-semibold">
            ยอดรวม:{' '}
            <span
              className={type === 'expense' ? 'text-red-600' : 'text-green-600'}
            >
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function IncomeExpenseReportPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalType, setModalType] = useState<
    'income-operation' | 'income-installment' | 'expense'
  >('income-operation');
  const [modalLoading, setModalLoading] = useState(false);

  const { data, isLoading } = useGetIncomeExpenseReport({
    year: selectedYear,
  });

  const reportData = data?.data || { data: [], totals: {} };
  const monthlyData = reportData.data || [];
  const totals = reportData.totals || {
    incomeOperation: 0,
    incomeInstallment: 0,
    incomeTotal: 0,
    expense: 0,
    operatingBalance: 0,
    netProfit: 0,
  };

  const yearOptions = generateYearOptions();

  // Handle cell click to show details
  const handleCellClick = useCallback(
    async (
      month: number,
      monthName: string,
      type: 'income-operation' | 'income-installment' | 'expense',
    ) => {
      setModalLoading(true);

      // Set title based on type
      let typeLabel = '';
      if (type === 'income-operation') {
        typeLabel = 'รายรับ(ค่าดำเนินการ)';
      } else if (type === 'income-installment') {
        typeLabel = 'รายรับ(ค่างวด)';
      } else {
        typeLabel = 'รายจ่าย';
      }

      setModalTitle(`${typeLabel} - ${monthName} ${selectedYear + 543}`);
      setModalType(type);
      setModalOpen(true);

      try {
        const response = await incomeExpenseReportApi.getMonthlyDetails(
          selectedYear,
          month,
          type,
        );
        setModalData(response.data || []);
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
        setModalData([]);
      } finally {
        setModalLoading(false);
      }
    },
    [selectedYear],
  );

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="gradientText text-xl font-bold text-foreground">
              รายงานรายรับ/รายจ่าย
            </h1>
            <span className="text-sm text-muted-foreground">
              สรุปภาพรวมรายรับรายจ่ายประจำปี
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ปี:</span>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year + 543} {/* Convert to Thai Buddhist year */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                รายรับรวม
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                <CountingNumber
                  to={totals.incomeTotal ?? 0}
                  duration={1.5}
                  delay={300}
                  format={(value) => formatCurrency(value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                รายจ่ายรวม
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                <CountingNumber
                  to={totals.expense ?? 0}
                  duration={1.5}
                  delay={400}
                  format={(value) => formatCurrency(value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                กำไรสุทธิ
              </CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (totals.netProfit ?? 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                <CountingNumber
                  to={totals.netProfit ?? 0}
                  duration={1.5}
                  delay={500}
                  format={(value) => formatCurrency(value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Report Table */}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              กำลังโหลดข้อมูล...
            </span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">เดือน</TableHead>
                  <TableHead className="text-right font-semibold">
                    รายรับ(ค่าดำเนินการ)
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    รายรับ(ค่างวด)
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    รายรับ(รวม)
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    รายจ่าย
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    ดุลดำเนินการ
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    กำไรสุทธิ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month: any) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">
                      {month.monthName}
                    </TableCell>
                    {/* รายรับ(ค่าดำเนินการ) - Clickable */}
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer hover:text-primary underline decoration-dotted"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'income-operation',
                          )
                        }
                      >
                        {formatCurrency(month.incomeOperation)}
                      </span>
                    </TableCell>
                    {/* รายรับ(ค่างวด) - Clickable */}
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer hover:text-primary underline decoration-dotted"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'income-installment',
                          )
                        }
                      >
                        {formatCurrency(month.incomeInstallment)}
                      </span>
                    </TableCell>
                    {/* รายรับ(รวม) */}
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrency(month.incomeTotal)}
                    </TableCell>
                    {/* รายจ่าย - Clickable */}
                    <TableCell className="text-right font-mono text-red-600">
                      <span
                        className="cursor-pointer hover:text-red-700 underline decoration-dotted"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'expense',
                          )
                        }
                      >
                        {formatCurrency(month.expense)}
                      </span>
                    </TableCell>
                    {/* ดุลดำเนินการ */}
                    <TableCell
                      className={`text-right font-mono ${
                        (month.operatingBalance ?? 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(month.operatingBalance)}
                    </TableCell>
                    {/* กำไรสุทธิ */}
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        (month.netProfit ?? 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(month.netProfit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>รวมทั้งปี</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.incomeOperation)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.incomeInstallment)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(totals.incomeTotal)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {formatCurrency(totals.expense)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      (totals.operatingBalance ?? 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(totals.operatingBalance)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      (totals.netProfit ?? 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(totals.netProfit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
        type={modalType}
      />
    </Container>
  );
}
