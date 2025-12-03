// src/app/api/income-expense-report/details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { incomeExpenseReportService } from '@src/features/documents/services/server';
import { z } from 'zod';

const detailsFiltersSchema = z.object({
  year: z.string().transform((val) => parseInt(val, 10)),
  month: z.string().transform((val) => parseInt(val, 10)),
  type: z.enum(['income-operation', 'income-installment', 'expense']),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = detailsFiltersSchema.parse(filters);

    const result = await incomeExpenseReportService.getMonthlyDetails(
      validatedFilters.year,
      validatedFilters.month,
      validatedFilters.type,
    );

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/income-expense-report/details:', error);
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
