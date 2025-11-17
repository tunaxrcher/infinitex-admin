'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
} from '@src/shared/components/ui/card';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { type MonthlyData } from '../validations';

interface PaymentChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export function PaymentChart({ data, isLoading }: PaymentChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: item.monthName,
    payment: item.interestPayment,
  }));

  return (
    <Card>
      <CardHeader>
        <CardHeading>กราฟชำระค่างวดแต่ละเดือน</CardHeading>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                new Intl.NumberFormat('th-TH', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('th-TH', {
                  style: 'currency',
                  currency: 'THB',
                }).format(value)
              }
              labelStyle={{ color: '#000' }}
            />
            <Area
              type="monotone"
              dataKey="payment"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorPayment)"
              name="ชำระค่างวด"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
