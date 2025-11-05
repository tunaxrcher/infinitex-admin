// src/app/api/loans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { loanService } from '@src/features/loans/services/server';
import { loanUpdateSchema } from '@src/features/loans/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await loanService.getById(params.id);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error(`[API Error] GET /api/loans/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = loanUpdateSchema.parse(body);
    
    const result = await loanService.update(params.id, validatedData);
    return NextResponse.json({
      success: true,
      message: 'แก้ไขสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error(`[API Error] PUT /api/loans/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await loanService.delete(params.id);
    return NextResponse.json({
      success: true,
      message: 'ลบสินเชื่อสำเร็จ',
    });
  } catch (error: any) {
    console.error(`[API Error] DELETE /api/loans/${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: 500 }
    );
  }
}

