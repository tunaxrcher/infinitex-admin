---
description: 'Security guidelines สำหรับ Infinitex Admin'
alwaysApply: false
globs:
  - '**/app/api/**/route.ts'
  - '**/services/**'
  - '**/middleware/**'
---

# Security Guidelines

## 1. Authentication - ทุก API Route ต้องมี Auth

```typescript
// ✅ ถูก - ตรวจสอบ auth ทุก request
export async function POST(request: NextRequest) {
  try {
    const { adminId, adminName } = await getAdminFromToken(request);
    // ... proceed with authenticated user
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'ไม่มีสิทธิ์เข้าถึง' },
      { status: 401 },
    );
  }
}

// ❌ ผิด - ไม่ตรวจสอบ auth
export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... proceed without auth check
}
```

## 2. Input Validation - Validate ทุก Input ฝั่ง Server

```typescript
// ✅ ถูก - validate ด้วย Zod ก่อนใช้งาน
const body = await request.json();
const validatedData = loanCreateSchema.parse(body); // throws if invalid

// ✅ ถูก - validate query params
const filters = Object.fromEntries(searchParams.entries());
const validatedFilters = loanFiltersSchema.parse(filters);

// ❌ ผิด - ใช้ input โดยตรงไม่ validate
const body = await request.json();
await loanService.create(body); // อันตราย!
```

## 3. SQL Injection Prevention

**ใช้ Prisma parameterized queries เสมอ:**

```typescript
// ✅ ถูก - Prisma handles escaping
const user = await prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ อันตรายมาก - raw SQL with string interpolation
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = '${userInput}'
`; // SQL Injection vulnerability!

// ✅ ถ้าต้องใช้ raw SQL - ใช้ Prisma.$queryRaw with template literal
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`; // Prisma will escape this
```

## 4. Sensitive Data - ห้าม Expose

### ห้าม return sensitive data

```typescript
// ❌ ผิด - return password
return NextResponse.json({ data: user });

// ✅ ถูก - exclude sensitive fields
const { password, ...safeUser } = user;
return NextResponse.json({ data: safeUser });
```

### ห้าม log sensitive data

```typescript
// ❌ ผิด
console.log('User data:', user); // อาจมี password

// ✅ ถูก
console.log('User ID:', user.id);
```

## 5. Error Messages - ห้าม Leak System Info

```typescript
// ❌ ผิด - expose internal error details
catch (error: any) {
  return NextResponse.json({
    success: false,
    message: error.message,  // อาจมี stack trace หรือ internal info
    stack: error.stack       // อันตรายมาก!
  });
}

// ✅ ถูก - generic error message
catch (error: any) {
  console.error('[API Error]:', error);  // log ไว้ดู internal
  return NextResponse.json({
    success: false,
    message: 'เกิดข้อผิดพลาด'  // generic message to client
  }, { status: 500 });
}
```

## 6. File Upload Security

```typescript
// ✅ Validate file type
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('ประเภทไฟล์ไม่ถูกต้อง');
}

// ✅ Validate file size
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  throw new Error('ไฟล์มีขนาดใหญ่เกินไป');
}

// ✅ Generate safe filename
const safeFilename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
```

## 7. Authorization - ตรวจสอบสิทธิ์ระดับ Resource

```typescript
// ✅ ตรวจสอบว่า user มีสิทธิ์เข้าถึง resource นี้
async function getById(id: number, adminId: number) {
  const entity = await repository.findUnique({ where: { id } });

  if (!entity) {
    throw new Error('ไม่พบข้อมูล');
  }

  // ตรวจสอบ ownership หรือ permission
  if (entity.ownerId !== adminId && !isAdmin(adminId)) {
    throw new Error('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
  }

  return entity;
}
```

## 8. Rate Limiting (ถ้าจำเป็น)

สำหรับ sensitive endpoints:

```typescript
// ควรใช้ rate limiting สำหรับ:
// - Login attempts
// - Password reset
// - OTP verification
// - File uploads
```

## Security Checklist

เมื่อสร้าง API route ใหม่:

- [ ] มี auth check (`getAdminFromToken`)
- [ ] Validate input ด้วย Zod
- [ ] ไม่ return sensitive data
- [ ] Error messages ไม่ leak system info
- [ ] Log errors ฝั่ง server
- [ ] ตรวจสอบ authorization ถ้าจำเป็น
