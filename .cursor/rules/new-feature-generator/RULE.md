---
description: "Template สำหรับสร้าง feature ใหม่ตาม Infinitex architecture"
alwaysApply: false
---

# New Feature Generator

ใช้ rule นี้เมื่อต้องการสร้าง feature ใหม่ โดย @mention ในการสนทนา: `@new-feature-generator`

## คำสั่งสร้าง Feature ใหม่

เมื่อผู้ใช้ขอสร้าง feature ใหม่ ให้สร้างไฟล์ตามโครงสร้างนี้:

```
src/features/[feature-name]/
├── api.ts                    # Client-side API calls
├── hooks.ts                  # React Query hooks
├── validations.ts            # Zod schemas
├── repositories/
│   └── [entity]Repository.ts # Prisma database operations
├── services/
│   └── server.ts             # Server-side business logic
└── components/               # Feature-specific components (optional)

src/app/api/[entity]/
├── route.ts                  # GET, POST
└── [id]/
    └── route.ts              # GET, PUT, DELETE
```

## Checklist สำหรับสร้าง Feature ใหม่

### 1. Database (ถ้าต้องการ)
- [ ] เพิ่ม model ใน `prisma/schema.prisma`
- [ ] รัน `npx prisma migrate dev`
- [ ] รัน `npx prisma generate`

### 2. Feature Files
- [ ] สร้าง `validations.ts` ก่อน (เพราะ files อื่นต้อง import types)
- [ ] สร้าง `repositories/[entity]Repository.ts`
- [ ] สร้าง `services/server.ts`
- [ ] สร้าง `api.ts`
- [ ] สร้าง `hooks.ts`

### 3. API Routes
- [ ] สร้าง `src/app/api/[entity]/route.ts` (GET, POST)
- [ ] สร้าง `src/app/api/[entity]/[id]/route.ts` (GET, PUT, DELETE)
- [ ] เพิ่ม routes พิเศษตามความต้องการ

### 4. Components & Pages (optional)
- [ ] สร้าง components ใน `src/features/[feature]/components/`
- [ ] สร้าง page ใน `src/app/(protected)/admin/[feature]/page.tsx`

## Template Prompt

```
สร้าง feature ใหม่ชื่อ "[feature-name]" พร้อม entity "[entity-name]":

Entity fields:
- id: number (auto-increment)
- [field1]: string
- [field2]: number
- status: enum ['active', 'inactive']
- createdAt, updatedAt, deletedAt
- createdBy, updatedBy, deletedBy

ต้องการ:
1. CRUD operations ครบ
2. Pagination และ filtering
3. Soft delete
4. Audit trail
5. Thai error messages
```

## ตัวอย่างการใช้งาน

ผู้ใช้: "สร้าง feature products สำหรับจัดการสินค้า มี name, price, category, status"

AI จะสร้าง:
1. `src/features/products/validations.ts`
2. `src/features/products/repositories/productRepository.ts`
3. `src/features/products/services/server.ts`
4. `src/features/products/api.ts`
5. `src/features/products/hooks.ts`
6. `src/app/api/products/route.ts`
7. `src/app/api/products/[id]/route.ts`

## Naming Convention Summary

| Type | Format | Example |
|------|--------|---------|
| Feature folder | kebab-case | `products`, `land-accounts` |
| Entity name | camelCase | `product`, `landAccount` |
| Repository class | PascalCase | `ProductRepository` |
| Repository instance | camelCase | `productRepository` |
| Service object | camelCase | `productService` |
| API object | camelCase | `productApi` |
| Hooks | camelCase + usePrefix | `useGetProductList` |
| Schema | camelCase + Suffix | `productCreateSchema` |
| Type | PascalCase + Suffix | `ProductCreateSchema` |

