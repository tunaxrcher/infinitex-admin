// src/app/api/loan-check/[id]/customer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';
import { storage } from '@src/shared/lib/storage';

// ============================================
// CONSTANTS
// ============================================

const PLACEHOLDER_CUSTOMER_ID = 'cmjgzdrsw0000uhygha51qcr0';
const BASE64_IMAGE_REGEX = /^data:([A-Za-z-+\/]+);base64,(.+)$/;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Upload base64 image to storage
 * @returns URL of uploaded image or null if failed/not provided
 */
async function uploadBase64Image(
  base64Image: string | undefined,
  folder: string,
  filenamePrefix: string,
): Promise<string | null> {
  if (!base64Image?.startsWith('data:image')) {
    return null;
  }

  try {
    const matches = base64Image.match(BASE64_IMAGE_REGEX);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const [, contentType, base64Data] = matches;
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await storage.uploadFile(buffer, contentType, {
      folder,
      filename: `${filenamePrefix}-${Date.now()}`,
    });

    return result.url;
  } catch (error) {
    console.error(`[API] Image upload failed (${folder}):`, error);
    return null;
  }
}

/**
 * Update or create customer profile
 */
async function upsertCustomerProfile(
  customerId: string,
  existingProfileId: string | undefined,
  profileData: {
    fullName?: string;
    idCardNumber?: string;
    address?: string;
    email?: string;
    idCardFrontImage?: string | null;
  },
) {
  if (existingProfileId) {
    return prisma.userProfile.update({
      where: { id: existingProfileId },
      data: {
        fullName: profileData.fullName || undefined,
        idCardNumber: profileData.idCardNumber || undefined,
        address: profileData.address || undefined,
        email: profileData.email || undefined,
        idCardFrontImage: profileData.idCardFrontImage ?? undefined,
        updatedAt: new Date(),
      },
    });
  }

  return prisma.userProfile.create({
    data: {
      userId: customerId,
      fullName: profileData.fullName || null,
      idCardNumber: profileData.idCardNumber || null,
      address: profileData.address || null,
      email: profileData.email || null,
      idCardFrontImage: profileData.idCardFrontImage,
    },
  });
}

// ============================================
// API HANDLER
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: loanApplicationId } = await params;

    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      customerId,
      fullName,
      idCardNumber,
      address,
      email,
      phoneNumber,
      idCardImage,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ customerId' },
        { status: 400 },
      );
    }

    // Handle placeholder customer - create new
    if (customerId === PLACEHOLDER_CUSTOMER_ID) {
      const result = await createNewCustomerAndUpdateRelations(
        loanApplicationId,
        {
          phoneNumber: phoneNumber || '',
          fullName,
          idCardNumber,
          address,
          email,
          idCardImage,
        },
      );

      return NextResponse.json({
        success: true,
        message: 'สร้างลูกค้าใหม่และบันทึกข้อมูลสำเร็จ',
        data: { customerId: result.newCustomerId },
      });
    }

    // Handle existing customer - update
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: { profile: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลลูกค้า' },
        { status: 404 },
      );
    }

    // Upload ID card image if provided
    const uploadedImageUrl = await uploadBase64Image(
      idCardImage,
      'id-cards',
      customerId,
    );
    const idCardImageUrl =
      uploadedImageUrl ?? customer.profile?.idCardFrontImage;

    // Update profile
    await upsertCustomerProfile(customer.id, customer.profile?.id, {
      fullName,
      idCardNumber,
      address,
      email,
      idCardFrontImage: idCardImageUrl,
    });

    // Update phone number if changed
    if (phoneNumber && phoneNumber !== customer.phoneNumber) {
      await prisma.user.update({
        where: { id: customerId },
        data: { phoneNumber },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลลูกค้าสำเร็จ',
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] PUT /api/loan-check/${id}/customer:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 },
    );
  }
}

// ============================================
// TRANSACTION HANDLERS
// ============================================

interface CustomerData {
  phoneNumber: string;
  fullName?: string;
  idCardNumber?: string;
  address?: string;
  email?: string;
  idCardImage?: string;
}

/**
 * Create a new customer and update all related records (loan application & loan)
 */
async function createNewCustomerAndUpdateRelations(
  loanApplicationId: string,
  customerData: CustomerData,
) {
  // Generate unique phone if not provided
  const phoneNumber =
    customerData.phoneNumber ||
    `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Upload ID card image before transaction
  const idCardImageUrl = await uploadBase64Image(
    customerData.idCardImage,
    'id-cards',
    'new-customer',
  );

  return prisma.$transaction(async (tx) => {
    // Validate phone number uniqueness
    const existingUser = await tx.user.findUnique({ where: { phoneNumber } });
    if (existingUser) {
      throw new Error(
        'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว กรุณาใช้ปุ่ม "สุ่มเบอร์" เพื่อสร้างเบอร์ใหม่',
      );
    }

    // Create User
    const newCustomer = await tx.user.create({
      data: {
        phoneNumber,
        userType: 'CUSTOMER',
        isActive: true,
      },
    });

    // Create UserProfile
    await tx.userProfile.create({
      data: {
        userId: newCustomer.id,
        fullName: customerData.fullName || null,
        idCardNumber: customerData.idCardNumber || null,
        address: customerData.address || null,
        email: customerData.email || null,
        idCardFrontImage: idCardImageUrl,
      },
    });

    // Update LoanApplication
    await tx.loanApplication.update({
      where: { id: loanApplicationId },
      data: {
        customerId: newCustomer.id,
        ownerName: customerData.fullName || undefined,
        updatedAt: new Date(),
      },
    });

    // Update related Loan if exists
    const loan = await tx.loan.findFirst({
      where: { applicationId: loanApplicationId },
    });

    if (loan) {
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          customerId: newCustomer.id,
          updatedAt: new Date(),
        },
      });
    }

    return { newCustomerId: newCustomer.id };
  });
}
