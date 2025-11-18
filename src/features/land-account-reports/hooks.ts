// src/features/land-account-reports/hooks.ts
import { useQuery } from '@tanstack/react-query';
import { landAccountReportApi } from './api';
import { type LandAccountReportFiltersSchema } from './validations';

export const landAccountReportKeys = {
  all: () => ['landAccountReports'] as const,
  list: (filters?: LandAccountReportFiltersSchema) =>
    ['landAccountReports', 'list', filters] as const,
  detail: (id: string) => ['landAccountReports', 'detail', id] as const,
};

export const useGetLandAccountReportList = (
  filters: LandAccountReportFiltersSchema,
) => {
  return useQuery({
    queryKey: landAccountReportKeys.list(filters),
    queryFn: () => landAccountReportApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useGetLandAccountReportById = (id: string) => {
  return useQuery({
    queryKey: landAccountReportKeys.detail(id),
    queryFn: () => landAccountReportApi.getById(id),
    enabled: !!id,
  });
};
