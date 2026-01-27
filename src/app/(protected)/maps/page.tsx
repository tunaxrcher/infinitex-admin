// src/app/(protected)/maps/page.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Container } from '@src/shared/components/common/container';
import { useMapProperties } from '@src/features/maps/hooks';
import { PropertyListings } from '@src/features/maps/components/PropertyListings';
import { MapProperty, MapFilters } from '@src/features/maps/types';
import { Skeleton } from '@src/shared/components/ui/skeleton';

// Dynamically import MapContainer to avoid SSR issues with mapbox-gl
const MapContainer = dynamic(
  () => import('@src/features/maps/components/MapContainer').then(mod => mod.MapContainer),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted rounded-3xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    ),
  }
);

export default function MapsPage() {
  const [filters, setFilters] = useState<MapFilters>({
    source: 'ALL',
    status: 'ALL',
    limit: 0, // 0 = fetch all (clustering handles large numbers)
  });
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | undefined>();
  
  // Fetch properties with filters
  const { data, isLoading } = useMapProperties({
    ...filters,
    province: selectedProvince,
  });

  const properties = useMemo(() => data?.data || [], [data]);
  const stats = useMemo(() => data?.stats, [data]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<MapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle province selection from map
  const handleProvinceSelect = useCallback((provinceName: string) => {
    setSelectedProvince(provinceName);
    setSelectedProperty(undefined);
  }, []);

  // Handle clear province filter
  const handleClearProvince = useCallback(() => {
    setSelectedProvince(undefined);
    setSelectedProperty(undefined);
  }, []);

  // Handle property selection
  const handlePropertyClick = useCallback((property: MapProperty) => {
    setSelectedProperty(property);
  }, []);

  return (
    <Container>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">
            แผนที่ทรัพย์
          </h1>
          <span className="text-sm text-muted-foreground">
            ค้นหาและดูทรัพย์ทั้งจากระบบและกรมบังคับคดีบนแผนที่
          </span>
        </div>

        {/* Main Content */}
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Left: Listings */}
          <div className="w-[40%] bg-card border rounded-xl overflow-hidden">
            <PropertyListings
              properties={properties}
              isLoading={isLoading}
              total={data?.meta?.total || 0}
              filters={filters}
              selectedProvince={selectedProvince}
              stats={stats}
              onFilterChange={handleFilterChange}
              onPropertyClick={handlePropertyClick}
              onClearProvince={handleClearProvince}
              selectedPropertyId={selectedProperty?.id}
            />
          </div>

          {/* Right: Map */}
          <div className="w-[60%] bg-card border rounded-3xl overflow-hidden">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <MapContainer
                properties={properties}
                selectedProperty={selectedProperty}
                provinceStats={stats?.provinceStats}
                onProvinceSelect={handleProvinceSelect}
                onPropertySelect={handlePropertyClick}
              />
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
