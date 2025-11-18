// src/features/loans/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
// ============================================
// PAYMENT HOOKS
// ============================================

// Import payment API
import { loanApi, paymentApi } from './api';
import {
  type LoanCreateSchema,
  type LoanFiltersSchema,
  type LoanUpdateSchema,
} from './validations';

export const loanKeys = {
  all: () => ['loans'] as const,
  list: (filters?: LoanFiltersSchema) => ['loans', 'list', filters] as const,
  detail: (id: string) => ['loans', 'detail', id] as const,
};

export const useGetLoanList = (filters: LoanFiltersSchema) => {
  return useQuery({
    queryKey: loanKeys.list(filters),
    queryFn: () => loanApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds - ถือว่าข้อมูล fresh นาน 30 วินาที
    gcTime: 5 * 60 * 1000, // 5 minutes - เก็บ cache ไว้ 5 นาที
    refetchOnWindowFocus: false, // ไม่ refetch เมื่อกลับมาที่หน้าต่าง
    retry: 1, // ลองใหม่แค่ 1 ครั้งถ้า error
  });
};

export const useGetLoanById = (id: string) => {
  return useQuery({
    queryKey: loanKeys.detail(id),
    queryFn: () => loanApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoanCreateSchema) => loanApi.create(data),
    onSuccess: () => {
      // Invalidate all loan list queries (all filters)
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      // Refetch immediately
      queryClient.refetchQueries({ queryKey: ['loans', 'list'] });
      toast.success('สร้างสินเชื่อสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useUpdateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoanUpdateSchema }) =>
      loanApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all loan list queries
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({
        queryKey: loanKeys.detail(variables.id),
      });
      // Refetch immediately
      queryClient.refetchQueries({ queryKey: ['loans', 'list'] });
      toast.success('แก้ไขสินเชื่อสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loanApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: loanKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      // Refetch immediately
      queryClient.refetchQueries({ queryKey: ['loans', 'list'] });
      toast.success('ลบสินเชื่อสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useApproveLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, landAccountId }: { loanId: string; landAccountId: string }) =>
      loanApi.approve(loanId, landAccountId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(variables.loanId) });
      queryClient.invalidateQueries({ queryKey: ['landAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['landAccountReports'] });
      queryClient.refetchQueries({ queryKey: ['loans', 'list'] });
      toast.success('อนุมัติสินเชื่อสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useRejectLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes: string }) =>
      loanApi.reject(id, reviewNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({
        queryKey: loanKeys.detail(variables.id),
      });
      queryClient.refetchQueries({ queryKey: ['loans', 'list'] });
      toast.success('ยกเลิกสินเชื่อสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useGenerateInstallments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loanApi.generateInstallments(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(id) });
      queryClient.refetchQueries({ queryKey: loanKeys.detail(id) });
      toast.success('สร้างตารางผ่อนชำระสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

// Query keys for payments
export const paymentKeys = {
  all: () => ['payments'] as const,
  list: (filters?: any) => ['payments', 'list', filters] as const,
  detail: (id: string) => ['payments', 'detail', id] as const,
  byLoan: (loanId: string) => ['payments', 'by-loan', loanId] as const,
  upcoming: (limit?: number) => ['payments', 'upcoming', limit] as const,
  overdue: () => ['payments', 'overdue'] as const,
};

/**
 * Get list of payments with filters and pagination
 */
export const useGetPaymentList = (filters: any) => {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get payment by ID
 */
export const useGetPaymentById = (id: string) => {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentApi.getById(id),
    enabled: !!id,
  });
};

/**
 * Get payment history for a loan
 */
export const useGetPaymentsByLoanId = (loanId: string) => {
  return useQuery({
    queryKey: paymentKeys.byLoan(loanId),
    queryFn: () => paymentApi.getPaymentsByLoanId(loanId),
    enabled: !!loanId,
  });
};

/**
 * Get upcoming payments
 */
export const useGetUpcomingPayments = (limit?: number) => {
  return useQuery({
    queryKey: paymentKeys.upcoming(limit),
    queryFn: () => paymentApi.getUpcomingPayments(limit),
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get overdue payments
 */
export const useGetOverduePayments = () => {
  return useQuery({
    queryKey: paymentKeys.overdue(),
    queryFn: () => paymentApi.getOverduePayments(),
    staleTime: 60000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Pay a specific installment
 */
export const usePayInstallment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => paymentApi.payInstallment(data),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.all() });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.byLoan(variables.loanId),
      });

      // Refetch immediately
      queryClient.refetchQueries({ queryKey: paymentKeys.all() });
      queryClient.refetchQueries({ queryKey: ['loans'] });

      toast.success(data.message || 'สร้างรายการชำระเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

/**
 * Close/Payoff entire loan
 */
export const useCloseLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => paymentApi.closeLoan(data),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.all() });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.byLoan(variables.loanId),
      });

      // Refetch immediately
      queryClient.refetchQueries({ queryKey: paymentKeys.all() });
      queryClient.refetchQueries({ queryKey: ['loans'] });

      toast.success(data.message || 'สร้างรายการปิดสินเชื่อสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

/**
 * Verify payment (admin function)
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => paymentApi.verifyPayment(data),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: paymentKeys.all() });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(variables.paymentId),
      });

      // Refetch immediately
      queryClient.refetchQueries({ queryKey: paymentKeys.all() });
      queryClient.refetchQueries({ queryKey: ['loans'] });

      toast.success(data.message || 'ยืนยันการชำระเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

/**
 * Create a new payment (admin function)
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => paymentApi.create(data),
    onSuccess: () => {
      // Invalidate all payment list queries
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });

      // Refetch immediately
      queryClient.refetchQueries({ queryKey: ['payments', 'list'] });

      toast.success('สร้างรายการชำระเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

/**
 * Update a payment (admin function)
 */
export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      paymentApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all payment list queries
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(variables.id),
      });

      // Refetch immediately
      queryClient.refetchQueries({ queryKey: ['payments', 'list'] });

      toast.success('แก้ไขรายการชำระเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

/**
 * Delete a payment (only if pending)
 */
export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: paymentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['payments', 'list'] });

      // Refetch immediately
      queryClient.refetchQueries({ queryKey: ['payments', 'list'] });

      toast.success('ลบรายการชำระเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};
