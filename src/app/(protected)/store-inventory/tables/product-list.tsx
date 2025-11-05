'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  EllipsisVertical,
  Filter,
  Info,
  Search,
  Settings,
  Trash,
  X,
  Layers,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@src/shared/components/ui/tabs';
import { ProductFormSheet } from '../components/product-form-sheet';
import { ProductDetailsAnalyticsSheet } from '../components/product-details-analytics-sheet';
import { ManageVariantsSheet } from '../components/manage-variants';
import { cn } from '@src/shared/lib/utils';

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
  mockData?: IData[];
  onRowClick?: (productId: string) => void;
  displaySheet?: "productDetails" | "createProduct" | "editProduct" | "manageVariants";
}

const mockData: IData[] = [
  {
    id: '1',
    loanNumber: 'LOA000309',
    customerName: 'งานไถ่',
    placeName: 'test',
    area: '0-0-80',
    titleDeedNumber: '0000000',
    titleDeedType: 'น.ส.3ก',
    requestDate: '25 ต.ค. 2568',
    creditLimit: 2200000,
    paymentDay: 25,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 0,
    remainingAmount: 2640000,
    installmentAmount: 220000,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 0,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '2',
    loanNumber: 'LOA000310',
    customerName: 'สมชาย ใจดี',
    placeName: 'บ้านสวนผล',
    area: '1-2-50',
    titleDeedNumber: '1234567',
    titleDeedType: 'โฉนด',
    requestDate: '20 ต.ค. 2568',
    creditLimit: 1500000,
    paymentDay: 15,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 250000,
    remainingAmount: 1550000,
    installmentAmount: 125000,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '2 ปี',
    paidInstallments: 2,
    totalInstallments: 24,
    interestRate: 96,
    details: '',
  },
  {
    id: '3',
    loanNumber: 'LOA000311',
    customerName: 'วิไล สุขใจ',
    placeName: 'สวนยางพารา',
    area: '2-3-25',
    titleDeedNumber: '2345678',
    titleDeedType: 'น.ส.3',
    requestDate: '18 ต.ค. 2568',
    creditLimit: 3500000,
    paymentDay: 10,
    status: {
      label: 'รออนุมัติ',
      variant: 'warning',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 0,
    remainingAmount: 4200000,
    installmentAmount: 350000,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 0,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '4',
    loanNumber: 'LOA000312',
    customerName: 'ประเสริฐ มั่งมี',
    placeName: 'โรงงานผลิตภัณฑ์',
    area: '5-0-0',
    titleDeedNumber: '3456789',
    titleDeedType: 'โฉนด',
    requestDate: '15 ต.ค. 2568',
    creditLimit: 5000000,
    paymentDay: 5,
    status: {
      label: 'เกินกำหนดชำระ',
      variant: 'destructive',
    },
    overdueDays: 15,
    outstandingBalance: 416667,
    paidAmount: 833334,
    remainingAmount: 5166666,
    installmentAmount: 416667,
    creditRisk: 'ความเสี่ยงสูง',
    loanType: 'เงินสด',
    duration: '1.5 ปี',
    paidInstallments: 2,
    totalInstallments: 18,
    interestRate: 108,
    details: 'ค้างชำระเกิน 15 วัน',
  },
  {
    id: '5',
    loanNumber: 'LOA000313',
    customerName: 'มานะ ขยัน',
    placeName: 'ไร่อ้อย',
    area: '3-1-75',
    titleDeedNumber: '4567890',
    titleDeedType: 'น.ส.3ก',
    requestDate: '12 ต.ค. 2568',
    creditLimit: 2800000,
    paymentDay: 30,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 466667,
    remainingAmount: 2870000,
    installmentAmount: 233333,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1.5 ปี',
    paidInstallments: 2,
    totalInstallments: 18,
    interestRate: 108,
    details: '',
  },
  {
    id: '6',
    loanNumber: 'LOA000314',
    customerName: 'สมหญิง เจริญ',
    placeName: 'ที่ดินเปล่า',
    area: '0-3-45',
    titleDeedNumber: '5678901',
    titleDeedType: 'น.ส.3',
    requestDate: '10 ต.ค. 2568',
    creditLimit: 800000,
    paymentDay: 20,
    status: {
      label: 'ปิดบัญชี',
      variant: 'info',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 960000,
    remainingAmount: 0,
    installmentAmount: 80000,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 12,
    totalInstallments: 12,
    interestRate: 120,
    details: 'ชำระครบแล้ว',
  },
  {
    id: '7',
    loanNumber: 'LOA000315',
    customerName: 'พิชัย สุขสันต์',
    placeName: 'สวนทุเรียน',
    area: '4-2-30',
    titleDeedNumber: '6789012',
    titleDeedType: 'โฉนด',
    requestDate: '8 ต.ค. 2568',
    creditLimit: 4200000,
    paymentDay: 25,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 700000,
    remainingAmount: 4340000,
    installmentAmount: 350000,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '2 ปี',
    paidInstallments: 2,
    totalInstallments: 24,
    interestRate: 96,
    details: '',
  },
  {
    id: '8',
    loanNumber: 'LOA000316',
    customerName: 'นิภา รุ่งเรือง',
    placeName: 'บ้านพักตากอากาศ',
    area: '0-2-75',
    titleDeedNumber: '7890123',
    titleDeedType: 'น.ส.3ก',
    requestDate: '5 ต.ค. 2568',
    creditLimit: 1200000,
    paymentDay: 15,
    status: {
      label: 'ปิดบัญชี',
      variant: 'info',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 1440000,
    remainingAmount: 0,
    installmentAmount: 100000,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 12,
    totalInstallments: 12,
    interestRate: 120,
    details: 'ชำระครบแล้ว',
  },
  {
    id: '9',
    loanNumber: 'LOA000317',
    customerName: 'ธนา มั่งคั่ง',
    placeName: 'โกดังสินค้า',
    area: '1-0-50',
    titleDeedNumber: '8901234',
    titleDeedType: 'โฉนด',
    requestDate: '2 ต.ค. 2568',
    creditLimit: 3000000,
    paymentDay: 10,
    status: {
      label: 'รออนุมัติ',
      variant: 'warning',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 0,
    remainingAmount: 3600000,
    installmentAmount: 300000,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 0,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '10',
    loanNumber: 'LOA000318',
    customerName: 'อรุณ ใจสู้',
    placeName: 'ไร่มันสำปะหลัง',
    area: '6-0-25',
    titleDeedNumber: '9012345',
    titleDeedType: 'น.ส.3',
    requestDate: '30 ก.ย. 2568',
    creditLimit: 1800000,
    paymentDay: 5,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 300000,
    remainingAmount: 1860000,
    installmentAmount: 150000,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1.5 ปี',
    paidInstallments: 2,
    totalInstallments: 18,
    interestRate: 108,
    details: '',
  },
  {
    id: '11',
    loanNumber: 'LOA000319',
    customerName: 'วาสนา พัฒนา',
    placeName: 'ร้านค้า',
    area: '0-1-20',
    titleDeedNumber: '0123456',
    titleDeedType: 'โฉนด',
    requestDate: '28 ก.ย. 2568',
    creditLimit: 950000,
    paymentDay: 20,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 158333,
    remainingAmount: 982667,
    installmentAmount: 79167,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 2,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '12',
    loanNumber: 'LOA000320',
    customerName: 'สุรชัย วงศ์ดี',
    placeName: 'สวนผลไม้',
    area: '2-1-0',
    titleDeedNumber: '1234560',
    titleDeedType: 'น.ส.3ก',
    requestDate: '25 ก.ย. 2568',
    creditLimit: 1650000,
    paymentDay: 30,
    status: {
      label: 'รออนุมัติ',
      variant: 'warning',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 0,
    remainingAmount: 1980000,
    installmentAmount: 137500,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 0,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '13',
    loanNumber: 'LOA000321',
    customerName: 'กมลา ศรีสุข',
    placeName: 'บ้านเดี่ยว',
    area: '0-2-15',
    titleDeedNumber: '2345601',
    titleDeedType: 'โฉนด',
    requestDate: '22 ก.ย. 2568',
    creditLimit: 2100000,
    paymentDay: 15,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 350000,
    remainingAmount: 2170000,
    installmentAmount: 175000,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1.5 ปี',
    paidInstallments: 2,
    totalInstallments: 18,
    interestRate: 108,
    details: '',
  },
  {
    id: '14',
    loanNumber: 'LOA000322',
    customerName: 'บุญส่ง เฟื่องฟู',
    placeName: 'โรงเรือน',
    area: '0-0-50',
    titleDeedNumber: '3456012',
    titleDeedType: 'น.ส.3',
    requestDate: '20 ก.ย. 2568',
    creditLimit: 650000,
    paymentDay: 10,
    status: {
      label: 'ปิดบัญชี',
      variant: 'info',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 780000,
    remainingAmount: 0,
    installmentAmount: 54167,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 12,
    totalInstallments: 12,
    interestRate: 120,
    details: 'ชำระครบแล้ว',
  },
  {
    id: '15',
    loanNumber: 'LOA000323',
    customerName: 'ชัยวัฒน์ มั่งมี',
    placeName: 'โรงงาน',
    area: '8-0-0',
    titleDeedNumber: '4560123',
    titleDeedType: 'โฉนด',
    requestDate: '18 ก.ย. 2568',
    creditLimit: 6500000,
    paymentDay: 5,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 1300000,
    remainingAmount: 6720000,
    installmentAmount: 541667,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1.5 ปี',
    paidInstallments: 2,
    totalInstallments: 18,
    interestRate: 108,
    details: '',
  },
  {
    id: '16',
    loanNumber: 'LOA000324',
    customerName: 'ปราณี ศรีทอง',
    placeName: 'คอนโด',
    area: '0-0-35',
    titleDeedNumber: '5601234',
    titleDeedType: 'โฉนด',
    requestDate: '15 ก.ย. 2568',
    creditLimit: 750000,
    paymentDay: 25,
    status: {
      label: 'รออนุมัติ',
      variant: 'warning',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 0,
    remainingAmount: 900000,
    installmentAmount: 62500,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 0,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '17',
    loanNumber: 'LOA000325',
    customerName: 'สมพร รุ่งโรจน์',
    placeName: 'ที่ดินว่าง',
    area: '1-3-10',
    titleDeedNumber: '6012345',
    titleDeedType: 'น.ส.3ก',
    requestDate: '12 ก.ย. 2568',
    creditLimit: 1350000,
    paymentDay: 20,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 225000,
    remainingAmount: 1395000,
    installmentAmount: 112500,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 2,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '18',
    loanNumber: 'LOA000326',
    customerName: 'นิรันดร์ วิริยะ',
    placeName: 'สวนปาล์มน้ำมัน',
    area: '7-2-40',
    titleDeedNumber: '0123457',
    titleDeedType: 'โฉนด',
    requestDate: '10 ก.ย. 2568',
    creditLimit: 5500000,
    paymentDay: 5,
    status: {
      label: 'เกินกำหนดชำระ',
      variant: 'destructive',
    },
    overdueDays: 8,
    outstandingBalance: 458333,
    paidAmount: 916666,
    remainingAmount: 5683334,
    installmentAmount: 458333,
    creditRisk: 'ความเสี่ยงสูง',
    loanType: 'เงินสด',
    duration: '1.5 ปี',
    paidInstallments: 2,
    totalInstallments: 18,
    interestRate: 108,
    details: 'ค้างชำระ 8 วัน',
  },
  {
    id: '19',
    loanNumber: 'LOA000327',
    customerName: 'รัตนา บุญมา',
    placeName: 'โฮมสเตย์',
    area: '0-3-60',
    titleDeedNumber: '1234568',
    titleDeedType: 'น.ส.3',
    requestDate: '8 ก.ย. 2568',
    creditLimit: 1850000,
    paymentDay: 15,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 308333,
    remainingAmount: 1913667,
    installmentAmount: 154167,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 2,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '20',
    loanNumber: 'LOA000328',
    customerName: 'ชาติชาย สุขสม',
    placeName: 'โรงนา',
    area: '4-0-75',
    titleDeedNumber: '2345670',
    titleDeedType: 'โฉนด',
    requestDate: '5 ก.ย. 2568',
    creditLimit: 2450000,
    paymentDay: 10,
    status: {
      label: 'ปิดบัญชี',
      variant: 'info',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 2940000,
    remainingAmount: 0,
    installmentAmount: 204167,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 12,
    totalInstallments: 12,
    interestRate: 120,
    details: 'ชำระครบแล้ว',
  },
  {
    id: '21',
    loanNumber: 'LOA000329',
    customerName: 'สุภาพ เกิดผล',
    placeName: 'ไร่สับปะรด',
    area: '3-2-20',
    titleDeedNumber: '3456701',
    titleDeedType: 'น.ส.3ก',
    requestDate: '3 ก.ย. 2568',
    creditLimit: 2750000,
    paymentDay: 30,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 458333,
    remainingAmount: 2841667,
    installmentAmount: 229167,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 2,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '22',
    loanNumber: 'LOA000330',
    customerName: 'อนงค์ แก้วมา',
    placeName: 'หอพัก',
    area: '0-2-0',
    titleDeedNumber: '4567012',
    titleDeedType: 'โฉนด',
    requestDate: '1 ก.ย. 2568',
    creditLimit: 3200000,
    paymentDay: 25,
    status: {
      label: 'รออนุมัติ',
      variant: 'warning',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 0,
    remainingAmount: 3456000,
    installmentAmount: 266667,
    creditRisk: 'ความเสี่ยงปานกลาง',
    loanType: 'เงินสด',
    duration: '1.5 ปี',
    paidInstallments: 0,
    totalInstallments: 18,
    interestRate: 108,
    details: '',
  },
  {
    id: '23',
    loanNumber: 'LOA000331',
    customerName: 'พิทักษ์ ชัยชนะ',
    placeName: 'สวนยาง',
    area: '5-1-30',
    titleDeedNumber: '5670123',
    titleDeedType: 'โฉนด',
    requestDate: '28 ส.ค. 2568',
    creditLimit: 3850000,
    paymentDay: 20,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 641667,
    remainingAmount: 3981333,
    installmentAmount: 320833,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 2,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '24',
    loanNumber: 'LOA000332',
    customerName: 'จิราพร สวัสดิ์',
    placeName: 'รีสอร์ท',
    area: '2-0-50',
    titleDeedNumber: '6701234',
    titleDeedType: 'โฉนด',
    requestDate: '25 ส.ค. 2568',
    creditLimit: 7200000,
    paymentDay: 15,
    status: {
      label: 'ยังไม่ถึงกำหนด',
      variant: 'success',
    },
    overdueDays: 0,
    outstandingBalance: 0,
    paidAmount: 1200000,
    remainingAmount: 7440000,
    installmentAmount: 600000,
    creditRisk: 'ความเสี่ยงต่ำ',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 2,
    totalInstallments: 12,
    interestRate: 120,
    details: '',
  },
  {
    id: '25',
    loanNumber: 'LOA000333',
    customerName: 'สุทิน มหาชัย',
    placeName: 'ไร่มะพร้าว',
    area: '6-3-15',
    titleDeedNumber: '7012345',
    titleDeedType: 'น.ส.3',
    requestDate: '22 ส.ค. 2568',
    creditLimit: 4100000,
    paymentDay: 5,
    status: {
      label: 'เกินกำหนดชำระ',
      variant: 'destructive',
    },
    overdueDays: 20,
    outstandingBalance: 341667,
    paidAmount: 683334,
    remainingAmount: 4242666,
    installmentAmount: 341667,
    creditRisk: 'ความเสี่ยงสูง',
    loanType: 'เงินสด',
    duration: '1 ปี',
    paidInstallments: 2,
    totalInstallments: 12,
    interestRate: 120,
    details: 'ค้างชำระเกิน 20 วัน',
  },
];

export function ProductListTable({
  mockData: propsMockData,
  onRowClick,
  displaySheet,
}: ProductListProps) {
  const data = propsMockData || mockData;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Search input state
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
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
    // You can add logic here to handle the selected product data
    console.log('Editing product:', product);
    setIsEditProductOpen(true);
  };

  const handleManageVariants = (product: IData) => {
    // You can add logic here to handle the selected product data
    console.log('Managing variants for product:', product);
    setIsManageVariantsOpen(true);
  };

  const handleViewDetails = (product: IData) => {
    // You can add logic here to handle the selected product data
    console.log('Viewing details for product:', product);
    setIsProductDetailsOpen(true);
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
        size: 40,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'loanNumber',
        accessorFn: (row) => row.loanNumber,
        header: ({ column }) => (
          <DataGridColumnHeader
            title="เลขที่สินเชื่อ"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: (info) => {
          return (
            <span
              className="text-sm font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsProductDetailsOpen(true)}
            >
              {info.row.original.loanNumber}
            </span>
          );
        },
        enableSorting: true,
        size: 130,
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
            <span className="text-sm">
              {info.row.original.customerName}
            </span>
          );
        },
        enableSorting: true,
        size: 130,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'placeName',
        accessorFn: (row) => row.placeName,
        header: ({ column }) => (
          <DataGridColumnHeader title="สถานที่" column={column} />
        ),
        cell: (info) => {
          return (
            <span className="text-sm">{info.row.original.placeName}</span>
          );
        },
        enableSorting: true,
        size: 120,
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
          return (
            <span className="text-sm">{info.row.original.area} ไร่</span>
          );
        },
        enableSorting: true,
        size: 100,
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
        size: 120,
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
        size: 120,
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
          const variant = status.variant as keyof BadgeProps['variant'];
          return (
            <Badge
              variant={variant}
              appearance="light"
              className="rounded-full"
            >
              {status.label}
            </Badge>
          );
        },
        enableSorting: true,
        size: 130,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'creditRisk',
        accessorFn: (row) => row.creditRisk,
        header: ({ column }) => (
          <DataGridColumnHeader title="เครดิต" column={column} />
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
        size: 140,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'requestDate',
        accessorFn: (row) => row.requestDate,
        header: ({ column }) => (
          <DataGridColumnHeader title="วันที่ขอ" column={column} />
        ),
        cell: (info) => {
          return info.row.original.requestDate;
        },
        enableSorting: true,
        size: 120,
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
          return <div className="text-center">{info.row.original.interestRate}%</div>;
        },
        enableSorting: true,
        size: 90,
        meta: {
          cellClassName: '',
        },
      },
      {
        id: 'actions',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" mode="icon" size="sm" className="">
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom">
                  <DropdownMenuItem onClick={() => handleEditProduct(row.original)}>
                    <Settings className="size-4" />
                    แก้ไขข้อมูล
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleManageVariants(row.original)}>
                    <Layers className="size-4" />
                    รายละเอียดการชำระ
                  </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
                      <Info className="size-4" />
                      ข้อมูลเต็ม
                    </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    <Trash className="size-4" />
                    ลบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 80,
      },
    ],
    [], // Same columns for all tabs
  );

  // Apply search, tab, and last moved filters
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

    // Apply search filter - search in loan number and customer name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.loanNumber.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [data, activeTab, searchQuery]);

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
  }, [activeTab, searchQuery, selectedLastMoved]);

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
        pageSize: 10, // Fixed 10 items per page
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', badge: data.length },
    { id: 'active', label: 'ยังไม่ถึงกำหนด', badge: data.filter(item => item.status.label === 'ยังไม่ถึงกำหนด').length },
    { id: 'pending', label: 'รออนุมัติ', badge: data.filter(item => item.status.label === 'รออนุมัติ').length },
    { id: 'overdue', label: 'เกินกำหนดชำระ', badge: data.filter(item => item.status.label === 'เกินกำหนดชำระ').length },
    { id: 'closed', label: 'ปิดบัญชี', badge: data.filter(item => item.status.label === 'ปิดบัญชี').length },
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
                      "relative text-foreground px-2 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none", 
                      activeTab === tab.id ? 'font-medium' : 'font-normal')
                    }
                  >
                    <div className="flex items-center gap-2">
                      {tab.label}
                      <Badge
                        size="sm"
                        variant={activeTab === tab.id ? 'primary' : 'outline'}
                        appearance="outline"
                        className={cn("rounded-full", activeTab === tab.id ? '' : 'bg-muted/60')}
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
      />

      {/* Edit Product Modal */}
      <ProductFormSheet
        mode="edit"
        open={isEditProductOpen}
        onOpenChange={setIsEditProductOpen}
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
    </div>
  );
}
