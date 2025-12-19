---
description: 'Pattern สำหรับ React components ใน Infinitex Admin'
globs:
  - '**/components/**/*.tsx'
  - '**/app/**/*.tsx'
alwaysApply: false
---

# React Components Pattern

## โครงสร้าง Component พื้นฐาน

```tsx
'use client';

// เฉพาะ Client Components
import { useState } from 'react';
import { useGetLoanList } from '@src/features/loans/hooks';
import { Button } from '@src/shared/components/ui/button';

interface LoanCardProps {
  loanId: string;
  onEdit?: (id: string) => void;
  className?: string;
}

export function LoanCard({ loanId, onEdit, className }: LoanCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useGetLoanById(loanId);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  return <Card className={cn('p-4', className)}>{/* ... */}</Card>;
}
```

## Client vs Server Components

### Server Components (default)

```tsx
// ไม่ต้องมี 'use client'
// ใช้ได้: async/await, เรียก service โดยตรง
// ใช้ไม่ได้: useState, useEffect, event handlers

import { loanService } from '@src/features/loans/services/server';

export default async function LoansPage() {
  const loans = await loanService.getList({ page: 1, limit: 10 });

  return (
    <div>
      <LoanList initialData={loans} />
    </div>
  );
}
```

### Client Components

```tsx
'use client';  // บรรทัดแรก!

// ใช้ได้: useState, useEffect, hooks, event handlers
// ใช้ไม่ได้: async component, เรียก service โดยตรง

export function LoanList({ initialData }: Props) {
  const [filter, setFilter] = useState('');
  const { data } = useGetLoanList({ search: filter });

  return (/* ... */);
}
```

## Component Organization

### Feature Components

```
src/features/[feature]/components/
├── [entity]-list.tsx      # List/table component
├── [entity]-card.tsx      # Card component
├── [entity]-form.tsx      # Create/edit form
├── [entity]-detail.tsx    # Detail view
├── [entity]-dialog.tsx    # Dialog/modal
└── [entity]-filters.tsx   # Filter controls
```

### Naming Conventions

- **Files**: `kebab-case.tsx` (`loan-card.tsx`)
- **Components**: `PascalCase` (`LoanCard`)
- **Props Interface**: `ComponentNameProps` (`LoanCardProps`)

## Props Pattern

### Interface Definition

```tsx
interface LoanDialogProps {
  // Required props
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Optional props
  loanId?: string;
  mode?: 'create' | 'edit';
  className?: string;

  // Callbacks
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

### Destructuring with Defaults

```tsx
export function LoanDialog({
  open,
  onOpenChange,
  loanId,
  mode = 'create',
  className,
  onSuccess,
}: LoanDialogProps) {
  // ...
}
```

## State Management

### Local State

```tsx
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | undefined>();
```

### Server State (React Query)

```tsx
// ใช้ hooks จาก features
const { data, isLoading, error } = useGetLoanList(filters);
const createMutation = useCreateLoan();
```

## Loading & Error States

```tsx
// Loading
if (isLoading) {
  return <Skeleton className="h-20 w-full" />;
}

// Error
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

// Empty
if (!data || data.length === 0) {
  return <EmptyState message="ไม่พบข้อมูล" />;
}
```

## Event Handlers

```tsx
// Naming: handle + Action
const handleSubmit = (data: FormData) => {
  createMutation.mutate(data, {
    onSuccess: () => {
      onOpenChange(false);
    },
  });
};

const handleDelete = (id: string) => {
  if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
    deleteMutation.mutate(id);
  }
};
```

## Import Order

```tsx
// 1. React imports
'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
// 3. Feature hooks/utils
import { useCreateLoan, useGetLoanList } from '@src/features/loans/hooks';
import { loanCreateSchema } from '@src/features/loans/validations';
// 2. External libraries
import { useForm } from 'react-hook-form';
// 4. Shared components
import { Button } from '@src/shared/components/ui/button';
import { Card } from '@src/shared/components/ui/card';
// 5. Local/relative imports
import { LoanCard } from './loan-card';
```

## Common UI Components

```tsx
// Buttons
<Button variant="outline">ยกเลิก</Button>
<Button className="gradientButton">บันทึก</Button>
<Button disabled={isPending}>
  {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
</Button>

// Dialogs
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>หัวข้อ</DialogTitle>
      <DialogDescription>รายละเอียด</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        ยกเลิก
      </Button>
      <Button type="submit">บันทึก</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Badges
<Badge variant="success">อนุมัติ</Badge>
<Badge variant="warning">รออนุมัติ</Badge>
<Badge variant="destructive">ยกเลิก</Badge>
```
