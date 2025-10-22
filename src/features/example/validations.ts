// src/features/[...feature]/validations.ts
import { baseTableSchema } from '@src/shared//validations/pagination';
import { z } from 'zod';

export const featureFiltersSchema = baseTableSchema.object({
  action: z.string().optional(),
});

export type FeatureFiltersSchema = z.infer<typeof featureFiltersSchema>;
