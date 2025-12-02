// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@src/features/documents/services/server';
import {
  documentCreateSchema,
  documentFiltersSchema,
} from '@src/features/documents/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = documentFiltersSchema.parse(filters);

    const result = await documentService.getList(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/documents:', error);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = documentCreateSchema.parse(body);
    const { adminId, adminName } = await getAdminFromToken(request);

    const result = await documentService.create(
      validatedData,
      adminId,
      adminName,
    );

    return NextResponse.json({
      success: true,
      message: 'บันทึกใบสำคัญสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/documents:', error);
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

