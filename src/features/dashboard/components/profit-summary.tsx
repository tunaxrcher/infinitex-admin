'use client';

import {
  RemixiconComponentType,
  RiBankLine,
  RiFacebookCircleLine,
  RiGoogleLine,
  RiInstagramLine,
  RiStore2Line,
} from '@remixicon/react';
import { DropdownMenu4 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-4';
import { formatCurrency } from '@src/shared/lib/helpers';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  EllipsisVertical,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Badge, BadgeDot } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { CountingNumber } from '@src/shared/components/ui/counting-number';
import { Skeleton } from '@src/shared/components/ui/skeleton';

interface IProfitSummaryRow {
  icon: LucideIcon | RemixiconComponentType;
  text: string;
  total: string;
  subtitle?: string;
  amount?: number;
}
type IProfitSummaryRows = Array<IProfitSummaryRow>;

interface IProfitSummaryItem {
  badgeColor: string;
  label: string;
}
type IProfitSummaryItems = Array<IProfitSummaryItem>;

interface IProfitSummaryProps {
  limit?: number;
  totalPaymentYear?: number;
  averagePaymentPerMonth?: number;
  highestPaymentMonth?: {
    month: number;
    monthName: string;
    amount: number;
  };
  lowestPaymentMonth?: {
    month: number;
    monthName: string;
    amount: number;
  };
  isLoading?: boolean;
}

const ProfitSummary = ({
  limit,
  totalPaymentYear = 0,
  averagePaymentPerMonth = 0,
  highestPaymentMonth = { month: 0, monthName: '-', amount: 0 },
  lowestPaymentMonth = { month: 0, monthName: '-', amount: 0 },
  isLoading = false,
}: IProfitSummaryProps) => {
  const rows: IProfitSummaryRows = [
    {
      icon: TrendingUp,
      text: 'เดือนที่รับชำระสูงสุด',
      total: formatCurrency(highestPaymentMonth.amount),
      subtitle: highestPaymentMonth.monthName,
      amount: highestPaymentMonth.amount,
    },
    {
      icon: TrendingDown,
      text: 'เดือนที่รับชำระต่ำสุด',
      total: formatCurrency(lowestPaymentMonth.amount),
      subtitle: lowestPaymentMonth.monthName,
      amount: lowestPaymentMonth.amount,
    },
    {
      icon: BarChart3,
      text: 'ค่าเฉลี่ยรับชำระต่อเดือน',
      total: formatCurrency(averagePaymentPerMonth),
      amount: averagePaymentPerMonth,
    },
  ];

  const renderRow = (row: IProfitSummaryRow, index: number) => {
    if (isLoading) {
      return (
        <div
          key={index}
          className="flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-5 w-24" />
            {row.subtitle && <Skeleton className="h-3 w-16" />}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        key={index}
        className="flex items-center justify-between flex-wrap gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            initial={{ rotate: 0, scale: 0.8 }}
            animate={{ rotate: 360, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
          >
            <row.icon className="size-4.5 text-muted-foreground" />
          </motion.div>
          <span className="text-sm font-normal text-mono">{row.text}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {row.amount !== undefined ? (
              <CountingNumber
                to={row.amount}
                duration={1.5}
                delay={600 + index * 100 + 100}
                format={(value) => formatCurrency(value)}
              />
            ) : (
              row.total
            )}
          </span>
          {row.subtitle && (
            <motion.span
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
            >
              {row.subtitle}
            </motion.span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>สรุปข้อมูล</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <motion.span
            className="text-sm font-normal text-secondary-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            ยอดรับชำระทั้งปี
          </motion.span>
          {isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <motion.div
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <span className="text-3xl font-semibold text-mono">
                <CountingNumber
                  to={totalPaymentYear}
                  duration={2}
                  delay={300}
                  format={(value) => formatCurrency(value)}
                />
              </span>
            </motion.div>
          )}
        </div>
        <div className="border-b border-input"></div>
        <div className="grid gap-3">{rows.slice(0, limit).map(renderRow)}</div>
      </CardContent>
    </Card>
  );
};

export {
  ProfitSummary,
  type IProfitSummaryRow,
  type IProfitSummaryRows,
  type IProfitSummaryItem,
  type IProfitSummaryItems,
  type IProfitSummaryProps,
};
