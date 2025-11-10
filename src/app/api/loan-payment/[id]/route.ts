// src/app/api/loan-payment/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@src/features/loans/services/server';
import { paymentUpdateSchema } from '@src/features/loans/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await paymentService.getById(id);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] GET /api/loan-payment/${id}:`, error);
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
    const validatedData = paymentUpdateSchema.parse(body);

    // Note: Update functionality should be limited or admin-only
    // This is a placeholder for now
    return NextResponse.json({
      success: true,
      message: 'แก้ไขรายการชำระเงินสำเร็จ',
      data: { id, ...validatedData },
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] PUT /api/loan-payment/${id}:`, error);
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
    const result = await paymentService.delete(id);
    return NextResponse.json({
      success: true,
      message: result.message,
      data: null,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] DELETE /api/loan-payment/${id}:`, error);
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
