// src/app/api/land-account-reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { landAccountReportService } from '@src/features/land-account-reports/services/server';
import { landAccountReportFiltersSchema } from '@src/features/land-account-reports/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = landAccountReportFiltersSchema.parse(filters);

    const result = await landAccountReportService.getList(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/land-account-reports:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: 500 },
    );
  }
}

