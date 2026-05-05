import { NextResponse } from 'next/server';
import { documentService } from '@src/features/documents/services/server';

export async function GET() {
  try {
    const suggestions = await documentService.getWithholdingTaxSuggestions();
    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    console.error(
      '[API Error] GET /api/documents/withholding-tax-suggestions:',
      error,
    );
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}
