'use client';

import { useCallback, useMemo, useState } from 'react';
import { dashboardApi } from '@src/features/dashboard/api';
import { DetailModal } from '@src/features/dashboard/components/detail-modal';
import { DetailModalAdvanced } from '@src/features/dashboard/components/detail-modal-advanced';
import { formatCurrency } from '@src/shared/lib/helpers';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardTitle,
} from '@src/shared/components/ui/card';
import { DataGrid } from '@src/shared/components/ui/data-grid';
import { DataGridColumnHeader } from '@src/shared/components/ui/data-grid-column-header';
import { DataGridPagination } from '@src/shared/components/ui/data-grid-pagination';
import { DataGridTable } from '@src/shared/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@src/shared/components/ui/scroll-area';
import { Skeleton } from '@src/shared/components/ui/skeleton';

interface MonthlyData {
  month: number;
  monthName: string;
  loanAmount: number;
  totalPayment: number;
  interestPayment: number;
  closeAccountPayment: number;
  overduePayment: number;
  profit: number;
}

interface ITeamsProps {
  data?: MonthlyData[];
  year?: number;
  isLoading?: boolean;
}

const Teams = ({ data = [], year, isLoading = false }: ITeamsProps) => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalType, setModalType] = useState<
    'loan' | 'payment' | 'installment'
  >('payment');
  const [loading, setLoading] = useState(false);

  // Get current month for highlighting
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isCurrentYear = year === currentYear;

  const handleCellClick = useCallback(
    async (
      month: number,
      type:
        | 'loans'
        | 'payments'
        | 'interest-payments'
        | 'close-payments'
        | 'overdue',
      title: string,
      modalType: 'loan' | 'payment' | 'installment',
    ) => {
      if (!year) return;
      setLoading(true);
      try {
        const response = await dashboardApi.getMonthlyDetails(
          year,
          month,
          type,
        );
        setModalData(response.data || []);
        setModalTitle(title);
        setModalType(modalType);
        setModalOpen(true);
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    },
    [year],
  );

  const columns = useMemo<ColumnDef<MonthlyData>[]>(
    () => [
      {
        id: 'monthName',
        accessorFn: (row) => row.monthName,
        header: ({ column }) => (
          <DataGridColumnHeader title="เดือน" column={column} />
        ),
        cell: ({ row }) => {
          const isCurrentMonthRow =
            isCurrentYear && row.original.month === currentMonth;
          return (
            <div className="flex items-center gap-2">
              <span className="leading-none font-medium text-sm text-mono">
                {row.original.monthName}
              </span>
              {isCurrentMonthRow && (
                <Badge variant="primary" size="sm" className="bg-blue-600">
                  ปัจจุบัน
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: true,
        size: 140,
        meta: {
          skeleton: <Skeleton className="h-4 w-[80px]" />,
        },
      },
      {
        id: 'loanAmount',
        accessorFn: (row) => row.loanAmount,
        header: ({ column }) => (
          <DataGridColumnHeader title="ยอดเปิดสินเชื่อ" column={column} />
        ),
        cell: ({ row }) => (
          <span
            className="text-sm font-medium cursor-pointer hover:text-primary underline decoration-dotted"
            onClick={() =>
              handleCellClick(
                row.original.month,
                'loans',
                `เปิดสินเชื่อ - ${row.original.monthName}`,
                'loan',
              )
            }
          >
            {formatCurrency(row.original.loanAmount)}
          </span>
        ),
        enableSorting: true,
        size: 150,
        meta: {
          skeleton: <Skeleton className="h-4 w-[90px]" />,
        },
      },
      {
        id: 'totalPayment',
        accessorFn: (row) => row.totalPayment,
        header: ({ column }) => (
          <DataGridColumnHeader title="รับชำระทั้งหมด" column={column} />
        ),
        cell: ({ row }) => (
          <span
            className="text-sm font-medium cursor-pointer hover:text-primary underline decoration-dotted"
            onClick={() =>
              handleCellClick(
                row.original.month,
                'payments',
                `รับชำระ - ${row.original.monthName}`,
                'payment',
              )
            }
          >
            {formatCurrency(row.original.totalPayment)}
          </span>
        ),
        enableSorting: true,
        size: 150,
        meta: {
          skeleton: <Skeleton className="h-4 w-[90px]" />,
        },
      },
      {
        id: 'interestPayment',
        accessorFn: (row) => row.interestPayment,
        header: ({ column }) => (
          <DataGridColumnHeader title="ชำระค่างวด" column={column} />
        ),
        cell: ({ row }) => (
          <span
            className="text-sm font-medium cursor-pointer hover:text-primary underline decoration-dotted"
            onClick={() =>
              handleCellClick(
                row.original.month,
                'interest-payments',
                `ชำระค่างวด - ${row.original.monthName}`,
                'payment',
              )
            }
          >
            {formatCurrency(row.original.interestPayment)}
          </span>
        ),
        enableSorting: true,
        size: 140,
        meta: {
          skeleton: <Skeleton className="h-4 w-[90px]" />,
        },
      },
      {
        id: 'closeAccountPayment',
        accessorFn: (row) => row.closeAccountPayment,
        header: ({ column }) => (
          <DataGridColumnHeader title="ปิดบัญชี" column={column} />
        ),
        cell: ({ row }) => (
          <span
            className="text-sm font-medium cursor-pointer hover:text-primary underline decoration-dotted"
            onClick={() =>
              handleCellClick(
                row.original.month,
                'close-payments',
                `ชำระปิดบัญชี - ${row.original.monthName}`,
                'payment',
              )
            }
          >
            {formatCurrency(row.original.closeAccountPayment)}
          </span>
        ),
        enableSorting: true,
        size: 130,
        meta: {
          skeleton: <Skeleton className="h-4 w-[90px]" />,
        },
      },
      {
        id: 'overduePayment',
        accessorFn: (row) => row.overduePayment,
        header: ({ column }) => (
          <DataGridColumnHeader title="ค้างชำระ" column={column} />
        ),
        cell: ({ row }) => (
          <span
            className="text-sm font-medium text-red-600 cursor-pointer hover:text-red-700 underline decoration-dotted"
            onClick={() =>
              handleCellClick(
                row.original.month,
                'overdue',
                `ค้างชำระ - ${row.original.monthName}`,
                'installment',
              )
            }
          >
            {formatCurrency(row.original.overduePayment)}
          </span>
        ),
        enableSorting: true,
        size: 130,
        meta: {
          skeleton: <Skeleton className="h-4 w-[90px]" />,
        },
      },
      {
        id: 'profit',
        accessorFn: (row) => row.profit,
        header: ({ column }) => (
          <DataGridColumnHeader title="กำไร" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-green-600">
            {formatCurrency(row.original.profit)}
          </span>
        ),
        enableSorting: true,
        size: 130,
        meta: {
          skeleton: <Skeleton className="h-4 w-[90px]" />,
        },
      },
    ],
    [currentMonth, isCurrentYear, handleCellClick],
  );

  const table = useReactTable({
    columns,
    data: data,
    pageCount: Math.ceil((data?.length || 0) / pagination.pageSize),
    getRowId: (row: MonthlyData) => String(row.month),
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    columnResizeMode: 'onChange',
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    enableRowSelection: false,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <DataGrid
        table={table}
        recordCount={data?.length || 0}
        tableLayout={{
          columnsPinnable: false,
          columnsMovable: false,
          columnsVisibility: false,
          cellBorder: true,
        }}
      >
        <Card>
          <CardHeader className="py-3.5">
            <CardTitle>ข้อมูลรายเดือน</CardTitle>
          </CardHeader>
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      {/* Modal for details */}
      {modalType === 'installment' ? (
        <DetailModalAdvanced
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={modalTitle}
          data={modalData}
          loading={loading}
        />
      ) : (
        <DetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={modalTitle}
          data={modalData}
          loading={loading}
          type={modalType}
        />
      )}
    </>
  );
};

export { Teams, type ITeamsProps };
