'use client';

import { useState } from 'react';
import { Container } from '@src/shared/components/common/container';
import { useGetIncomeExpenseReport } from '@src/features/documents/hooks';
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
import { Card, CardContent, CardHeader, CardTitle } from '@src/shared/components/ui/card';
import { Loader2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

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
const formatCurrency = (value: number) => {
  return value.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function IncomeExpenseReportPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

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

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">รายงานรายรับ/รายจ่าย</h1>
            <p className="text-muted-foreground">
              สรุปภาพรวมรายรับรายจ่ายประจำปี
            </p>
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
                {formatCurrency(totals.incomeTotal)}
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
                {formatCurrency(totals.expense)}
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
                  totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(totals.netProfit)}
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายงานรายเดือน ปี {selectedYear + 543}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
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
                        <TableCell className="text-right font-mono">
                          {formatCurrency(month.incomeOperation)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(month.incomeInstallment)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {formatCurrency(month.incomeTotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {formatCurrency(month.expense)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${
                            month.operatingBalance >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(month.operatingBalance)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-semibold ${
                            month.netProfit >= 0
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
                          totals.operatingBalance >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(totals.operatingBalance)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          totals.netProfit >= 0
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
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

