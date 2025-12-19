---
description: 'ภาพรวมโปรเจค Infinitex Admin - ข้อมูลสำคัญที่ต้องรู้'
alwaysApply: true
---

# Infinitex Admin - Project Overview

ระบบ Admin สำหรับจัดการธุรกิจสินเชื่อ รวมถึงการจัดการลูกค้า, สินเชื่อ, การชำระเงิน, บัญชีที่ดิน และรายงานทางการเงิน

## Tech Stack

| Category      | Technology                          |
| ------------- | ----------------------------------- |
| Framework     | Next.js 15 (App Router)             |
| Language      | TypeScript + Zod validation         |
| Database      | Prisma ORM + MySQL                  |
| Auth          | NextAuth.js                         |
| Client State  | React Query (@tanstack/react-query) |
| UI            | Radix UI + Tailwind CSS v4          |
| Forms         | React Hook Form + Zod               |
| Tables        | @tanstack/react-table               |
| Charts        | Recharts, ApexCharts                |
| Notifications | react-hot-toast, sonner             |

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Database
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema to database
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Open Prisma Studio GUI
```

## Path Aliases

โปรเจคใช้ `@src/*` สำหรับ import:

```typescript
// Feature imports
@src/features/[feature]/*           # Feature code

// Shared imports
@src/shared/components/ui/*         # UI components
@src/shared/components/common/*     # Common components
@src/shared/lib/*                   # Utilities
@src/shared/hooks/*                 # Shared hooks
@src/shared/providers/*             # React providers
@src/shared/validations/*           # Shared Zod schemas
```

## Directory Structure

### `src/features/` - Feature Modules

```
src/features/
├── customers/       # จัดการลูกค้า
├── loans/           # จัดการสินเชื่อ
├── land-accounts/   # บัญชีที่ดิน
├── documents/       # จัดการเอกสาร
├── dashboard/       # Dashboard และรายงาน
├── financial-summary/  # สรุปทางการเงิน
└── real-investment/ # การลงทุนจริง
```

**แต่ละ feature ประกอบด้วย:**

- `api.ts` - Client-side API calls
- `hooks.ts` - React Query hooks
- `validations.ts` - Zod schemas
- `repositories/` - Database access (extends BaseRepository)
- `services/server.ts` - Server-side business logic (marked with `"server-only"`)
- `components/` - Feature-specific components (optional)
- `tables/` - Table components (optional)

### `src/shared/` - Shared Code

```
src/shared/
├── components/
│   ├── ui/           # UI components (shadcn/ui style)
│   ├── common/       # Common reusable components
│   └── layouts/      # Layout components
├── lib/              # Utilities (api, db, auth, utils, storage)
├── hooks/            # Custom React hooks
├── providers/        # React context providers
├── config/           # App configuration
├── middleware/       # API middleware
├── i18n/             # Internationalization
└── validations/      # Shared Zod schemas
```

### `src/app/` - Next.js App Router

```
src/app/
├── (auth)/           # Auth pages (signin)
├── (protected)/      # Protected admin pages
│   └── admin/
│       ├── loans/
│       ├── customers/
│       ├── land-accounts/
│       └── ...
├── api/              # API routes
│   ├── loans/
│   ├── customers/
│   └── ...
└── components/       # App-level components
    ├── layouts/
    └── partials/
```

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Components (React)                                     │
│  └─> ใช้ hooks สำหรับ data fetching                      │
├─────────────────────────────────────────────────────────┤
│  Hooks (React Query)                                    │
│  └─> เรียก api.ts, จัดการ cache                          │
├─────────────────────────────────────────────────────────┤
│  API Client (api.ts)                                    │
│  └─> HTTP calls ไปยัง API routes                         │
├─────────────────────────────────────────────────────────┤
│  API Routes (route.ts)                                  │
│  └─> Validate + เรียก service                            │
├─────────────────────────────────────────────────────────┤
│  Services (server.ts)                                   │
│  └─> Business logic, เรียก repository                    │
├─────────────────────────────────────────────────────────┤
│  Repositories                                           │
│  └─> Database queries via Prisma                        │
└─────────────────────────────────────────────────────────┘
```

## Core Patterns

แต่ละ pattern มี rule เฉพาะ - ใช้เมื่อทำงานกับไฟล์ที่เกี่ยวข้อง:

| Pattern        | Rule                     | ใช้เมื่อ                         |
| -------------- | ------------------------ | -------------------------------- |
| Client API     | `@feature-api-client`    | สร้าง/แก้ไข `api.ts`             |
| React Query    | `@react-query-hooks`     | สร้าง/แก้ไข `hooks.ts`           |
| Zod Validation | `@zod-validations`       | สร้าง/แก้ไข `validations.ts`     |
| Repository     | `@prisma-repositories`   | สร้าง/แก้ไข `*Repository.ts`     |
| Service        | `@server-services`       | สร้าง/แก้ไข `services/server.ts` |
| API Routes     | `@api-routes`            | สร้าง/แก้ไข `route.ts`           |
| New Feature    | `@new-feature-generator` | สร้าง feature ใหม่ทั้งหมด        |

## Key Files

| File                         | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `@src/shared/lib/api.ts`     | API client (`apiFetch`)                     |
| `@src/shared/lib/db.ts`      | Prisma client (`prisma`)                    |
| `@src/shared/lib/auth.ts`    | Auth utilities (`getAdminFromToken`)        |
| `@src/shared/lib/storage.ts` | File storage (S3)                           |
| `@src/shared/lib/utils.ts`   | Utility functions (`cn`, formatters)        |
| `@src/shared/lib/helpers.ts` | Helpers (`formatCurrency`, `toAbsoluteUrl`) |

## Important Notes

- **React 19**: ใช้ React 19 - ไม่ต้อง import React ในไฟล์ component
- **Tailwind v4**: ใช้ `@tailwindcss/postcss` plugin
- **Next.js 15**: App Router, React Server Components
- **Thai Language**: Error messages และ UI text ใช้ภาษาไทย
- **Soft Delete**: ใช้ `deletedAt` field แทนการลบจริง
- **Audit Trail**: ทุก record มี `createdBy`, `updatedBy`, `deletedBy`
