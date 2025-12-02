// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@src/features/documents/services/server';
import { documentUpdateSchema } from '@src/features/documents/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await documentService.getById(id);

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/documents/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: error.message === 'ไม่พบข้อมูลใบสำคัญ' ? 404 : 500 },
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
    const validatedData = documentUpdateSchema.parse(body);
    const { adminId, adminName } = await getAdminFromToken(request);

    const result = await documentService.update(
      id,
      validatedData,
      adminId,
      adminName,
    );

    return NextResponse.json({
      success: true,
      message: 'แก้ไขใบสำคัญสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] PUT /api/documents/[id]:', error);
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

    await documentService.delete(id, adminId, adminName);

    return NextResponse.json({
      success: true,
      message: 'ลบใบสำคัญสำเร็จ',
    });
  } catch (error: any) {
    console.error('[API Error] DELETE /api/documents/[id]:', error);
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

