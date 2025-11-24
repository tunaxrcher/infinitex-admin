import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Title deed analysis started');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ไม่พบไฟล์ที่อัพโหลด' },
        { status: 400 },
      );
    }

    console.log('[API] File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Call service layer
    const result = await loanService.analyzeTitleDeed(file);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Title deed analysis failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการวิเคราะห์โฉนด',
      },
      { status: 500 },
    );
  }
}
