// src/features/dashboard/repositories/dashboardRepository.ts
import { prisma } from '@src/shared/lib/db';

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
    });
  }

  /**
   * Get payments completed in a specific month and year
   */
  async getPaymentsInMonth(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

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
            status: true,
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
    });
  }

  /**
   * Get overdue installments in a specific month (ค้างชำระของเดือนนั้น)
   */
  async getOverdueInstallmentsInMonth(year: number, month: number) {
    // ค้างชำระ = งวดที่ครบกำหนดในเดือนนั้นแต่เลยกำหนดไปแล้ว (ณ วันนี้) และยังไม่ชำระ
    const result = await prisma.$queryRaw<
      Array<{ total_amount: number | null; total_count: bigint }>
    >`
      SELECT 
        SUM(li.totalAmount) as total_amount,
        COUNT(*) as total_count
      FROM loan_installments li
      INNER JOIN loans l ON li.loanId = l.id
      WHERE li.isPaid = false
        AND YEAR(li.dueDate) = ${year}
        AND MONTH(li.dueDate) = ${month}
        AND li.dueDate < NOW()
        AND l.status = 'ACTIVE'
    `;

    return {
      _sum: {
        totalAmount: result[0]?.total_amount || 0,
      },
      _count: Number(result[0]?.total_count || 0),
    };
  }

  /**
   * Get loans created in a specific month with full details
   */
  async getLoansCreatedInMonthDetails(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return prisma.loan.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
        contractDate: { gte: startDate, lte: endDate },
      },
      include: {
        customer: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get overdue installments in a specific month with full details
   */
  async getOverdueInstallmentsInMonthDetails(year: number, month: number) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        li.*,
        l.loanNumber,
        l.status as loanStatus,
        up.firstName,
        up.lastName
      FROM loan_installments li
      INNER JOIN loans l ON li.loanId = l.id
      LEFT JOIN users u ON l.customerId = u.id
      LEFT JOIN user_profiles up ON u.id = up.userId
      WHERE li.isPaid = false
        AND YEAR(li.dueDate) = ${year}
        AND MONTH(li.dueDate) = ${month}
        AND li.dueDate < NOW()
        AND l.status = 'ACTIVE'
      ORDER BY li.dueDate ASC
    `;

    // Transform data to match Prisma structure
    return result.map((item: any) => ({
      ...item,
      loan: {
        loanNumber: item.loanNumber,
        status: item.loanStatus,
        customer: {
          profile: {
            firstName: item.firstName,
            lastName: item.lastName,
          },
        },
      },
    }));
  }
}

export const dashboardRepository = new DashboardRepository();
