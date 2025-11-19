// src/features/real-investment/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { realInvestmentApi } from './api';
import { type InvestmentUpdateSchema } from './validations';

export const realInvestmentKeys = {
  all: () => ['realInvestment'] as const,
  current: () => ['realInvestment', 'current'] as const,
};

export const useGetCurrentInvestment = () => {
  return useQuery({
    queryKey: realInvestmentKeys.current(),
    queryFn: () => realInvestmentApi.getCurrent(),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useUpdateInvestment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvestmentUpdateSchema) =>
      realInvestmentApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realInvestmentKeys.all() });
      queryClient.refetchQueries({ queryKey: realInvestmentKeys.current() });
      toast.success('อัปเดตทุนสำเร็จ');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    },
  });
};
