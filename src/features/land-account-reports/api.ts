// src/features/land-account-reports/api.ts
import { apiFetch } from '@src/shared/lib/api';
import { type LandAccountReportFiltersSchema } from './validations';

export const landAccountReportApi = {
  getList: async (filters: LandAccountReportFiltersSchema) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(
      `/api/land-accounts/reports?${searchParams}`,
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/api/land-accounts/reports/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};
