// src/features/documents/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  documentApi,
  documentTitleListApi,
  incomeExpenseReportApi,
} from './api';
import {
  type DocumentCreateSchema,
  type DocumentFiltersSchema,
  type DocumentTitleListFiltersSchema,
  type DocumentUpdateSchema,
  type GenerateDocNumberSchema,
  type IncomeExpenseReportFiltersSchema,
} from './validations';

// ============================================
// DOCUMENT QUERY KEYS
// ============================================

export const documentKeys = {
  all: () => ['documents'] as const,
  list: (filters?: DocumentFiltersSchema) =>
    ['documents', 'list', filters] as const,
  detail: (id: string) => ['documents', 'detail', id] as const,
};

export const documentTitleListKeys = {
  all: () => ['documentTitleLists'] as const,
  list: (filters?: DocumentTitleListFiltersSchema) =>
    ['documentTitleLists', 'list', filters] as const,
};

export const incomeExpenseReportKeys = {
  all: () => ['incomeExpenseReport'] as const,
  monthly: (filters?: IncomeExpenseReportFiltersSchema) =>
    ['incomeExpenseReport', 'monthly', filters] as const,
};

// ============================================
// DOCUMENT HOOKS
// ============================================

export const useGetDocumentList = (filters: DocumentFiltersSchema) => {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => documentApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useGetDocumentById = (id: string) => {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentCreateSchema) => documentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
      queryClient.invalidateQueries({
        queryKey: ['landAccountReports', 'list'],
      });
      queryClient.invalidateQueries({ queryKey: ['landAccounts', 'list'] });
      queryClient.refetchQueries({ queryKey: ['documents', 'list'] });
      toast.success('บันทึกใบสำคัญสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdateSchema }) =>
      documentApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: ['landAccountReports', 'list'],
      });
      queryClient.invalidateQueries({ queryKey: ['landAccounts', 'list'] });
      queryClient.refetchQueries({ queryKey: ['documents', 'list'] });
      toast.success('แก้ไขใบสำคัญสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
      queryClient.invalidateQueries({
        queryKey: ['landAccountReports', 'list'],
      });
      queryClient.invalidateQueries({ queryKey: ['landAccounts', 'list'] });
      queryClient.refetchQueries({ queryKey: ['documents', 'list'] });
      toast.success('ลบใบสำคัญสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useGenerateDocNumber = () => {
  return useMutation({
    mutationFn: (data: GenerateDocNumberSchema) =>
      documentApi.generateDocNumber(data),
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

// ============================================
// DOCUMENT TITLE LIST HOOKS
// ============================================

export const useGetDocumentTitleList = (
  filters: DocumentTitleListFiltersSchema,
) => {
  return useQuery({
    queryKey: documentTitleListKeys.list(filters),
    queryFn: () => documentTitleListApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// ============================================
// INCOME/EXPENSE REPORT HOOKS
// ============================================

export const useGetIncomeExpenseReport = (
  filters: IncomeExpenseReportFiltersSchema,
) => {
  return useQuery({
    queryKey: incomeExpenseReportKeys.monthly(filters),
    queryFn: () => incomeExpenseReportApi.getMonthlyReport(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
