// src/features/documents/validations.ts
import { z } from 'zod';

// ============================================
// DOCUMENT FILTER SCHEMAS
// ============================================

export const documentFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(10000).optional().default(10),
  docType: z
    .enum(['RECEIPT', 'PAYMENT_VOUCHER', 'DISCOUNT_NOTE', 'EXPENSE'])
    .optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type DocumentFiltersSchema = z.infer<typeof documentFiltersSchema>;

// ============================================
// CREATE/UPDATE SCHEMAS
// ============================================

export const documentCreateSchema = z.object({
  docType: z.enum(['RECEIPT', 'PAYMENT_VOUCHER', 'DISCOUNT_NOTE', 'EXPENSE']),
  docNumber: z.string().min(1, 'กรุณากรอกเลขที่ใบสำคัญ'),
  docDate: z.string().min(1, 'กรุณาเลือกวันที่'),
  title: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  price: z.number().min(0, 'จำนวนเงินต้องมากกว่าหรือเท่ากับ 0'),
  cashFlowName: z.string().min(1, 'กรุณาเลือกบัญชีบริษัท'),
  note: z.string().optional(),
  filePath: z.string().optional(),
});

export type DocumentCreateSchema = z.infer<typeof documentCreateSchema>;

export const documentUpdateSchema = z.object({
  docDate: z.string().optional(),
  title: z.string().optional(),
  price: z.number().min(0).optional(),
  cashFlowName: z.string().optional(),
  note: z.string().optional(),
  filePath: z.string().optional(),
});

export type DocumentUpdateSchema = z.infer<typeof documentUpdateSchema>;

// ============================================
// DOCUMENT TITLE LIST FILTER SCHEMAS
// ============================================

export const documentTitleListFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(10000).optional().default(100),
  docType: z
    .enum(['RECEIPT', 'PAYMENT_VOUCHER', 'DISCOUNT_NOTE', 'EXPENSE'])
    .optional(),
  search: z.string().optional(),
});

export type DocumentTitleListFiltersSchema = z.infer<
  typeof documentTitleListFiltersSchema
>;

// ============================================
// INCOME/EXPENSE REPORT SCHEMAS
// ============================================

export const incomeExpenseReportFiltersSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  landAccountId: z.string().optional(),
});

export type IncomeExpenseReportFiltersSchema = z.infer<
  typeof incomeExpenseReportFiltersSchema
>;

// ============================================
// GENERATE DOCUMENT NUMBER SCHEMA
// ============================================

export const generateDocNumberSchema = z.object({
  docType: z.enum(['RECEIPT', 'PAYMENT_VOUCHER']),
  date: z.string().optional(), // YYYY-MM-DD format
});

export type GenerateDocNumberSchema = z.infer<typeof generateDocNumberSchema>;
