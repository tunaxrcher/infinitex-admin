// src/app/api/land-accounts/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { landAccountService } from '@src/features/land-accounts/services/server';
import { accountWithdrawSchema } from '@src/features/land-accounts/validations';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = accountWithdrawSchema.parse(body);

    // Get admin info from session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const adminId = token?.id as string | undefined;
    const adminName = token?.name as string | undefined;

    const result = await landAccountService.withdraw(
      validatedData,
      adminId,
      adminName,
    );
    return NextResponse.json({
      success: true,
      message: 'ลดเงินสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/land-accounts/withdraw:', error);
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
