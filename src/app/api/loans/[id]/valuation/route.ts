// src/app/api/loans/[id]/valuation/route.ts
// Gets property valuation from AI (works with both application ID and loan ID)
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // Service now handles both application ID and loan ID
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
