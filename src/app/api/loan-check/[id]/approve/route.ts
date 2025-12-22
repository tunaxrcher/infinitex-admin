// src/app/api/loan-check/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { prisma } from '@src/shared/lib/db';
import { sendLoanApprovalToLine } from '@src/shared/lib/line-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      landAccountId,
      approvedAmount,
      interestRate,
      termMonths,
      operationFee,
      transferFee,
      otherFee,
      note,
    } = body;

    // Verify token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    if (!landAccountId) {
      return NextResponse.json(
        {
          success: false,
          message: 'กรุณาเลือกบัญชีสำหรับจ่ายสินเชื่อ',
        },
        { status: 400 },
      );
    }

    // Update application with new calculation data before approval
    await prisma.loanApplication.update({
      where: { id },
      data: {
        approvedAmount: approvedAmount ?? undefined,
        interestRate: interestRate ?? undefined,
        termMonths: termMonths ?? undefined,
        operationFee: operationFee ?? undefined,
        transferFee: transferFee ?? undefined,
        otherFee: otherFee ?? undefined,
        reviewNotes: note ?? undefined,
      },
    });

    // Approve the loan using existing service (without admin info for public access)
    const result = await loanService.approve(
      id,
      landAccountId,
      undefined, // No admin ID for public access
      'ผู้อนุมัติผ่านลิงก์', // Generic approver name
    );

    // Get updated application for LINE notification
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: { profile: true },
        },
        loan: true,
      },
    });

    // Send LINE notification
    if (application) {
      try {
        await sendLoanApprovalToLine({
          loanNumber: application.loan?.loanNumber || '',
          amount: `฿${Number(application.approvedAmount || application.requestedAmount).toLocaleString('th-TH')}`,
          ownerName:
            application.ownerName ||
            application.customer?.profile?.fullName ||
            '',
          propertyLocation: application.propertyLocation || undefined,
          propertyArea: application.propertyArea || undefined,
          parcelNo: application.landNumber || undefined,
          interestRate:
            interestRate?.toString() || application.interestRate?.toString(),
          termMonths:
            termMonths?.toString() || application.termMonths?.toString(),
          status: 'approved',
        });
      } catch (lineError) {
        console.error(
          '[LINE API] Failed to send approval notification:',
          lineError,
        );
        // Don't fail the request if LINE notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'อนุมัติสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] POST /api/loan-check/${id}/approve:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}
