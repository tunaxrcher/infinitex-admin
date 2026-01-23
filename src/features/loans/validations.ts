// src/features/loans/validations.ts
import { z } from 'zod';

// ============================================
// LOAN FILTER SCHEMAS
// ============================================

export const loanFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(10000).optional().default(10), // เพิ่ม max เป็น 10000
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED']).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type LoanFiltersSchema = z.infer<typeof loanFiltersSchema>;

// ============================================
// TITLE DEED SCHEMA (for multiple deeds support)
// ============================================

export const titleDeedSchema = z.object({
  id: z.string().optional(), // สำหรับ edit mode
  imageUrl: z.string().optional(),
  imageKey: z.string().optional(),
  deedNumber: z.string().optional(), // เลขที่โฉนด/ระวาง
  provinceName: z.string().optional(),
  amphurName: z.string().optional(),
  parcelNo: z.string().optional(), // เลขที่โฉนด
  landAreaText: z.string().optional(), // เนื้อที่ เช่น "2 ไร่ 1 งาน 50 ตร.ว."
  ownerName: z.string().optional(), // ชื่อเจ้าของในโฉนด
  landType: z.string().optional(), // ประเภทที่ดิน
  titleDeedData: z.any().optional(), // ข้อมูลดิบจาก API
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  linkMap: z.string().optional(),
  sortOrder: z.number().optional().default(0),
  isPrimary: z.boolean().optional().default(false),
});

export type TitleDeedSchema = z.infer<typeof titleDeedSchema>;

// ============================================
// CREATE/UPDATE SCHEMAS
// ============================================

export const loanCreateSchema = z.object({
  // ข้อมูลพื้นฐาน
  customerName: z.string().min(1, 'กรุณากรอกชื่อลูกค้า'),
  ownerName: z.string().optional(), // ชื่อเจ้าของที่ดิน (user input)
  placeName: z.string().optional(),
  landNumber: z.string().optional(), // ไม่บังคับแล้ว เพราะข้อมูลอยู่ใน titleDeeds
  landArea: z.string().optional(), // ไม่บังคับแล้ว เพราะข้อมูลอยู่ใน titleDeeds
  loanStartDate: z.string().min(1, 'กรุณาเลือกวันที่ออกสินเชื่อ'),
  loanDueDate: z.string().min(1, 'กรุณาเลือกกำหนดชำระสินเชื่อ'),
  loanAmount: z.number().min(0, 'ยอดสินเชื่อต้องมากกว่า 0'),

  // โหมดโฉนด (เดี่ยว/หลายใบ)
  deedMode: z.enum(['SINGLE', 'MULTIPLE']).optional().default('SINGLE'),

  // ข้อมูลโฉนด (รองรับหลายโฉนด)
  titleDeeds: z.array(titleDeedSchema).optional(), // ข้อมูลโฉนดทั้งหมด
  totalPropertyValue: z.number().optional(), // มูลค่ารวมของทุกโฉนด

  // ข้อมูลทรัพย์สิน (backward compatibility)
  propertyValue: z.number().optional(), // มูลค่าทรัพย์ประเมิน
  requestedAmount: z.number().optional(), // วงเงินที่ขอ (ถ้าไม่ระบุจะใช้ loanAmount)
  maxApprovedAmount: z.number().optional(), // วงเงินสูงสุดที่อนุมัติได้

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

  // ไฟล์อัพโหลด (backward compatibility - สำหรับโฉนดเดี่ยว)
  titleDeedImages: z.array(z.string()).optional(), // URL ของรูปโฉนดทั้งหมด
  existingImageUrls: z.array(z.string()).optional(), // URL ของรูปโฉนดที่มีอยู่แล้ว
  supportingImages: z.array(z.string()).optional(), // URL ของรูปเพิ่มเติมทั้งหมด
  existingSupportingImageUrls: z.array(z.string()).optional(), // URL ของรูปเพิ่มเติมที่มีอยู่แล้ว
  idCardImage: z.string().optional(), // URL ของรูปบัตรประชาชน

  // ข้อมูลโฉนดจาก API (backward compatibility - สำหรับโฉนดเดี่ยว)
  titleDeedData: z.any().optional(), // ข้อมูลโฉนดทั้งชุดจาก API
});

export type LoanCreateSchema = z.infer<typeof loanCreateSchema>;

export const loanUpdateSchema = loanCreateSchema.partial();

export type LoanUpdateSchema = z.infer<typeof loanUpdateSchema>;

