// src/features/loans/api.ts
import { apiFetch } from '@src/shared/lib/api';
import {
  type LoanCreateSchema,
  type LoanFiltersSchema,
  type LoanUpdateSchema,
} from './validations';

export const loanApi = {
  getList: async (filters: LoanFiltersSchema) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(`/api/loans?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/api/loans/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  create: async (data: LoanCreateSchema & { titleDeedFiles?: File[] }) => {
    // Create FormData to send files along with loan data
    const formData = new FormData();

    // Append all form fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'titleDeedFiles' && Array.isArray(value)) {
        // Append files
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append('titleDeedFiles', file);
          }
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await apiFetch(`/api/loans`, {
      method: 'POST',
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  update: async (id: string, data: LoanUpdateSchema) => {
    const response = await apiFetch(`/api/loans/${id}`, {
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

  delete: async (id: string) => {
    const response = await apiFetch(`/api/loans/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  approve: async (id: string) => {
    const response = await apiFetch(`/api/loans/${id}/approve`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  reject: async (id: string, reviewNotes: string) => {
    const response = await apiFetch(`/api/loans/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviewNotes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  generateInstallments: async (id: string) => {
    const response = await apiFetch(`/api/loans/${id}/generate-installments`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};
