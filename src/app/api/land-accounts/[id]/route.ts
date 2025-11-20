// src/app/api/land-accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { landAccountService } from '@src/features/land-accounts/services/server';
import { landAccountUpdateSchema } from '@src/features/land-accounts/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await landAccountService.getById(id);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] GET /api/land-accounts/${id}:`, error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = landAccountUpdateSchema.parse(body);
    const { adminId, adminName } = await getAdminFromToken(request);

    const result = await landAccountService.update(
      id,
      validatedData,
      adminId,
      adminName,
    );

    return NextResponse.json({
      success: true,
      message: 'แก้ไขบัญชีสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] PUT /api/land-accounts/${id}:`, error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { adminId, adminName } = await getAdminFromToken(request);
    await landAccountService.delete(id, adminId, adminName);

    return NextResponse.json({
      success: true,
      message: 'ลบบัญชีสำเร็จ',
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] DELETE /api/land-accounts/${id}:`, error);
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
