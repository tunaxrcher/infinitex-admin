// src/app/api/customers/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@src/features/customers/services/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const customers = await customerService.searchCustomers(query, limit);

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: customers,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/customers/search:', error);
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
