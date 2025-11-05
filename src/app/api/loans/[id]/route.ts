// src/app/api/loans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { loanUpdateSchema } from '@src/features/loans/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await loanService.getById(id);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] GET /api/loans/${id}:`, error);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = loanUpdateSchema.parse(body);

    const result = await loanService.update(id, validatedData);
    return NextResponse.json({
      success: true,
      message: 'แก้ไขสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] PUT /api/loans/${id}:`, error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await loanService.delete(id);
    return NextResponse.json({
      success: true,
      message: 'ลบสินเชื่อสำเร็จ',
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] DELETE /api/loans/${id}:`, error);
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
