---
description: 'Pattern สำหรับ Forms ด้วย React Hook Form + Zod'
globs:
  - '**/*-form.tsx'
  - '**/*-dialog.tsx'
  - '**/components/**/*form*.tsx'
alwaysApply: false
---

# React Hook Form + Zod Pattern

## โครงสร้างพื้นฐาน

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateEntity } from '@src/features/[feature]/hooks';
import {
  entityCreateSchema,
  type EntityCreateSchema,
} from '@src/features/[feature]/validations';
import { useForm } from 'react-hook-form';
import { Button } from '@src/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import { Input } from '@src/shared/components/ui/input';

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EntityFormDialog({
  open,
  onOpenChange,
}: EntityFormDialogProps) {
  const createMutation = useCreateEntity();

  const form = useForm<EntityCreateSchema>({
    resolver: zodResolver(entityCreateSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
    },
  });

  const onSubmit = (data: EntityCreateSchema) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มรายการใหม่</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Form fields */}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

## Form Field Types

### Text Input

```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>ชื่อ</FormLabel>
      <FormControl>
        <Input placeholder="กรอกชื่อ" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Number Input

```tsx
<FormField
  control={form.control}
  name="amount"
  render={({ field }) => (
    <FormItem>
      <FormLabel>จำนวนเงิน</FormLabel>
      <FormControl>
        <Input
          type="number"
          placeholder="0.00"
          {...field}
          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>รายละเอียด</FormLabel>
      <FormControl>
        <Textarea
          placeholder="กรอกรายละเอียด"
          className="resize-none"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Select

```tsx
<FormField
  control={form.control}
  name="status"
  render={({ field }) => (
    <FormItem>
      <FormLabel>สถานะ</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="เลือกสถานะ" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="active">ใช้งาน</SelectItem>
          <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox

```tsx
<FormField
  control={form.control}
  name="isActive"
  render={({ field }) => (
    <FormItem className="flex items-center gap-2">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <FormLabel className="!mt-0">เปิดใช้งาน</FormLabel>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Date Picker

```tsx
<FormField
  control={form.control}
  name="startDate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>วันที่เริ่มต้น</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {field.value ? (
                format(field.value, 'dd/MM/yyyy', { locale: th })
              ) : (
                <span>เลือกวันที่</span>
              )}
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Edit Mode (with existing data)

```tsx
interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId?: string; // ถ้ามี = edit mode
}

export function EntityFormDialog({ open, onOpenChange, entityId }: Props) {
  const isEditMode = !!entityId;

  // Fetch existing data
  const { data: existingData } = useGetEntityById(entityId!, {
    enabled: isEditMode,
  });

  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();

  const form = useForm<EntityCreateSchema>({
    resolver: zodResolver(entityCreateSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (existingData) {
      form.reset({
        name: existingData.name,
        description: existingData.description,
      });
    }
  }, [existingData, form]);

  const onSubmit = (data: EntityCreateSchema) => {
    if (isEditMode) {
      updateMutation.mutate(
        { id: entityId, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* fields */}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

## Form Validation (Zod)

```typescript
// src/features/[feature]/validations.ts
import { z } from 'zod';

export const entityCreateSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('จำนวนต้องเป็นค่าบวก'),
  status: z.enum(['active', 'inactive']).default('active'),
  startDate: z.coerce.date().optional(),
});

export type EntityCreateSchema = z.infer<typeof entityCreateSchema>;
```

## Key Patterns

### 1. Always use zodResolver

```tsx
const form = useForm({
  resolver: zodResolver(schema),  // สำคัญ!
  defaultValues: { ... },
});
```

### 2. Reset form on success

```tsx
onSuccess: () => {
  form.reset();
  onOpenChange(false);
};
```

### 3. Disable submit while pending

```tsx
<Button type="submit" disabled={mutation.isPending}>
  {mutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
</Button>
```

### 4. Handle number inputs

```tsx
onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
```

### 5. Populate form for edit mode

```tsx
useEffect(() => {
  if (existingData) {
    form.reset(existingData);
  }
}, [existingData, form]);
```
