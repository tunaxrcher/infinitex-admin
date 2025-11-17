// src/features/dashboard/services/server.ts
import 'server-only';
import { dashboardRepository } from '../repositories/dashboardRepository';
import {
  type DashboardFiltersSchema,
  type DashboardSummary,
  type MonthlyData,
} from '../validations';

const MONTH_NAMES = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const dashboardService = {
  async getDashboardSummary(
    filters: DashboardFiltersSchema,
  ): Promise<DashboardSummary> {
    const year = parseInt(filters.year || new Date().getFullYear().toString());
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // สร้างข้อมูลรายเดือน 12 เดือน
    const monthlyDataPromises: Promise<MonthlyData>[] = [];

    for (let month = 1; month <= 12; month++) {
      monthlyDataPromises.push(this.getMonthlyData(year, month));
    }

    const monthlyData = await Promise.all(monthlyDataPromises);

    // คำนวณข้อมูลสรุป
    const currentMonthData = monthlyData[currentMonth - 1];

    // ยอดเปิดสินเชื่อเดือนปัจจุบัน
    const currentMonthLoanAmount = currentMonthData.loanAmount;

    // กำไรเดือนปัจจุบัน (ดอกเบี้ย + ค่าธรรมเนียม)
    const currentMonthProfit = currentMonthData.profit;

    // กำไรทั้งปี (รวมกำไรทุกเดือน)
    const yearProfit = monthlyData.reduce((sum, data) => sum + data.profit, 0);

    // หายอดรับชำระสูงสุด/ต่ำสุด (ใช้ interestPayment = ชำระค่างวด)
    const monthsWithData = monthlyData.filter((d) => d.interestPayment > 0);

    let highestPaymentMonth = monthsWithData[0] || monthlyData[0];
    let lowestPaymentMonth = monthsWithData[0] || monthlyData[0];

    monthsWithData.forEach((data) => {
      if (data.interestPayment > highestPaymentMonth.interestPayment) {
        highestPaymentMonth = data;
      }
      if (data.interestPayment < lowestPaymentMonth.interestPayment) {
        lowestPaymentMonth = data;
      }
    });

    // ยอดรับชำระทั้งหมด = ยอดชำระค่างวดทั้งหมด
    const totalPaymentYear = monthlyData.reduce(
      (sum, data) => sum + data.interestPayment,
      0,
    );

    // เฉลี่ยต่อเดือน = เฉลี่ยกำไร
    const averagePaymentPerMonth = yearProfit / 12;

    // คำนวณเปอร์เซ็นต์ยอดรับชำระ (ยอดชำระค่างวดทั้งปี / ยอดเปิดสินเชื่อทั้งปี)
    const totalLoanAmountYear = monthlyData.reduce(
      (sum, data) => sum + data.loanAmount,
      0,
    );
    const paymentPercentage =
      totalLoanAmountYear > 0
        ? (totalPaymentYear / totalLoanAmountYear) * 100
        : 0;

    return {
      currentMonthLoanAmount,
      currentMonthProfit,
      yearProfit,
      monthlyData,
      highestPaymentMonth: {
        month: highestPaymentMonth.month,
        monthName: highestPaymentMonth.monthName,
        amount: highestPaymentMonth.interestPayment, // ใช้ interestPayment (ชำระค่างวด)
      },
      lowestPaymentMonth: {
        month: lowestPaymentMonth.month,
        monthName: lowestPaymentMonth.monthName,
        amount: lowestPaymentMonth.interestPayment, // ใช้ interestPayment (ชำระค่างวด)
      },
      averagePaymentPerMonth,
      totalPaymentYear,
      paymentPercentage,
    };
  },

  async getMonthlyData(year: number, month: number): Promise<MonthlyData> {
    // Query ข้อมูลพร้อมกัน (Parallel)
    const [loansCreated, payments, overdueInstallments] = await Promise.all([
      dashboardRepository.getLoansCreatedInMonth(year, month),
      dashboardRepository.getPaymentsInMonth(year, month),
      dashboardRepository.getOverdueInstallmentsInMonth(year, month),
    ]);

    // 1. ยอดเปิดสินเชื่อ
    const loanAmount = Number(loansCreated._sum.principalAmount || 0);

    // 2. รับชำระ
    const totalPayment = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // 3. ชำระค่างวด (มี installmentId = ดอกเบี้ย)
    const interestPayment = payments
      .filter((p) => p.installmentId != null && p.installmentId !== '')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    // 4. ชำระปิดบัญชี (ไม่มี installmentId = เงินต้น)
    const closeAccountPayment = payments
      .filter((p) => !p.installmentId || p.installmentId === '')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    // 5. ค้างชำระ
    const overduePayment = Number(overdueInstallments._sum.totalAmount || 0);

    // 6. กำไร = ยอดชำระค่างวด (เนื่องจาก interestAmount/feeAmount เป็น 0)
    const profit = interestPayment;

    return {
      month,
      monthName: MONTH_NAMES[month - 1],
      loanAmount,
      totalPayment,
      interestPayment,
      closeAccountPayment,
      overduePayment,
      profit,
    };
  },
};
