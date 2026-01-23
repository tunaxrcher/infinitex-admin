// src/app/api/loan-check/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { prisma } from '@src/shared/lib/db';
import { sendLoanRejectionToLine } from '@src/shared/lib/line-api';
import { z } from 'zod';

const rejectSchema = z.object({
  reviewNotes: z.string().min(1, 'กรุณาระบุเหตุผลการปฏิเสธ'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { reviewNotes } = rejectSchema.parse(body);

    // Get application data before rejection for LINE notification
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: { profile: true },
        },
        titleDeeds: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    // Reject the loan
    const result = await loanService.reject(id, reviewNotes);

    // Send LINE notification
    if (application) {
      try {
        // Get primary title deed for notification
        const primaryTitleDeed =
          application.titleDeeds?.find((td) => td.isPrimary) ||
          application.titleDeeds?.[0];

        await sendLoanRejectionToLine({
          amount: `฿${Number(application.requestedAmount).toLocaleString('th-TH')}`,
          ownerName:
            primaryTitleDeed?.ownerName ||
            application.customer?.profile?.fullName ||
            '',
          propertyLocation: primaryTitleDeed
            ? `${primaryTitleDeed.amphurName || ''} ${primaryTitleDeed.provinceName || ''}`.trim() ||
              undefined
            : undefined,
          parcelNo: primaryTitleDeed?.deedNumber || undefined,
          reason: reviewNotes,
          status: 'rejected',
        });
      } catch (lineError) {
        console.error(
          '[LINE API] Failed to send rejection notification:',
          lineError,
        );
        // Don't fail the request if LINE notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ปฏิเสธสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] POST /api/loan-check/${id}/reject:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}
