// src/app/api/loan-payment/pay-installment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';
import { payInstallmentSchema } from '@src/features/loans/validations';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = payInstallmentSchema.parse(body);

    // Get admin info from session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const userId = undefined; // Optional - service will use loan.customerId by default
    const adminId = token?.id as string | undefined;
    const adminName = token?.name as string | undefined;

    const result = await paymentService.payInstallment(
      validatedData,
      userId,
      adminId,
      adminName,
    );

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
