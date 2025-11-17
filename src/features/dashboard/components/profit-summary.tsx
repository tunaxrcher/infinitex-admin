'use client';

import { formatCurrency } from '@src/shared/lib/helpers';
import { DollarSign, Percent, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
} from '@src/shared/components/ui/card';
import { Skeleton } from '@src/shared/components/ui/skeleton';

interface ProfitSummaryProps {
  highestPaymentMonth: {
    month: number;
    monthName: string;
    amount: number;
  };
  lowestPaymentMonth: {
    month: number;
    monthName: string;
    amount: number;
  };
  averagePaymentPerMonth: number;
  totalPaymentYear: number;
  paymentPercentage: number;
  isLoading?: boolean;
}

export function ProfitSummary({
  highestPaymentMonth,
  lowestPaymentMonth,
  averagePaymentPerMonth,
  totalPaymentYear,
  paymentPercentage,
  isLoading,
}: ProfitSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const summaryItems = [
    {
      label: 'ยอดรับชำระสูงสุด',
      value: `${highestPaymentMonth.monthName} - ${formatCurrency(highestPaymentMonth.amount)}`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'ยอดรับชำระน้อยสุด',
      value: `${lowestPaymentMonth.monthName} - ${formatCurrency(lowestPaymentMonth.amount)}`,
      icon: TrendingDown,
      color: 'text-red-600',
    },
    {
      label: 'เฉลี่ยต่อเดือน',
      value: formatCurrency(averagePaymentPerMonth),
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      label: 'ยอดรับชำระทั้งหมด',
      value: formatCurrency(totalPaymentYear),
      icon: DollarSign,
      color: 'text-purple-600',
    },
    {
      label: 'เปอร์เซ็นต์ยอดรับชำระ',
      value: `${paymentPercentage.toFixed(2)}%`,
      icon: Percent,
      color: 'text-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardHeading>สรุปภาพรวม</CardHeading>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col space-y-2 rounded-lg border p-4"
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-sm font-medium text-gray-600">
                    {item.label}
                  </span>
                </div>
                <div className="text-lg font-bold">{item.value}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
