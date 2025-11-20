// src/app/api/loans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import { loanUpdateSchema } from '@src/features/loans/validations';
import { storage } from '@src/shared/lib/storage';

// ============================================
// Helper Functions
// ============================================

/**
 * Parse FormData and extract fields and files
 */
function parseFormDataFields(formData: FormData) {
  const data: any = {};
  const titleDeedFiles: File[] = [];
  const supportingFiles: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (key === 'titleDeedFiles' && value instanceof File) {
      titleDeedFiles.push(value);
    } else if (key === 'supportingFiles' && value instanceof File) {
      supportingFiles.push(value);
    } else if (
      key === 'existingImageUrls' ||
      key === 'existingSupportingImageUrls'
    ) {
      try {
        data[key] = JSON.parse(value as string);
      } catch {
        data[key] = [];
      }
    } else {
      if (value === 'undefined' || value === 'null') {
        data[key] = undefined;
      } else if (
        [
          'loanAmount',
          'loanYears',
          'interestRate',
          'operationFee',
          'transferFee',
          'otherFee',
        ].includes(key)
      ) {
        data[key] = parseFloat(value as string);
      } else {
        data[key] = value;
      }
    }
  }

  return { data, titleDeedFiles, supportingFiles };
}

/**
 * Upload files to storage
 */
async function uploadFilesToStorage(
  files: File[],
  folder: string,
): Promise<string[]> {
  const urls: string[] = [];

  if (files.length > 0) {
    console.log(`[API] Uploading ${files.length} files to ${folder}...`);

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await storage.uploadFile(buffer, file.type, {
          folder,
          filename: file.name,
        });

        urls.push(result.url);
        console.log(`[API] Uploaded: ${file.name} -> ${result.url}`);
      } catch (uploadError) {
        console.error(`[API] Failed to upload ${file.name}:`, uploadError);
        throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
      }
    }
  }

  return urls;
}

/**
 * Process images for update (replace if new, keep existing otherwise)
 */
function processImagesForUpdate(
  newUrls: string[],
  existingUrls: string[],
  imageType: string,
): string[] {
  const finalUrls = newUrls.length > 0 ? newUrls : existingUrls;

  console.log(`[API Update] Processing ${imageType}:`, {
    hasNewImages: newUrls.length > 0,
    existingCount: existingUrls.length,
    newCount: newUrls.length,
    finalCount: finalUrls.length,
    action:
      newUrls.length > 0 ? 'Using NEW images only' : 'Using existing images',
  });

  return finalUrls;
}

// ============================================
// API Routes
// ============================================

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
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] GET /api/loans/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
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

    // Parse form data
    const { data, titleDeedFiles, supportingFiles } =
      parseFormDataFields(formData);

    // Upload files
    const [newTitleDeedUrls, newSupportingUrls] = await Promise.all([
      uploadFilesToStorage(titleDeedFiles, 'title-deeds'),
      uploadFilesToStorage(supportingFiles, 'supporting-images'),
    ]);

    // Process images (replace if new, keep existing otherwise)
    const existingTitleDeedUrls = data.existingImageUrls || [];
    const existingSupportingUrls = data.existingSupportingImageUrls || [];

    data.titleDeedImages = processImagesForUpdate(
      newTitleDeedUrls,
      existingTitleDeedUrls,
      'title deed images',
    );
    data.supportingImages = processImagesForUpdate(
      newSupportingUrls,
      existingSupportingUrls,
      'supporting images',
    );

    // Validate and update
    const validatedData = loanUpdateSchema.parse(data);
    const result = await loanService.update(id, validatedData);

    return NextResponse.json({
      success: true,
      message: 'แก้ไขสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] PUT /api/loans/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
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
  } catch (error: any) {
    const { id } = await params;
    console.error(`[API Error] DELETE /api/loans/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
        errors: error,
      },
      { status: 500 },
    );
  }
}