// ============================================
// PAYMENT FILTER SCHEMAS
// ============================================

export const paymentFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(10000).optional().default(10),
  status: z.string().optional(),
  search: z.string().optional(),
  loanId: z.string().optional(),
  userId: z.string().optional(),
  paymentMethod: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PaymentFiltersSchema = z.infer<typeof paymentFiltersSchema>;

// ============================================
// INSTALLMENT PAYMENT
// ============================================

export const payInstallmentSchema = z.object({
  loanId: z.string().min(1, 'กรุณาระบุรหัสสินเชื่อ'),
  installmentId: z.string().min(1, 'กรุณาระบุรหัสงวดชำระ'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  paymentMethod: z.enum(
    ['CASH', 'QR_CODE', 'BARCODE', 'INTERNET_BANKING', 'BANK_TRANSFER'],
    {
      errorMap: () => ({ message: 'กรุณาเลือกช่องทางการชำระเงิน' }),
    },
  ),

  // บัญชีสำหรับรับชำระ
  landAccountId: z.string().min(1, 'กรุณาเลือกบัญชีรับชำระ'),

  // Optional fields based on payment method
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  transactionId: z.string().optional(),

  // Late payment handling
  includeLateFee: z.boolean().optional().default(false),
  lateFeeAmount: z.number().optional().default(0),
});

export type PayInstallmentSchema = z.infer<typeof payInstallmentSchema>;

// ============================================
// LOAN CLOSURE (PAYOFF)
// ============================================

export const closeLoanSchema = z.object({
  loanId: z.string().min(1, 'กรุณาระบุรหัสสินเชื่อ'),
  paymentMethod: z.enum(
    ['CASH', 'QR_CODE', 'BARCODE', 'INTERNET_BANKING', 'BANK_TRANSFER'],
    {
      errorMap: () => ({ message: 'กรุณาเลือกช่องทางการชำระเงิน' }),
    },
  ),

  // บัญชีสำหรับรับชำระ
  landAccountId: z.string().min(1, 'กรุณาเลือกบัญชีรับชำระ'),

  // Optional fields based on payment method
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  transactionId: z.string().optional(),

  // Early closure might have discount or additional fees
  discountAmount: z.number().optional().default(0),
  additionalFees: z.number().optional().default(0),
  notes: z.string().optional(),

  // Custom amount - if provided, use this instead of calculated principal
  customAmount: z.number().optional(),
});

export type CloseLoanSchema = z.infer<typeof closeLoanSchema>;

// ============================================
// PAYMENT VERIFICATION
// ============================================

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'กรุณาระบุรหัสการชำระเงิน'),
  status: z.enum(['COMPLETED', 'FAILED'], {
    errorMap: () => ({ message: 'สถานะไม่ถูกต้อง' }),
  }),
  transactionId: z.string().optional(),
  paidDate: z.string().optional(),
  verificationNotes: z.string().optional(),
});

export type VerifyPaymentSchema = z.infer<typeof verifyPaymentSchema>;

// ============================================
// PAYMENT CREATION
// ============================================

export const paymentCreateSchema = z.object({
  userId: z.string().min(1, 'กรุณาระบุรหัสผู้ใช้'),
  loanId: z.string().min(1, 'กรุณาระบุรหัสสินเชื่อ'),
  installmentId: z.string().optional(),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  paymentMethod: z.enum([
    'CASH',
    'QR_CODE',
    'BARCODE',
    'INTERNET_BANKING',
    'BANK_TRANSFER',
  ]),
  dueDate: z.string(),

  // Payment breakdown
  principalAmount: z.number().optional().default(0),
  interestAmount: z.number().optional().default(0),
  feeAmount: z.number().optional().default(0),

  // Optional fields
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  qrCode: z.string().optional(),
  barcodeNumber: z.string().optional(),
});

export type PaymentCreateSchema = z.infer<typeof paymentCreateSchema>;

// ============================================
// PAYMENT UPDATE
// ============================================

export const paymentUpdateSchema = paymentCreateSchema.partial();

export type PaymentUpdateSchema = z.infer<typeof paymentUpdateSchema>;

// Manual lookup schema
export const manualLookupSchema = z.object({
  pvCode: z.string().min(1, 'กรุณาเลือกจังหวัด'),
  amCode: z.string().min(1, 'กรุณาเลือกอำเภอ'),
  parcelNo: z.string().min(1, 'กรุณากรอกเลขโฉนด'),
});

export type ManualLookupSchema = z.infer<typeof manualLookupSchema>;
