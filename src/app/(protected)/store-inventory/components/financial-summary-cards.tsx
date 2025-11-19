'use client';

import { useGetFinancialSummary } from '@src/features/financial-summary/hooks';
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '@src/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { CountingNumber } from '@src/shared/components/ui/counting-number';
import { Skeleton } from '@src/shared/components/ui/skeleton';

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
  const investmentAmount = financialData?.investmentAmount || 0;
  const totalAssets =
    (financialData?.investmentAmount || 0) +
    (financialData?.cashInAccounts || 0) +
    (financialData?.totalCompletedLoanAmount || 0);

  // Calculate ROI (Return on Investment)
  // ROI = (ทรัพย์สินสุทธิ - เงินลงทุนเริ่มต้น) / เงินลงทุนเริ่มต้น × 100
  const roi =
    investmentAmount > 0
      ? ((netAssets - investmentAmount) / investmentAmount) * 100
      : 0;
  const isPositiveROI = roi >= 0;

  // Calculate percentages for progress bar
  const investmentPercent =
    totalAssets > 0
      ? ((financialData?.investmentAmount || 0) / totalAssets) * 100
      : 0;
  const cashPercent =
    totalAssets > 0
      ? ((financialData?.cashInAccounts || 0) / totalAssets) * 100
      : 0;
  const completedPercent =
    totalAssets > 0
      ? ((financialData?.totalCompletedLoanAmount || 0) / totalAssets) * 100
      : 0;

  const renderRow = (row: IFinancialRow, index: number) => {
    return (
      <motion.div
        key={index}
        className="flex items-center justify-between flex-wrap gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            initial={{ rotate: 0, scale: 0.8 }}
            animate={{ rotate: 360, scale: 1 }}
            transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
          >
            <row.icon
              className={`size-4.5 ${row.color || 'text-muted-foreground'}`}
            />
          </motion.div>
          <span className="text-sm font-normal text-mono">{row.text}</span>
        </div>
        <div className="flex items-center text-sm font-medium text-foreground gap-6">
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <span className="lg:text-right">
              ฿
              <CountingNumber
                to={row.amount}
                duration={1.5}
                delay={1.3 + index * 0.1}
                format={(value) => formatCurrency(value)}
              />
            </span>
          )}
        </div>
      </motion.div>
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
                ฿
                <CountingNumber
                  to={netAssets}
                  duration={2}
                  format={(value) => formatCurrencyWithDecimals(value)}
                />
              </span>
              {investmentAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <Badge
                    size="sm"
                    variant={isPositiveROI ? 'success' : 'destructive'}
                    appearance="light"
                  >
                    <TrendingUp className="size-3 mr-1" />
                    {isPositiveROI ? '+' : ''}
                    {roi.toFixed(1)}%
                  </Badge>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {!isLoading && !isError && totalAssets > 0 && (
          <>
            <div className="flex items-center gap-1 mb-1.5 overflow-hidden">
              <motion.div
                className="bg-blue-500 h-2 rounded-xs"
                initial={{ width: 0 }}
                animate={{ width: `${investmentPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
              <motion.div
                className="bg-green-500 h-2 rounded-xs"
                initial={{ width: 0 }}
                animate={{ width: `${cashPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              />
              <motion.div
                className="bg-violet-500 h-2 rounded-xs"
                initial={{ width: 0 }}
                animate={{ width: `${completedPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
              />
            </div>
            <motion.div
              className="flex items-center flex-wrap gap-4 mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="size-2 rounded-full bg-blue-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.3 }}
                />
                <span className="text-sm font-normal text-foreground">
                  เงินลงทุน ({investmentPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="size-2 rounded-full bg-green-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, duration: 0.3 }}
                />
                <span className="text-sm font-normal text-foreground">
                  เงินสด ({cashPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="size-2 rounded-full bg-violet-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.1, duration: 0.3 }}
                />
                <span className="text-sm font-normal text-foreground">
                  ปิดบัญชี ({completedPercent.toFixed(1)}%)
                </span>
              </div>
            </motion.div>
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
