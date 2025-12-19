---
description: 'Pattern สำหรับ Next.js API routes ใน app/api'
globs:
  - '**/app/api/**/route.ts'
alwaysApply: false
---

# Next.js API Routes Pattern

## โครงสร้างไฟล์ route.ts

```typescript
// src/app/api/[entity]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { entityService } from '@src/features/[feature]/services/server';
import {
  entityCreateSchema,
  entityFiltersSchema,
} from '@src/features/[feature]/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';

// ============================================
// GET - List/Search
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = Object.fromEntries(searchParams.entries());
    const validatedFilters = entityFiltersSchema.parse(filters);

    const result = await entityService.getList(validatedFilters);

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    console.error('[API Error] GET /api/entities:', error);
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

// ============================================
// POST - Create
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = entityCreateSchema.parse(body);

    const { adminId, adminName } = await getAdminFromToken(request);
    const result = await entityService.create(
      validatedData,
      adminId,
      adminName,
    );

    return NextResponse.json({
      success: true,
      message: 'สร้างรายการสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('[API Error] POST /api/entities:', error);
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
```

## Dynamic Route Pattern

```typescript
// src/app/api/[entity]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { entityService } from '@src/features/[feature]/services/server';
import { entityUpdateSchema } from '@src/features/[feature]/validations';
import { getAdminFromToken } from '@src/shared/lib/auth';

// ============================================
// GET - Get by ID
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await entityService.getById(Number(id));

    return NextResponse.json({
      success: true,
      message: 'สำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error(`[API Error] GET /api/entities/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: error.message === 'ไม่พบข้อมูล' ? 404 : 500 },
    );
  }
}

// ============================================
// PUT - Update
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = entityUpdateSchema.parse(body);

    const { adminId, adminName } = await getAdminFromToken(request);
    const result = await entityService.update(
      Number(id),
      validatedData,
      adminId,
      adminName,
    );

    return NextResponse.json({
      success: true,
      message: 'แก้ไขรายการสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error(`[API Error] PUT /api/entities/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}

// ============================================
// DELETE - Soft Delete
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { adminId, adminName } = await getAdminFromToken(request);
    await entityService.delete(Number(id), adminId, adminName);

    return NextResponse.json({
      success: true,
      message: 'ลบรายการสำเร็จ',
    });
  } catch (error: any) {
    console.error(`[API Error] DELETE /api/entities/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'เกิดข้อผิดพลาด',
      },
      { status: 500 },
    );
  }
}
```

## ⚠️ หลักการสำคัญ: แยก Logic ไปที่ Service

**API Route ต้องบาง (thin) - ไม่ควรมี business logic ใดๆ**

```typescript
// ❌ ผิด - เขียน logic ใน route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // ❌ ไม่ควรมี business logic ใน route
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existingUser) {
    throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { ...body, password: hashedPassword },
  });

  return NextResponse.json({ success: true, data: user });
}

// ✅ ถูก - route เรียก service เท่านั้น
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = userCreateSchema.parse(body);

  const { adminId, adminName } = await getAdminFromToken(request);
  const result = await userService.create(validatedData, adminId, adminName);

  return NextResponse.json({ success: true, data: result });
}
```

### หน้าที่ของ API Route:

1. ✅ รับ request (query params, body, formData)
2. ✅ Validate ด้วย Zod schema
3. ✅ ดึง auth info จาก token
4. ✅ เรียก service method
5. ✅ Return response ในรูปแบบมาตรฐาน
6. ✅ Handle errors และ log

### สิ่งที่ไม่ควรทำใน API Route:

- ❌ เขียน query database โดยตรง
- ❌ เขียน business logic (validation rules, calculations)
- ❌ เรียก repository โดยตรง (ต้องผ่าน service)
- ❌ Import prisma โดยตรง

---

## ข้อกำหนดสำคัญ

### Response Format

```typescript
// Success response
{
  success: true,
  message: 'สำเร็จ',  // ภาษาไทย
  data: result,
  meta?: { page, limit, total, totalPages },  // สำหรับ pagination
}

// Error response
{
  success: false,
  message: error.message || 'เกิดข้อผิดพลาด',
  errors?: error,
}
```

### Error Logging

```typescript
console.error('[API Error] METHOD /api/path:', error);
```

### Auth Pattern

```typescript
const { adminId, adminName } = await getAdminFromToken(request);
```

### Validation Pattern

```typescript
// Query params
const filters = Object.fromEntries(searchParams.entries());
const validatedFilters = entityFiltersSchema.parse(filters);

// Body
const body = await request.json();
const validatedData = entityCreateSchema.parse(body);
```

### File Upload Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Parse form data
    const data: any = {};
    const files: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      } else {
        data[key] = value;
      }
    }

    // Upload files
    const uploadedUrls = await uploadFilesToStorage(files, 'uploads');

    // Create record with file URLs
    const result = await entityService.create(
      {
        ...data,
        fileUrls: uploadedUrls,
      },
      adminId,
      adminName,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    // ...
  }
}
```

## Common Success Messages

```typescript
'สำเร็จ';
'สร้างรายการสำเร็จ';
'แก้ไขรายการสำเร็จ';
'ลบรายการสำเร็จ';
'อนุมัติสำเร็จ';
'ยกเลิกสำเร็จ';
'อัปโหลดสำเร็จ';
```
