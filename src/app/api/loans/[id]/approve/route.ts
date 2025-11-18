// src/app/api/loans/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { getToken } from 'next-auth/jwt';

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

    // Get admin info from session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const adminId = token?.id as string | undefined;
    const adminName = token?.name as string | undefined;

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
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] POST /api/loans/${id}/approve:`, error);
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
