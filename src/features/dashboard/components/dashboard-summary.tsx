'use client'

import { Card, CardContent, CardHeader, CardHeading } from '@src/shared/components/ui/card'
import { Skeleton } from '@src/shared/components/ui/skeleton'
import { formatCurrency } from '@src/shared/lib/helpers'
import { TrendingUp, DollarSign, PiggyBank } from 'lucide-react'

interface DashboardSummaryProps {
  currentMonthLoanAmount: number
  currentMonthProfit: number
  yearProfit: number
  isLoading?: boolean
}

export function DashboardSummary({
  currentMonthLoanAmount,
  currentMonthProfit,
  yearProfit,
  isLoading,
}: DashboardSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      title: 'ยอดเปิดสินเชื่อ (เดือนปัจจุบัน)',
      value: currentMonthLoanAmount,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'กำไร (เดือนปัจจุบัน)',
      value: currentMonthProfit,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'กำไรทั้งปี',
      value: yearProfit,
      icon: PiggyBank,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardHeading className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardHeading>
              <div className={`${stat.bgColor} rounded-lg p-2`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stat.value)}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

