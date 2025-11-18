// src/app/api/land-accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { landAccountService } from '@src/features/land-accounts/services/server';
import { landAccountUpdateSchema } from '@src/features/land-accounts/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const result = await landAccountService.getById(params.id);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/land-accounts/[id]:', error);
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
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = landAccountUpdateSchema.parse(body);

    // TODO: Get admin info from session
    const adminId = undefined;
    const adminName = undefined;

    const result = await landAccountService.update(params.id, validatedData, adminId, adminName);
    return NextResponse.json({
      success: true,
      message: 'แก้ไขบัญชีสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] PUT /api/land-accounts/[id]:', error);
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
  { params }: { params: { id: string } },
) {
  try {
    // TODO: Get admin info from session
    const adminId = undefined;
    const adminName = undefined;

    await landAccountService.delete(params.id, adminId, adminName);
    return NextResponse.json({
      success: true,
      message: 'ลบบัญชีสำเร็จ',
    });
  } catch (error: any) {
    console.error('[API Error] DELETE /api/land-accounts/[id]:', error);
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

