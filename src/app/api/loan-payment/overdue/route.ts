// src/app/api/loan-payment/overdue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from authentication session
    const userId = 'demo-user-id';

    const result = await paymentService.getOverduePayments(userId);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/loan-payment/overdue:', error);
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

