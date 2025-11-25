import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@src/shared/lib/ai-services';

/**
 * Analyze ID card image to extract customer information
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API] ID card analysis started');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'ไม่พบไฟล์ที่อัพโหลด',
        },
        { status: 400 },
      );
    }

    console.log('[API] File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Analyze with AI service
    const result = await aiService.analyzeIdCardImage(buffer, file.type);

    console.log('[API] ID card analysis result:', result);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] ID card analysis failed:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการวิเคราะห์บัตรประชาชน',
      },
      { status: 500 },
    );
  }
}

