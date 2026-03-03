import { NextRequest, NextResponse } from 'next/server';
import { taxSubmissionReportService } from '@src/features/documents/services/server';
import { taxSubmissionReportFiltersSchema } from '@src/features/documents/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());
    const validatedFilters = taxSubmissionReportFiltersSchema.parse(filters);

    const result =
      await taxSubmissionReportService.getMonthlyReport(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/tax-submission-report:', error);
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
