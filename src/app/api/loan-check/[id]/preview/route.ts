// src/app/api/loan-check/[id]/preview/route.ts
// Public preview endpoint - returns basic loan data without authentication
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
        titleDeeds: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
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
              titleDeeds: {
                orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
              },
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

    // Get primary title deed for backward compatibility
    const primaryTitleDeed =
      application.titleDeeds?.find((td) => td.isPrimary) ||
      application.titleDeeds?.[0];

    // Return preview data (same structure but public)
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
        // Title deed data from titleDeeds relation
        deedMode: application.deedMode,
        totalPropertyValue: application.totalPropertyValue
          ? Number(application.totalPropertyValue)
          : null,
        titleDeeds:
          application.titleDeeds?.map((td) => ({
            id: td.id,
            imageUrl: td.imageUrl,
            deedNumber: td.deedNumber,
            provinceName: td.provinceName,
            amphurName: td.amphurName,
            parcelNo: td.parcelNo,
            landAreaText: td.landAreaText,
            ownerName: td.ownerName,
            landType: td.landType,
            latitude: td.latitude,
            longitude: td.longitude,
            linkMap: td.linkMap,
            isPrimary: td.isPrimary,
            sortOrder: td.sortOrder,
          })) || [],
        // Backward compatibility fields from primary title deed
        propertyType: primaryTitleDeed?.landType || null,
        propertyValue: application.totalPropertyValue
          ? Number(application.totalPropertyValue)
          : null,
        propertyArea: primaryTitleDeed?.landAreaText || null,
        propertyLocation: primaryTitleDeed
          ? `${primaryTitleDeed.amphurName || ''} ${primaryTitleDeed.provinceName || ''}`.trim() ||
            null
          : null,
        landNumber: primaryTitleDeed?.deedNumber || null,
        ownerName: primaryTitleDeed?.ownerName || null,
        titleDeedImage: primaryTitleDeed?.imageUrl || null,
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
              idCardImage: application.customer.profile?.idCardFrontImage,
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
    console.error(`[API Error] GET /api/loan-check/${id}/preview:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 },
    );
  }
}
