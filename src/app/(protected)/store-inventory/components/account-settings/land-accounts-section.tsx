'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  useCreateLandAccount,
  useDeleteLandAccount,
  useDepositLandAccount,
  useGetLandAccountList,
  useTransferLandAccount,
  useUpdateLandAccount,
  useWithdrawLandAccount,
} from '@src/features/land-accounts/hooks';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, MoreVertical, Plus, Search, Trash } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@src/shared/components/ui/dropdown-menu';
import { Input, InputWrapper } from '@src/shared/components/ui/input';
import { ScrollArea, ScrollBar } from '@src/shared/components/ui/scroll-area';
import { CreateAccountDialog } from './create-account-dialog';
import { EditAccountDialog } from './edit-account-dialog';
import { TransferDialog } from './transfer-dialog';
import { DepositDialog } from './deposit-dialog';
import { WithdrawDialog } from './withdraw-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@src/shared/components/ui/alert-dialog';

interface IAccountData {
  id: string;
  accountName: string;
  accountBalance: number;
}

export function LandAccountsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<IAccountData | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useGetLandAccountList({
    page: 1,
    limit: 1000,
    search: debouncedSearch || undefined,
  });

  const deleteMutation = useDeleteLandAccount();

  // Transform API data
  const data = useMemo(() => {
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) {
      return [];
    }

    return apiResponse.data.map((account: any) => ({
      id: account.id,
      accountName: account.accountName || '-',
      accountBalance: Number(account.accountBalance) || 0,
    })) as IAccountData[];
  }, [apiResponse]);

  // Define columns
  const columns = useMemo<ColumnDef<IAccountData>[]>(
    () => [
      {
        accessorKey: 'accountName',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="ชื่อบัญชี" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('accountName')}</div>
        ),
      },
      {
        accessorKey: 'accountBalance',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="ยอดเงินคงเหลือ" />
        ),
        cell: ({ row }) => {
          const balance = row.getValue('accountBalance') as number;
          return (
            <div className="text-right font-medium">
              ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const account = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAccount(account);
                  setIsDepositOpen(true);
                }}
              >
                เพิ่มเงิน
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAccount(account);
                  setIsWithdrawOpen(true);
                }}
              >
                ลดเงิน
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAccount(account);
                  setIsTransferOpen(true);
                }}
              >
                โอนเงิน
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAccount(account);
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    แก้ไข
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAccount(account);
                      setIsDeleteOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    ลบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
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

  const handleDelete = () => {
    if (selectedAccount) {
      deleteMutation.mutate(selectedAccount.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedAccount(null);
        },
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">รายการบัญชี</h2>
            <p className="text-sm text-muted-foreground">
              จัดการบัญชีทั้งหมดในระบบ
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มบัญชี
          </Button>
        </CardHeader>

        <CardToolbar>
          <div className="flex items-center gap-2">
            <InputWrapper className="w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาบัญชี..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </InputWrapper>
          </div>
        </CardToolbar>

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

      {/* Dialogs */}
      <CreateAccountDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <EditAccountDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={selectedAccount}
      />
      <TransferDialog
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        accounts={data}
        fromAccount={selectedAccount}
      />
      <DepositDialog
        open={isDepositOpen}
        onOpenChange={setIsDepositOpen}
        account={selectedAccount}
      />
      <WithdrawDialog
        open={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        account={selectedAccount}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบบัญชี</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบบัญชี &quot;{selectedAccount?.accountName}&quot;?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

