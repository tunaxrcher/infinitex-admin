// src/app/api/income-expense-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { incomeExpenseReportService } from '@src/features/documents/services/server';
import { incomeExpenseReportFiltersSchema } from '@src/features/documents/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = incomeExpenseReportFiltersSchema.parse(filters);

    const result = await incomeExpenseReportService.getMonthlyReport(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/income-expense-report:', error);
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

