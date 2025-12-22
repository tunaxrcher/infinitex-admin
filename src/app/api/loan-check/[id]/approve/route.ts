// src/app/api/loan-check/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';
import { sendLoanApprovalToLine } from '@src/shared/lib/line-api';

// Helper functions (same as loan service)
function generateLoanNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `LOA${timestamp}${random}`;
}

function calculateMonthlyPayment(
  loanAmount: number,
  interestRate: number,
): number {
  // ดอกเบี้ยต่อเดือน = ยอดเงินกู้ × (อัตราดอกเบี้ยต่อปี / 100) / 12
  return (loanAmount * (interestRate / 100)) / 12;
}

function calculateNextPaymentDate(contractDate: Date): Date {
  const nextDate = new Date(contractDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

function calculateExpiryDate(contractDate: Date, loanYears: number): Date {
  const expiryDate = new Date(contractDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + loanYears);
  return expiryDate;
}

function generateInstallmentsData(
  loanId: string,
  contractDate: Date,
  termMonths: number,
  monthlyPayment: number,
): Array<{
  loanId: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  isPaid: boolean;
  isLate: boolean;
}> {
  const installments = [];

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(contractDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      loanId,
      installmentNumber: i,
      dueDate,
      principalAmount: 0, // Flat rate - principal paid at end
      interestAmount: monthlyPayment,
      totalAmount: monthlyPayment,
      isPaid: false,
      isLate: false,
    });
  }

  return installments;
}

async function updateLandAccountBalance(
  tx: any,
  landAccountId: string,
  amount: number,
  operation: 'increment' | 'decrement',
  detail: string,
  note: string,
  adminId?: string,
  adminName?: string,
) {
  // Validate account exists and has sufficient balance if decrementing
  const account = await tx.landAccount.findUnique({
    where: { id: landAccountId, deletedAt: null },
  });

  if (!account) {
    throw new Error('ไม่พบบัญชีที่เลือก');
  }

  if (operation === 'decrement' && Number(account.accountBalance) < amount) {
    throw new Error('ยอดเงินในบัญชีไม่เพียงพอ');
  }

  // Update account balance
  const updatedAccount = await tx.landAccount.update({
    where: { id: landAccountId },
    data: {
      accountBalance: { [operation]: amount },
      updatedAt: new Date(),
    },
  });

  // Create report
  await tx.landAccountReport.create({
    data: {
      landAccountId,
      detail,
      amount,
      note,
      accountBalance: updatedAccount.accountBalance,
      ...(adminId && { adminId }),
      adminName: adminName || undefined,
    },
  });

  return updatedAccount;
}

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

    // Find application with customer
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: { profile: true },
        },
        agent: true,
        loan: true,
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
            titleDeedNumber: application.landNumber,
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
      await sendLoanApprovalToLine({
        loanNumber: result.loanNumber,
        amount: `฿${Number(loanAmount).toLocaleString('th-TH')}`,
        ownerName:
          application.ownerName ||
          application.customer?.profile?.fullName ||
          '',
        propertyLocation: application.propertyLocation || undefined,
        propertyArea: application.propertyArea || undefined,
        parcelNo: application.landNumber || undefined,
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
