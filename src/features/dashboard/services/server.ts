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

    // Fetch monthly data for all 12 months in parallel
    const monthlyData = await this._fetchAllMonthlyData(year);

    // Calculate summary metrics
    const currentMonthData = monthlyData[currentMonth - 1];
    const yearProfit = this._calculateYearProfit(monthlyData);
    const { highestPaymentMonth, lowestPaymentMonth } =
      this._findPaymentExtremes(monthlyData);
    const totalPaymentYear = this._calculateTotalPayment(monthlyData);
    const totalLoanAmountYear = this._calculateTotalLoanAmount(monthlyData);

    return {
      currentMonthLoanAmount: currentMonthData.loanAmount,
      currentMonthProfit: currentMonthData.profit,
      yearProfit,
      monthlyData,
      highestPaymentMonth: {
        month: highestPaymentMonth.month,
        monthName: highestPaymentMonth.monthName,
        amount: highestPaymentMonth.interestPayment,
      },
      lowestPaymentMonth: {
        month: lowestPaymentMonth.month,
        monthName: lowestPaymentMonth.monthName,
        amount: lowestPaymentMonth.interestPayment,
      },
      averagePaymentPerMonth: yearProfit / 12,
      totalPaymentYear,
      paymentPercentage:
        totalLoanAmountYear > 0
          ? (totalPaymentYear / totalLoanAmountYear) * 100
          : 0,
    };
  },

  /**
   * Fetch monthly data for all 12 months in parallel
   */
  async _fetchAllMonthlyData(year: number): Promise<MonthlyData[]> {
    const promises = Array.from({ length: 12 }, (_, i) =>
      this.getMonthlyData(year, i + 1),
    );
    return Promise.all(promises);
  },

  /**
   * Calculate total profit for the year
   */
  _calculateYearProfit(monthlyData: MonthlyData[]): number {
    return monthlyData.reduce((sum, data) => sum + data.profit, 0);
  },

  /**
   * Calculate total payment amount for the year
   */
  _calculateTotalPayment(monthlyData: MonthlyData[]): number {
    return monthlyData.reduce((sum, data) => sum + data.interestPayment, 0);
  },

  /**
   * Calculate total loan amount for the year
   */
  _calculateTotalLoanAmount(monthlyData: MonthlyData[]): number {
    return monthlyData.reduce((sum, data) => sum + data.loanAmount, 0);
  },

  /**
   * Find months with highest and lowest payment amounts
   */
  _findPaymentExtremes(monthlyData: MonthlyData[]): {
    highestPaymentMonth: MonthlyData;
    lowestPaymentMonth: MonthlyData;
  } {
    const monthsWithData = monthlyData.filter((d) => d.interestPayment > 0);

    // Use first month as default if no data exists
    const defaultMonth = monthsWithData[0] || monthlyData[0];

    const highestPaymentMonth = monthsWithData.reduce(
      (highest, current) =>
        current.interestPayment > highest.interestPayment ? current : highest,
      defaultMonth,
    );

    const lowestPaymentMonth = monthsWithData.reduce(
      (lowest, current) =>
        current.interestPayment < lowest.interestPayment ? current : lowest,
      defaultMonth,
    );

    return { highestPaymentMonth, lowestPaymentMonth };
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

  /**
   * Get monthly details by type
   */
  async getMonthlyDetails(
    year: number,
    month: number,
    type:
      | 'loans'
      | 'payments'
      | 'interest-payments'
      | 'close-payments'
      | 'overdue',
  ): Promise<any[]> {
    const detailHandlers = {
      loans: () =>
        dashboardRepository.getLoansCreatedInMonthDetails(year, month),

      payments: () => dashboardRepository.getPaymentsInMonth(year, month),

      'interest-payments': async () => {
        const payments = await dashboardRepository.getPaymentsInMonth(
          year,
          month,
        );
        return payments.filter(
          (p) => p.installmentId != null && p.installmentId !== '',
        );
      },

      'close-payments': async () => {
        const payments = await dashboardRepository.getPaymentsInMonth(
          year,
          month,
        );
        return payments.filter(
          (p) => !p.installmentId || p.installmentId === '',
        );
      },

      overdue: () =>
        dashboardRepository.getOverdueInstallmentsInMonthDetails(year, month),
    };

    const handler = detailHandlers[type];
    if (!handler) {
      throw new Error(`Invalid type parameter: ${type}`);
    }

    return handler();
  },
};
