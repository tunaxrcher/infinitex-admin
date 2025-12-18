---
description: "Pattern สำหรับ Prisma repositories ใน repositories folder"
globs:
  - "**/repositories/**Repository.ts"
  - "**/repositories/*.ts"
alwaysApply: false
---

# Prisma Repository Pattern

## โครงสร้างไฟล์ Repository

```typescript
// src/features/[feature-name]/repositories/entityRepository.ts
import { prisma } from '@src/shared/lib/db';
import { BaseRepository } from '@src/shared/repositories/baseRepository';

export class EntityRepository extends BaseRepository<typeof prisma.entity> {
  constructor() {
    super(prisma.entity);
  }

  // ============================================
  // Custom Query Methods
  // ============================================

  async findByStatus(status: string) {
    return this.model.findMany({
      where: { status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithRelations(id: number) {
    return this.model.findUnique({
      where: { id },
      include: {
        createdByAdmin: { select: { id: true, name: true } },
        updatedByAdmin: { select: { id: true, name: true } },
        // Add other relations
      },
    });
  }

  async findByCustomerId(customerId: number) {
    return this.model.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // Search & Filter Methods
  // ============================================

  async search(keyword: string) {
    return this.model.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { code: { contains: keyword, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      take: 10,
    });
  }

  // ============================================
  // Aggregate Methods
  // ============================================

  async countByStatus(status: string) {
    return this.model.count({
      where: { status, deletedAt: null },
    });
  }

  async sumAmount(where: any) {
    const result = await this.model.aggregate({
      _sum: { amount: true },
      where: { ...where, deletedAt: null },
    });
    return result._sum.amount || 0;
  }
}

// Export singleton instance
export const entityRepository = new EntityRepository();
```

## ข้อกำหนดสำคัญ

### Class Structure
1. **ALWAYS** extend `BaseRepository`
2. Export ทั้ง class และ singleton instance
3. ใช้ `prisma` จาก `@src/shared/lib/db`

### Naming Convention
- Class: `EntityRepository` (PascalCase)
- Instance: `entityRepository` (camelCase)
- File: `entityRepository.ts` (camelCase)

### Soft Delete
**ALWAYS** include `deletedAt: null` ใน where clause:
```typescript
where: { 
  status: 'active',
  deletedAt: null  // สำคัญมาก!
}
```

### Common Patterns

#### Pagination with BaseRepository
```typescript
// BaseRepository มี paginate method ให้แล้ว
const result = await entityRepository.paginate({
  where: { status: 'active', deletedAt: null },
  orderBy: { createdAt: 'desc' },
  page: 1,
  limit: 10,
});
```

#### Include Relations
```typescript
include: {
  customer: { select: { id: true, name: true, phone: true } },
  createdByAdmin: { select: { id: true, name: true } },
  items: {
    where: { deletedAt: null },
    include: { product: true },
  },
}
```

#### Transaction
```typescript
async createWithItems(data: any, items: any[]) {
  return prisma.$transaction(async (tx) => {
    const entity = await tx.entity.create({ data });
    
    await tx.entityItem.createMany({
      data: items.map(item => ({
        ...item,
        entityId: entity.id,
      })),
    });
    
    return entity;
  });
}
```

### Method Naming
- `findBy[Field]` - หา record ตาม field
- `findWithRelations` - หา record พร้อม relations
- `search` - ค้นหาด้วย keyword
- `countBy[Field]` - นับจำนวนตาม field
- `sum[Field]` - รวมค่าตาม field

