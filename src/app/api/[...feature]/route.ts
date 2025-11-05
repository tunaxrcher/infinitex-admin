// src/app/api/loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '../../../features/products/services/server';
import { productsFiltersSchema } from '../../../features/products/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = productsFiltersSchema.parse(filters);

    const result = await loanService.getList(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/loans:', error);
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
    const result = await loanService.create(body);
    return NextResponse.json({
      success: true,
      message: 'สร้างสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/loans:', error);
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
