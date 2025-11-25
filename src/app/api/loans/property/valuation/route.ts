import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loan/services/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Property valuation started');

    const formData = await request.formData();

    // Get title deed image (required)
    const titleDeedImage = formData.get('titleDeedImage') as File;
    if (!titleDeedImage) {
      return NextResponse.json(
        { error: 'ไม่พบรูปโฉนดที่ดิน' },
        { status: 400 },
      );
    }

    // Get title deed data (optional but recommended)
    const titleDeedDataStr = formData.get('titleDeedData') as string;
    let titleDeedData = null;
    if (titleDeedDataStr) {
      try {
        titleDeedData = JSON.parse(titleDeedDataStr);
      } catch (error) {
        console.warn('[API] Failed to parse title deed data:', error);
      }
    }

    // Get supporting images (optional)
    const supportingImages: File[] = [];
    let imageIndex = 0;
    while (true) {
      const supportingImage = formData.get(
        `supportingImage_${imageIndex}`,
      ) as File;
      if (!supportingImage) break;

      supportingImages.push(supportingImage);
      imageIndex++;
    }

    console.log('[API] Processing valuation with:', {
      hasTitleDeedImage: !!titleDeedImage,
      hasTitleDeedData: !!titleDeedData,
      supportingImagesCount: supportingImages.length,
    });

    // Call service layer
    const result = await loanService.evaluatePropertyValue(
      titleDeedImage,
      titleDeedData,
      supportingImages.length > 0 ? supportingImages : undefined,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Property valuation failed:', error);
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
