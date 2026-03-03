import { NextRequest, NextResponse } from 'next/server';
import { taxSubmissionReportService } from '@src/features/documents/services/server';
import { z } from 'zod';

const detailsFiltersSchema = z.object({
  year: z.string().transform((val) => parseInt(val, 10)),
  month: z.string().transform((val) => parseInt(val, 10)),
  type: z.enum([
    'loan-open',
    'loan-total',
    'close-payment',
    'fee-payment',
    'expense',
    'income-expense-total',
  ]),
  taxRate: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 1.25)),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());
    const validatedFilters = detailsFiltersSchema.parse(filters);

    const result = await taxSubmissionReportService.getMonthlyDetails(
      validatedFilters.year,
      validatedFilters.month,
      validatedFilters.type,
      validatedFilters.taxRate,
    );

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/tax-submission-report/details:', error);
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
