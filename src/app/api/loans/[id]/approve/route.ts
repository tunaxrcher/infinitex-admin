// src/app/api/loans/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { getAdminFromToken } from '@src/shared/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { landAccountId } = body;

    if (!landAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: 'กรุณาเลือกบัญชีสำหรับจ่ายสินเชื่อ',
        },
        { status: 400 },
      );
    }

    const { adminId, adminName } = await getAdminFromToken(request);
    const result = await loanService.approve(
      id,
      landAccountId,
      adminId,
      adminName,
    );

    return NextResponse.json({
      success: true,
      message: 'อนุมัติสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] POST /api/loans/${id}/approve:`, error);
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
