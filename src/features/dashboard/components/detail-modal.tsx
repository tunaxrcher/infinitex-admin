'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@src/shared/lib/helpers';
import { format } from 'date-fns';
import { Search, X } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Input } from '@src/shared/components/ui/input';
import { ScrollArea } from '@src/shared/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@src/shared/components/ui/tooltip';

interface DetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  type: 'loan' | 'payment' | 'installment';
  loading?: boolean;
}

export function DetailModal({
  open,
  onOpenChange,
  title,
  data,
  type,
  loading,
}: DetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || !data) return data;

    const query = searchQuery.toLowerCase();

    return data.filter((item) => {
      if (type === 'loan') {
        const customerName = (item.customer?.profile?.fullName || '')
          .toLowerCase();
        const loanNumber = (item.loanNumber || '').toLowerCase();
        return loanNumber.includes(query) || customerName.includes(query);
      }

      if (type === 'payment') {
        const customerName = (item.user?.profile?.fullName || '')
          .toLowerCase();
        const loanNumber = (item.loan?.loanNumber || '').toLowerCase();
        return loanNumber.includes(query) || customerName.includes(query);
      }

      if (type === 'installment') {
        const customerName = (item.loan?.customer?.profile?.fullName || '')
          .toLowerCase();
        const loanNumber = (item.loan?.loanNumber || '').toLowerCase();
        return loanNumber.includes(query) || customerName.includes(query);
      }

      return true;
    });
  }, [data, searchQuery, type]);
  // Helper function to truncate text with tooltip
  const TruncatedText = ({
    text,
    maxLength = 30,
  }: {
    text: string;
    maxLength?: number;
  }) => {
    if (!text || text.length <= maxLength) {
      return <span>{text || '-'}</span>;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help truncate">
              {text.substring(0, maxLength)}...
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderContent = () => {
    if (!filteredData || filteredData.length === 0) {
      return (
        <div className="py-10 text-center text-gray-500">
          {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล'}
        </div>
      );
    }

    if (type === 'loan') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">เลขที่สินเชื่อ</TableHead>
                <TableHead className="min-w-[150px]">ชื่อลูกค้า</TableHead>
                <TableHead className="min-w-[120px] text-right">
                  ยอดเงินต้น
                </TableHead>
                <TableHead className="min-w-[100px]">วันที่สร้าง</TableHead>
                <TableHead className="min-w-[100px]">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((loan: any) => {
                const customerName = loan.customer?.profile?.fullName || '';
                return (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      <TruncatedText text={loan.loanNumber} maxLength={20} />
                    </TableCell>
                    <TableCell>
                      <TruncatedText
                        text={customerName || '-'}
                        maxLength={25}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.principalAmount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(loan.createdAt), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          loan.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : loan.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (type === 'payment') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">เลขที่สินเชื่อ</TableHead>
                <TableHead className="min-w-[150px]">ชื่อลูกค้า</TableHead>
                <TableHead className="min-w-[110px] text-right">
                  เงินต้น
                </TableHead>
                <TableHead className="min-w-[110px] text-right">
                  ดอกเบี้ย
                </TableHead>
                <TableHead className="min-w-[110px] text-right">
                  ค่าธรรมเนียม
                </TableHead>
                <TableHead className="min-w-[120px] text-right">
                  ยอดชำระ
                </TableHead>
                <TableHead className="min-w-[140px]">วันที่ชำระ</TableHead>
                <TableHead className="min-w-[100px]">ประเภท</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((payment: any) => {
                const customerName = payment.user?.profile?.fullName || '';
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <TruncatedText
                        text={payment.loan?.loanNumber || '-'}
                        maxLength={20}
                      />
                    </TableCell>
                    <TableCell>
                      <TruncatedText
                        text={customerName || '-'}
                        maxLength={25}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payment.principalAmount || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payment.interestAmount || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payment.feeAmount || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {payment.paidDate
                        ? format(new Date(payment.paidDate), 'dd/MM/yyyy HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.installmentId ? (
                        <span className="whitespace-nowrap rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          ชำระค่างวด
                        </span>
                      ) : (
                        <span className="whitespace-nowrap rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                          ปิดบัญชี
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (type === 'installment') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">เลขที่สินเชื่อ</TableHead>
                <TableHead className="min-w-[150px]">ชื่อลูกค้า</TableHead>
                <TableHead className="min-w-[80px]">งวดที่</TableHead>
                <TableHead className="min-w-[110px] text-right">
                  เงินต้น
                </TableHead>
                <TableHead className="min-w-[110px] text-right">
                  ดอกเบี้ย
                </TableHead>
                <TableHead className="min-w-[120px] text-right">
                  ยอดค้างชำระ
                </TableHead>
                <TableHead className="min-w-[110px]">วันครบกำหนด</TableHead>
                <TableHead className="min-w-[100px]">เลยกำหนด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((installment: any) => {
                const daysLate = installment.dueDate
                  ? Math.floor(
                      (new Date().getTime() -
                        new Date(installment.dueDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : 0;
                const customerName = installment.loan?.customer?.profile?.fullName || '';
                return (
                  <TableRow key={installment.id}>
                    <TableCell className="font-medium">
                      <TruncatedText
                        text={installment.loan?.loanNumber || '-'}
                        maxLength={20}
                      />
                    </TableCell>
                    <TableCell>
                      <TruncatedText
                        text={customerName || '-'}
                        maxLength={25}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      งวดที่ {installment.installmentNumber}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(installment.principalAmount || 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(installment.interestAmount || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-red-600">
                      {formatCurrency(installment.totalAmount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(installment.dueDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                        {daysLate} วัน
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      );
    }

    return null;
  };

  // คำนวณยอดรวม (จากข้อมูลที่ filter แล้ว)
  const totalAmount =
    type === 'loan'
      ? filteredData.reduce(
          (sum, item) => sum + Number(item.principalAmount || 0),
          0,
        )
      : type === 'payment'
        ? filteredData.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        : type === 'installment'
          ? filteredData.reduce(
              (sum, item) => sum + Number(item.totalAmount || 0),
              0,
            )
          : 0;

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
            placeholder="ค้นหาเลขที่สินเชื่อ หรือชื่อลูกค้า..."
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

        <div className="max-h-[calc(90vh-260px)] overflow-y-auto">
          {renderContent()}
        </div>
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
            <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
