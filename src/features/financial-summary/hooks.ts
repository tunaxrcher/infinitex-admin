// src/features/financial-summary/hooks.ts
import { useQuery } from '@tanstack/react-query';

import { financialSummaryApi } from './api';

export const financialSummaryKeys = {
  all: () => ['financialSummary'] as const,
  summary: () => ['financialSummary', 'summary'] as const,
};

export const useGetFinancialSummary = () => {
  return useQuery({
    queryKey: financialSummaryKeys.summary(),
    queryFn: () => financialSummaryApi.getSummary(),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

