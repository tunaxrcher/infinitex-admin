// src/app/api/loan-check/[id]/customer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';
import { storage } from '@src/shared/lib/storage';

// ID ของลูกค้าที่ต้องสร้างใหม่ (dummy/placeholder customer)
const PLACEHOLDER_CUSTOMER_ID = 'cmjgzdrsw0000uhygha51qcr0';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: loanApplicationId } = await params;

    // Verify token from header
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

    // Check if this is the placeholder customer that needs to be replaced
    if (customerId === PLACEHOLDER_CUSTOMER_ID) {
      // Create new customer and update related records
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

    // Normal update flow - find existing customer
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

    // Upload ID card image if provided (base64)
    let idCardImageUrl = customer.profile?.idCardFrontImage;
    if (idCardImage && idCardImage.startsWith('data:image')) {
      try {
        const matches = idCardImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          const result = await storage.uploadFile(buffer, contentType, {
            folder: 'id-cards',
            filename: `${customerId}-${Date.now()}`,
          });

          idCardImageUrl = result.url;
        }
      } catch (uploadError) {
        console.error('[API] ID card upload failed:', uploadError);
      }
    }

    // Update customer profile
    if (customer.profile) {
      await prisma.userProfile.update({
        where: { id: customer.profile.id },
        data: {
          fullName: fullName || undefined,
          idCardNumber: idCardNumber || undefined,
          address: address || undefined,
          email: email || undefined,
          idCardFrontImage: idCardImageUrl,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create profile if not exists
      await prisma.userProfile.create({
        data: {
          userId: customer.id,
          fullName: fullName || null,
          idCardNumber: idCardNumber || null,
          address: address || null,
          email: email || null,
          idCardFrontImage: idCardImageUrl,
        },
      });
    }

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

/**
 * Create a new customer and update all related records
 */
async function createNewCustomerAndUpdateRelations(
  loanApplicationId: string,
  customerData: {
    phoneNumber: string;
    fullName?: string;
    idCardNumber?: string;
    address?: string;
    email?: string;
    idCardImage?: string;
  },
) {
  // Generate a unique phone number if not provided
  const phoneNumber =
    customerData.phoneNumber ||
    `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Upload ID card image if provided
  let idCardImageUrl: string | null = null;
  if (
    customerData.idCardImage &&
    customerData.idCardImage.startsWith('data:image')
  ) {
    try {
      const matches = customerData.idCardImage.match(
        /^data:([A-Za-z-+\/]+);base64,(.+)$/,
      );
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const result = await storage.uploadFile(buffer, contentType, {
          folder: 'id-cards',
          filename: `new-customer-${Date.now()}`,
        });

        idCardImageUrl = result.url;
      }
    } catch (uploadError) {
      console.error('[API] ID card upload failed:', uploadError);
    }
  }

  return prisma.$transaction(async (tx) => {
    // Check if phone number already exists
    const existingUser = await tx.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      throw new Error(
        'เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว กรุณาใช้ปุ่ม "สุ่มเบอร์" เพื่อสร้างเบอร์ใหม่',
      );
    }

    // 1. Create new User
    const newCustomer = await tx.user.create({
      data: {
        phoneNumber,
        userType: 'CUSTOMER',
        isActive: true,
      },
    });

    // 2. Create UserProfile
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

    // 3. Update LoanApplication to point to new customer
    await tx.loanApplication.update({
      where: { id: loanApplicationId },
      data: {
        customerId: newCustomer.id,
        ownerName: customerData.fullName || undefined,
        updatedAt: new Date(),
      },
    });

    // 4. Find and update related Loan if exists
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
