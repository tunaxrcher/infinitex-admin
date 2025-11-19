// src/features/real-investment/api.ts
import { apiFetch } from '@src/shared/lib/api';
import { type InvestmentUpdateSchema } from './validations';

export const realInvestmentApi = {
  getCurrent: async () => {
    const response = await apiFetch('/api/real-investment');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  update: async (data: InvestmentUpdateSchema) => {
    const response = await apiFetch('/api/real-investment', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};
