// src/app/api/loans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';
import {
  loanCreateSchema,
  loanFiltersSchema,
} from '@src/features/loans/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';
import { storage } from '@src/shared/lib/storage';

// ============================================
// Helper Functions
// ============================================

/**
 * Parse FormData and extract fields and files
 * Updated: Support titleDeeds array for multiple deeds
 */
function parseFormDataFields(formData: FormData) {
  const data: any = {};
  const titleDeedFiles: File[] = [];
  const supportingFiles: File[] = [];
  const titleDeedsArray: any[] = []; // Collect multiple titleDeeds entries
  let idCardFile: File | null = null;

  for (const [key, value] of formData.entries()) {
    if (key === 'titleDeedFiles' && value instanceof File) {
      titleDeedFiles.push(value);
    } else if (key === 'supportingFiles' && value instanceof File) {
      supportingFiles.push(value);
    } else if (key === 'idCardFile' && value instanceof File) {
      idCardFile = value;
    } else if (key === 'titleDeeds') {
      // Each titleDeed is sent as a separate JSON string
      try {
        const parsed = JSON.parse(value as string);
        titleDeedsArray.push(parsed);
      } catch {
        // Skip invalid entries
      }
    } else if (
      key === 'existingImageUrls' ||
      key === 'existingSupportingImageUrls'
    ) {
      try {
        data[key] = JSON.parse(value as string);
      } catch {
        data[key] = [];
      }
    } else if (key === 'titleDeedData') {
      try {
        data[key] = JSON.parse(value as string);
      } catch {
        data[key] = null;
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
          'totalPropertyValue',
          'propertyValue',
        ].includes(key)
      ) {
        data[key] = parseFloat(value as string);
      } else {
        data[key] = value;
      }
    }
  }

  // Assign collected titleDeeds array
  data.titleDeeds = titleDeedsArray.length > 0 ? titleDeedsArray : [];

  return { data, titleDeedFiles, supportingFiles, idCardFile };
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

// ============================================
// API Routes
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());
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

    // Parse form data
    const { data, titleDeedFiles, supportingFiles, idCardFile } =
      parseFormDataFields(formData);

    // Upload files
    const [newTitleDeedUrls, newSupportingUrls, idCardUrl] = await Promise.all([
      uploadFilesToStorage(titleDeedFiles, 'title-deeds'),
      uploadFilesToStorage(supportingFiles, 'supporting-images'),
      idCardFile
        ? uploadFilesToStorage([idCardFile], 'id-cards').then(
            (urls) => urls[0] || null,
          )
        : Promise.resolve(null),
    ]);

    // Combine images (existing + new) for backward compatibility
    const existingTitleDeedUrls = data.existingImageUrls || [];
    const existingSupportingUrls = data.existingSupportingImageUrls || [];

    data.titleDeedImages = [...existingTitleDeedUrls, ...newTitleDeedUrls];
    data.supportingImages = [...existingSupportingUrls, ...newSupportingUrls];

    // If titleDeeds array is provided (new format), update image URLs
    if (data.titleDeeds && data.titleDeeds.length > 0) {
      // Track which deed needs new upload
      let newUrlIndex = 0;

      data.titleDeeds = data.titleDeeds.map((deed: any, index: number) => {
        const updatedDeed = { ...deed };

        // If this deed doesn't have an imageUrl, assign from newly uploaded files
        if (!updatedDeed.imageUrl && newTitleDeedUrls[newUrlIndex]) {
          updatedDeed.imageUrl = newTitleDeedUrls[newUrlIndex];
          newUrlIndex++;
        }

        // Assign titleDeedData to primary deed (from AI analysis)
        // titleDeedData ควรเก็บเฉพาะข้อมูล raw จาก LandMaps API
        if (
          updatedDeed.isPrimary &&
          data.titleDeedData &&
          !updatedDeed.titleDeedData
        ) {
          updatedDeed.titleDeedData = data.titleDeedData;
        }

        return updatedDeed;
      });
    } else if (!data.titleDeeds && data.titleDeedImages.length > 0) {
      // Legacy format: Create titleDeeds from titleDeedImages
      data.titleDeeds = data.titleDeedImages.map(
        (url: string, index: number) => ({
          imageUrl: url,
          sortOrder: index,
          isPrimary: index === 0,
          titleDeedData: index === 0 ? data.titleDeedData : null,
          deedNumber: index === 0 ? data.landNumber : null,
          landAreaText: index === 0 ? data.landArea : null,
        }),
      );
    }

    // Add ID card image if uploaded
    if (idCardUrl) {
      data.idCardImage = idCardUrl;
    }

    // Validate and create
    const validatedData = loanCreateSchema.parse(data);
    const { adminId, adminName } = await getAdminFromToken(request);
    const result = await loanService.create(validatedData, adminId, adminName);
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
