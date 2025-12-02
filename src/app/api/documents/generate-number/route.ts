// src/app/api/documents/generate-number/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@src/features/documents/services/server';
import { generateDocNumberSchema } from '@src/features/documents/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = generateDocNumberSchema.parse(body);

    const result = await documentService.generateDocNumber(validatedData);

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/documents/generate-number:', error);
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

