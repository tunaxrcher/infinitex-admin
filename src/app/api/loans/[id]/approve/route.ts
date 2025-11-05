// src/app/api/loans/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await loanService.approve(id);
    return NextResponse.json({
      success: true,
      message: 'อนุมัติสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] POST /api/loans/${id}/approve:`, error);
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        errors: error,
      },
      { status: 500 }
    );
  }
}

