---
description: "Naming conventions และ code style สำหรับ Infinitex Admin"
alwaysApply: true
---

# Infinitex Coding Standards

## ภาษาและการสื่อสาร

### ใช้ภาษาไทย:
- Error messages: `'ไม่พบข้อมูล'`, `'เกิดข้อผิดพลาด'`
- Toast notifications: `'บันทึกสำเร็จ'`, `'ลบรายการสำเร็จ'`
- Validation messages: `'กรุณากรอกชื่อ'`
- User-facing labels และ text

### ใช้ภาษาอังกฤษ:
- Variable names, function names, class names
- Technical comments
- Code documentation

## Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Variables, functions | camelCase | `getUserList`, `loanData` |
| Components, classes, types | PascalCase | `LoanCard`, `UserRepository` |
| File names | kebab-case | `loan-list.tsx`, `user-service.ts` |
| API routes | kebab-case | `/api/loan-payment/[id]` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Entity (singular) | camelCase | `loan`, `customer` |
| Collections (plural) | camelCase | `loans`, `customers` |

### Naming Patterns

```typescript
// API Object
loanApi              // ไม่ใช่ LoanApi หรือ loan_api

// Hooks
useGetLoanList       // use + Get + Entity + Action
useCreateLoan
useUpdateLoan
useDeleteLoan

// Repository
LoanRepository       // PascalCase class
loanRepository       // camelCase instance

// Service
loanService          // camelCase object

// Schemas
loanCreateSchema     // camelCase + Schema suffix
LoanCreateSchema     // PascalCase type (z.infer)

// Keys
loanKeys             // for React Query keys
```

## Code Style

### Prettier Config (inferred from codebase)
- Single quotes for imports
- Semicolons at end of statements
- 2 spaces indentation
- Trailing commas in multiline

### TypeScript
- Strict mode enabled
- Use `type` for object shapes, `interface` for extensible contracts
- Prefer `type` imports: `import { type EntitySchema } from './validations'`

### Imports Order
```typescript
// 1. External packages
import { NextRequest, NextResponse } from 'next/server';
import { useMutation, useQuery } from '@tanstack/react-query';

// 2. Shared modules
import { apiFetch } from '@src/shared/lib/api';
import { prisma } from '@src/shared/lib/db';

// 3. Feature modules (relative)
import { loanService } from './services/server';
import { type LoanCreateSchema } from './validations';

// 4. Types (type-only imports last)
import type { Loan } from '@prisma/client';
```

## Error Messages (ภาษาไทย)

```typescript
// Common errors
'ไม่พบข้อมูล'
'เกิดข้อผิดพลาด'
'ไม่มีสิทธิ์ดำเนินการ'
'ข้อมูลซ้ำ'
'กรุณาลองใหม่อีกครั้ง'

// Validation errors
'กรุณากรอกชื่อ'
'รูปแบบอีเมลไม่ถูกต้อง'
'เบอร์โทรศัพท์ไม่ถูกต้อง'
'จำนวนต้องเป็นค่าบวก'

// Success messages
'บันทึกสำเร็จ'
'สร้างรายการสำเร็จ'
'แก้ไขรายการสำเร็จ'
'ลบรายการสำเร็จ'
'อัปเดตสถานะสำเร็จ'
```

## File Naming Examples

```
src/features/loans/
├── api.ts                    # loanApi object
├── hooks.ts                  # useGetLoanList, useCreateLoan
├── validations.ts            # loanCreateSchema, LoanCreateSchema
├── repositories/
│   └── loanRepository.ts     # LoanRepository class, loanRepository instance
├── services/
│   └── server.ts             # loanService object
└── components/
    ├── loan-list.tsx         # LoanList component
    ├── loan-form.tsx         # LoanForm component
    └── loan-card.tsx         # LoanCard component
```
