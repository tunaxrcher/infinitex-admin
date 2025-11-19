// src/app/api/real-investment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { realInvestmentService } from '@src/features/real-investment/services/server';
import { investmentUpdateSchema } from '@src/features/real-investment/validations';

export async function GET(request: NextRequest) {
  try {
    const result = await realInvestmentService.getCurrent();
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/real-investment:', error);
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = investmentUpdateSchema.parse(body);

    const result = await realInvestmentService.update(validatedData);
    return NextResponse.json({
      success: true,
      message: 'อัปเดตทุนสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] PUT /api/real-investment:', error);
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
