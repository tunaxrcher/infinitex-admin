'use client'

import { useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { ArrowUpDown, Search, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@src/shared/components/ui/dialog'
import { Input, InputWrapper } from '@src/shared/components/ui/input'
import { Button } from '@src/shared/components/ui/button'
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@src/shared/components/ui/card'
import { DataGrid } from '@src/shared/components/ui/data-grid'
import { DataGridPagination } from '@src/shared/components/ui/data-grid-pagination'
import { DataGridTable } from '@src/shared/components/ui/data-grid-table'
import { ScrollArea, ScrollBar } from '@src/shared/components/ui/scroll-area'
import { formatCurrency } from '@src/shared/lib/helpers'

interface DetailModalAdvancedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  data: any[]
  loading?: boolean
}

export function DetailModalAdvanced({
  open,
  onOpenChange,
  title,
  data,
  loading,
}: DetailModalAdvancedProps) {
  // Auto-detect type based on data structure
  const type: 'loan' | 'payment' | 'installment' = 
    data.length > 0 
      ? data[0].loanNumber 
        ? 'loan' 
        : data[0].installmentId !== undefined
          ? 'payment'
          : 'installment'
      : 'payment'
  const [globalFilter, setGlobalFilter] = useState('')

  // Define columns based on type
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (type === 'loan') {
      return [
        {
          accessorKey: 'loanNumber',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              >
                เลขที่สินเชื่อ
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
          cell: ({ row }) => <div className="font-medium">{row.getValue('loanNumber')}</div>,
        },
        {
          accessorFn: (row) =>
            `${row.customer?.profile?.firstName || ''} ${row.customer?.profile?.lastName || ''}`.trim(),
          id: 'customerName',
          header: 'ชื่อลูกค้า',
          cell: ({ row }) => <div>{row.getValue('customerName') || '-'}</div>,
        },
        {
          accessorKey: 'principalAmount',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="ml-auto"
              >
                ยอดเงินต้น
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
          cell: ({ row }) => (
            <div className="text-right tabular-nums">
              {formatCurrency(row.getValue('principalAmount'))}
            </div>
          ),
        },
        {
          accessorKey: 'createdAt',
          header: 'วันที่สร้าง',
          cell: ({ row }) => (
            <div className="whitespace-nowrap">
              {format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy')}
            </div>
          ),
        },
        {
          accessorKey: 'status',
          header: 'สถานะ',
          cell: ({ row }) => {
            const status = row.getValue('status') as string
            return (
              <span
                className={`rounded px-2 py-1 text-xs ${
                  status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {status}
              </span>
            )
          },
        },
      ]
    }

    if (type === 'payment') {
      return [
        {
          accessorFn: (row) => row.loan?.loanNumber || '-',
          id: 'loanNumber',
          header: 'เลขที่สินเชื่อ',
          cell: ({ row }) => <div className="font-medium">{row.getValue('loanNumber')}</div>,
        },
        {
          accessorFn: (row) =>
            `${row.user?.profile?.firstName || ''} ${row.user?.profile?.lastName || ''}`.trim(),
          id: 'customerName',
          header: 'ชื่อลูกค้า',
          cell: ({ row }) => <div>{row.getValue('customerName') || '-'}</div>,
        },
        {
          accessorKey: 'principalAmount',
          header: () => <div className="text-right">เงินต้น</div>,
          cell: ({ row }) => (
            <div className="text-right tabular-nums">
              {formatCurrency(row.getValue('principalAmount') || 0)}
            </div>
          ),
        },
        {
          accessorKey: 'interestAmount',
          header: () => <div className="text-right">ดอกเบี้ย</div>,
          cell: ({ row }) => (
            <div className="text-right tabular-nums">
              {formatCurrency(row.getValue('interestAmount') || 0)}
            </div>
          ),
        },
        {
          accessorKey: 'feeAmount',
          header: () => <div className="text-right">ค่าธรรมเนียม</div>,
          cell: ({ row }) => (
            <div className="text-right tabular-nums">
              {formatCurrency(row.getValue('feeAmount') || 0)}
            </div>
          ),
        },
        {
          accessorKey: 'amount',
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="ml-auto"
              >
                ยอดชำระ
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
          cell: ({ row }) => (
            <div className="text-right font-semibold tabular-nums">
              {formatCurrency(row.getValue('amount'))}
            </div>
          ),
        },
        {
          accessorKey: 'paidDate',
          header: 'วันที่ชำระ',
          cell: ({ row }) => {
            const paidDate = row.getValue('paidDate')
            return (
              <div className="whitespace-nowrap">
                {paidDate ? format(new Date(paidDate as string), 'dd/MM/yyyy HH:mm') : '-'}
              </div>
            )
          },
        },
        {
          accessorKey: 'installmentId',
          header: 'ประเภท',
          cell: ({ row }) => {
            const installmentId = row.getValue('installmentId')
            return installmentId ? (
              <span className="whitespace-nowrap rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                ชำระค่างวด
              </span>
            ) : (
              <span className="whitespace-nowrap rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                ปิดบัญชี
              </span>
            )
          },
        },
      ]
    }

    // type === 'installment'
    return [
      {
        accessorFn: (row) => row.loan?.loanNumber || '-',
        id: 'loanNumber',
        header: 'เลขที่สินเชื่อ',
        cell: ({ row }) => <div className="font-medium">{row.getValue('loanNumber')}</div>,
      },
      {
        accessorFn: (row) =>
          `${row.loan?.customer?.profile?.firstName || ''} ${row.loan?.customer?.profile?.lastName || ''}`.trim(),
        id: 'customerName',
        header: 'ชื่อลูกค้า',
        cell: ({ row }) => <div>{row.getValue('customerName') || '-'}</div>,
      },
      {
        accessorKey: 'installmentNumber',
        header: 'งวดที่',
        cell: ({ row }) => (
          <div className="whitespace-nowrap">งวดที่ {row.getValue('installmentNumber')}</div>
        ),
      },
      {
        accessorKey: 'principalAmount',
        header: () => <div className="text-right">เงินต้น</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {formatCurrency(row.getValue('principalAmount') || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'interestAmount',
        header: () => <div className="text-right">ดอกเบี้ย</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {formatCurrency(row.getValue('interestAmount') || 0)}
          </div>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="ml-auto"
            >
              ยอดค้างชำระ
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-red-600">
            {formatCurrency(row.getValue('totalAmount'))}
          </div>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'วันครบกำหนด',
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            {format(new Date(row.getValue('dueDate')), 'dd/MM/yyyy')}
          </div>
        ),
      },
      {
        id: 'daysLate',
        accessorFn: (row) => {
          if (!row.dueDate) return 0
          return Math.floor(
            (new Date().getTime() - new Date(row.dueDate).getTime()) / (1000 * 60 * 60 * 24),
          )
        },
        header: 'เลยกำหนด',
        cell: ({ row }) => (
          <span className="whitespace-nowrap rounded bg-red-100 px-2 py-1 text-xs text-red-800">
            {row.getValue('daysLate')} วัน
          </span>
        ),
      },
    ]
  }, [type])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // คำนวณยอดรวม (จากข้อมูลที่กรองแล้ว)
  const filteredData = table.getFilteredRowModel().rows.map((row) => row.original)
  const totalAmount =
    type === 'loan'
      ? filteredData.reduce((sum, item) => sum + Number(item.principalAmount || 0), 0)
      : type === 'payment'
        ? filteredData.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        : type === 'installment'
          ? filteredData.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
          : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader className="flex-nowrap py-3">
            <div className="flex w-full items-center justify-between">
              <h3 className="leading-0 text-base font-semibold text-foreground">รายละเอียด</h3>
              <CardToolbar className="flex items-center gap-2">
                {/* Search */}
                <div className="w-full max-w-[250px]">
                  <InputWrapper>
                    <Search />
                    <Input
                      placeholder="ค้นหา..."
                      value={globalFilter ?? ''}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                    {globalFilter && (
                      <Button
                        onClick={() => setGlobalFilter('')}
                        variant="dim"
                        className="-me-4"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </InputWrapper>
                </div>
              </CardToolbar>
            </div>
          </CardHeader>

          <DataGrid
            table={table}
            recordCount={table.getFilteredRowModel().rows.length}
            tableLayout={{
              cellBorder: true,
            }}
          >
            <CardTable>
              <ScrollArea className="max-h-[calc(90vh-260px)]">
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter className="py-3" style={{ alignItems: 'stretch' }}>
              <div className="flex w-full flex-col gap-4">
                <DataGridPagination />
                <div className="flex items-center justify-end border-t pt-4">
                  <div className="text-base font-semibold">
                    ยอดรวม: <span className="text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardFooter>
          </DataGrid>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

