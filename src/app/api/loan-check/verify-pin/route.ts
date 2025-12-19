// src/app/api/loan-check/verify-pin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';

// Default PIN - can be configured via SystemConfig
const DEFAULT_PIN = process.env.LOAN_CHECK_PIN || '999999';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        {
          success: false,
          message: 'กรุณากรอก PIN',
        },
        { status: 400 },
      );
    }

    // Try to get PIN from SystemConfig
    let correctPin = DEFAULT_PIN;
    try {
      const configPin = await prisma.systemConfig.findUnique({
        where: { key: 'LOAN_CHECK_PIN' },
      });
      if (configPin?.value) {
        correctPin = configPin.value;
      }
    } catch (error) {
      // Use default PIN if config not found
      console.log('[Loan Check] Using default PIN');
    }

    // Verify PIN
    if (pin !== correctPin) {
      return NextResponse.json(
        {
          success: false,
          message: 'PIN ไม่ถูกต้อง',
        },
        { status: 401 },
      );
    }

    // Generate a simple session token (in production, use JWT)
    const token = Buffer.from(`loan-check-${Date.now()}-${Math.random()}`).toString('base64');

    return NextResponse.json({
      success: true,
      message: 'ยืนยัน PIN สำเร็จ',
      token,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/loan-check/verify-pin:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}

