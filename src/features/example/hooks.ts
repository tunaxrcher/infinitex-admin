// src/features/[...feature]/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { entityApi } from '../api'
import { type EntityFiltersSchema, entityFiltersSchema } from '../validations'

export const entityKeys = {
  all: () => ['entity'] as const,
  list: (filters?: EntityFiltersSchema) => ['entity', 'list', filters] as const,
  detail: (id: number) => ['entity', 'detail', id] as const,
}

export const useGetEntityList = (filters: EntityFiltersSchema) => {
  return useQuery({
    queryKey: entityKeys.list(filters),
    queryFn: () => entityApi.getList(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    gcTime: 0,
  })
}

export const useToggleEntityStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: entityApi.toggleStatus,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.list() })
      toast.success('อัปเดตสถานะสำเร็จ')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด')
    },
  })
}

export const useDeleteEntity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: entityApi.deleteItem,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: entityKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: entityKeys.list() })
      toast.success('ลบรายการสำเร็จ')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'เกิดข้อผิดพลาด')
    },
  })
}
