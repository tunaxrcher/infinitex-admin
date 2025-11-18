// src/features/land-accounts/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { landAccountApi } from './api';
import {
  type AccountDepositSchema,
  type AccountTransferSchema,
  type AccountWithdrawSchema,
  type LandAccountCreateSchema,
  type LandAccountFiltersSchema,
  type LandAccountLogFiltersSchema,
  type LandAccountUpdateSchema,
} from './validations';

export const landAccountKeys = {
  all: () => ['landAccounts'] as const,
  list: (filters?: LandAccountFiltersSchema) => ['landAccounts', 'list', filters] as const,
  detail: (id: string) => ['landAccounts', 'detail', id] as const,
  logs: (filters?: LandAccountLogFiltersSchema) => ['landAccounts', 'logs', filters] as const,
};

export const useGetLandAccountList = (filters: LandAccountFiltersSchema) => {
  return useQuery({
    queryKey: landAccountKeys.list(filters),
    queryFn: () => landAccountApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useGetLandAccountById = (id: string) => {
  return useQuery({
    queryKey: landAccountKeys.detail(id),
    queryFn: () => landAccountApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateLandAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LandAccountCreateSchema) => landAccountApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landAccounts', 'list'] });
      queryClient.refetchQueries({ queryKey: ['landAccounts', 'list'] });
      toast.success('สร้างบัญชีสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useUpdateLandAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LandAccountUpdateSchema }) =>
      landAccountApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['landAccounts', 'list'] });
      queryClient.invalidateQueries({ queryKey: landAccountKeys.detail(variables.id) });
      queryClient.refetchQueries({ queryKey: ['landAccounts', 'list'] });
      toast.success('แก้ไขบัญชีสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useDeleteLandAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => landAccountApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: landAccountKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['landAccounts', 'list'] });
      queryClient.refetchQueries({ queryKey: ['landAccounts', 'list'] });
      toast.success('ลบบัญชีสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useTransferLandAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountTransferSchema) => landAccountApi.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landAccounts'] });
      queryClient.refetchQueries({ queryKey: ['landAccounts'] });
      toast.success('โอนเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useDepositLandAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountDepositSchema) => landAccountApi.deposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landAccounts'] });
      queryClient.refetchQueries({ queryKey: ['landAccounts'] });
      toast.success('เพิ่มเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useWithdrawLandAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountWithdrawSchema) => landAccountApi.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landAccounts'] });
      queryClient.refetchQueries({ queryKey: ['landAccounts'] });
      toast.success('ลดเงินสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};

export const useGetLandAccountLogs = (filters: LandAccountLogFiltersSchema) => {
  return useQuery({
    queryKey: landAccountKeys.logs(filters),
    queryFn: () => landAccountApi.getLogs(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

