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

  create: async (
    data: LoanCreateSchema & {
      titleDeedFiles?: File[];
      existingImageUrls?: string[];
      supportingFiles?: File[];
      existingSupportingImageUrls?: string[];
      idCardFile?: File | null;
    },
  ) => {
    // Create FormData to send files along with loan data
    const formData = new FormData();

    // Append all form fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'titleDeedFiles' && Array.isArray(value)) {
        // Append title deed files
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append('titleDeedFiles', file);
          }
        });
      } else if (key === 'supportingFiles' && Array.isArray(value)) {
        // Append supporting files
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append('supportingFiles', file);
          }
        });
      } else if (key === 'idCardFile' && value instanceof File) {
        // Append ID card file
        formData.append('idCardFile', value);
      } else if (key === 'existingImageUrls' && Array.isArray(value)) {
        // Append existing title deed image URLs as JSON array
        formData.append('existingImageUrls', JSON.stringify(value));
      } else if (
        key === 'existingSupportingImageUrls' &&
        Array.isArray(value)
      ) {
        // Append existing supporting image URLs as JSON array
        formData.append('existingSupportingImageUrls', JSON.stringify(value));
      } else if (
        key === 'titleDeedData' &&
        value !== undefined &&
        value !== null
      ) {
        // Append titleDeedData as JSON string
        formData.append('titleDeedData', JSON.stringify(value));
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

  update: async (
    id: string,
    data: LoanUpdateSchema & {
      titleDeedFiles?: File[];
      existingImageUrls?: string[];
      supportingFiles?: File[];
      existingSupportingImageUrls?: string[];
      idCardFile?: File | null;
    },
  ) => {
    // Create FormData to send files along with loan data
    const formData = new FormData();

    // Append all form fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'titleDeedFiles' && Array.isArray(value)) {
        // Append title deed files
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append('titleDeedFiles', file);
          }
        });
      } else if (key === 'supportingFiles' && Array.isArray(value)) {
        // Append supporting files
        value.forEach((file) => {
          if (file instanceof File) {
            formData.append('supportingFiles', file);
          }
        });
      } else if (key === 'idCardFile' && value instanceof File) {
        // Append ID card file
        formData.append('idCardFile', value);
      } else if (key === 'existingImageUrls' && Array.isArray(value)) {
        // Append existing title deed image URLs as JSON array
        formData.append('existingImageUrls', JSON.stringify(value));
      } else if (
        key === 'existingSupportingImageUrls' &&
        Array.isArray(value)
      ) {
        // Append existing supporting image URLs as JSON array
        formData.append('existingSupportingImageUrls', JSON.stringify(value));
      } else if (
        key === 'titleDeedData' &&
        value !== undefined &&
        value !== null
      ) {
        // Append titleDeedData as JSON string
        formData.append('titleDeedData', JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await apiFetch(`/api/loans/${id}`, {
      method: 'PUT',
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      body: formData,
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

  approve: async (id: string, landAccountId: string) => {
    const response = await apiFetch(`/api/loans/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ landAccountId }),
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

// ============================================
// PAYMENT APIs
// ============================================

export const paymentApi = {
  /**
   * Get list of payments with filters
   */
  getList: async (filters: any) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await apiFetch(`/api/loan-payment?${searchParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  /**
   * Get payment by ID
   */
  getById: async (id: string) => {
    const response = await apiFetch(`/api/loan-payment/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  /**
   * Pay a specific installment
   */
  payInstallment: async (data: any) => {
    const response = await apiFetch(`/api/loan-payment/pay-installment`, {
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

  /**
   * Close/Payoff entire loan
   */
  closeLoan: async (data: any) => {
    const response = await apiFetch(`/api/loan-payment/close-loan`, {
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

  /**
   * Verify payment (admin function)
   */
  verifyPayment: async (data: any) => {
    const response = await apiFetch(`/api/loan-payment/verify`, {
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

  /**
   * Get payment history for a loan
   */
  getPaymentsByLoanId: async (loanId: string) => {
    const response = await apiFetch(`/api/loan-payment/by-loan/${loanId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  /**
   * Get upcoming payments for current user
   */
  getUpcomingPayments: async (limit?: number) => {
    const searchParams = new URLSearchParams();
    if (limit) {
      searchParams.append('limit', limit.toString());
    }

    const response = await apiFetch(
      `/api/loan-payment/upcoming?${searchParams}`,
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  /**
   * Get overdue payments for current user
   */
  getOverduePayments: async () => {
    const response = await apiFetch(`/api/loan-payment/overdue`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },

  /**
   * Create a new payment (admin function)
   */
  create: async (data: any) => {
    const response = await apiFetch(`/api/loan-payment`, {
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

  /**
   * Update a payment (admin function)
   */
  update: async (id: string, data: any) => {
    const response = await apiFetch(`/api/loan-payment/${id}`, {
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

  /**
   * Delete a payment (only if pending)
   */
  delete: async (id: string) => {
    const response = await apiFetch(`/api/loan-payment/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'เกิดข้อผิดพลาด');
    }
    return response.json();
  },
};
