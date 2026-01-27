// src/app/(fullscreen)/maps/page.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMapProperties } from '@src/features/maps/hooks';
import { PropertyListings } from '@src/features/maps/components/PropertyListings';
import { MapProperty, MapFilters } from '@src/features/maps/types';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { Button } from '@src/shared/components/ui/button';
import { KeenIcon } from '@src/shared/components/keenicons';

// Dynamically import MapContainer to avoid SSR issues with mapbox-gl
const MapContainer = dynamic(
  () => import('@src/features/maps/components/MapContainer').then(mod => mod.MapContainer),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    ),
  }
);

export default function MapsFullscreenPage() {
  const [filters, setFilters] = useState<MapFilters>({
    source: 'ALL',
    status: 'ALL',
    limit: 0,
  });
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | undefined>();
  const [showListings, setShowListings] = useState(true);
  
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
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Sidebar Listings - Collapsible */}
      <div 
        className={`
          h-full bg-card border-r transition-all duration-300 flex flex-col
          ${showListings ? 'w-[380px]' : 'w-0'}
        `}
      >
        {showListings && (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <KeenIcon icon="arrow-left" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    แผนที่ทรัพย์
                  </h1>
                  <span className="text-xs text-muted-foreground">
                    FINX & LED Properties
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowListings(false)}
                className="rounded-full"
              >
                <KeenIcon icon="double-arrow-left" />
              </Button>
            </div>

            {/* Listings */}
            <div className="flex-1 overflow-hidden">
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
          </>
        )}
      </div>

      {/* Map - Full Width */}
      <div className="flex-1 h-full relative">
        {/* Toggle Listings Button */}
        {!showListings && (
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setShowListings(true)}
            className="absolute top-4 left-4 z-20 gap-2 shadow-lg"
          >
            <KeenIcon icon="double-arrow-right" />
            แสดงรายการ
          </Button>
        )}

        {/* Back to Dashboard Button (when listings hidden) */}
        {!showListings && (
          <Link href="/dashboard">
            <Button 
              variant="secondary"
              size="icon"
              className="absolute top-4 left-40 z-20 shadow-lg rounded-full"
            >
              <KeenIcon icon="home-2" />
            </Button>
          </Link>
        )}

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
  );
}
