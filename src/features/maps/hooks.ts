// src/features/maps/hooks.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { MapApiResponse, MapFilters } from './types';

const API_BASE = '/api/maps';

/**
 * Build query string from filters
 */
function buildQueryString(filters: MapFilters): string {
  const params = new URLSearchParams();

  if (filters.province) params.set('province', filters.province);
  if (filters.amphur) params.set('amphur', filters.amphur);
  if (filters.source) params.set('source', filters.source);
  if (filters.priceMin !== undefined)
    params.set('priceMin', filters.priceMin.toString());
  if (filters.priceMax !== undefined)
    params.set('priceMax', filters.priceMax.toString());
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page !== undefined) params.set('page', filters.page.toString());
  // Use !== undefined because limit=0 means "fetch all"
  if (filters.limit !== undefined)
    params.set('limit', filters.limit.toString());

  return params.toString();
}

/**
 * Fetch map properties
 */
async function fetchMapProperties(
  filters: MapFilters,
): Promise<MapApiResponse> {
  const queryString = buildQueryString(filters);
  const url = `${API_BASE}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch map properties');
  }

  return response.json();
}

/**
 * Hook to fetch map properties with filters
 */
export function useMapProperties(filters: MapFilters = {}) {
  return useQuery({
    queryKey: ['maps', filters],
    queryFn: () => fetchMapProperties(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
