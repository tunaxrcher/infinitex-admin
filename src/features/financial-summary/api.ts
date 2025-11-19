// src/features/financial-summary/api.ts
import { apiFetch } from '@src/shared/lib/api';

export const financialSummaryApi = {
  getSummary: async () => {
    const response = await apiFetch('/api/financial-summary');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};

