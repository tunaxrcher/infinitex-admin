// src/features/dashboard/services/server.ts
import 'server-only'

import { dashboardRepository } from '../repositories/dashboardRepository'
import { type DashboardFiltersSchema, type DashboardSummary, type MonthlyData } from '../validations'

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
]

export const dashboardService = {
  async getDashboardSummary(filters: DashboardFiltersSchema): Promise<DashboardSummary> {
    const year = parseInt(filters.year || new Date().getFullYear().toString())
    const currentMonth = new Date().getMonth() + 1 // 1-12

    // สร้างข้อมูลรายเดือน 12 เดือน
    const monthlyDataPromises: Promise<MonthlyData>[] = []

    for (let month = 1; month <= 12; month++) {
      monthlyDataPromises.push(this.getMonthlyData(year, month))
    }

    const monthlyData = await Promise.all(monthlyDataPromises)

    // คำนวณข้อมูลสรุป
    const currentMonthData = monthlyData[currentMonth - 1]
    
    // ยอดเปิดสินเชื่อเดือนปัจจุบัน
    const currentMonthLoanAmount = currentMonthData.loanAmount

    // กำไรเดือนปัจจุบัน (ดอกเบี้ย + ค่าธรรมเนียม)
    const currentMonthProfit = currentMonthData.profit

    // กำไรทั้งปี (รวมกำไรทุกเดือน)
    const yearProfit = monthlyData.reduce((sum, data) => sum + data.profit, 0)

    // หายอดรับชำระสูงสุด/ต่ำสุด
    let highestPaymentMonth = monthlyData[0]
    let lowestPaymentMonth = monthlyData[0]

    monthlyData.forEach((data) => {
      if (data.totalPayment > highestPaymentMonth.totalPayment) {
        highestPaymentMonth = data
      }
      if (data.totalPayment < lowestPaymentMonth.totalPayment) {
        lowestPaymentMonth = data
      }
    })

    // เฉลี่ยต่อเดือน
    const totalPaymentYear = monthlyData.reduce((sum, data) => sum + data.totalPayment, 0)
    const averagePaymentPerMonth = totalPaymentYear / 12

    // คำนวณเปอร์เซ็นต์ยอดรับชำระ (เทียบกับเป้าหมายหรือยอดเปิดสินเชื่อทั้งปี)
    const totalLoanAmountYear = monthlyData.reduce((sum, data) => sum + data.loanAmount, 0)
    const paymentPercentage = totalLoanAmountYear > 0 ? (totalPaymentYear / totalLoanAmountYear) * 100 : 0

    return {
      currentMonthLoanAmount,
      currentMonthProfit,
      yearProfit,
      monthlyData,
      highestPaymentMonth: {
        month: highestPaymentMonth.month,
        monthName: highestPaymentMonth.monthName,
        amount: highestPaymentMonth.totalPayment,
      },
      lowestPaymentMonth: {
        month: lowestPaymentMonth.month,
        monthName: lowestPaymentMonth.monthName,
        amount: lowestPaymentMonth.totalPayment,
      },
      averagePaymentPerMonth,
      totalPaymentYear,
      paymentPercentage,
    }
  },

  async getMonthlyData(year: number, month: number): Promise<MonthlyData> {
    // 1. ยอดเปิดสินเชื่อ (สินเชื่อที่สร้างในเดือนนั้น)
    const loansCreated = await dashboardRepository.getLoansCreatedInMonth(year, month)
    const loanAmount = Number(loansCreated._sum.principalAmount || 0)
    // console.log('loanAmount', loanAmount)

    // 2. รับชำระ (ยอดชำระทั้งหมดในเดือนนั้น)
    const payments = await dashboardRepository.getPaymentsInMonth(year, month)
    const totalPayment = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)

    // 3. ชำระค่างวด (มี installmentId ที่ไม่เป็น null/empty = จ่ายดอกเบี้ย)
    const paymentsWithInstallment = payments.filter(
      (p) => p.installmentId != null && p.installmentId !== '',
    )
    
    // Debug: Log for month 1 year 2025
    // if (month === 1 && year === 2025) {
    //   console.log('=== DEBUG Month 1, 2025 ===')
    //   console.log('Total payments count:', payments.length)
    //   console.log('Total payments amount:', totalPayment.toLocaleString())
    //   console.log('Payments with installmentId count:', paymentsWithInstallment.length)
    //   console.log(
    //     'Payments with installmentId amount:',
    //     paymentsWithInstallment.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString(),
    //   )
    //   console.log('All payments:', payments.map(p => ({
    //     amount: Number(p.amount),
    //     installmentId: p.installmentId,
    //     paidDate: p.paidDate,
    //   })))
    // }
    
    const interestPayment = paymentsWithInstallment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    )

    // 4. ชำระปิดบัญชี (ไม่มี installmentId หรือเป็น null/empty = จ่ายเงินต้น)
    const closeAccountPayment = payments
      .filter((p) => !p.installmentId || p.installmentId === '') // ไม่มี installmentId หรือเป็น null/empty
      .reduce((sum, payment) => sum + Number(payment.amount), 0)

    // 5. ค้างชำระ (งวดที่เลยกำหนดชำระแล้วแต่ยังไม่ได้ชำระ)
    const overdueInstallments = await dashboardRepository.getOverdueInstallmentsInMonth(year, month)
    const overduePayment = Number(overdueInstallments._sum.totalAmount || 0)

    // 6. กำไร (ดอกเบี้ย + ค่าธรรมเนียม/ค่าปรับ)
    const profit = payments.reduce(
      (sum, payment) => sum + Number(payment.interestAmount || 0) + Number(payment.feeAmount || 0),
      0,
    )

    return {
      month,
      monthName: MONTH_NAMES[month - 1],
      loanAmount,
      totalPayment,
      interestPayment,
      closeAccountPayment,
      overduePayment,
      profit,
    }
  },
}

