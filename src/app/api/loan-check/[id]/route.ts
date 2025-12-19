// src/app/api/loan-check/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Try to find as application first
    let application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: { profile: true },
        },
        agent: {
          include: { profile: true },
        },
        loan: true,
      },
    });

    if (!application) {
      // Try to find by loan ID
      const loan = await prisma.loan.findUnique({
        where: { id },
        include: {
          application: {
            include: {
              customer: {
                include: { profile: true },
              },
              agent: {
                include: { profile: true },
              },
              loan: true,
            },
          },
        },
      });

      if (loan?.application) {
        application = loan.application;
      }
    }

    if (!application) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลสินเชื่อ' },
        { status: 404 },
      );
    }

    // Parse supporting images if it's a string
    let supportingImages: string[] = [];
    if (application.supportingImages) {
      if (typeof application.supportingImages === 'string') {
        try {
          supportingImages = JSON.parse(application.supportingImages);
        } catch {
          supportingImages = [];
        }
      } else if (Array.isArray(application.supportingImages)) {
        supportingImages = application.supportingImages as string[];
      }
    }

    // Parse valuation result if it exists
    let valuationResult = null;
    if (application.valuationResult) {
      if (typeof application.valuationResult === 'string') {
        try {
          valuationResult = JSON.parse(application.valuationResult);
        } catch {
          valuationResult = null;
        }
      } else {
        valuationResult = application.valuationResult;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        loanType: application.loanType,
        requestedAmount: Number(application.requestedAmount),
        approvedAmount: application.approvedAmount
          ? Number(application.approvedAmount)
          : null,
        maxApprovedAmount: application.maxApprovedAmount
          ? Number(application.maxApprovedAmount)
          : null,
        interestRate: application.interestRate
          ? Number(application.interestRate)
          : 1,
        termMonths: application.termMonths || 48,
        operationFee: application.operationFee
          ? Number(application.operationFee)
          : 0,
        transferFee: application.transferFee
          ? Number(application.transferFee)
          : 0,
        otherFee: application.otherFee ? Number(application.otherFee) : 0,
        propertyType: application.propertyType,
        propertyValue: application.propertyValue
          ? Number(application.propertyValue)
          : null,
        propertyArea: application.propertyArea,
        propertyLocation: application.propertyLocation,
        landNumber: application.landNumber,
        ownerName: application.ownerName,
        titleDeedImage: application.titleDeedImage,
        titleDeedData: application.titleDeedData,
        supportingImages,
        idCardFrontImage: application.idCardFrontImage,
        idCardBackImage: application.idCardBackImage,
        submittedAt: application.submittedAt,
        reviewNotes: application.reviewNotes,
        createdAt: application.createdAt,
        // AI Analysis fields
        valuationResult,
        estimatedValue: application.estimatedValue
          ? Number(application.estimatedValue)
          : null,
        valuationDate: application.valuationDate,
        customer: application.customer
          ? {
              id: application.customer.id,
              phoneNumber: application.customer.phoneNumber,
              fullName: application.customer.profile?.fullName,
              idCardNumber: application.customer.profile?.idCardNumber,
              address: application.customer.profile?.address,
              email: application.customer.profile?.email,
              idCardImage: application.customer.profile?.idCardImage,
            }
          : null,
        agent: application.agent
          ? {
              id: application.agent.id,
              phoneNumber: application.agent.phoneNumber,
              fullName: application.agent.profile?.fullName,
            }
          : null,
        hasLoan: !!application.loan,
        loan: application.loan
          ? {
              id: application.loan.id,
              loanNumber: application.loan.loanNumber,
              status: application.loan.status,
            }
          : null,
      },
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] GET /api/loan-check/${id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 },
    );
  }
}
