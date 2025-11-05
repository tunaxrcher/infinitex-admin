// src/app/api/customers/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';

    // ค้นหาลูกค้าจาก phoneNumber, firstName, lastName
    const customers = await prisma.user.findMany({
      where: {
        userType: 'CUSTOMER',
        OR: [
          { phoneNumber: { contains: query } },
          { profile: { firstName: { contains: query } } },
          { profile: { lastName: { contains: query } } },
        ],
      },
      include: {
        profile: true,
      },
      take: 10, // จำกัดผลลัพธ์ 10 รายการ
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: customers,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error('[API Error] GET /api/customers/search:', error);
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        errors: error,
      },
      { status: 500 },
    );
  }
}
