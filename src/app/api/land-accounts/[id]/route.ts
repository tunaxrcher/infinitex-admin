// src/app/api/land-accounts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { landAccountService } from '@src/features/land-accounts/services/server';
import { landAccountUpdateSchema } from '@src/features/land-accounts/validations';
import { getToken } from 'next-auth/jwt';

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

    // Validate request body
    const validatedData = landAccountUpdateSchema.parse(body);

    // Get admin info from session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const adminId = token?.id as string | undefined;
    const adminName = token?.name as string | undefined;

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
    // Get admin info from session
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const adminId = token?.id as string | undefined;
    const adminName = token?.name as string | undefined;

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
