// src/app/api/dashboard/monthly-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dashboardRepository } from '@src/features/dashboard/repositories/dashboardRepository';
import { prisma } from '@src/shared/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString(),
    );
    const month = parseInt(searchParams.get('month') || '1');
    const type = searchParams.get('type') || 'loans';

    let data: any[] = [];

    switch (type) {
      case 'loans': {
        // ดึงสินเชื่อที่สร้างในเดือนนั้น
        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

        data = await prisma.loan.findMany({
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
        break;
      }

      case 'payments': {
        // ดึง payments ทั้งหมด
        data = await dashboardRepository.getPaymentsInMonth(year, month);
        break;
      }

      case 'interest-payments':
      case 'close-payments': {
        // ดึง payments แล้วกรองตาม type
        const payments = await dashboardRepository.getPaymentsInMonth(
          year,
          month,
        );
        data =
          type === 'interest-payments'
            ? payments.filter(
                (p) => p.installmentId != null && p.installmentId !== '',
              )
            : payments.filter(
                (p) => !p.installmentId || p.installmentId === '',
              );
        break;
      }

      case 'overdue': {
        // ดึงงวดค้างชำระของเดือนนั้น (เฉพาะสินเชื่อที่ยัง ACTIVE)
        data = await prisma.$queryRaw`
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
        data = (data as any[]).map((item: any) => ({
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
        break;
      }

      default:
        throw new Error('Invalid type parameter');
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/dashboard/monthly-details:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}
