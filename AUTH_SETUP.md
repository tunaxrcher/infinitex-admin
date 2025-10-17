# คู่มือการตั้งค่าระบบ Authentication

## ภาพรวม

ระบบ Authentication ใช้ **NextAuth.js v4** กับ **JWT strategy** สำหรับ Admin login

### Features
- ✅ Email/Password login สำหรับ Admin
- ✅ Google OAuth (optional)
- ✅ JWT-based sessions
- ✅ Role-based access control
- ✅ Auto redirect หาก login ไม่สำเร็จ

## โครงสร้างไฟล์

```
src/
├── shared/
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── db.ts                   # Prisma client
│   │   └── prisma.ts              # Prisma export alias
│   └── types/
│       └── next-auth.d.ts         # NextAuth TypeScript types
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts       # NextAuth API route
│   └── (auth)/
│       └── signin/
│           └── page.tsx           # Sign in page
prisma/
├── schema.prisma                  # Database schema
└── seed.ts                        # Seed script สำหรับสร้าง Admin
```

## การตั้งค่า

### 1. Environment Variables

สร้างไฟล์ `.env.local` และเพิ่มค่าต่อไปนี้:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/infinitex_admin"

# Next Auth (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. สร้าง Database และ Tables

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 3. Seed Admin Account

สร้าง Admin account สำหรับทดสอบ:

```bash
# ต้องติดตั้ง ts-node ก่อน (ถ้ายังไม่มี)
npm install -D ts-node

# Run seed script
npm run db:seed
```

Admin account ที่ถูกสร้าง:
- **Email**: `demo@kt.com`
- **Password**: `demo123`
- **Role**: `SUPER_ADMIN`

### 4. เริ่มใช้งาน

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ http://localhost:3000/signin

## การใช้งานใน Code

### 1. ตรวจสอบ Authentication ใน API Route

```typescript
// src/app/api/example/route.ts
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@src/shared/lib/auth'

export async function GET(req: NextRequest) {
  // ตรวจสอบ session
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  }

  // เข้าถึงข้อมูล user
  const userId = session.user.id
  const userEmail = session.user.email
  const userRole = session.user.roleId

  return NextResponse.json({ data: 'Protected data' })
}
```

### 2. ใช้งานใน Client Component

```typescript
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function MyComponent() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <button onClick={() => signIn()}>Sign in</button>
  }

  return (
    <div>
      <p>Signed in as {session.user.email}</p>
      <p>Role: {session.user.roleName}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}
```

### 3. ใช้งานใน Server Component

```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@src/shared/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/signin')
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.roleName}</p>
    </div>
  )
}
```

## Admin Roles

ระบบรองรับ Admin roles ดังนี้ (จาก schema):

- `SUPER_ADMIN` - ทำได้ทุกอย่าง
- `LOAN_OFFICER` - จัดการสินเชื่อ
- `CUSTOMER_SERVICE` - ดูแลลูกค้า
- `FINANCE` - จัดการการเงิน
- `CONTENT_MANAGER` - จัดการ Banner/Privilege

## Permissions

Admin สามารถมี permissions แบบ fine-grained ผ่านตาราง `admin_permissions`:

```typescript
// ตัวอย่าง permissions
enum PermissionCode {
  VIEW_APPLICATIONS
  APPROVE_APPLICATIONS
  VIEW_LOANS
  CREATE_LOANS
  UPDATE_LOANS
  DELETE_LOANS
  VIEW_USERS
  MANAGE_AGENTS
  VIEW_PAYMENTS
  PROCESS_PAYMENTS
  // ... และอื่นๆ
}
```

## การแก้ไขปัญหา

### ปัญหา: "Invalid email or password"
- ตรวจสอบว่า admin account ถูกสร้างแล้วด้วย `npm run db:seed`
- ตรวจสอบว่า password ถูกต้อง (default: `demo123`)

### ปัญหา: "Your account is not active"
- ตรวจสอบว่า `isActive = true` ในตาราง `admins`

### ปัญหา: Redirect loop
- ตรวจสอบว่า `NEXTAUTH_URL` ตรงกับ URL ที่ใช้งาน
- ตรวจสอบว่า `NEXTAUTH_SECRET` ถูกตั้งค่าแล้ว

### ปัญหา: Session หาย
- ตรวจสอบว่า `NEXTAUTH_SECRET` เหมือนกันในทุก environment
- ลอง clear cookies และ login ใหม่

## Security Best Practices

1. **NEXTAUTH_SECRET**: ใช้ secret ที่ปลอดภัย generate ด้วย:
   ```bash
   openssl rand -base64 32
   ```

2. **Password Hashing**: ระบบใช้ bcrypt กับ salt rounds = 10

3. **Session Duration**: Default = 30 วัน, สามารถปรับได้ใน `auth.ts`

4. **JWT**: ใช้ JWT strategy แทน database sessions เพื่อ performance

## Google OAuth Setup (Optional)

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง OAuth 2.0 Client ID
3. เพิ่ม Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
4. คัดลอก Client ID และ Client Secret ใส่ใน `.env.local`

## สรุป

ระบบ Authentication พร้อมใช้งานแล้ว! 🎉

- ✅ Admin login ด้วย email/password
- ✅ JWT sessions
- ✅ Protected routes
- ✅ Role-based access
- ✅ Google OAuth (optional)

หากมีคำถามหรือพบปัญหา กรุณาตรวจสอบ logs ใน console หรือติดต่อทีมพัฒนา

