'use client';

import { useState } from 'react';
import {
  ChannelStats,
  EarningsChart,
  EntryCallout,
  Highlights,
  TeamMeeting,
  Teams,
} from '@src/app/(protected)/components/demo1';
import { Label } from '@src/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Container } from '@src/shared/components/common/container';
import { useGetDashboardSummary } from '../hooks';
import { DashboardSummary } from './dashboard-summary';
import { MonthlyDataTable } from './monthly-data-table';
import { PaymentChart } from './payment-chart';
import { ProfitSummary } from './profit-summary';

export function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<string>(currentYear.toString());

  const { data, isLoading, isError, error } = useGetDashboardSummary({ year });

  const dashboardData = data?.data;

  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800">เกิดข้อผิดพลาด</h3>
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลได้'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <div className="container-fluid space-y-5 lg:space-y-9">
        <div className="flex items-center flex-wrap gap-2.5 justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="gradientText text-xl font-bold text-foreground">
              พอร์ต
            </h1>
            <span className="text-sm text-muted-foreground">
              ข้อมูลสรุปรายปีและรายเดือนของพอร์ตสินเชื่อ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="year" className="text-sm font-medium">
              ปี
            </Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y + 543}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-y-5 lg:gap-7.5 items-stretch">
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-5 lg:gap-7.5 h-full items-stretch">
              <DashboardSummary
                currentMonthLoanAmount={
                  dashboardData?.currentMonthLoanAmount || 0
                }
                currentMonthProfit={dashboardData?.currentMonthProfit || 0}
                yearProfit={dashboardData?.yearProfit || 0}
                isLoading={isLoading}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <PaymentChart
              data={dashboardData?.monthlyData || []}
              isLoading={isLoading}
            />
          </div>
        </div>
        <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5 items-stretch">
          <MonthlyDataTable
            data={dashboardData?.monthlyData || []}
            year={parseInt(year)}
            isLoading={isLoading}
          />
        </div>

        <div className="grid lg:grid-cols-1 gap-5 lg:gap-7.5 items-stretch">
          <ProfitSummary
            limit={3}
            totalPaymentYear={dashboardData?.totalPaymentYear || 0}
            averagePaymentPerMonth={dashboardData?.averagePaymentPerMonth || 0}
            highestPaymentMonth={
              dashboardData?.highestPaymentMonth || {
                month: 0,
                monthName: '-',
                amount: 0,
              }
            }
            lowestPaymentMonth={
              dashboardData?.lowestPaymentMonth || {
                month: 0,
                monthName: '-',
                amount: 0,
              }
            }
            isLoading={isLoading}
          />
        </div>
      </div>
    </Container>
  );
}
