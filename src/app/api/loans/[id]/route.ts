// src/app/api/loans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { loanUpdateSchema } from '@src/features/loans/validations';
import { storage } from '@src/shared/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await loanService.getById(id);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] GET /api/loans/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        errors: error,
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    // Extract form fields
    const data: any = {};
    const titleDeedFiles: File[] = [];

    // Parse form data
    for (const [key, value] of formData.entries()) {
      if (key === 'titleDeedFiles') {
        // Collect all title deed files
        if (value instanceof File) {
          titleDeedFiles.push(value);
        }
      } else if (key === 'existingImageUrls') {
        // Parse existing image URLs from JSON
        try {
          data[key] = JSON.parse(value as string);
        } catch {
          data[key] = [];
        }
      } else {
        // Parse other fields
        if (value === 'undefined' || value === 'null') {
          data[key] = undefined;
        } else if (
          key === 'loanAmount' ||
          key === 'loanYears' ||
          key === 'interestRate' ||
          key === 'operationFee' ||
          key === 'transferFee' ||
          key === 'otherFee'
        ) {
          data[key] = parseFloat(value as string);
        } else {
          data[key] = value;
        }
      }
    }

    // Upload new title deed images
    const newImageUrls: string[] = [];
    if (titleDeedFiles.length > 0) {
      console.log(
        `[API] Uploading ${titleDeedFiles.length} title deed images...`,
      );

      for (const file of titleDeedFiles) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const result = await storage.uploadFile(buffer, file.type, {
            folder: 'title-deeds',
            filename: file.name,
          });

          newImageUrls.push(result.url);
          console.log(`[API] Uploaded: ${file.name} -> ${result.url}`);
        } catch (uploadError) {
          console.error(`[API] Failed to upload ${file.name}:`, uploadError);
          throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
        }
      }
    }

    // Replace title deed images
    // - ถ้ามีรูปใหม่: ใช้เฉพาะรูปใหม่ (ทิ้งรูปเก่าทั้งหมด)
    // - ถ้าไม่มีรูปใหม่: ใช้รูปเก่าที่ยังเลือกไว้
    const existingImages = data.existingImageUrls || [];
    const allImageUrls = newImageUrls.length > 0 ? newImageUrls : existingImages;
    
    console.log('[API Update] Replacing title deed images:', {
      hasNewImages: newImageUrls.length > 0,
      existingCount: existingImages.length,
      newCount: newImageUrls.length,
      finalCount: allImageUrls.length,
      action: newImageUrls.length > 0 ? 'Using NEW images only' : 'Using existing images',
      images: allImageUrls,
    });
    
    data.titleDeedImages = allImageUrls;

    // Validate request body
    const validatedData = loanUpdateSchema.parse(data);

    const result = await loanService.update(id, validatedData);
    return NextResponse.json({
      success: true,
      message: 'แก้ไขสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] PUT /api/loans/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        errors: error,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await loanService.delete(id);
    return NextResponse.json({
      success: true,
      message: 'ลบสินเชื่อสำเร็จ',
    });
  } catch (error) {
    const { id } = await params;
    const errorMessage =
      error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
    console.error(`[API Error] DELETE /api/loans/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        errors: error,
      },
      { status: 500 },
    );
  }
}
