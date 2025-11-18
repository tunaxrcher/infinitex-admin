// src/features/land-account-reports/validations.ts
import { z } from 'zod';

// ============================================
// LAND ACCOUNT REPORT FILTER SCHEMAS
// ============================================

export const landAccountReportFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(10000).optional().default(10),
  landAccountId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type LandAccountReportFiltersSchema = z.infer<
  typeof landAccountReportFiltersSchema
>;
