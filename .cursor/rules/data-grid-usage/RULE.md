---
description: "Pattern สำหรับใช้ DataGrid และ react-table ใน Infinitex Admin"
globs:
  - "**/tables/**/*.tsx"
  - "**/*-table.tsx"
  - "**/*-list.tsx"
alwaysApply: false
---

# DataGrid & React Table Pattern

## โครงสร้างพื้นฐาน

```tsx
'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { DataGrid } from '@src/shared/components/ui/data-grid';
import { DataGridColumnHeader } from '@src/shared/components/ui/data-grid-column-header';
import { DataGridPagination } from '@src/shared/components/ui/data-grid-pagination';
import { DataGridTable } from '@src/shared/components/ui/data-grid-table';
import { Card, CardFooter, CardTable } from '@src/shared/components/ui/card';
import { ScrollArea, ScrollBar } from '@src/shared/components/ui/scroll-area';

import { useGetEntityList } from '@src/features/[feature]/hooks';

interface EntityData {
  id: string;
  name: string;
  status: string;
  // ... other fields
}

export function EntityListTable() {
  // 1. State
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);

  // 2. Fetch data
  const { data: apiResponse, isLoading } = useGetEntityList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  // 3. Transform data
  const data = useMemo(() => {
    if (!apiResponse?.data) return [];
    return apiResponse.data.map((item) => ({
      id: item.id,
      name: item.name,
      // ... transform fields
    }));
  }, [apiResponse]);

  // 4. Define columns
  const columns = useMemo<ColumnDef<EntityData>[]>(() => [
    // ... column definitions
  ], []);

  // 5. Create table instance
  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false, // true ถ้า pagination ฝั่ง server
  });

  // 6. Render
  return (
    <Card>
      <DataGrid
        table={table}
        recordCount={data.length}
        isLoading={isLoading}
        tableLayout={{
          cellBorder: true,
          columnsVisibility: true,
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
```

## Column Definitions

### Basic Column
```tsx
{
  id: 'name',
  accessorFn: (row) => row.name,
  header: ({ column }) => (
    <DataGridColumnHeader title="ชื่อ" column={column} />
  ),
  cell: (info) => (
    <span className="text-sm">{info.getValue()}</span>
  ),
  enableSorting: true,
  size: 200,
}
```

### Column with Custom Cell
```tsx
{
  id: 'status',
  accessorFn: (row) => row.status,
  header: ({ column }) => (
    <DataGridColumnHeader title="สถานะ" column={column} />
  ),
  cell: (info) => {
    const status = info.row.original.status;
    const variant = status === 'active' ? 'success' : 'destructive';
    return (
      <Badge variant={variant}>
        {status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
      </Badge>
    );
  },
  enableSorting: true,
  size: 120,
}
```

### Column with Filter
```tsx
{
  id: 'name',
  accessorFn: (row) => row.name,
  header: ({ column }) => (
    <DataGridColumnHeader
      title="ชื่อ"
      column={column}
      filter={
        <Input
          placeholder="Filter..."
          value={(column.getFilterValue() as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value)}
          variant="sm"
          className="w-40"
        />
      }
    />
  ),
  cell: (info) => info.getValue(),
  enableSorting: true,
  size: 200,
}
```

### Actions Column
```tsx
{
  id: 'actions',
  header: () => '',
  enableSorting: false,
  size: 100,
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" mode="icon" size="sm">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
          <Settings className="size-4" />
          แก้ไข
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handleDelete(row.original.id)}
        >
          <Trash className="size-4" />
          ลบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
```

### Currency Column
```tsx
{
  id: 'amount',
  accessorFn: (row) => row.amount,
  header: ({ column }) => (
    <DataGridColumnHeader title="จำนวนเงิน" column={column} />
  ),
  cell: (info) => (
    <div className="text-right font-medium">
      ฿{info.row.original.amount.toLocaleString()}
    </div>
  ),
  enableSorting: true,
  size: 140,
}
```

## DataGrid Props

```tsx
<DataGrid
  table={table}
  recordCount={totalRecords}
  isLoading={isLoading}
  loadingMode="skeleton"  // 'skeleton' | 'spinner'
  emptyMessage="ไม่พบข้อมูล"
  onRowClick={(row) => handleRowClick(row.id)}
  tableLayout={{
    dense: false,           // แถวบางลง
    cellBorder: true,       // เส้นขอบ cells
    rowBorder: true,        // เส้นขอบ rows
    headerSticky: true,     // header ติดด้านบน
    columnsVisibility: true, // ซ่อน/แสดง columns
    columnsResizable: true,  // ปรับขนาด columns
  }}
/>
```

## Pagination

### Client-side Pagination
```tsx
const table = useReactTable({
  data: allData,  // ส่งข้อมูลทั้งหมด
  manualPagination: false,  // react-table จัดการ pagination
  getPaginationRowModel: getPaginationRowModel(),
});
```

### Server-side Pagination
```tsx
const { data, isLoading } = useGetEntityList({
  page: pagination.pageIndex + 1,
  limit: pagination.pageSize,
});

const table = useReactTable({
  data: data?.data || [],
  pageCount: Math.ceil((data?.meta?.total || 0) / pagination.pageSize),
  manualPagination: true,  // pagination จาก server
});
```

## Search with Debounce

```tsx
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [searchQuery]);

const { data } = useGetEntityList({
  search: debouncedSearch || undefined,
});
```

## Tabs with Filtering

```tsx
const [activeTab, setActiveTab] = useState('all');

const filteredData = useMemo(() => {
  if (activeTab === 'all') return data;
  return data.filter((item) => item.status === activeTab);
}, [data, activeTab]);

// Reset pagination when filter changes
useEffect(() => {
  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
}, [activeTab]);
```

