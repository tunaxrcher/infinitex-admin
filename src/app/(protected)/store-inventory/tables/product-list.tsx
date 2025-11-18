'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useApproveLoan,
  useDeleteLoan,
  useGetLoanList,
  useRejectLoan,
} from '@src/features/loans/hooks';
import { cn } from '@src/shared/lib/utils';
import {
  Column,
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Check,
  EllipsisVertical,
  Filter,
  Info,
  Layers,
  Search,
  Settings,
  Trash,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@src/shared/components/ui/alert';
import { Badge, BadgeProps } from '@src/shared/components/ui/badge';
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
import { DataGridColumnVisibility } from '@src/shared/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@src/shared/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@src/shared/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@src/shared/components/ui/dropdown-menu';
import { Input, InputWrapper } from '@src/shared/components/ui/input';
import { ScrollArea, ScrollBar } from '@src/shared/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@src/shared/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@src/shared/components/ui/tooltip';
import { ApproveLoanDialog } from '../components/approve-loan-dialog';
import { ManageVariantsSheet } from '../components/manage-variants';
import { ProductDetailsAnalyticsSheet } from '../components/product-details-analytics-sheet';
import { ProductFormSheet } from '../components/product-form-sheet';
import { RejectLoanDialog } from '../components/reject-loan-dialog';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

export interface IData {
  id: string;
  loanNumber: string;
  customerName: string;
  placeName: string;
  area: string;
  titleDeedNumber: string;
  titleDeedType: string;
  requestDate: string;
  requestDateRaw: Date; // เพิ่มฟิลด์ raw date สำหรับการเรียง
  creditLimit: number;
  paymentDay: number;
  status: {
    label: string;
    variant: string;
  };
  overdueDays: number;
  outstandingBalance: number;
  paidAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  creditRisk: string;
  loanType: string;
  duration: string;
  paidInstallments: number;
  totalInstallments: number;
  interestRate: number;
  details: string;
}

interface ProductListProps {
  onRowClick?: (productId: string) => void;
  displaySheet?:
    | 'productDetails'
    | 'createProduct'
    | 'editProduct'
    | 'manageVariants';
}

export function ProductListTable({
  onRowClick,
  displaySheet,
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25, // Default 25 rows per page
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data from API - ดึงทั้งหมดมาครั้งเดียว ไม่ส่ง status filter
  const {
    data: apiResponse,
    isLoading,
    error,
    isError,
  } = useGetLoanList({
    page: 1,
    limit: 1000, // ดึงทั้งหมด (ปรับตามจำนวนข้อมูลจริง)
    search: debouncedSearch || undefined,
    // ไม่ส่ง status filter - จะกรองฝั่ง client แทน
  });

  const deleteLoan = useDeleteLoan();
  const approveLoan = useApproveLoan();
  const rejectLoan = useRejectLoan();

  // Reject dialog state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectingLoanId, setRejectingLoanId] = useState<string | undefined>();

  // Approve dialog state
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approvingLoanId, setApprovingLoanId] = useState<string | undefined>();

  // Log API response for debugging
  useEffect(() => {
    console.log('Current Tab:', activeTab);
    console.log('API Response:', apiResponse);
    console.log('API Data Count:', apiResponse?.data?.length || 0);
    console.log('Is Loading:', isLoading);
    console.log('Is Error:', isError);
    if (error) console.error('API Error:', error);
  }, [apiResponse, isLoading, isError, error, activeTab]);

  // Transform API data to match IData interface
  const apiData = useMemo(() => {
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) {
      console.log('No API data available');
      return [];
    }

    console.log('Transforming API data:', apiResponse.data.length, 'loans');

    return apiResponse.data.map((loan: unknown) => {
      const loanData = loan as Record<string, unknown>;
      const customer = loanData.customer as Record<string, unknown> | undefined;
      const profile = customer?.profile as Record<string, unknown> | undefined;
      const application = loanData.application as
        | Record<string, unknown>
        | undefined;

      const customerFirstName = (profile?.firstName as string) || '';
      const customerLastName = (profile?.lastName as string) || '';
      const fullName =
        `${customerFirstName} ${customerLastName}`.trim() || 'ไม่ระบุ';

      // กำหนดสถานะตาม loan.status หรือ application.status
      const loanStatus = loanData.status as string;
      const appStatus = application?.status as string;
      const hasOverdueInstallments = loanData.hasOverdueInstallments as boolean;
      let statusLabel = 'รออนุมัติ';
      let statusVariant = 'warning';

      // ตรวจสอบสถานะจาก loan.status ก่อน (ถ้ามี)
      if (loanStatus === 'ACTIVE') {
        // ถ้ามีงวดค้างชำระ แสดงว่าเกินกำหนด
        if (hasOverdueInstallments) {
          statusLabel = 'เกินกำหนดชำระ';
          statusVariant = 'destructive';
        } else {
          statusLabel = 'ยังไม่ถึงกำหนด';
          statusVariant = 'success';
        }
      } else if (loanStatus === 'COMPLETED') {
        statusLabel = 'ปิดบัญชี';
        statusVariant = 'info';
      } else if (loanStatus === 'DEFAULTED') {
        statusLabel = 'เกินกำหนดชำระ';
        statusVariant = 'destructive';
      } else if (loanStatus === 'CANCELLED' || appStatus === 'REJECTED') {
        statusLabel = 'ยกเลิกแล้ว';
        statusVariant = 'destructive';
      } else if (
        appStatus === 'DRAFT' ||
        appStatus === 'SUBMITTED' ||
        appStatus === 'UNDER_REVIEW' ||
        appStatus === 'APPROVED'
      ) {
        // ทุกสถานะก่อนสร้าง loan ให้แสดงเป็น "รออนุมัติ"
        statusLabel = 'รออนุมัติ';
        statusVariant = 'warning';
      } else {
        // Default
        statusLabel = 'รออนุมัติ';
        statusVariant = 'warning';
      }

      // ดึงข้อมูลจาก loan_application
      const propertyType = (application?.propertyType as string) || '-';
      const propertyValue = application?.propertyValue
        ? Number(application.propertyValue)
        : null;
      const requestedAmount = application?.requestedAmount
        ? Number(application.requestedAmount)
        : null;
      const approvedAmount = application?.approvedAmount
        ? Number(application.approvedAmount)
        : null;
      const maxApprovedAmount = application?.maxApprovedAmount
        ? Number(application.maxApprovedAmount)
        : null;
      const ownerName = (application?.ownerName as string) || fullName;
      const landNumber = (application?.landNumber as string) || '-';

      // แปลง loanType จาก enum ให้เป็นภาษาไทย
      const loanTypeMap: Record<string, string> = {
        HOUSE_LAND_MORTGAGE: 'จำนองบ้านและโฉนด',
        CAR_REGISTRATION: 'ทะเบียนรถ',
        FINX_PLUS: 'FinX พลัส',
      };
      const loanTypeDisplay =
        loanTypeMap[loanData.loanType as string] || 'จำนองบ้านและโฉนด';

      // คำนวณ overdue days (ถ้ามี loan)
      let overdueDays = 0;
      let outstandingBalance = 0;
      let paymentDay = 0;

      if (loanStatus === 'ACTIVE' || loanStatus === 'DEFAULTED') {
        const nextPaymentDate = new Date(loanData.nextPaymentDate as string);
        const today = new Date();
        paymentDay = nextPaymentDate.getDate();

        // ใช้ข้อมูล overdue จาก backend
        if (hasOverdueInstallments && loanData.oldestOverdueDate) {
          const oldestOverdueDate = new Date(
            loanData.oldestOverdueDate as string,
          );
          const diffTime = today.getTime() - oldestOverdueDate.getTime();
          overdueDays = Math.max(
            0,
            Math.floor(diffTime / (1000 * 60 * 60 * 24)),
          );

          // คำนวณ outstanding balance จาก overdueCount
          const overdueCount = (loanData.overdueCount as number) || 0;
          outstandingBalance =
            overdueCount * Number(loanData.monthlyPayment || 0);
        }
      }

      // ใช้ข้อมูลจาก application ถ้ายังไม่มี loan
      const principalAmount = loanStatus
        ? Number(loanData.principalAmount)
        : Number(application?.requestedAmount || 0);
      const remainingBalance = loanStatus
        ? Number(loanData.remainingBalance)
        : principalAmount;

      // ใช้วันที่จาก application.createdAt (วันที่ยื่นคำขอ) หรือ loan.contractDate
      const requestDateRaw = application?.createdAt
        ? new Date(application.createdAt as string)
        : new Date(loanData.contractDate as string);

      return {
        id: loanData.id as string,
        loanNumber: loanData.loanNumber as string,
        customerName: fullName,
        placeName: (application?.propertyLocation as string) || '-',
        area: (application?.propertyArea as string) || '-',
        titleDeedNumber:
          (loanData.titleDeedNumber as string) || landNumber || '-',
        titleDeedType: propertyType,
        requestDate: requestDateRaw.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        requestDateRaw: requestDateRaw, // เก็บค่า raw date ไว้สำหรับการเรียง
        creditLimit: principalAmount,
        paymentDay: paymentDay,
        status: {
          label: statusLabel,
          variant: statusVariant,
        },
        overdueDays: overdueDays,
        outstandingBalance: outstandingBalance,
        paidAmount: principalAmount - remainingBalance,
        remainingAmount: remainingBalance,
        installmentAmount: Number(loanData.monthlyPayment || 0),
        creditRisk: 'ความเสี่ยงต่ำ',
        loanType: loanTypeDisplay,
        duration: loanData.termMonths
          ? `${Number(loanData.termMonths) / 12} ปี`
          : '-',
        paidInstallments: (loanData.currentInstallment as number) || 0,
        totalInstallments: (loanData.totalInstallments as number) || 0,
        interestRate: Number(loanData.interestRate || 0),
        details: '',
      };
    });
  }, [apiResponse]);

  // Use API data only
  const data = apiData;

  // Search input state
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'requestDate', desc: true },
  ]);
  const [selectedLastMoved] = useState<string[]>([]);

  // Modal state
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isManageVariantsOpen, setIsManageVariantsOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>();

  // Auto-open sheet based on displaySheet prop
  useEffect(() => {
    if (displaySheet) {
      switch (displaySheet) {
        case 'productDetails':
          setIsProductDetailsOpen(true);
          break;
        case 'createProduct':
          setIsCreateProductOpen(true);
          break;
        case 'editProduct':
          setIsEditProductOpen(true);
          break;
        case 'manageVariants':
          setIsManageVariantsOpen(true);
          break;
      }
    }
  }, [displaySheet]);

  const handleEditProduct = (product: IData) => {
    console.log('Editing product:', product);
    setSelectedLoanId(product.id);
    setIsEditProductOpen(true);
  };

  const handleManageVariants = (product: IData) => {
    // You can add logic here to handle the selected product data
    console.log('Managing variants for product:', product);
    setIsManageVariantsOpen(true);
  };

  const handleViewDetails = (product: IData) => {
    console.log('Viewing details for product:', product);
    setSelectedLoanId(product.id);
    setIsProductDetailsOpen(true);
  };

  const handleEditFromDetails = () => {
    console.log('Opening edit form with loan ID:', selectedLoanId);
    setIsProductDetailsOpen(false);
    setTimeout(() => {
      setIsEditProductOpen(true);
    }, 100); // Delay เล็กน้อยเพื่อให้ modal ปิดก่อน
  };

  // Handle approve loan
  const handleApproveLoan = (loanId: string) => {
    setApprovingLoanId(loanId);
    setIsApproveDialogOpen(true);
  };

  // Confirm approve loan with account selection
  const confirmApproveLoan = (landAccountId: string) => {
    if (approvingLoanId) {
      approveLoan.mutate(
        { loanId: approvingLoanId, landAccountId },
        {
          onSuccess: () => {
            setIsApproveDialogOpen(false);
            setApprovingLoanId(undefined);
          },
        },
      );
    }
  };

  // Handle reject loan
  const handleRejectLoan = (loanId: string) => {
    setRejectingLoanId(loanId);
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = (reviewNotes: string) => {
    if (rejectingLoanId) {
      rejectLoan.mutate(
        { id: rejectingLoanId, reviewNotes },
        {
          onSuccess: () => {
            setIsRejectDialogOpen(false);
            setRejectingLoanId(undefined);
          },
        },
      );
    }
  };

  const ColumnInputFilter = <TData, TValue>({
    column,
  }: IColumnFilterProps<TData, TValue>) => {
    return (
      <Input
        placeholder="Filter..."
        value={(column.getFilterValue() as string) ?? ''}
        onChange={(event) => column.setFilterValue(event.target.value)}
        variant="sm"
        className="w-40"
      />
    );
  };

  const columns = useMemo<ColumnDef<IData>[]>(
    () => [
      {
        accessorKey: 'id',
        accessorFn: (row) => row.id,
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        size: 50,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'loanNumber',
        accessorFn: (row) => row.loanNumber,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="ชื่อสถานที่ / เลขที่สินเชื่อ"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: (info) => {
          // return (
          //   <span
          //     className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
          //     onClick={() => setIsProductDetailsOpen(true)}
          //   >
          //     {info.row.original.loanNumber}
          //   </span>
          // );

          return (
            <div className="flex items-center gap-2.5">
              <Card className="flex items-center justify-center rounded-md bg-accent/50 h-[40px] w-[50px] shadow-none shrink-0">
                <img
                  src={'/images/loan.png'}
                  className="cursor-pointer h-[40px]"
                  alt="image"
                  onClick={() => handleViewDetails(info.row.original)}
                />
              </Card>
              <div className="flex flex-col gap-1">
                {info.row.original.placeName.length > 20 ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="text-sm font-medium text-foreground leading-3.5 truncate max-w-[180px] cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleViewDetails(info.row.original)}
                        >
                          {info.row.original.placeName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{info.row.original.placeName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span
                    className="text-sm font-medium text-foreground leading-3.5 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleViewDetails(info.row.original)}
                  >
                    {info.row.original.placeName}
                  </span>
                )}
                <span className="text-xs text-muted-foreground uppercase">
                  เลขที่สินเชื่อ:{' '}
                  <span className="text-xs font-medium text-secondary-foreground">
                    {info.row.original.loanNumber}
                  </span>
                </span>
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 260,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'customerName',
        accessorFn: (row) => row.customerName,
        header: ({ column }) => (
          <DataGridColumnHeader title="ชื่อลูกค้า" column={column} />
        ),
        cell: (info) => {
          return (
            <span className="text-sm">{info.row.original.customerName}</span>
          );
        },
        enableSorting: true,
        size: 150,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'area',
        accessorFn: (row) => row.area,
        header: ({ column }) => (
          <DataGridColumnHeader title="เนื้อที่" column={column} />
        ),
        cell: (info) => {
          return <span className="text-sm">{info.row.original.area}</span>;
        },
        enableSorting: true,
        size: 140,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'titleDeed',
        accessorFn: (row) => row.titleDeedType,
        header: ({ column }) => (
          <DataGridColumnHeader title="โฉนด" column={column} />
        ),
        cell: (info) => {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">{info.row.original.titleDeedType}</span>
              <span className="text-xs text-muted-foreground">
                {info.row.original.titleDeedNumber}
              </span>
            </div>
          );
        },
        enableSorting: true,
        size: 140,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'creditLimit',
        accessorFn: (row) => row.creditLimit,
        header: ({ column }) => (
          <DataGridColumnHeader title="วงเงิน" column={column} />
        ),
        cell: (info) => {
          return (
            <div className="text-right font-medium">
              ฿{info.row.original.creditLimit.toLocaleString()}
            </div>
          );
        },
        enableSorting: true,
        size: 140,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <DataGridColumnHeader title="สถานะ" column={column} />
        ),
        cell: (info) => {
          const status = info.row.original.status;
          const overdueDays = info.row.original.overdueDays;
          const variant = status.variant as keyof BadgeProps['variant'];

          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant={variant}
                appearance="light"
                className="rounded-full"
              >
                {status.label}
              </Badge>
              {overdueDays > 0 && status.label === 'เกินกำหนดชำระ' && (
                <span className="text-xs text-destructive font-medium">
                  เกิน {overdueDays} วัน
                </span>
              )}
            </div>
          );
        },
        enableSorting: true,
        size: 160,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'creditRisk',
        accessorFn: (row) => row.creditRisk,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="เครดิต (In Development)"
            column={column}
          />
        ),
        cell: (info) => {
          const risk = info.row.original.creditRisk;
          let variant: 'info' | 'success' | 'warning' | 'destructive' = 'info';
          if (risk === 'ความเสี่ยงต่ำ') variant = 'success';
          else if (risk === 'ความเสี่ยงปานกลาง') variant = 'warning';
          else if (risk === 'ความเสี่ยงสูง') variant = 'destructive';

          return (
            <Badge
              variant={variant}
              appearance="outline"
              className="rounded-full"
            >
              {risk}
            </Badge>
          );
        },
        enableSorting: true,
        size: 180,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'requestDate',
        accessorFn: (row) => row.requestDateRaw, // ใช้ raw date สำหรับการเรียง
        header: ({ column }) => (
          <DataGridColumnHeader title="วันที่ขอ" column={column} />
        ),
        cell: (info) => {
          return info.row.original.requestDate; // แสดง formatted date
        },
        enableSorting: true,
        size: 140,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'interestRate',
        accessorFn: (row) => row.interestRate,
        header: ({ column }) => (
          <DataGridColumnHeader title="ดอกเบี้ย" column={column} />
        ),
        cell: (info) => {
          return (
            <div className="text-center">{info.row.original.interestRate}%</div>
          );
        },
        enableSorting: true,
        size: 80,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'actions',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => {
          const statusLabel = row.original.status.label;
          const isPending = statusLabel === 'รออนุมัติ';

          return (
            <div className="flex items-center justify-center gap-1">
              {isPending ? (
                /* สำหรับสินเชื่อรออนุมัติ - แสดงปุ่มโดยตรง */
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className=" hover:text-green-700 hover:bg-green-50 "
                    onClick={() => handleApproveLoan(row.original.id)}
                  >
                    <Check className="size-3.5" /> อนุมัติ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className=" hover:text-red-700 hover:bg-red-50 "
                    onClick={() => handleRejectLoan(row.original.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </>
              ) : (
                /* สำหรับสินเชื่ออื่นๆ - แสดง dropdown */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" mode="icon" size="sm" className="">
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom">
                    <DropdownMenuItem
                      onClick={() => handleEditProduct(row.original)}
                    >
                      <Settings className="size-4" />
                      แก้ไขข้อมูล
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleManageVariants(row.original)}
                    >
                      <Layers className="size-4" />
                      รายละเอียดการชำระ
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleViewDetails(row.original)}
                    >
                      <Info className="size-4" />
                      ข้อมูลเต็ม
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        if (confirm('คุณต้องการลบสินเชื่อนี้ใช่หรือไม่?')) {
                          deleteLoan.mutate(row.original.id);
                        }
                      }}
                    >
                      <Trash className="size-4" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        },
        size: 160, // เพิ่มขนาด column เพื่อให้พอดีกับปุ่ม 2 ปุ่ม
      },
    ],
    [], // Same columns for all tabs
  );

  // Apply tab filter only (search is handled by API)
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply tab filter based on tabs array ids
    if (activeTab === 'all') {
      result = result; // No filter, show all data
    } else if (activeTab === 'active') {
      result = result.filter((item) => item.status.label === 'ยังไม่ถึงกำหนด');
    } else if (activeTab === 'pending') {
      result = result.filter((item) => item.status.label === 'รออนุมัติ');
    } else if (activeTab === 'overdue') {
      result = result.filter((item) => item.status.label === 'เกินกำหนดชำระ');
    } else if (activeTab === 'closed') {
      result = result.filter((item) => item.status.label === 'ปิดบัญชี');
    }

    // Note: Search filtering is handled by API (server-side)
    // No need to filter here again as data is already filtered

    return result;
  }, [data, activeTab]);

  useEffect(() => {
    const selectedRowIds = Object.keys(rowSelection);
    if (selectedRowIds.length > 0) {
      toast.custom(
        (t) => (
          <Alert
            variant="mono"
            icon="success"
            close={true}
            onClose={() => toast.dismiss(t)}
          >
            <AlertIcon>
              <Info />
            </AlertIcon>
            <AlertTitle>
              Selected row IDs: {selectedRowIds.join(', ')}
            </AlertTitle>
          </Alert>
        ),
        {
          duration: 5000,
        },
      );
    }
  }, [rowSelection]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [activeTab, debouncedSearch, selectedLastMoved]);

  // Sync inputValue with searchQuery when searchQuery changes externally
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize, // Use dynamic pageSize from state
      },
      sorting,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false, // Let react-table handle pagination
  });

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', badge: data.length },
    {
      id: 'active',
      label: 'ยังไม่ถึงกำหนด',
      badge: data.filter(
        (item: IData) => item.status.label === 'ยังไม่ถึงกำหนด',
      ).length,
    },
    {
      id: 'pending',
      label: 'รออนุมัติ',
      badge: data.filter((item: IData) => item.status.label === 'รออนุมัติ')
        .length,
    },
    {
      id: 'overdue',
      label: 'เกินกำหนดชำระ',
      badge: data.filter((item: IData) => item.status.label === 'เกินกำหนดชำระ')
        .length,
    },
    {
      id: 'closed',
      label: 'ปิดบัญชี',
      badge: data.filter((item: IData) => item.status.label === 'ปิดบัญชี')
        .length,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Reset to first page when changing tabs
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  };

  // Search input handlers
  const handleClearInput = () => {
    setInputValue('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div>
      <Card>
        <CardHeader className="py-3 flex-nowrap">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="m-0 p-0 w-full"
          >
            <TabsList className="h-auto p-0 bg-transparent border-b-0 border-border rounded-none -ms-[3px] w-full">
              <div className="flex items-center gap-1 min-w-max">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'relative text-foreground px-2 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none',
                      activeTab === tab.id ? 'font-medium' : 'font-normal',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {tab.label}
                      <Badge
                        size="sm"
                        variant={activeTab === tab.id ? 'primary' : 'outline'}
                        appearance="outline"
                        className={cn(
                          'rounded-full',
                          activeTab === tab.id ? '' : 'bg-muted/60',
                        )}
                      >
                        {tab.badge}
                      </Badge>
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary -mb-[14px]" />
                    )}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </Tabs>
          <CardToolbar className="flex items-center gap-2">
            {/* Search */}
            <div className="w-full max-w-[200px]">
              <InputWrapper>
                <Search />
                <Input
                  placeholder="Search..."
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <Button
                  onClick={handleClearInput}
                  variant="dim"
                  className="-me-4"
                  disabled={inputValue === ''}
                >
                  {inputValue !== '' && <X size={16} />}
                </Button>
              </InputWrapper>
            </div>

            {/* Filter */}
            <DataGridColumnVisibility
              table={table}
              trigger={
                <Button variant="outline">
                  <Filter className="size-3.5" />
                  Filters
                </Button>
              }
            />
          </CardToolbar>
        </CardHeader>

        {/* Tab Contents */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {tabs.map((tab) => (
            <TabsContent
              key={`content-${tab.id}`}
              value={tab.id}
              className="mt-0"
            >
              <DataGrid
                table={table}
                recordCount={filteredData?.length || 0}
                onRowClick={
                  onRowClick ? (row: IData) => onRowClick(row.id) : undefined
                }
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
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsAnalyticsSheet
        open={isProductDetailsOpen}
        onOpenChange={setIsProductDetailsOpen}
        loanId={selectedLoanId}
        onEdit={handleEditFromDetails}
      />

      {/* Edit Product Modal */}
      <ProductFormSheet
        mode="edit"
        open={isEditProductOpen}
        onOpenChange={setIsEditProductOpen}
        loanId={selectedLoanId}
      />

      {/* Create Product Modal */}
      <ProductFormSheet
        mode="new"
        open={isCreateProductOpen}
        onOpenChange={setIsCreateProductOpen}
      />

      {/* Manage Variants Modal */}
      <ManageVariantsSheet
        open={isManageVariantsOpen}
        onOpenChange={setIsManageVariantsOpen}
      />

      {/* Reject Loan Dialog */}
      <RejectLoanDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleConfirmReject}
        isLoading={rejectLoan.isPending}
      />

      {/* Approve Loan Dialog */}
      <ApproveLoanDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        onConfirm={confirmApproveLoan}
        isPending={approveLoan.isPending}
      />
    </div>
  );
}
