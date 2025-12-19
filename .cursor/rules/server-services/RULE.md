---
description: 'Pattern สำหรับ Server-side services ใน services/server.ts'
globs:
  - '**/services/server.ts'
  - '**/services/*.server.ts'
alwaysApply: false
---

# Server Services Pattern

## โครงสร้างไฟล์ services/server.ts

```typescript
// src/features/[feature-name]/services/server.ts
import 'server-only';
import { entityRepository } from '../repositories/entityRepository';
import {
  type EntityCreateSchema,
  type EntityFiltersSchema,
  type EntityUpdateSchema,
} from '../validations';

export const entityService = {
  // ============================================
  // Query Methods
  // ============================================

  async getList(filters: EntityFiltersSchema) {
    const where: any = { deletedAt: null };

    // Build where clause from filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    return entityRepository.paginate({
      where,
      orderBy: { createdAt: 'desc' },
      page: Number(filters.page) || 1,
      limit: Number(filters.limit) || 10,
    });
  },

  async getById(id: number) {
    const entity = await entityRepository.findWithRelations(id);
    if (!entity || entity.deletedAt) {
      throw new Error('ไม่พบข้อมูล');
    }
    return entity;
  },

  // ============================================
  // Mutation Methods
  // ============================================

  async create(data: EntityCreateSchema, adminId: number, adminName?: string) {
    // Business logic validation
    await this.validateBusinessRules(data);

    // Check duplicates if needed
    // await this.checkDuplicates(data);

    return entityRepository.create({
      data: {
        ...data,
        createdBy: adminId,
        createdByName: adminName,
      },
    });
  },

  async update(
    id: number,
    data: EntityUpdateSchema,
    adminId: number,
    adminName?: string,
  ) {
    // Verify existence
    await this.getById(id);

    // Business logic validation
    await this.validateBusinessRules(data);

    return entityRepository.update({
      where: { id },
      data: {
        ...data,
        updatedBy: adminId,
        updatedByName: adminName,
        updatedAt: new Date(),
      },
    });
  },

  async delete(id: number, adminId: number, adminName?: string) {
    // Verify existence
    await this.getById(id);

    // Soft delete
    return entityRepository.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: adminId,
        deletedByName: adminName,
      },
    });
  },

  async toggleStatus(id: number, adminId: number, adminName?: string) {
    const entity = await this.getById(id);
    const newStatus = entity.status === 'active' ? 'inactive' : 'active';

    return this.update(id, { status: newStatus }, adminId, adminName);
  },

  // ============================================
  // Business Logic Methods
  // ============================================

  async validateBusinessRules(data: any) {
    // Add business validation logic here
    // Example: check if amount is within limits
    // if (data.amount > MAX_AMOUNT) {
    //   throw new Error('จำนวนเงินเกินวงเงินที่กำหนด');
    // }
  },

  async checkDuplicates(data: any) {
    // Example: check for duplicate code
    // const existing = await entityRepository.findByCode(data.code);
    // if (existing) {
    //   throw new Error('รหัสนี้มีอยู่แล้วในระบบ');
    // }
  },
};
```

## ข้อกำหนดสำคัญ

### 1. Server-Only Directive

```typescript
import 'server-only'; // บรรทัดแรกเสมอ!
```

### 2. Error Messages ภาษาไทย

```typescript
throw new Error('ไม่พบข้อมูล');
throw new Error('ไม่มีสิทธิ์ดำเนินการ');
throw new Error('ข้อมูลซ้ำ');
throw new Error('จำนวนเงินเกินวงเงินที่กำหนด');
throw new Error('สถานะไม่ถูกต้อง');
```

### 3. Audit Fields

ทุก mutation ต้องมี audit fields:

```typescript
// Create
createdBy: adminId,
createdByName: adminName,

// Update
updatedBy: adminId,
updatedByName: adminName,
updatedAt: new Date(),

// Delete (soft delete)
deletedAt: new Date(),
deletedBy: adminId,
deletedByName: adminName,
```

### 4. Soft Delete Pattern

```typescript
// ไม่ใช้ delete() ตรงๆ
// แต่ใช้ update() เพื่อ set deletedAt
async delete(id: number, adminId: number) {
  return entityRepository.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: adminId,
    },
  });
}
```

### 5. Filter Building Pattern

```typescript
const where: any = { deletedAt: null };

if (filters.search) {
  where.OR = [
    /* search fields */
  ];
}

if (filters.status) {
  where.status = filters.status;
}

// Date range
if (filters.dateFrom || filters.dateTo) {
  where.createdAt = {};
  if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
  if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
}
```

### Method Structure

1. **Query methods**: `getList`, `getById`, `getByField`
2. **Mutation methods**: `create`, `update`, `delete`, `toggleStatus`
3. **Business logic**: `validateBusinessRules`, `checkDuplicates`
4. **Helpers**: private methods สำหรับ logic ที่ซ้ำ
