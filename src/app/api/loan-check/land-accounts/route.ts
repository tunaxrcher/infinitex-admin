// src/app/api/loan-check/land-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Get all active land accounts
    const accounts = await prisma.landAccount.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        accountName: 'asc',
      },
      select: {
        id: true,
        accountName: true,
        accountBalance: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: accounts.map((account) => ({
        id: account.id,
        accountName: account.accountName,
        accountBalance: Number(account.accountBalance),
      })),
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/loan-check/land-accounts:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}

