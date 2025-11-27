import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { valuationResult, estimatedValue } = body;

    if (!valuationResult || !estimatedValue) {
      return NextResponse.json(
        { error: 'กรุณาระบุผลการประเมินและมูลค่าประเมิน' },
        { status: 400 },
      );
    }

    // Update loan with valuation data
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        valuationResult,
        valuationDate: new Date(),
        estimatedValue: parseFloat(estimatedValue),
      },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        application: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLoan,
    });
  } catch (error) {
    console.error('Error saving valuation:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกผลประเมิน' },
      { status: 500 },
    );
  }
}
