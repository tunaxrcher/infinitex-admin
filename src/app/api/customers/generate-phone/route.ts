// src/app/api/customers/generate-phone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { customerService } from '@src/features/customers/services/server';

/**
 * Generate a unique phone number for customers who don't want to provide their number
 */
export async function POST(request: NextRequest) {
  try {
    const phoneNumber = await customerService.generateUniquePhoneNumber();

    return NextResponse.json({
      success: true,
      data: {
        phoneNumber,
      },
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/customers/generate-phone:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างเบอร์โทรศัพท์',
        errors: error,
      },
      { status: 500 },
    );
  }
}
