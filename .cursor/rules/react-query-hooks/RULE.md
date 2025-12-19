---
description: 'Pattern สำหรับ React Query hooks ใน feature hooks.ts'
globs:
  - '**/features/**/hooks.ts'
alwaysApply: false
---

# React Query Hooks Pattern

## โครงสร้างไฟล์ hooks.ts

```typescript
// src/features/[feature-name]/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { entityApi } from './api';
import { type EntityFiltersSchema } from './validations';

// ============================================
// Query Keys
// ============================================

export const entityKeys = {
  all: () => ['entities'] as const,
  list: (filters?: EntityFiltersSchema) =>
    ['entities', 'list', filters] as const,
  detail: (id: string) => ['entities', 'detail', id] as const,
};

// ============================================
// Query Hooks
// ============================================

export const useGetEntityList = (filters: EntityFiltersSchema) => {
  return useQuery({
    queryKey: entityKeys.list(filters),
    queryFn: () => entityApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useGetEntityById = (id: string) => {
  return useQuery({
    queryKey: entityKeys.detail(id),
    queryFn: () => entityApi.getById(id),
    enabled: !!id,
  });
};

// ============================================
// Mutation Hooks
// ============================================

export const useCreateEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EntityCreateSchema) => entityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', 'list'] });
      queryClient.refetchQueries({ queryKey: ['entities', 'list'] });
      toast.success('สร้างรายการสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntityUpdateSchema }) =>
      entityApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entities', 'list'] });
      queryClient.invalidateQueries({
        queryKey: entityKeys.detail(variables.id),
      });
      queryClient.refetchQueries({ queryKey: ['entities', 'list'] });
      toast.success('แก้ไขรายการสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useDeleteEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entityApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: entityKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['entities', 'list'] });
      queryClient.refetchQueries({ queryKey: ['entities', 'list'] });
      toast.success('ลบรายการสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};
```

## ข้อกำหนดสำคัญ

### Query Keys Pattern

- ใช้ factory function สำหรับ query keys
- Structure: `[entity, 'list'/'detail', params]`
- Export เป็น `entityKeys` object

### Query Hooks Naming

- `useGet[Entity]List` - ดึงรายการ
- `useGet[Entity]ById` - ดึงรายละเอียด
- `useCreate[Entity]` - สร้างใหม่
- `useUpdate[Entity]` - แก้ไข
- `useDelete[Entity]` - ลบ
- `useToggle[Entity]Status` - เปลี่ยนสถานะ

### Query Options ที่แนะนำ

```typescript
{
  placeholderData: (previousData) => previousData, // ป้องกัน loading flash
  staleTime: 30000,           // 30 seconds
  gcTime: 5 * 60 * 1000,      // 5 minutes
  refetchOnWindowFocus: false,
  retry: 1,
}
```

### Mutation Pattern

1. `invalidateQueries` - ทำให้ cache หมดอายุ
2. `refetchQueries` - ดึงข้อมูลใหม่ทันที
3. `removeQueries` - ลบ cache สำหรับ delete operations
4. Toast notifications ภาษาไทย

## Toast Messages ที่ใช้บ่อย

```typescript
// Success
toast.success('สร้างรายการสำเร็จ');
toast.success('แก้ไขรายการสำเร็จ');
toast.success('ลบรายการสำเร็จ');
toast.success('อัปเดตสถานะสำเร็จ');
toast.success('บันทึกสำเร็จ');

// Error
toast.error(error.message || 'เกิดข้อผิดพลาด');
```
