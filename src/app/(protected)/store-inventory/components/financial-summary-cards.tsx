'use client';

import {
  Banknote,
  CircleDollarSign,
  TrendingUp,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@src/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@src/shared/components/ui/card';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { useGetFinancialSummary } from '@src/features/financial-summary/hooks';

interface IFinancialRow {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  amount: number;
  color?: string;
}
type IFinancialRows = Array<IFinancialRow>;

export function FinancialSummaryCards() {
  const { data, isLoading, isError } = useGetFinancialSummary();

  const financialData = data?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyWithDecimals = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const rows: IFinancialRows = [
    {
      icon: Banknote,
      text: 'เงินลงทุนจริง',
      amount: financialData?.investmentAmount || 0,
      color: 'text-blue-500',
    },
    {
      icon: CircleDollarSign,
      text: 'ยอดวงเงินกู้รวม',
      amount: financialData?.totalActiveLoanAmount || 0,
      color: 'text-orange-500',
    },
    {
      icon: Wallet,
      text: 'เงินสดในบัญชี',
      amount: financialData?.cashInAccounts || 0,
      color: 'text-green-500',
    },
    {
      icon: CheckCircle2,
      text: 'วงเงินที่ปิดบัญชีแล้ว',
      amount: financialData?.totalCompletedLoanAmount || 0,
      color: 'text-violet-500',
    },
  ];

  const netAssets = financialData?.netAssets || 0;
  const totalAssets =
    (financialData?.investmentAmount || 0) +
    (financialData?.cashInAccounts || 0) +
    (financialData?.totalCompletedLoanAmount || 0);

  // Calculate percentages for progress bar
  const investmentPercent = totalAssets > 0
    ? ((financialData?.investmentAmount || 0) / totalAssets) * 100
    : 0;
  const cashPercent = totalAssets > 0
    ? ((financialData?.cashInAccounts || 0) / totalAssets) * 100
    : 0;
  const completedPercent = totalAssets > 0
    ? ((financialData?.totalCompletedLoanAmount || 0) / totalAssets) * 100
    : 0;

  const renderRow = (row: IFinancialRow, index: number) => {
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-1.5">
          <row.icon className={`size-4.5 ${row.color || 'text-muted-foreground'}`} />
          <span className="text-sm font-normal text-mono">{row.text}</span>
        </div>
        <div className="flex items-center text-sm font-medium text-foreground gap-6">
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <span className="lg:text-right">฿{formatCurrency(row.amount)}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>ข้อมูลทางการเงินของ InfiniteX</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            ทรัพย์สินสุทธิ
          </span>
          {isLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : isError ? (
            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-semibold text-destructive">
                Error
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-semibold text-mono">
                ฿{formatCurrencyWithDecimals(netAssets)}
              </span>
              {netAssets > 0 && (
                <Badge size="sm" variant="success" appearance="light">
                  <TrendingUp className="size-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          )}
        </div>

        {!isLoading && !isError && totalAssets > 0 && (
          <>
            <div className="flex items-center gap-1 mb-1.5">
              <div
                className="bg-blue-500 h-2 rounded-xs"
                style={{ width: `${investmentPercent}%` }}
              ></div>
              <div
                className="bg-green-500 h-2 rounded-xs"
                style={{ width: `${cashPercent}%` }}
              ></div>
              <div
                className="bg-violet-500 h-2 rounded-xs"
                style={{ width: `${completedPercent}%` }}
              ></div>
            </div>
            <div className="flex items-center flex-wrap gap-4 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-normal text-foreground">
                  เงินลงทุน ({investmentPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-normal text-foreground">
                  เงินสด ({cashPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-violet-500"></div>
                <span className="text-sm font-normal text-foreground">
                  ปิดบัญชี ({completedPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </>
        )}

        <div className="border-b border-input"></div>
        <div className="grid gap-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </>
          ) : (
            rows.map(renderRow)
          )}
        </div>
      </CardContent>
    </Card>
  );
}

