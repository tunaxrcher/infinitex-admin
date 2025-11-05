// src/features/loans/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { loanApi } from './api';
import { type LoanFiltersSchema, type LoanCreateSchema, type LoanUpdateSchema } from './validations';

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
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(variables.id) });
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
    mutationFn: (id: string) => loanApi.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['loans', 'list'] });
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(id) });
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
      queryClient.invalidateQueries({ queryKey: loanKeys.detail(variables.id) });
      queryClient.refetchQueries({ queryKey: ['loans', 'list'] });
      toast.success('ยกเลิกสินเชื่อสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

