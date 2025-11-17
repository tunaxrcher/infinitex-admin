// src/features/dashboard/hooks.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';
import { type DashboardFiltersSchema } from './validations';

export const dashboardKeys = {
  all: () => ['dashboard'] as const,
  summary: (filters?: DashboardFiltersSchema) =>
    ['dashboard', 'summary', filters] as const,
};

export const useGetDashboardSummary = (filters: DashboardFiltersSchema) => {
  return useQuery({
    queryKey: dashboardKeys.summary(filters),
    queryFn: () => dashboardApi.getSummary(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    gcTime: 0,
  });
};
