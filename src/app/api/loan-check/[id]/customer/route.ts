// src/app/api/loan-check/[id]/customer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/db';
import { storage } from '@src/shared/lib/storage';

export async function PUT(
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

    // Find the customer
    const customer = await prisma.customer.findUnique({
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
    let idCardImageUrl = customer.profile?.idCardImage;
    if (idCardImage && idCardImage.startsWith('data:image')) {
      try {
        // Extract base64 data
        const matches = idCardImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          // Upload to storage
          const result = await storage.uploadFile(buffer, contentType, {
            folder: 'id-cards',
            filename: `${customerId}-${Date.now()}`,
          });

          idCardImageUrl = result.url;
        }
      } catch (uploadError) {
        console.error('[API] ID card upload failed:', uploadError);
        // Continue without updating image
      }
    }

    // Update customer profile
    if (customer.profile) {
      await prisma.customerProfile.update({
        where: { id: customer.profile.id },
        data: {
          fullName: fullName || undefined,
          idCardNumber: idCardNumber || undefined,
          address: address || undefined,
          email: email || undefined,
          idCardImage: idCardImageUrl,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create profile if not exists
      await prisma.customerProfile.create({
        data: {
          customerId: customer.id,
          fullName: fullName || null,
          idCardNumber: idCardNumber || null,
          address: address || null,
          email: email || null,
          idCardImage: idCardImageUrl,
        },
      });
    }

    // Update phone number if changed
    if (phoneNumber && phoneNumber !== customer.phoneNumber) {
      await prisma.customer.update({
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
