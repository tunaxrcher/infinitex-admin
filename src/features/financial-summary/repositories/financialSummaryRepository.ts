// src/features/financial-summary/repositories/financialSummaryRepository.ts
import { prisma } from '@src/shared/lib/db';

export class FinancialSummaryRepository {
  /**
   * Get real investment amount
   */
  async getRealInvestment() {
    const realInvestment = await prisma.realInvestment.findFirst({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return realInvestment ? Number(realInvestment.investment) : 0;
  }

  /**
   * Get total active loan amount
   */
  async getTotalActiveLoanAmount() {
    const activeLoansSum = await prisma.loan.aggregate({
      where: {
        status: 'ACTIVE',
      },
      _sum: {
        principalAmount: true,
      },
    });

    return activeLoansSum._sum.principalAmount
      ? Number(activeLoansSum._sum.principalAmount)
      : 0;
  }

  /**
   * Get total cash in accounts
   */
  async getTotalCashInAccounts() {
    const accountsSum = await prisma.landAccount.aggregate({
      where: {
        deletedAt: null,
      },
      _sum: {
        accountBalance: true,
      },
    });

    return accountsSum._sum.accountBalance
      ? Number(accountsSum._sum.accountBalance)
      : 0;
  }

  /**
   * Get total completed loan amount
   */
  async getTotalCompletedLoanAmount() {
    const completedLoansSum = await prisma.loan.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        principalAmount: true,
      },
    });

    return completedLoansSum._sum.principalAmount
      ? Number(completedLoansSum._sum.principalAmount)
      : 0;
  }

  /**
   * Get all financial data in parallel for better performance
   */
  async getAllFinancialData() {
    const [
      investmentAmount,
      totalActiveLoanAmount,
      cashInAccounts,
      totalCompletedLoanAmount,
    ] = await Promise.all([
      this.getRealInvestment(),
      this.getTotalActiveLoanAmount(),
      this.getTotalCashInAccounts(),
      this.getTotalCompletedLoanAmount(),
    ]);

    return {
      investmentAmount,
      totalActiveLoanAmount,
      cashInAccounts,
      totalCompletedLoanAmount,
    };
  }
}

export const financialSummaryRepository = new FinancialSummaryRepository();
