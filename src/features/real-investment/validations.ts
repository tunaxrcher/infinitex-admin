// src/features/real-investment/validations.ts
import { z } from 'zod';

// ============================================
// REAL INVESTMENT SCHEMAS
// ============================================

export const investmentUpdateSchema = z.object({
  operation: z.enum(['edit', 'add', 'subtract'], {
    required_error: 'กรุณาเลือกการดำเนินการ',
  }),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
});

export type InvestmentUpdateSchema = z.infer<typeof investmentUpdateSchema>;

