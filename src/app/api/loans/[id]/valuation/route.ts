// src/app/api/loans/[id]/valuation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await loanService.getValuation(id);

    return NextResponse.json(result);
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] POST /api/loans/${id}/valuation:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการประเมินมูลค่า',
        errors: error,
      },
      { status: 500 },
    );
  }
}
