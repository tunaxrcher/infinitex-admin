// src/features/dashboard/api.ts
import { apiFetch } from '@src/shared/lib/api';
import {
  type DashboardFiltersSchema,
  type DashboardSummary,
} from './validations';

export const dashboardApi = {
  getSummary: async (
    filters: DashboardFiltersSchema,
  ): Promise<{ success: boolean; data: DashboardSummary; message: string }> => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(`/api/dashboard?${searchParams}`);
    return response.json();
  },

  getMonthlyDetails: async (
    year: number,
    month: number,
    type:
      | 'loans'
      | 'payments'
      | 'interest-payments'
      | 'close-payments'
      | 'overdue',
  ): Promise<{ success: boolean; data: any[] }> => {
    const response = await apiFetch(
      `/api/dashboard/monthly-details?year=${year}&month=${month}&type=${type}`,
    );
    return response.json();
  },
};
