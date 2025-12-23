// src/app/api/loans/[id]/save-valuation/route.ts
// Saves valuation result to loan_application (works with both application ID and loan ID)
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { valuationResult, estimatedValue } = body;

    // Service now handles both application ID and loan ID
    const updatedApplication = await loanService.saveValuation(
      id,
      valuationResult,
      estimatedValue,
    );

    return NextResponse.json({
      success: true,
      data: updatedApplication,
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] POST /api/loans/${id}/save-valuation:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการบันทึกผลประเมิน',
        errors: error,
      },
      { status: 500 },
    );
  }
}
