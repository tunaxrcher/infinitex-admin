// src/features/financial-summary/services/server.ts
import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export const financialSummaryService = {
  async getSummary() {
    try {
      // 1. เงินลงทุนจริง (Real Investment)
      const realInvestment = await prisma.realInvestment.findFirst({
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const investmentAmount = realInvestment
        ? Number(realInvestment.investment)
        : 0;

      // 2. ยอดวงเงินกู้รวม (Active Loans)
      const activeLoansSum = await prisma.loan.aggregate({
        where: {
          status: 'ACTIVE',
        },
        _sum: {
          principalAmount: true,
        },
      });

      const totalActiveLoanAmount = activeLoansSum._sum.principalAmount
        ? Number(activeLoansSum._sum.principalAmount)
        : 0;

      // 3. เงินสดในบัญชี (Cash in Accounts)
      const accountsSum = await prisma.landAccount.aggregate({
        where: {
          deletedAt: null,
        },
        _sum: {
          accountBalance: true,
        },
      });

      const cashInAccounts = accountsSum._sum.accountBalance
        ? Number(accountsSum._sum.accountBalance)
        : 0;

      // 4. วงเงินที่ปิดบัญชีแล้ว (Completed Loans)
      const completedLoansSum = await prisma.loan.aggregate({
        where: {
          status: 'COMPLETED',
        },
        _sum: {
          principalAmount: true,
        },
      });

      const totalCompletedLoanAmount = completedLoansSum._sum.principalAmount
        ? Number(completedLoansSum._sum.principalAmount)
        : 0;

      // 5. ทรัพย์สินสุทธิ (Net Assets)
      // สูตร: เงินลงทุน + เงินสดในบัญชี + วงเงินที่ปิดแล้ว - ยอดวงเงินกู้ที่ค้างอยู่
      const netAssets =
        investmentAmount +
        cashInAccounts +
        totalCompletedLoanAmount -
        totalActiveLoanAmount;

      return {
        investmentAmount,
        totalActiveLoanAmount,
        cashInAccounts,
        totalCompletedLoanAmount,
        netAssets,
      };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      throw new Error('ไม่สามารถดึงข้อมูลสรุปทางการเงินได้');
    }
  },
};
