// src/app/api/document-title-lists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { documentTitleListService } from '@src/features/documents/services/server';
import { documentTitleListFiltersSchema } from '@src/features/documents/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = documentTitleListFiltersSchema.parse(filters);

    const result = await documentTitleListService.getList(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/document-title-lists:', error);
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
