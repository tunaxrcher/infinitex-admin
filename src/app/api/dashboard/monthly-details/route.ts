// src/app/api/dashboard/monthly-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@src/features/dashboard/services/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString(),
    );
    const month = parseInt(searchParams.get('month') || '1');
    const type = (searchParams.get('type') || 'loans') as
      | 'loans'
      | 'payments'
      | 'interest-payments'
      | 'close-payments'
      | 'overdue';

    const data = await dashboardService.getMonthlyDetails(year, month, type);

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
