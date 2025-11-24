import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Manual title deed lookup started');

    const body = await request.json();
    const { pvCode, amCode, parcelNo } = body;

    if (!pvCode || !amCode || !parcelNo) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูลให้ครบถ้วน' },
        { status: 400 },
      );
    }

    console.log('[API] Lookup params:', { pvCode, amCode, parcelNo });

    // Call service layer
    const result = await loanService.manualTitleDeedLookup({
      pvCode,
      amCode,
      parcelNo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Manual lookup failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการค้นหาข้อมูล',
      },
      { status: 500 },
    );
  }
}
