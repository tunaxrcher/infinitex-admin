// src/app/api/land-accounts/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { landAccountService } from '@src/features/land-accounts/services/server';
import { accountTransferSchema } from '@src/features/land-accounts/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = accountTransferSchema.parse(body);
    const { adminId, adminName } = await getAdminFromToken(request);

    const result = await landAccountService.transfer(
      validatedData,
      adminId,
      adminName,
    );

    return NextResponse.json({
      success: true,
      message: 'โอนเงินสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/land-accounts/transfer:', error);
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
