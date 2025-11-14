'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table'
import { Card, CardContent, CardHeader, CardHeading } from '@src/shared/components/ui/card'
import { Skeleton } from '@src/shared/components/ui/skeleton'
import { formatCurrency } from '@src/shared/lib/helpers'
import { type MonthlyData } from '../validations'
import { DetailModal } from './detail-modal'
import { DetailModalAdvanced } from './detail-modal-advanced'
import { dashboardApi } from '../api'
import { toast } from 'sonner'

interface MonthlyDataTableProps {
  data: MonthlyData[]
  year: number
  isLoading?: boolean
}

export function MonthlyDataTable({ data, year, isLoading }: MonthlyDataTableProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalData, setModalData] = useState<any[]>([])
  const [modalType, setModalType] = useState<'loan' | 'payment' | 'installment'>('payment')
  const [loading, setLoading] = useState(false)

  const handleCellClick = async (
    month: number,
    type: 'loans' | 'payments' | 'interest-payments' | 'close-payments' | 'overdue',
    title: string,
    modalType: 'loan' | 'payment' | 'installment',
  ) => {
    setLoading(true)
    try {
      const response = await dashboardApi.getMonthlyDetails(year, month, type)
      setModalData(response.data || [])
      setModalTitle(title)
      setModalType(modalType)
      setModalOpen(true)
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }
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
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardHeading>ข้อมูลรายเดือน</CardHeading>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">เดือน</TableHead>
                <TableHead className="text-right">เปิดสินเชื่อ</TableHead>
                <TableHead className="text-right">รับชำระ</TableHead>
                <TableHead className="text-right">ชำระค่างวด</TableHead>
                <TableHead className="text-right">ชำระปิดบัญชี</TableHead>
                <TableHead className="text-right">ค้างชำระ</TableHead>
                <TableHead className="text-right">กำไร</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.monthName}</TableCell>
                  <TableCell
                    className="cursor-pointer text-right underline decoration-dotted hover:bg-blue-50"
                    onClick={() =>
                      handleCellClick(
                        row.month,
                        'loans',
                        `เปิดสินเชื่อ - ${row.monthName}`,
                        'loan',
                      )
                    }
                  >
                    {formatCurrency(row.loanAmount)}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-right underline decoration-dotted hover:bg-blue-50"
                    onClick={() =>
                      handleCellClick(
                        row.month,
                        'payments',
                        `รับชำระ - ${row.monthName}`,
                        'payment',
                      )
                    }
                  >
                    {formatCurrency(row.totalPayment)}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-right underline decoration-dotted hover:bg-blue-50"
                    onClick={() =>
                      handleCellClick(
                        row.month,
                        'interest-payments',
                        `ชำระค่างวด - ${row.monthName}`,
                        'payment',
                      )
                    }
                  >
                    {formatCurrency(row.interestPayment)}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-right underline decoration-dotted hover:bg-blue-50"
                    onClick={() =>
                      handleCellClick(
                        row.month,
                        'close-payments',
                        `ชำระปิดบัญชี - ${row.monthName}`,
                        'payment',
                      )
                    }
                  >
                    {formatCurrency(row.closeAccountPayment)}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer text-right text-red-600 underline decoration-dotted hover:bg-red-50"
                    onClick={() =>
                      handleCellClick(
                        row.month,
                        'overdue',
                        `ค้างชำระ - ${row.monthName}`,
                        'installment',
                      )
                    }
                  >
                    {formatCurrency(row.overduePayment)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(row.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <DetailModalAdvanced
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={modalTitle}
        data={modalData}
        type={modalType}
      />
    </Card>
  )
}

