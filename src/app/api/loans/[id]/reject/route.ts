// src/app/api/loans/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { z } from 'zod';

const rejectSchema = z.object({
  reviewNotes: z.string().min(1, 'กรุณาระบุเหตุผลการยกเลิก'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reviewNotes } = rejectSchema.parse(body);
    
    const result = await loanService.reject(id, reviewNotes);
    return NextResponse.json({
      success: true,
      message: 'ยกเลิกสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] POST /api/loans/${id}/reject:`, error);
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

