// src/app/api/loan-check/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  calculateExpiryDate,
  calculateMonthlyPayment,
  calculateNextPaymentDate,
  generateInstallmentsData,
  generateLoanNumber,
  updateLandAccountBalance,
} from '@src/features/loans/services/server';
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

    // Find application with customer and title deeds
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: { profile: true },
        },
        agent: true,
        loan: true,
        titleDeeds: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลสินเชื่อ' },
        { status: 404 },
      );
    }

    // Validate application status
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      return NextResponse.json(
        { success: false, message: 'สินเชื่อนี้ไม่สามารถอนุมัติได้' },
        { status: 400 },
      );
    }

    // Calculate values
    const loanAmount = approvedAmount || application.requestedAmount || 0;
    const finalInterestRate = interestRate ?? application.interestRate ?? 1;
    const finalTermMonths = termMonths ?? application.termMonths ?? 48;
    const loanYears = finalTermMonths / 12;
    const monthlyPayment = calculateMonthlyPayment(
      Number(loanAmount),
      Number(finalInterestRate),
    );

    const contractDate = new Date();
    const expiryDate = calculateExpiryDate(contractDate, loanYears);
    const nextPaymentDate = calculateNextPaymentDate(contractDate);
    const loanNumber = generateLoanNumber();

    const adminName = 'ผู้อนุมัติผ่านลิงก์';

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update application status and values
      await tx.loanApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          approvedAmount: loanAmount,
          interestRate: finalInterestRate,
          termMonths: finalTermMonths,
          operationFee: operationFee ?? application.operationFee ?? 0,
          transferFee: transferFee ?? application.transferFee ?? 0,
          otherFee: otherFee ?? application.otherFee ?? 0,
          reviewNotes: note ?? undefined,
        },
      });

      // 2. Check if loan already exists
      let loan = application.loan;

      if (loan) {
        // Update existing loan
        loan = await tx.loan.update({
          where: { id: loan.id },
          data: {
            status: 'ACTIVE',
            principalAmount: loanAmount,
            interestRate: finalInterestRate,
            termMonths: finalTermMonths,
            monthlyPayment,
            totalInstallments: finalTermMonths,
            remainingBalance:
              Number(loanAmount) * (1 + Number(finalInterestRate) / 100),
            nextPaymentDate,
            contractDate,
            expiryDate,
            updatedAt: new Date(),
          },
        });

        // Delete old installments and recreate
        await tx.loanInstallment.deleteMany({ where: { loanId: loan.id } });

        // Create new installments
        const installmentsData = generateInstallmentsData(
          loan.id,
          contractDate,
          finalTermMonths,
          monthlyPayment,
        );
        await tx.loanInstallment.createMany({ data: installmentsData });
      } else {
        // Get title deed number from primary title deed
        const primaryTitleDeed =
          application.titleDeeds?.find((td) => td.isPrimary) ||
          application.titleDeeds?.[0];

        // 3. Create new loan
        loan = await tx.loan.create({
          data: {
            loanNumber,
            loanType: application.loanType,
            status: 'ACTIVE',
            principalAmount: loanAmount,
            interestRate: finalInterestRate,
            termMonths: finalTermMonths,
            monthlyPayment,
            currentInstallment: 0,
            totalInstallments: finalTermMonths,
            remainingBalance:
              Number(loanAmount) * (1 + Number(finalInterestRate) / 100),
            nextPaymentDate,
            contractDate,
            expiryDate,
            titleDeedNumber: primaryTitleDeed?.deedNumber || null,
            customerId: application.customerId,
            applicationId: application.id,
            agentId: application.agentId,
          },
        });

        // 4. Create installments
        const installmentsData = generateInstallmentsData(
          loan.id,
          contractDate,
          finalTermMonths,
          monthlyPayment,
        );
        await tx.loanInstallment.createMany({ data: installmentsData });
      }

      // 5. Deduct from land account and create reports
      const customerName = application.customer?.profile?.fullName || '';
      await updateLandAccountBalance(
        tx,
        landAccountId,
        Number(loanAmount),
        'decrement',
        `เปิดสินเชื่อ(${loan.loanNumber})`,
        '',
        undefined,
        adminName,
      );

      return { loan, loanNumber: loan.loanNumber };
    });

    // 6. Send LINE notification
    try {
      // Get primary title deed for notification
      const primaryTitleDeedForNotification =
        application.titleDeeds?.find((td) => td.isPrimary) ||
        application.titleDeeds?.[0];

      await sendLoanApprovalToLine({
        loanNumber: result.loanNumber,
        amount: `฿${Number(loanAmount).toLocaleString('th-TH')}`,
        ownerName:
          primaryTitleDeedForNotification?.ownerName ||
          application.customer?.profile?.fullName ||
          '',
        propertyLocation: primaryTitleDeedForNotification
          ? `${primaryTitleDeedForNotification.amphurName || ''} ${primaryTitleDeedForNotification.provinceName || ''}`.trim() ||
            undefined
          : undefined,
        propertyArea:
          primaryTitleDeedForNotification?.landAreaText || undefined,
        parcelNo: primaryTitleDeedForNotification?.deedNumber || undefined,
        interestRate: finalInterestRate?.toString(),
        termMonths: finalTermMonths?.toString(),
        status: 'approved',
      });
    } catch (lineError) {
      console.error(
        '[LINE API] Failed to send approval notification:',
        lineError,
      );
      // Don't fail the request if LINE notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'อนุมัติสินเชื่อสำเร็จ',
      data: {
        loanNumber: result.loanNumber,
        approvedAmount: loanAmount,
        monthlyPayment,
        termMonths: finalTermMonths,
        interestRate: finalInterestRate,
      },
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
