// src/features/financial-summary/services/server.ts
import 'server-only';
import { financialSummaryRepository } from '../repositories/financialSummaryRepository';

export const financialSummaryService = {
  async getSummary() {
    try {
      // Get all financial data in parallel
      const {
        investmentAmount,
        totalActiveLoanAmount,
        cashInAccounts,
        totalCompletedLoanAmount,
      } = await financialSummaryRepository.getAllFinancialData();

      // Calculate net assets
      // Formula: Total Active Loan Amount + Cash in Accounts
      const netAssets = totalActiveLoanAmount + cashInAccounts;

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
