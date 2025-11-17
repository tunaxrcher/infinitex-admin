// src/features/dashboard/validations.ts
import { z } from 'zod';

export const dashboardFiltersSchema = z.object({
  year: z.string().optional().default(new Date().getFullYear().toString()),
});

export type DashboardFiltersSchema = z.infer<typeof dashboardFiltersSchema>;

// Type definitions for dashboard data
export interface MonthlyData {
  month: number;
  monthName: string;
  loanAmount: number; // ยอดเปิดสินเชื่อ
  totalPayment: number; // รับชำระ (ยอดชำระทั้งหมด)
  interestPayment: number; // ชำระค่างวด (มี installmentId = จ่ายดอกเบี้ย)
  closeAccountPayment: number; // ชำระปิดบัญชี (ไม่มี installmentId = จ่ายเงินต้น)
  overduePayment: number; // ค้างชำระ
  profit: number; // กำไร (ดอกเบี้ย + ค่าธรรมเนียม)
}

export interface DashboardSummary {
  currentMonthLoanAmount: number; // ยอดเปิดสินเชื่อ (เดือนปัจจุบัน)
  currentMonthProfit: number; // กำไร (เดือนปัจจุบัน)
  yearProfit: number; // กำไรทั้งปี
  monthlyData: MonthlyData[]; // ข้อมูลรายเดือน 12 เดือน
  highestPaymentMonth: {
    month: number;
    monthName: string;
    amount: number;
  };
  lowestPaymentMonth: {
    month: number;
    monthName: string;
    amount: number;
  };
  averagePaymentPerMonth: number;
  totalPaymentYear: number;
  paymentPercentage: number;
}
