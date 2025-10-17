# คู่มือสถาปัตยกรรม Feature สำหรับ AI Code Generation

## ภาพรวม

คู่มือนี้อธิบายรูปแบบสถาปัตยกรรมมาตรฐานที่ใช้ในไดเรกทอรี `src/features/` เพื่อให้ AI สามารถสร้างโค้ดที่สอดคล้องและบำรุงรักษาได้ง่ายสำหรับทุก feature ในแอปพลิเคชัน Infinitex

## โครงสร้างไดเรกทอรี

```
src/features/[feature-name]/
├── api.ts                 # การเรียก API จากฝั่ง client
├── hooks.ts              # React Query hooks สำหรับดึงข้อมูล
├── validations.ts        # Zod schemas สำหรับตรวจสอบข้อมูล
├── components/           # Components เฉพาะของ feature
├── repositories/         # การจัดการฐานข้อมูล (Prisma)
└── services/            # Business logic ฝั่ง server
```

## รูปแบบไฟล์และข้อตกลง

### 1. `api.ts` - ชั้น API ฝั่ง Client

**วัตถุประสงค์:** จัดการ HTTP requests จาก frontend ไปยัง API endpoints

**รูปแบบ:**

```typescript
// src/features/[feature-name]/api.ts
import { api } from '@src/shared/lib/api-client'

import { featureService } from './services/server'

export const [entity]Api = {
  getList: async (filters: any): ReturnType<typeof featureService.getList> => {
    const searchParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    return api.get(`/api/[entity]?${searchParams}`)
  },

  getById: async (id: number): Promise<any> => {
    return api.get(`/api/[entity]/${id}`)
  },

  create: async (data: any): Promise<any> => {
    return api.post(`/api/[entity]`, data)
  },

  update: async (id: number, data: any): Promise<any> => {
    return api.put(`/api/[entity]/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/[entity]/${id}`)
  },

  toggleStatus: async (id: number): Promise<void> => {
    return api.patch(`/api/[entity]/${id}/toggle-status`)
  },
}
```

**ข้อตกลงสำคัญ:**

- Import shared API client จาก `@src/shared/lib/api-client`
- Export object เดียวชื่อ `[entity]Api`
- Standard CRUD operations: `getList`, `getById`, `create`, `update`, `delete`
- Operations เพิ่มเติมเช่น `toggleStatus` ตามความต้องการ
- จัดการ URL search parameters สำหรับการกรองใน `getList`

### 2. `hooks.ts` - React Query Hooks

**วัตถุประสงค์:** Custom hooks สำหรับดึงข้อมูล, caching, และ mutations โดยใช้ React Query

**Pattern:**

```typescript
// src/features/[feature-name]/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { [entity]Api } from './api'
import { type [Entity]FiltersSchema } from './validations'

export const [entity]Keys = {
  all: () => ['[entity]'] as const,
  list: (filters?: [Entity]FiltersSchema) => ['[entity]', 'list', filters] as const,
  detail: (id: number) => ['[entity]', 'detail', id] as const,
}

export const useGet[Entity]List = (filters: [Entity]FiltersSchema) => {
  return useQuery({
    queryKey: [entity]Keys.list(filters),
    queryFn: () => [entity]Api.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    gcTime: 0,
  })
}

export const useToggle[Entity]Status = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: [entity]Api.toggleStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [entity]Keys.list() })
      toast.success('อัปเดตสถานะสำเร็จ')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด')
    },
  })
}

export const useDelete[Entity] = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: [entity]Api.delete,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: [entity]Keys.detail(id) })
      queryClient.invalidateQueries({ queryKey: [entity]Keys.list() })
      toast.success('ลบรายการสำเร็จ')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด')
    },
  })
}
```

**ข้อตกลงสำคัญ:**

- กำหนด query keys ในรูปแบบ object ที่มีโครงสร้าง (`[entity]Keys`)
- ใช้การตั้งชื่อที่สอดคล้อง: `useGet[Entity]List`, `useToggle[Entity]Status`, `useDelete[Entity]`
- จัดการ success/error states ด้วย toast notifications ภาษาไทย
- Invalidate queries ที่เกี่ยวข้องหลังจาก mutations
- ใช้ placeholderData สำหรับ list queries เพื่อป้องกัน loading states

### 3. `validations.ts` - Zod Schemas

**วัตถุประสงค์:** กำหนด validation schemas สำหรับ forms และ API data

**Pattern:**

