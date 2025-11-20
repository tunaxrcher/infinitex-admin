// src/features/customers/api.ts
import { apiFetch } from '@src/shared/lib/api';

export const customerApi = {
  searchCustomers: async (query?: string) => {
    const searchParams = new URLSearchParams();
    if (query) {
      searchParams.append('query', query);
    }

    const response = await apiFetch(`/api/customers/search?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};
