// src/features/customers/hooks.ts
import { useQuery } from '@tanstack/react-query';
import { customerApi } from './api';

export const customerKeys = {
  all: () => ['customers'] as const,
  search: (query?: string) => ['customers', 'search', query] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
};

export const useSearchCustomers = (query?: string) => {
  return useQuery({
    queryKey: customerKeys.search(query),
    queryFn: () => customerApi.searchCustomers(query),
    enabled: (query?.length || 0) >= 3, // ค้นหาเมื่อพิมพ์อย่างน้อย 3 ตัวอักษร
    staleTime: 60000, // 1 minute
  });
};

export const useGetCustomerById = (id: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerApi.getById(id),
    enabled: !!id,
  });
};
