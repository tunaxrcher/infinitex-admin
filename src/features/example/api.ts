// src/features/[...feature]/api.ts
import { api } from '@src/shared//lib/api-client'

import { featureService } from './services/server'

export const entityApi = {
  getList: async (filters: any): ReturnType<typeof featureService.getList> => {
    const searchParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })

    return api.get(`/api/entity?${searchParams}`)
  },

  getById: async (id: number): Promise<any> => {
    return api.get(`/api/entity/${id}`)
  },

  create: async (data: any): Promise<any> => {
    return api.post(`/api/entity`, data)
  },

  update: async (id: number, data: any): Promise<any> => {
    return api.put(`/api/entity/${id}`, data)
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/entity/${id}`)
  },

  toggleStatus: async (id: number): Promise<void> => {
    return api.patch(`/api/entity/${id}/toggle-status`)
  },
}
