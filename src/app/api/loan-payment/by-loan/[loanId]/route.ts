// src/app/api/loan-payment/by-loan/[loanId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loanId: string }> },
) {
  try {
    const { loanId } = await params;
    const result = await paymentService.getPaymentsByLoanId(loanId);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error) {
    const { loanId } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(
      `[API Error] GET /api/loan-payment/by-loan/${loanId}:`,
      error,
    );
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        errors: error,
      },
      { status: 500 },
    );
  }
}
