// src/features/documents/api.ts
import { apiFetch } from '@src/shared/lib/api';
import {
  type DocumentCreateSchema,
  type DocumentFiltersSchema,
  type DocumentTitleListFiltersSchema,
  type DocumentUpdateSchema,
  type GenerateDocNumberSchema,
  type IncomeExpenseReportFiltersSchema,
} from './validations';

export const documentApi = {
  getList: async (filters: DocumentFiltersSchema) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(`/api/documents?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  getById: async (id: string) => {
    const response = await apiFetch(`/api/documents/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  create: async (data: DocumentCreateSchema) => {
    const response = await apiFetch(`/api/documents`, {
      method: 'POST',
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

  update: async (id: string, data: DocumentUpdateSchema) => {
    const response = await apiFetch(`/api/documents/${id}`, {
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
    const response = await apiFetch(`/api/documents/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  generateDocNumber: async (data: GenerateDocNumberSchema) => {
    const response = await apiFetch(`/api/documents/generate-number`, {
      method: 'POST',
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

// ============================================
// DOCUMENT TITLE LIST API
// ============================================

export const documentTitleListApi = {
  getList: async (filters: DocumentTitleListFiltersSchema) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(
      `/api/document-title-lists?${searchParams}`,
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};

// ============================================
// INCOME/EXPENSE REPORT API
// ============================================

export const incomeExpenseReportApi = {
  getMonthlyReport: async (filters: IncomeExpenseReportFiltersSchema) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(
      `/api/income-expense-report?${searchParams}`,
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  getMonthlyDetails: async (
    year: number,
    month: number,
    type: 'income-operation' | 'income-installment' | 'expense',
  ) => {
    const searchParams = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
      type,
    });

    const response = await apiFetch(
      `/api/income-expense-report/details?${searchParams}`,
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};