```typescript
// src/features/[feature-name]/validations.ts
import { baseTableSchema } from '@src/shared/validations/pagination'
import { z } from 'zod'

export const [feature]FiltersSchema = baseTableSchema.extend({
  // Add feature-specific filters
  status: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type [Feature]FiltersSchema = z.infer<typeof [feature]FiltersSchema>

export const [entity]CreateSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  description: z.string().optional(),
  // Add other fields as needed
})

export type [Entity]CreateSchema = z.infer<typeof [entity]CreateSchema>

export const [entity]UpdateSchema = [entity]CreateSchema.partial()

export type [Entity]UpdateSchema = z.infer<typeof [entity]UpdateSchema>
```

**Key Conventions:**

- Extend `baseTableSchema` for filter schemas
- Use Thai error messages
- Export both schema and TypeScript types
- Separate schemas for create/update operations
- Use consistent naming conventions

### 4. `repositories/[entity]Repository.ts` - ชั้นฐานข้อมูล

**วัตถุประสงค์:** จัดการการดำเนินการกับฐานข้อมูลโดยใช้ Prisma ORM

**Pattern:**

```typescript
// src/features/[feature-name]/repositories/[entity]Repository.ts
import { prisma } from '@src/shared/lib/db'
import { BaseRepository } from '@src/shared/repositories/baseRepository'

export class [Entity]Repository extends BaseRepository<typeof prisma.[entity]> {
  constructor() {
    super(prisma.[entity])
  }

  // Add custom methods specific to this entity
  async findByStatus(status: string) {
    return this.model.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findWithRelations(id: number) {
    return this.model.findUnique({
      where: { id },
      include: {
        // Include related models as needed
      }
    })
  }
}

export const [entity]Repository = new [Entity]Repository()
```

**Key Conventions:**

- Extend `BaseRepository` for common operations
- Export both class and instance
- Add entity-specific methods as needed
- Use TypeScript for type safety

### 5. `services/server.ts` - ชั้น Business Logic

**วัตถุประสงค์:** ประมวลผล business logic ฝั่ง server และประสานงานการทำงานของ repository

**Pattern:**

```typescript
// src/features/[feature-name]/services/server.ts
import 'server-only'

import { [entity]Repository } from '../repositories/[entity]Repository'
import { type [Entity]CreateSchema, type [Entity]UpdateSchema } from '../validations'

export const [entity]Service = {
  async getList(filters: any) {
    // Implement filtering logic
    return [entity]Repository.paginate({
      where: {
        // Build where clause from filters
      },
      orderBy: { createdAt: 'desc' },
      page: filters.page || 1,
      limit: filters.limit || 10,
    })
  },

  async getById(id: number) {
    const entity = await [entity]Repository.findWithRelations(id)
    if (!entity) {
      throw new Error('ไม่พบข้อมูล')
    }
    return entity
  },

  async create(data: [Entity]CreateSchema, createdBy?: number) {
    // Add business logic validation
    // Handle duplicate checks
    // Log creation

    return [entity]Repository.create({
      data: {
        ...data,
        createdBy,
      }
    })
  },

  async update(id: number, data: [Entity]UpdateSchema, updatedBy?: number) {
    // Add business logic validation
    // Check existence
    // Log updates

    return [entity]Repository.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
        updatedAt: new Date(),
      }
    })
  },

  async delete(id: number, deletedBy?: number) {
    // Soft delete or hard delete based on requirements
    return [entity]Repository.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      }
    })
  },

  async toggleStatus(id: number, updatedBy?: number) {
    const entity = await this.getById(id)
    const newStatus = entity.status === 'active' ? 'inactive' : 'active'

    return this.update(id, { status: newStatus }, updatedBy)
  },
}
```

**Key Conventions:**

- Use `'server-only'` directive at the top
- Import repository and validation types
- Implement business logic, not just CRUD operations
- Handle errors with Thai messages
- Include audit fields (createdBy, updatedBy, deletedBy)
- Use soft deletes where appropriate

## การเชื่อมต่อ API

### โครงสร้าง API Routes

Features เชื่อมต่อกับ API routes ใน `src/app/api/`:

```
src/app/api/
├── [entity]/
│   ├── route.ts           # GET, POST /api/[entity]
│   └── [id]/
│       ├── route.ts       # GET, PUT, DELETE /api/[entity]/[id]
│       └── toggle-status/
│           └── route.ts   # PATCH /api/[entity]/[id]/toggle-status
```

### API Route Implementation Pattern

