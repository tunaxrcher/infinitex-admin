---
description: 'Pattern สำหรับ Prisma repositories ใน repositories folder'
globs:
  - '**/repositories/**Repository.ts'
  - '**/repositories/*.ts'
alwaysApply: false
---

# Prisma Repository Pattern

## โครงสร้างไฟล์ Repository

```typescript
// src/features/[feature-name]/repositories/entityRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class EntityRepository {
  // ============================================
  // Find Methods
  // ============================================

  async findMany(options: {
    where?: Prisma.EntityWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.EntityOrderByWithRelationInput;
    include?: Prisma.EntityInclude;
  }) {
    return prisma.entity.findMany(options);
  }

  async findById(id: string, include?: Prisma.EntityInclude) {
    return prisma.entity.findUnique({
      where: { id },
      include,
    });
  }

  async count(where?: Prisma.EntityWhereInput) {
    return prisma.entity.count({ where });
  }

  // ============================================
  // Mutation Methods
  // ============================================

  async create(data: Prisma.EntityCreateInput) {
    return prisma.entity.create({ data });
  }

  async update(id: string, data: Prisma.EntityUpdateInput) {
    return prisma.entity.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    // Soft delete - ใช้ update แทน delete
    return prisma.entity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ============================================
  // Pagination
  // ============================================

  async paginate(options: {
    where?: Prisma.EntityWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.EntityOrderByWithRelationInput;
    include?: Prisma.EntityInclude;
  }) {
    const { where, page, limit, orderBy, include } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.count(where),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// Export singleton instance
export const entityRepository = new EntityRepository();
```

## ข้อกำหนดสำคัญ

### Class Structure

- Import `Prisma` types จาก `@prisma/client`
- Import `prisma` จาก `@src/shared/lib/db`
- Export ทั้ง class และ singleton instance

### Naming Convention

| Type     | Format     | Example                    |
| -------- | ---------- | -------------------------- |
| Class    | PascalCase | `LandAccountRepository`    |
| Instance | camelCase  | `landAccountRepository`    |
| File     | camelCase  | `landAccountRepository.ts` |

### Standard Methods

| Method                   | Purpose                     |
| ------------------------ | --------------------------- |
| `findMany(options)`      | ค้นหาหลาย records           |
| `findById(id, include?)` | ค้นหาตาม ID                 |
| `count(where?)`          | นับจำนวน records            |
| `create(data)`           | สร้าง record ใหม่           |
| `update(id, data)`       | แก้ไข record                |
| `delete(id)`             | Soft delete (set deletedAt) |
| `paginate(options)`      | Pagination พร้อม meta       |

### Soft Delete Pattern (สำคัญมาก!)

```typescript
// ❌ ห้ามใช้ delete() โดยตรง
await prisma.entity.delete({ where: { id } });

// ✅ ใช้ update() เพื่อ set deletedAt
async delete(id: string) {
  return prisma.entity.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

### Paginate Response Format

```typescript
{
  data: Entity[],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
  }
}
```

### Custom Query Methods (เพิ่มตามความต้องการ)

```typescript
async findByStatus(status: string) {
  return this.findMany({
    where: { status, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

async findByCustomerId(customerId: string) {
  return this.findMany({
    where: { customerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

async search(keyword: string) {
  return this.findMany({
    where: {
      OR: [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ],
      deletedAt: null,
    },
    take: 10,
  });
}
```

### Include Relations

```typescript
async findWithRelations(id: string) {
  return this.findById(id, {
    customer: { select: { id: true, name: true, phone: true } },
    admin: { select: { id: true, email: true, firstName: true } },
    items: {
      where: { deletedAt: null },
      include: { product: true },
    },
  });
}
```

### Transaction Pattern

```typescript
// ใน service layer, ไม่ใช่ repository
async createWithLog(data: any, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const entity = await tx.entity.create({ data });

    await tx.entityLog.create({
      data: {
        entityId: entity.id,
        action: 'CREATE',
        adminId,
      },
    });

    return entity;
  });
}
```

## Checklist สำหรับ Repository ใหม่

- [ ] Import `Prisma` และ `prisma`
- [ ] สร้าง class พร้อม standard methods
- [ ] Implement `paginate()` method
- [ ] ใช้ soft delete ใน `delete()` method
- [ ] Export ทั้ง class และ singleton instance
