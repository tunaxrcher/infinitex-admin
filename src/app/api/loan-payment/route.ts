// src/app/api/loan-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';
import {
  paymentCreateSchema,
  paymentFiltersSchema,
} from '@src/features/loans/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = paymentFiltersSchema.parse(filters);

    const result = await paymentService.getList(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/loan-payment:', error);
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

    // Validate request body
    const validatedData = paymentCreateSchema.parse(body);

    const result = await paymentService.create(validatedData);
    return NextResponse.json({
      success: true,
      message: 'สร้างรายการชำระเงินสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/loan-payment:', error);
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
