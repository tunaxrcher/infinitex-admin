// src/features/dashboard/repositories/dashboardRepository.ts
import { prisma } from '@src/shared/lib/db'
import { Prisma } from '@prisma/client'

export class DashboardRepository {
  /**
   * Get loans created in a specific month and year
   */
  async getLoansCreatedInMonth(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return prisma.loan.aggregate({
      where: {
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
        contractDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        principalAmount: true,
      },
      _count: true,
    })

    
  }

  /**
   * Get payments completed in a specific month and year
   */
  async getPaymentsInMonth(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    console.log('startDate', startDate)
    console.log('endDate', endDate)

    return prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidDate: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        installment: true,
        loan: {
          select: {
            loanNumber: true,
            // status: true,
          },
        },
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        paidDate: 'desc',
      },
    })
  }

  /**
   * Get overdue installments in a specific month
   */
  async getOverdueInstallmentsInMonth(year: number, month: number) {
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return prisma.loanInstallment.aggregate({
      where: {
        isPaid: false,
        dueDate: {
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    })
  }

  /**
   * Get total interest earned in a specific month
   */
  async getInterestEarnedInMonth(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paidDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        interestAmount: true,
        feeAmount: true,
      },
    })
  }

  /**
   * Get loans that were closed (paid off) in a specific month
   */
  async getClosedLoansInMonth(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return prisma.loan.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        payments: {
          where: {
            paidDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            paidDate: 'desc',
          },
        },
      },
    })
  }
}

export const dashboardRepository = new DashboardRepository()

