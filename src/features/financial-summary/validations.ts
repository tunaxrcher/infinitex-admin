// src/features/financial-summary/validations.ts
import { z } from 'zod';

export const financialSummaryFiltersSchema = z.object({
  // สามารถเพิ่ม filters เพิ่มเติมได้ในอนาคต เช่น ช่วงวันที่
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type FinancialSummaryFiltersSchema = z.infer<
  typeof financialSummaryFiltersSchema
>;

