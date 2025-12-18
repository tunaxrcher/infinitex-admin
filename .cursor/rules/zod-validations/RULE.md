---
description: "Pattern สำหรับ Zod validation schemas ใน validations.ts"
globs:
  - "**/validations.ts"
  - "**/validations/*.ts"
alwaysApply: false
---

# Zod Validation Schemas Pattern

## โครงสร้างไฟล์ validations.ts

```typescript
// src/features/[feature-name]/validations.ts
import { baseTableSchema } from '@src/shared/validations/pagination';
import { z } from 'zod';

// ============================================
// Filter Schemas
// ============================================

export const entityFiltersSchema = baseTableSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  // Add feature-specific filters
});

export type EntityFiltersSchema = z.infer<typeof entityFiltersSchema>;

// ============================================
// Create/Update Schemas
// ============================================

export const entityCreateSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  // Add other required fields
});

export type EntityCreateSchema = z.infer<typeof entityCreateSchema>;

export const entityUpdateSchema = entityCreateSchema.partial();

export type EntityUpdateSchema = z.infer<typeof entityUpdateSchema>;
```

## ข้อกำหนดสำคัญ

### Naming Convention
- Schema: `entityFiltersSchema`, `entityCreateSchema`, `entityUpdateSchema`
- Type: `EntityFiltersSchema`, `EntityCreateSchema`, `EntityUpdateSchema`

### Filter Schema
- **ALWAYS** extend จาก `baseTableSchema` สำหรับ pagination
- Standard filters: `search`, `status`, `dateFrom`, `dateTo`

### Error Messages ภาษาไทย
```typescript
z.string().min(1, 'กรุณากรอกชื่อ')
z.string().email('รูปแบบอีเมลไม่ถูกต้อง')
z.number().min(1, 'กรุณาระบุจำนวน')
z.string().regex(/^[0-9]{10}$/, 'เบอร์โทรศัพท์ไม่ถูกต้อง')
z.number().positive('จำนวนต้องเป็นค่าบวก')
z.date().min(new Date(), 'วันที่ต้องไม่น้อยกว่าวันนี้')
```

### Common Patterns

#### Optional with Transform
```typescript
loanAmount: z.coerce.number().positive('จำนวนเงินต้องเป็นค่าบวก'),
interestRate: z.coerce.number().min(0).max(100),
```

#### Enum with Default
```typescript
status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
type: z.enum(['income', 'expense']),
```

#### Date Handling
```typescript
startDate: z.coerce.date(),
endDate: z.coerce.date().optional(),
```

#### Array with Validation
```typescript
items: z.array(z.object({
  productId: z.string(),
  quantity: z.number().min(1),
})).min(1, 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'),
```

### Update Schema Pattern
```typescript
// ใช้ .partial() สำหรับ update (ทุก field เป็น optional)
export const entityUpdateSchema = entityCreateSchema.partial();

// หรือกำหนดเฉพาะ field ที่แก้ไขได้
export const entityUpdateSchema = entityCreateSchema.pick({
  name: true,
  description: true,
}).partial();
```

### Refinement Pattern
```typescript
export const dateRangeSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
  },
  { message: 'วันที่เริ่มต้นต้องน้อยกว่าวันที่สิ้นสุด' }
);
```

## Export Checklist
- [ ] Export schema (camelCase)
- [ ] Export type (PascalCase) ด้วย `z.infer<typeof schema>`
- [ ] ใช้ error messages ภาษาไทย
- [ ] Extend `baseTableSchema` สำหรับ filter schemas

