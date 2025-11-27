import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@src/shared/lib/ai-services';
import { prisma } from '@src/shared/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log('[API] Starting valuation for loan:', id);

    // Fetch loan data with application
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!loan || !loan.application) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสินเชื่อหรือใบสมัคร' },
        { status: 404 },
      );
    }

    // Get images from application
    const titleDeedImage = loan.application.titleDeedImage;
    const supportingImages = loan.application.supportingImages
      ? typeof loan.application.supportingImages === 'string'
        ? JSON.parse(loan.application.supportingImages)
        : loan.application.supportingImages
      : [];

    console.log('[API] Image data:', {
      hasTitleDeedImage: !!titleDeedImage,
      supportingImagesCount: Array.isArray(supportingImages)
        ? supportingImages.length
        : 0,
    });

    if (!titleDeedImage) {
      return NextResponse.json(
        { error: 'ไม่พบรูปโฉนดที่ดิน' },
        { status: 400 },
      );
    }

    if (!Array.isArray(supportingImages) || supportingImages.length === 0) {
      return NextResponse.json(
        { error: 'ต้องมีรูปเพิ่มเติมอย่างน้อย 1 รูป' },
        { status: 400 },
      );
    }

    // Helper function to convert URL to Buffer
    const urlToBuffer = async (url: string): Promise<Buffer> => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    };

    console.log('[API] Converting images to buffers...');

    // Convert title deed image to Buffer
    const titleDeedBuffer = await urlToBuffer(titleDeedImage);

    // Convert supporting images to Buffers
    const supportingBuffers: Buffer[] = [];
    for (let i = 0; i < supportingImages.length; i++) {
      const buffer = await urlToBuffer(supportingImages[i]);
      supportingBuffers.push(buffer);
    }

    console.log('[API] Calling aiService.evaluatePropertyValue...');

    // Get title deed data if available
    const titleDeedData = loan.application.titleDeedData
      ? typeof loan.application.titleDeedData === 'string'
        ? JSON.parse(loan.application.titleDeedData)
        : loan.application.titleDeedData
      : null;

    // Call AI service to evaluate property value
    const result = await aiService.evaluatePropertyValue(
      titleDeedBuffer,
      titleDeedData,
      supportingBuffers,
    );

    console.log('[API] Valuation result:', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[API] Valuation failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการประเมินมูลค่า',
        success: false,
      },
      { status: 500 },
    );
  }
}
