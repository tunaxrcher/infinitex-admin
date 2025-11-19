// src/app/api/financial-summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { financialSummaryService } from '@src/features/financial-summary/services/server';

export async function GET(request: NextRequest) {
  try {
    const result = await financialSummaryService.getSummary();
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/financial-summary:', error);
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
