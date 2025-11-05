// src/features/loans/validations.ts
import { z } from 'zod';

// ============================================
// FILTER SCHEMAS
// ============================================

export const loanFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED']).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type LoanFiltersSchema = z.infer<typeof loanFiltersSchema>;

// ============================================
// CREATE/UPDATE SCHEMAS
// ============================================

export const loanCreateSchema = z.object({
  // ข้อมูลพื้นฐาน
  customerName: z.string().min(1, 'กรุณากรอกชื่อลูกค้า'),
  placeName: z.string().optional(),
  landNumber: z.string().min(1, 'กรุณากรอกเลขที่ดิน'),
  landArea: z.string().optional(),
  loanStartDate: z.string().min(1, 'กรุณาเลือกวันที่ออกสินเชื่อ'),
  loanDueDate: z.string().min(1, 'กรุณาเลือกกำหนดชำระสินเชื่อ'),
  loanAmount: z.number().min(0, 'ยอดสินเชื่อต้องมากกว่า 0'),

  // ข้อมูลลูกค้า
  fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  phoneNumber: z.string().min(1, 'กรุณากรอกเบอร์ติดต่อ'),
  idCard: z.string().min(1, 'กรุณากรอกเลขบัตรประชาชน'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),

  // ข้อมูลการคำนวณ
  loanYears: z.number().min(1, 'จำนวนปีต้องมากกว่า 0'),
  interestRate: z.number().min(0, 'ดอกเบี้ยต้องมากกว่าหรือเท่ากับ 0'),
  operationFee: z.number().min(0).optional().default(0),
  transferFee: z.number().min(0).optional().default(0),
  otherFee: z.number().min(0).optional().default(0),
  note: z.string().optional(),

  // ไฟล์อัพโหลด
  titleDeedImages: z.array(z.string()).optional(),
});

export type LoanCreateSchema = z.infer<typeof loanCreateSchema>;

export const loanUpdateSchema = loanCreateSchema.partial();

export type LoanUpdateSchema = z.infer<typeof loanUpdateSchema>;

