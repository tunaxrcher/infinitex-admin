// src/app/api/loan-payment/pay-installment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';
import { payInstallmentSchema } from '@src/features/loans/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = payInstallmentSchema.parse(body);
    const { adminId, adminName } = await getAdminFromToken(request);

    const userId = undefined; // Optional - service will use loan.customerId by default
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
