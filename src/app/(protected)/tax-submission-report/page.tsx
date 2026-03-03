'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { taxSubmissionReportApi } from '@src/features/documents/api';
import { type TaxFeeLoanItem } from '@src/features/documents/components/tax-submission-package-pdf';
import { useGetTaxSubmissionReport } from '@src/features/documents/hooks';
import { format } from 'date-fns';
import { Loader2, Printer, Search, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
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

const TAX_RATE_STORAGE_KEY = 'tax_submission_rate_percent';

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

const formatCurrency = (value: number | undefined | null) => {
  const num = value ?? 0;
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

type DetailType =
  | 'loan-open'
  | 'loan-total'
  | 'close-payment'
  | 'fee-payment'
  | 'expense'
  | 'income-expense-total';

interface DetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  loading: boolean;
  type: DetailType;
  onPrintLoan?: (loan: TaxFeeLoanItem) => void;
}

function DetailModal({
  open,
  onOpenChange,
  title,
  data,
  loading,
  type,
  onPrintLoan,
}: DetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const filteredData = useMemo(() => {
    if (!searchQuery || !data) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      if (type === 'expense') {
        return [item.docNumber, item.title, item.note, item.cashFlowName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }

      if (type === 'income-expense-total') {
        return [
          item.source,
          item.loanNumber,
          item.customerName,
          item.docNumber,
          item.title,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }

      return [item.loanNumber, item.customerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [data, searchQuery, type]);

  const totalAmount = useMemo(() => {
    if (!filteredData) return 0;

    if (type === 'loan-open') {
      return filteredData.reduce(
        (sum, item) => sum + Number(item.principalAmount || 0),
        0,
      );
    }

    if (type === 'fee-payment') {
      return filteredData.reduce(
        (sum, item) => sum + Number(item.feeAmount || 0),
        0,
      );
    }

    if (type === 'income-expense-total') {
      return filteredData.reduce((sum, item) => {
        const amount = Number(item.amount || 0);
        return item.type === 'expense' ? sum - amount : sum + amount;
      }, 0);
    }

    return filteredData.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
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

    if (type === 'loan-open') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่เปิดสัญญา</TableHead>
                <TableHead>เลขที่สินเชื่อ</TableHead>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead className="text-right">ยอดเปิดสินเชื่อ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.date
                      ? format(new Date(item.date), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{item.loanNumber || '-'}</TableCell>
                  <TableCell>{item.customerName || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.principalAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (type === 'expense') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>เลขที่ใบสำคัญ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>บัญชี</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.date
                      ? format(new Date(item.date), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{item.docNumber || '-'}</TableCell>
                  <TableCell>{item.title || '-'}</TableCell>
                  <TableCell>{item.cashFlowName || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    -{formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>{item.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (type === 'income-expense-total') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>แหล่งข้อมูล</TableHead>
                <TableHead>อ้างอิง</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={`${item.type}-${item.id}`}>
                  <TableCell>
                    {item.date
                      ? format(new Date(item.date), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </TableCell>
                  <TableCell>{item.source || '-'}</TableCell>
                  <TableCell>
                    {item.loanNumber || item.docNumber || item.title || '-'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      item.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.type === 'income' ? '' : '-'}
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>วันที่ชำระ</TableHead>
              <TableHead>เลขที่สินเชื่อ</TableHead>
              <TableHead>ชื่อลูกค้า</TableHead>
              {(type === 'fee-payment' || type === 'loan-total') && (
                <TableHead className="text-right">ยอดสินเชื่อ</TableHead>
              )}
              {type === 'fee-payment' && (
                <TableHead className="text-right">เรท(%)</TableHead>
              )}
              {(type === 'fee-payment' || type === 'loan-total') && (
                <TableHead className="text-right">
                  {type === 'fee-payment' ? 'ชำระค่าธรรมเนียม' : 'จำนวนเงิน'}
                </TableHead>
              )}
              {type === 'fee-payment' && (
                <TableHead className="w-[80px] text-center">พิมพ์</TableHead>
              )}
              {type === 'close-payment' && (
                <TableHead className="text-right">ชำระปิดบัญชี</TableHead>
              )}
              {type === 'loan-total' && <TableHead>รายการ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item: any) => {
              const amount =
                type === 'fee-payment'
                  ? Number(item.feeAmount || 0)
                  : Number(item.amount || 0);
              const loanPrincipal = Number(item.loanPrincipal || 0);
              const isFeeRow = item.type === 'fee-payment';

              return (
                <TableRow key={`${item.type || type}-${item.id}`}>
                  <TableCell>
                    {item.date
                      ? format(new Date(item.date), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{item.loanNumber || '-'}</TableCell>
                  <TableCell>{item.customerName || '-'}</TableCell>

                  {(type === 'fee-payment' || type === 'loan-total') && (
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loanPrincipal)}
                    </TableCell>
                  )}

                  {type === 'fee-payment' && (
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.taxRate)}
                    </TableCell>
                  )}

                  {(type === 'fee-payment' || type === 'loan-total') && (
                    <TableCell
                      className={`text-right font-mono ${
                        isFeeRow ? 'text-green-600' : ''
                      }`}
                    >
                      {formatCurrency(amount)}
                    </TableCell>
                  )}
                  {type === 'fee-payment' && (
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-[#e5d8c7] bg-[#f7efe6] text-[#a67752] hover:bg-[#efdfcd]"
                        onClick={() => onPrintLoan?.(item as TaxFeeLoanItem)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}

                  {type === 'close-payment' && (
                    <TableCell className="text-right font-mono">
                      {formatCurrency(amount)}
                    </TableCell>
                  )}

                  {type === 'loan-total' && (
                    <TableCell>
                      {isFeeRow ? 'ค่าธรรมเนียม' : 'ปิดบัญชี'}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
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
              className={
                type === 'expense'
                  ? 'text-red-600'
                  : totalAmount >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
              }
            >
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TaxSubmissionReportPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [taxRate, setTaxRate] = useState(1.25);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState('1.25');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalType, setModalType] = useState<DetailType>('loan-open');
  const [modalLoading, setModalLoading] = useState(false);
  const [printingMonth, setPrintingMonth] = useState<number | null>(null);

  useEffect(() => {
    const storedRate = window.localStorage.getItem(TAX_RATE_STORAGE_KEY);
    if (!storedRate) return;
    const parsed = Number(storedRate);
    if (Number.isNaN(parsed)) return;
    setTaxRate(parsed);
    setTaxRateInput(parsed.toString());
  }, []);

  const { data, isLoading } = useGetTaxSubmissionReport({
    year: selectedYear,
    taxRate,
  });

  const reportData = data?.data || { data: [], totals: {} };
  const monthlyData = reportData.data || [];
  const totals = reportData.totals || {
    loanOpenAmount: 0,
    loanTotalAmount: 0,
    closeAccountPayment: 0,
    feePayment: 0,
    expense: 0,
    incomeExpenseTotal: 0,
  };

  const yearOptions = generateYearOptions();

  const handleCellClick = useCallback(
    async (
      month: number,
      monthName: string,
      type: DetailType,
      title: string,
    ) => {
      setModalLoading(true);
      setModalTitle(`${title} - ${monthName} ${selectedYear + 543}`);
      setModalType(type);
      setModalOpen(true);

      try {
        const response = await taxSubmissionReportApi.getMonthlyDetails(
          selectedYear,
          month,
          type,
          taxRate,
        );
        setModalData(response.data || []);
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
        setModalData([]);
      } finally {
        setModalLoading(false);
      }
    },
    [selectedYear, taxRate],
  );

  const saveTaxRate = () => {
    const value = Number(taxRateInput);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error('กรุณาระบุเรทระหว่าง 0 - 100');
      return;
    }
    setTaxRate(value);
    window.localStorage.setItem(TAX_RATE_STORAGE_KEY, value.toString());
    setRateDialogOpen(false);
    toast.success('บันทึกเรทค่าธรรมเนียมสำเร็จ');
  };

  const openPrintPreview = useCallback(
    async (loans: TaxFeeLoanItem[], monthName: string) => {
      const viewerWindow = window.open('', '_blank');
      if (!viewerWindow) {
        toast.error('ไม่สามารถเปิด PDF Viewer ได้ กรุณาอนุญาต Pop-up');
        return;
      }

      viewerWindow.document.write(
        `<!doctype html><html lang="th"><head><meta charset="UTF-8"/><title>กำลังสร้าง PDF...</title><style>body{font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#e5e7eb;background:#111827;flex-direction:column;gap:12px}.spinner{width:40px;height:40px;border:3px solid #374151;border-top-color:#60a5fa;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="spinner"></div><div>กำลังสร้างเอกสาร PDF...</div></body></html>`,
      );
      viewerWindow.document.close();

      try {
        // POST ไปยัง API — server fetch รูปจาก S3 + generate PDF (ไม่มี CORS)
        const res = await fetch('/api/tax-submission-report/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loans,
            monthName,
            buddhistYear: selectedYear + 543,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Server error ${res.status}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        viewerWindow.document.open();
        viewerWindow.document.write(`
          <!doctype html>
          <html lang="th">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>PDF Viewer - ชุดเอกสารนำส่งภาษี</title>
              <style>
                html, body { margin:0; padding:0; height:100%; background:#111827; }
                .viewer-wrap { height:100%; display:flex; flex-direction:column; }
                .toolbar {
                  height:44px; background:#1f2937; color:#fff;
                  display:flex; align-items:center; justify-content:space-between;
                  padding:0 12px; font-family:Arial,sans-serif; font-size:13px;
                }
                .toolbar a {
                  color:#fff; text-decoration:none;
                  border:1px solid rgba(255,255,255,0.35);
                  border-radius:6px; padding:6px 10px; margin-left:8px;
                }
                iframe { width:100%; height:calc(100% - 44px); border:none; background:#374151; }
              </style>
            </head>
            <body>
              <div class="viewer-wrap">
                <div class="toolbar">
                  <div>PDF Viewer: ชุดเอกสารนำส่งภาษี</div>
                  <div>
                    <a href="${url}" download="tax-submission-package.pdf">Download</a>
                    <a href="${url}" target="_blank">Open Native Viewer</a>
                  </div>
                </div>
                <iframe src="${url}#toolbar=1&navpanes=1&scrollbar=1" title="PDF Viewer"></iframe>
              </div>
            </body>
          </html>
        `);
        viewerWindow.document.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown PDF error';
        const safeErrorMessage = errorMessage
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        viewerWindow.document.open();
        viewerWindow.document.write(`
          <!doctype html>
          <html lang="th">
            <head><meta charset="UTF-8" /><title>PDF Error</title></head>
            <body style="font-family:Arial,sans-serif;padding:24px;">
              <h2>สร้าง PDF ไม่สำเร็จ</h2>
              <p>${safeErrorMessage}</p>
            </body>
          </html>
        `);
        viewerWindow.document.close();
        toast.error(`สร้าง PDF ไม่สำเร็จ: ${errorMessage}`);
      }
    },
    [selectedYear],
  );

  const handlePrintMonthPackage = useCallback(
    async (month: number, monthName: string) => {
      setPrintingMonth(month);
      try {
        const response = await taxSubmissionReportApi.getMonthlyDetails(
          selectedYear,
          month,
          'fee-payment',
          taxRate,
        );
        const rawItems = (response.data || []) as TaxFeeLoanItem[];
        const itemsMap = new Map<string, TaxFeeLoanItem>();
        for (const item of rawItems) {
          const key = item.loanId || item.loanNumber || item.id;
          const existing = itemsMap.get(key);
          if (!existing) {
            itemsMap.set(key, { ...item });
            continue;
          }
          existing.feeAmount =
            Number(existing.feeAmount || 0) + Number(item.feeAmount || 0);
          if (!existing.date && item.date) {
            existing.date = item.date;
          }
          if (
            (!existing.placeDisplay || existing.placeDisplay === '-') &&
            item.placeDisplay
          ) {
            existing.placeDisplay = item.placeDisplay;
          }
          if (
            (!existing.placeName || existing.placeName === '-') &&
            item.placeName
          ) {
            existing.placeName = item.placeName;
          }
          if (
            (!existing.propertyType || existing.propertyType === 'ที่ดิน') &&
            item.propertyType
          ) {
            existing.propertyType = item.propertyType;
          }
          if (
            (!existing.allPlaceNames || existing.allPlaceNames.length === 0) &&
            item.allPlaceNames
          ) {
            existing.allPlaceNames = item.allPlaceNames;
          }
        }
        const items = Array.from(itemsMap.values());
        if (items.length === 0) {
          toast.error('ไม่พบรายการชำระค่าธรรมเนียมของเดือนนี้');
          return;
        }
        await openPrintPreview(items, monthName);
      } catch (error) {
        toast.error('ไม่สามารถสร้างเอกสาร PDF ได้');
      } finally {
        setPrintingMonth(null);
      }
    },
    [openPrintPreview, selectedYear, taxRate],
  );

  const handlePrintSingleLoanPackage = useCallback(
    async (loan: TaxFeeLoanItem) => {
      await openPrintPreview([loan], 'เอกสารรายสินเชื่อ');
    },
    [openPrintPreview],
  );

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="gradientText text-xl font-bold text-foreground">
              รายงานนำส่งภาษี
            </h1>
            <span className="text-sm text-muted-foreground">
              สรุปรายเดือนสำหรับข้อมูลนำส่งภาษี
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ปี:</span>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year + 543}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setRateDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              ตั้งค่าเรทค่าธรรมเนียม
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ยอดรวมสินเชื่อทั้งปี
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totals.loanTotalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ชำระค่าธรรมเนียมทั้งปี
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.feePayment)}
              </div>
              <p className="text-xs text-muted-foreground">
                เรทปัจจุบัน {formatCurrency(taxRate)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                รวมรับ/จ่ายทั้งปี
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totals.incomeExpenseTotal >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(totals.incomeExpenseTotal)}
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>
        </div>

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
                    ยอดเปิดสินเชื่อ
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    ยอดรวมสินเชื่อ
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    ชำระปิดบัญชี
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    ชำระค่าธรรมเนียม
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    รายจ่าย
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    รวมรับ/จ่าย
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month: any) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">
                      {month.monthName}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-primary"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'loan-open',
                            'ยอดเปิดสินเชื่อ',
                          )
                        }
                      >
                        {formatCurrency(month.loanOpenAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-primary"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'loan-total',
                            'ยอดรวมสินเชื่อ',
                          )
                        }
                      >
                        {formatCurrency(month.loanTotalAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-primary"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'close-payment',
                            'ชำระปิดบัญชี',
                          )
                        }
                      >
                        {formatCurrency(month.closeAccountPayment)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className="cursor-pointer underline decoration-dotted hover:text-green-700"
                          onClick={() =>
                            handleCellClick(
                              month.month,
                              month.monthName,
                              'fee-payment',
                              'ชำระค่าธรรมเนียม',
                            )
                          }
                        >
                          {formatCurrency(month.feePayment)}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={printingMonth === month.month}
                          className="h-8 w-8 border-[#e5d8c7] bg-[#f7efe6] text-[#a67752] hover:bg-[#efdfcd]"
                          onClick={() =>
                            handlePrintMonthPackage(
                              month.month,
                              month.monthName,
                            )
                          }
                        >
                          {printingMonth === month.month ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-red-700"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'expense',
                            'รายจ่าย',
                          )
                        }
                      >
                        {formatCurrency(month.expense)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        (month.incomeExpenseTotal ?? 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      <span
                        className="cursor-pointer underline decoration-dotted"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'income-expense-total',
                            'รวมรับ/จ่าย',
                          )
                        }
                      >
                        {formatCurrency(month.incomeExpenseTotal)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>ยอดรวม</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.loanOpenAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.loanTotalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.closeAccountPayment)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(totals.feePayment)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {formatCurrency(totals.expense)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      (totals.incomeExpenseTotal ?? 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(totals.incomeExpenseTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>

      <DetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
        type={modalType}
        onPrintLoan={handlePrintSingleLoanPackage}
      />

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ตั้งค่าเรทชำระค่าธรรมเนียม</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">เรท (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxRateInput}
                onChange={(e) => setTaxRateInput(e.target.value)}
                placeholder="เช่น 1.25"
              />
              <p className="text-xs text-muted-foreground">
                ระบบจะใช้สูตร: ยอดสินเชื่อ x เรท สำหรับรายการชำระค่างวด
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRateDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button onClick={saveTaxRate}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
