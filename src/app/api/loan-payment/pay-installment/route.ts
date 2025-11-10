// src/app/api/loan-payment/pay-installment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';
import { payInstallmentSchema } from '@src/features/loans/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = payInstallmentSchema.parse(body);

    // userId is optional - service will use loan.customerId by default
    const result = await paymentService.payInstallment(validatedData);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/loan-payment/pay-installment:', error);
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
