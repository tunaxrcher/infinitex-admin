// src/features/land-accounts/validations.ts
import { z } from 'zod';

// ============================================
// LAND ACCOUNT FILTER SCHEMAS
// ============================================

export const landAccountFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(10000).optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type LandAccountFiltersSchema = z.infer<typeof landAccountFiltersSchema>;

// ============================================
// CREATE/UPDATE SCHEMAS
// ============================================

export const landAccountCreateSchema = z.object({
  accountName: z.string().min(1, 'กรุณากรอกชื่อบัญชี'),
  accountBalance: z.number().optional().default(0),
});

export type LandAccountCreateSchema = z.infer<typeof landAccountCreateSchema>;

export const landAccountUpdateSchema = z.object({
  accountName: z.string().min(1, 'กรุณากรอกชื่อบัญชี').optional(),
  accountBalance: z.number().optional(),
});

export type LandAccountUpdateSchema = z.infer<typeof landAccountUpdateSchema>;

// ============================================
// ACCOUNT TRANSACTION SCHEMAS
// ============================================

export const accountTransferSchema = z.object({
  fromAccountId: z.string().min(1, 'กรุณาเลือกบัญชีต้นทาง'),
  toAccountId: z.string().min(1, 'กรุณาเลือกบัญชีปลายทาง'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  note: z.string().optional(),
});

export type AccountTransferSchema = z.infer<typeof accountTransferSchema>;

export const accountDepositSchema = z.object({
  accountId: z.string().min(1, 'กรุณาเลือกบัญชี'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  note: z.string().optional(),
});

export type AccountDepositSchema = z.infer<typeof accountDepositSchema>;

export const accountWithdrawSchema = z.object({
  accountId: z.string().min(1, 'กรุณาเลือกบัญชี'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  note: z.string().optional(),
});

export type AccountWithdrawSchema = z.infer<typeof accountWithdrawSchema>;

// ============================================
// LAND ACCOUNT LOG FILTER SCHEMAS
// ============================================

export const landAccountLogFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(10000).optional().default(10),
  landAccountId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type LandAccountLogFiltersSchema = z.infer<
  typeof landAccountLogFiltersSchema
>;
