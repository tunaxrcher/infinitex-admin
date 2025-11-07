// src/app/api/loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import {
  loanCreateSchema,
  loanFiltersSchema,
} from '@src/features/loans/validations';
import { storage } from '@src/shared/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());

    // Validate filters
    const validatedFilters = loanFiltersSchema.parse(filters);

    const result = await loanService.getList(validatedFilters);
    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/loans:', error);
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const data: any = {};
    const titleDeedFiles: File[] = [];
    const supportingFiles: File[] = [];

    // Parse form data
    for (const [key, value] of formData.entries()) {
      if (key === 'titleDeedFiles') {
        // Collect all title deed files
        if (value instanceof File) {
          titleDeedFiles.push(value);
        }
      } else if (key === 'supportingFiles') {
        // Collect all supporting files
        if (value instanceof File) {
          supportingFiles.push(value);
        }
      } else if (key === 'existingImageUrls' || key === 'existingSupportingImageUrls') {
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
          console.log(`[API] Uploaded title deed: ${file.name} -> ${result.url}`);
        } catch (uploadError) {
          console.error(`[API] Failed to upload ${file.name}:`, uploadError);
          throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
        }
      }
    }

    // Upload supporting images
    const supportingImageUrls: string[] = [];
    if (supportingFiles.length > 0) {
      console.log(
        `[API] Uploading ${supportingFiles.length} supporting images...`,
      );

      for (const file of supportingFiles) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const result = await storage.uploadFile(buffer, file.type, {
            folder: 'supporting-images',
            filename: file.name,
          });

          supportingImageUrls.push(result.url);
          console.log(`[API] Uploaded supporting: ${file.name} -> ${result.url}`);
        } catch (uploadError) {
          console.error(`[API] Failed to upload ${file.name}:`, uploadError);
          throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
        }
      }
    }

    // Combine title deed images (existing + new)
    const existingImages = data.existingImageUrls || [];
    const allImageUrls = [...existingImages, ...newImageUrls];
    data.titleDeedImages = allImageUrls;

    // Combine supporting images (existing + new)
    const existingSupporting = data.existingSupportingImageUrls || [];
    const allSupportingUrls = [...existingSupporting, ...supportingImageUrls];
    data.supportingImages = allSupportingUrls;

    // Validate request body
    const validatedData = loanCreateSchema.parse(data);

    const result = await loanService.create(validatedData);
    return NextResponse.json({
      success: true,
      message: 'สร้างสินเชื่อสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/loans:', error);
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