```typescript
// src/app/api/[entity]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { [entity]Service } from '@src/features/[feature]/services/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = Object.fromEntries(searchParams.entries())

    const result = await [entity]Service.getList(filters)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await [entity]Service.create(body)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## Component Architecture

### Component Organization

```
src/features/[feature]/components/
├── [entity]-list.tsx      # List/table component
├── [entity]-form.tsx      # Create/edit form
├── [entity]-detail.tsx    # Detail view
└── [entity]-filters.tsx   # Filter component
```

### Page Integration

Pages in `src/app/(layout)/` import and use feature components:

```typescript
// src/app/(layout)/admin/[entity]/page.tsx
import { [Entity]List } from '@src/features/[feature]/components/[entity]-list'

export default function [Entity]Page() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">[Entity] Management</h1>
      <[Entity]List />
    </div>
  )
}
```

## Naming Conventions

### Variables and Functions

- **camelCase** for variables, functions, and properties
- **PascalCase** for components, classes, types, and interfaces
- **kebab-case** for file names and API routes

### Entity Naming

- **Singular** form for entity names (e.g., `user`, `admin`, `loan`)
- **Plural** form for collections and API endpoints (e.g., `users`, `admins`, `loans`)

### File Naming Examples

- `userApi` → User API object
- `useGetUserList` → Hook for fetching user list
- `UserRepository` → Repository class
- `userService` → Service object
- `UserFiltersSchema` → Filter validation schema

## Error Handling

### Standard Error Patterns

```typescript
// Service layer error handling
if (!entity) {
  throw new Error('ไม่พบข้อมูล')
}

// Hook error handling with toast
onError: (error: Error) => {
  toast.error(error.message || 'เกิดข้อผิดพลาด')
}

// API route error handling
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}
```

## TypeScript Integration

### Type Export Pattern

```typescript
// From validations.ts
export type [Entity]FiltersSchema = z.infer<typeof [entity]FiltersSchema>
export type [Entity]CreateSchema = z.infer<typeof [entity]CreateSchema>

// From Prisma (auto-generated)
import type { [Entity] } from '@prisma/client'
```

## แนวทางปฏิบัติที่ดี

1. **โครงสร้างที่สอดคล้อง**: ทุก feature ควรปฏิบัติตามโครงสร้างไดเรกทอรีเดียวกัน
2. **ความปลอดภัยของ Type**: ใช้ TypeScript และ Zod สำหรับ runtime validation
3. **การจัดการข้อผิดพลาด**: แสดงข้อความข้อผิดพลาดที่มีความหมายเป็นภาษาไทย
4. **การตรวจสอบการเปลี่ยนแปลง**: รวมฟิลด์ createdBy, updatedBy, deletedBy
5. **การลบแบบ Soft**: ใช้ฟิลด์ deletedAt แทนการลบถาวร
6. **การ Invalidate Query**: ทำการ invalidate React Query cache อย่างถูกต้องหลังจาก mutations
7. **Loading States**: ใช้ placeholderData เพื่อป้องกัน loading states ที่ไม่จำเป็น
8. **โค้ดฝั่ง Server เท่านั้น**: ใช้ directive 'server-only' สำหรับไฟล์ service

## Template สำหรับ AI Code Generation

เมื่อต้องการสร้างโค้ดสำหรับ feature ใหม่ ให้ใช้ template นี้:

```
สร้าง feature ใหม่ชื่อ "[feature-name]" พร้อม entity "[entity-name]" ตามรูปแบบสถาปัตยกรรม Infinitex:

1. สร้าง api.ts พร้อม standard CRUD operations
2. สร้าง hooks.ts พร้อม React Query hooks สำหรับดึงข้อมูล
3. สร้าง validations.ts พร้อม Zod schemas สำหรับ filters และ CRUD operations
4. สร้าง repositories/[entity]Repository.ts ที่ extend จาก BaseRepository
5. สร้าง services/server.ts พร้อม business logic
6. ใช้ภาษาไทยสำหรับข้อความ error และ toast notifications
7. ปฏิบัติตามข้อตกลงการตั้งชื่อและโครงสร้างที่ระบุใน FEATURE_ARCHITECTURE_GUIDE.md

Entity ควรมีฟิลด์เหล่านี้: [ระบุฟิลด์และประเภทข้อมูล]
```

คู่มือนี้ช่วยให้การสร้างโค้ดมีความสอดคล้อง บำรุงรักษาได้ง่าย และขยายได้สำหรับทุก feature ในแอปพลิเคชัน Infinitex
