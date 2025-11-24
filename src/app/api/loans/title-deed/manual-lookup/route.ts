import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { manualLookupSchema } from '@src/features/loans/validations';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Manual title deed lookup started');

    const body = await request.json();

    // Validate request body
    const validatedData = manualLookupSchema.parse(body);

    console.log('[API] Manual lookup params:', validatedData);

    // Call service layer
    const result = await loanService.manualTitleDeedLookup(validatedData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Manual title deed lookup failed:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'ข้อมูลไม่ถูกต้อง',
          details: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดในการค้นหาข้อมูลโฉนด',
      },
      { status: 500 },
    );
  }
}
