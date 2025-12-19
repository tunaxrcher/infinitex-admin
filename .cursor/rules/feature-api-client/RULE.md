---
description: 'Pattern สำหรับ Client-side API calls ใน feature api.ts'
globs:
  - '**/features/**/api.ts'
alwaysApply: false
---

# Feature API Client Pattern

## โครงสร้างไฟล์ api.ts

```typescript
// src/features/[feature-name]/api.ts
import { apiFetch } from '@src/shared/lib/api';
import {
  type EntityCreateSchema,
  type EntityFiltersSchema,
  type EntityUpdateSchema,
} from './validations';

export const entityApi = {
  getList: async (filters: EntityFiltersSchema) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(`/api/entities?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/api/entities/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  create: async (data: EntityCreateSchema) => {
    const response = await apiFetch(`/api/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  update: async (id: string, data: EntityUpdateSchema) => {
    const response = await apiFetch(`/api/entities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  delete: async (id: string) => {
    const response = await apiFetch(`/api/entities/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};
```

## ข้อกำหนดสำคัญ

1. **Import**: ใช้ `apiFetch` จาก `@src/shared/lib/api`
2. **Export**: เป็น object เดียวชื่อ `[entity]Api`
3. **Standard CRUD**: `getList`, `getById`, `create`, `update`, `delete`
4. **Error handling**: ตรวจสอบ `response.ok` และ throw Error ด้วยข้อความภาษาไทย
5. **Search params**: สร้างจาก filters object สำหรับ getList
6. **Type imports**: import types จาก `./validations`

## สำหรับ File Upload

ใช้ FormData แทน JSON:

```typescript
create: async (data: EntityCreateSchema & { files?: File[] }) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'files' && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) {
          formData.append('files', file);
        }
      });
    } else if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await apiFetch(`/api/entities`, {
    method: 'POST',
    // ไม่ต้อง set Content-Type - browser จะ set เอง
    body: formData,
  });
  // ... error handling
};
```

## Operations เพิ่มเติม

เพิ่ม methods ตามความต้องการ:

- `toggleStatus`: สำหรับเปลี่ยน active/inactive
- `approve`, `reject`: สำหรับ workflow
- `search`: สำหรับ autocomplete
