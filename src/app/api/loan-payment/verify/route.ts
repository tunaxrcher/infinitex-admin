// src/app/api/loan-payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';
import { verifyPaymentSchema } from '@src/features/loans/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = verifyPaymentSchema.parse(body);

    // TODO: Add admin authentication check here
    // Only admins should be able to verify payments

    const result = await paymentService.verifyPayment(validatedData);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: null,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/loan-payment/verify:', error);
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
