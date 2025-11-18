'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetLandAccountReportList } from '@src/features/land-account-reports/hooks';
import { cn } from '@src/shared/lib/utils';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Search } from 'lucide-react';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@src/shared/components/ui/card';
import { DataGrid } from '@src/shared/components/ui/data-grid';
import { DataGridColumnHeader } from '@src/shared/components/ui/data-grid-column-header';
import { DataGridPagination } from '@src/shared/components/ui/data-grid-pagination';
import { DataGridTable } from '@src/shared/components/ui/data-grid-table';
import { Input, InputWrapper } from '@src/shared/components/ui/input';
import { ScrollArea, ScrollBar } from '@src/shared/components/ui/scroll-area';

interface IReportData {
  id: string;
  detail: string;
  amount: number;
  note: string | null;
  adminName: string | null;
  accountName: string;
  accountBalance: number | null;
  createdAt: Date;
}

export function LoanPaymentReportsTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data from API
  const {
    data: apiResponse,
    isLoading,
    error,
    isError,
  } = useGetLandAccountReportList({
    page: 1,
    limit: 1000,
    search: debouncedSearch || undefined,
  });

  // Transform API data
  const data = useMemo(() => {
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) {
      return [];
    }

    return apiResponse.data.map((report: any) => ({
      id: report.id,
      detail: report.detail || '-',
      amount: Number(report.amount) || 0,
      note: report.note,
      adminName:
        report.adminName ||
        report.admin?.firstName + ' ' + report.admin?.lastName ||
        '-',
      accountName: report.landAccount?.accountName || '-',
      accountBalance: report.accountBalance
        ? Number(report.accountBalance)
        : null,
      createdAt: new Date(report.createdAt),
    })) as IReportData[];
  }, [apiResponse]);

  // Define columns
  const columns = useMemo<ColumnDef<IReportData>[]>(
    () => [
      {
        accessorKey: 'detail',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="รายการ" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('detail')}</div>
        ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="จำนวนเงิน" />
        ),
        cell: ({ row }) => {
          const amount = row.getValue('amount') as number;
          return (
            <div className="text-right font-medium">
              ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          );
        },
      },
      {
        accessorKey: 'note',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="รายละเอียด" />
        ),
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate">
            {row.getValue('note') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'adminName',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="ผู้ทำรายการ" />
        ),
        cell: ({ row }) => <div>{row.getValue('adminName')}</div>,
      },
      {
        accessorKey: 'accountName',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="ชื่อบัญชีรับชำระ" />
        ),
        cell: ({ row }) => <div>{row.getValue('accountName')}</div>,
      },
      {
        accessorKey: 'accountBalance',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="ยอดคงเหลือ" />
        ),
        cell: ({ row }) => {
          const balance = row.getValue('accountBalance') as number | null;
          return (
            <div className="text-right font-medium">
              {balance !== null
                ? `฿${balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                : '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="วันที่" />
        ),
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as Date;
          return <div>{format(date, 'dd MMM yyyy HH:mm', { locale: th })}</div>;
        },
      },
    ],
    [],
  );

  // Create table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      pagination,
      sorting,
    },
  });

  return (
    <Card>
      <CardHeader className="py-3 flex-nowrap">
        <div className="m-0 p-0 w-full"></div>
        <CardToolbar className="flex items-center gap-2">
          {/* Search */}
          <div className="w-full max-w-[200px]">
            <InputWrapper>
              <Search className="" />
              <Input
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </InputWrapper>
          </div>
        </CardToolbar>
      </CardHeader>

      <DataGrid
        table={table}
        recordCount={data.length || 0}
        tableLayout={{
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
          cellBorder: true,
        }}
      >
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </DataGrid>
    </Card>
  );
}
