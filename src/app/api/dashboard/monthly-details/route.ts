// src/app/api/dashboard/monthly-details/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dashboardRepository } from '@src/features/dashboard/repositories/dashboardRepository'
import { prisma } from '@src/shared/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || '1')
    const type = searchParams.get('type') || 'loans'

    let data: any[] = []

    if (type === 'loans') {
      // ดึงสินเชื่อที่สร้างในเดือนนั้น
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)

      data = await prisma.loan.findMany({
        where: {
          status: {
            in: ['ACTIVE', 'COMPLETED'],
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          customer: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else if (type === 'payments') {
      // ดึง payments ทั้งหมด
      data = await dashboardRepository.getPaymentsInMonth(year, month)
    } else if (type === 'interest-payments') {
      // ดึง payments ที่มี installmentId
      const payments = await dashboardRepository.getPaymentsInMonth(year, month)
      // console.log('payments', payments)
      data = payments.filter((p) => p.installmentId != null && p.installmentId !== '')
    } else if (type === 'close-payments') {
      // ดึง payments ที่ไม่มี installmentId
      const payments = await dashboardRepository.getPaymentsInMonth(year, month)
      data = payments.filter((p) => !p.installmentId || p.installmentId === '')
    } else if (type === 'overdue') {
      // ดึงงวดค้างชำระ
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)

      data = await prisma.loanInstallment.findMany({
        where: {
          isPaid: false,
          dueDate: {
            lte: endDate,
          },
        },
        include: {
          loan: {
            select: {
              loanNumber: true,
              customer: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('[API Error] GET /api/dashboard/monthly-details:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    )
  }
}

