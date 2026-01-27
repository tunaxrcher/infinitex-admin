// src/app/(fullscreen)/maps/page.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMapProperties } from '@src/features/maps/hooks';
import { MapProperty, MapFilters } from '@src/features/maps/types';
import { KeenIcon } from '@src/shared/components/keenicons';

// Dynamically import MapContainer
const MapContainer = dynamic(
  () => import('@src/features/maps/components/MapContainer').then(mod => mod.MapContainer),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-500 border-t-transparent mx-auto mb-3" />
          <p className="text-gray-500 text-sm">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    ),
  }
);

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'area-asc' | 'area-desc' | 'discount-desc';

// Helper function to parse area string to number (in ตร.ว.)
function parseArea(sizeStr: string): number {
  if (!sizeStr) return 0;
  
  // Try to parse "X ไร่ Y งาน Z ตร.ว."
  const raiMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*ไร่/);
  const nganMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*งาน/);
  const waMatch = sizeStr.match(/(\d+(?:\.\d+)?)\s*(?:ตร\.?ว\.?|ตารางวา)/);
  
  let totalWa = 0;
  if (raiMatch) totalWa += parseFloat(raiMatch[1]) * 400; // 1 ไร่ = 400 ตร.ว.
  if (nganMatch) totalWa += parseFloat(nganMatch[1]) * 100; // 1 งาน = 100 ตร.ว.
  if (waMatch) totalWa += parseFloat(waMatch[1]);
  
  return totalWa;
}

export default function MapsFullscreenPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<MapFilters>({
    source: 'ALL',
    status: 'ALL',
    limit: 0,
  });
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>();
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [displayLimit, setDisplayLimit] = useState(50); // Number of items to show in list
  const [visiblePropertyIds, setVisiblePropertyIds] = useState<Set<string>>(new Set());
  
  const { data, isLoading } = useMapProperties({
    ...filters,
    province: selectedProvince,
    search: searchQuery || undefined,
  });

  const rawProperties = useMemo(() => data?.data || [], [data]);
  const stats = useMemo(() => data?.stats, [data]);
  const totalCount = stats ? stats.totalInternal + stats.totalLED : 0;

  // Sort properties based on selected sort option
  const sortedProperties = useMemo(() => {
    const sorted = [...rawProperties];
    
    switch (sortOption) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'area-asc':
        return sorted.sort((a, b) => parseArea(a.size) - parseArea(b.size));
      case 'area-desc':
        return sorted.sort((a, b) => parseArea(b.size) - parseArea(a.size));
      case 'discount-desc':
        // Calculate discount percentage: (appraisalPrice - price) / appraisalPrice
        return sorted.sort((a, b) => {
          const discountA = a.appraisalPrice && a.appraisalPrice > 0 
            ? (a.appraisalPrice - a.price) / a.appraisalPrice 
            : -Infinity;
          const discountB = b.appraisalPrice && b.appraisalPrice > 0 
            ? (b.appraisalPrice - b.price) / b.appraisalPrice 
            : -Infinity;
          return discountB - discountA; // Higher discount first
        });
      default:
        return sorted;
    }
  }, [rawProperties, sortOption]);

  // Filter to show only properties visible in map viewport (or all if no viewport filter)
  const displayProperties = useMemo(() => {
    if (visiblePropertyIds.size === 0) return sortedProperties;
    return sortedProperties.filter(p => visiblePropertyIds.has(p.id));
  }, [sortedProperties, visiblePropertyIds]);

  const handleFilterChange = useCallback((newFilters: Partial<MapFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setDisplayLimit(50); // Reset display limit when filters change
  }, []);

  // Handle visible properties change from map viewport
  const handleVisiblePropertiesChange = useCallback((visibleProps: MapProperty[]) => {
    setVisiblePropertyIds(new Set(visibleProps.map(p => p.id)));
    setDisplayLimit(50); // Reset display limit when viewport changes
  }, []);

  const handleProvinceSelect = useCallback((provinceName: string) => {
    setSelectedProvince(provinceName);
    setSelectedProperty(undefined);
  }, []);

  const handleClearProvince = useCallback(() => {
    setSelectedProvince(undefined);
    setSelectedProperty(undefined);
  }, []);

  const handlePropertyClick = useCallback((property: MapProperty) => {
    setSelectedProperty(property);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-100">
      {/* ===== HEADER ===== */}
      <header className="h-16 bg-white border-b border-gray-200 shrink-0 z-40">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center">
          {/* Back Button - Left */}
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            <KeenIcon icon="arrow-left" className="text-gray-700 text-lg" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search Box - Center */}
          <div className="w-full max-w-md">
            <div className="relative flex items-center">
              <svg 
                className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="ค้นหาทรัพย์, จังหวัด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white"
              />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Empty space for symmetry */}
          <div className="w-10" />
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map - Full Area */}
        <div className="absolute inset-0 z-0">
          <MapContainer
            properties={sortedProperties}
            selectedProperty={selectedProperty}
            provinceStats={stats?.provinceStats}
            onProvinceSelect={handleProvinceSelect}
            onPropertySelect={handlePropertyClick}
            onVisiblePropertiesChange={handleVisiblePropertiesChange}
          />
        </div>

        {/* ===== LEFT SIDE - Filters + Listings ===== */}
        <div className="absolute top-4 left-4 bottom-4 z-10 flex flex-col gap-3" style={{ width: '380px' }}>
          
          {/* Filters - Above Panel */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Source Filter */}
            <select
              value={filters.source || 'ALL'}
              onChange={(e) => handleFilterChange({ source: e.target.value as any })}
              className="h-9 px-3 pr-8 bg-white rounded-lg shadow-md text-sm text-gray-700 appearance-none cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="ALL">ทั้งหมด ({totalCount})</option>
              <option value="INTERNAL">FINX ({stats?.totalInternal || 0})</option>
              <option value="LED">LED ({stats?.totalLED || 0})</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status || 'ALL'}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              className="h-9 px-3 pr-8 bg-white rounded-lg shadow-md text-sm text-gray-700 appearance-none cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ขาย">ขาย</option>
              <option value="ขายแล้ว">ขายแล้ว</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortOption}
              onChange={(e) => { setSortOption(e.target.value as SortOption); setDisplayLimit(50); }}
              className="h-9 px-3 pr-8 bg-white rounded-lg shadow-md text-sm text-gray-700 appearance-none cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L2 4h8z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="default">เรียงตาม: ค่าเริ่มต้น</option>
              <option value="price-asc">ราคา (น้อย → มาก)</option>
              <option value="price-desc">ราคา (มาก → น้อย)</option>
              <option value="area-asc">พื้นที่ (น้อย → มาก)</option>
              <option value="area-desc">พื้นที่ (มาก → น้อย)</option>
              <option value="discount-desc">ถูกกว่าราคาตลาด</option>
            </select>

            {/* Province Badge */}
            {selectedProvince && (
              <span className="inline-flex items-center gap-2 bg-red-500 text-white text-sm h-9 px-3 rounded-lg shadow-md">
                <KeenIcon icon="geolocation" className="text-xs" />
                {selectedProvince}
                <button onClick={handleClearProvince} className="hover:bg-red-600 rounded-full p-0.5">
                  <KeenIcon icon="cross" className="text-xs" />
                </button>
              </span>
            )}
          </div>

          {/* Listings Panel */}
          <div className="flex-1 bg-white shadow-xl rounded-xl overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="h-12 px-4 flex items-center justify-between border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">รายการทรัพย์</span>
                <span className="text-sm text-gray-500">({displayProperties.length.toLocaleString()})</span>
              </div>
            </div>

            {/* Listings */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : displayProperties.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <KeenIcon icon="map" className="text-5xl text-gray-300 mb-4" />
                  <p className="text-gray-600 font-medium">ไม่พบทรัพย์ในพื้นที่นี้</p>
                  <p className="text-gray-500 text-sm mt-1">ลองเลื่อนหรือซูมแผนที่</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {displayProperties.slice(0, displayLimit).map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isSelected={selectedProperty?.id === property.id}
                      onClick={() => handlePropertyClick(property)}
                    />
                  ))}
                  {displayProperties.length > displayLimit ? (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-sm text-gray-500">
                        แสดง {displayLimit.toLocaleString()} จาก {displayProperties.length.toLocaleString()} รายการ
                      </p>
                      <button
                        onClick={() => setDisplayLimit(prev => Math.min(prev + 50, displayProperties.length))}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        โหลดเพิ่มอีก 50 รายการ
                      </button>
                    </div>
                  ) : displayProperties.length > 50 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      แสดงทั้งหมด {displayProperties.length.toLocaleString()} รายการ
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Property Card
function PropertyCard({ 
  property, 
  isSelected,
  onClick 
}: { 
  property: MapProperty;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const isSold = property.status === 'ขายแล้ว';
  const isLED = property.source === 'LED';

  return (
    <div
      onClick={onClick}
      className={`flex bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-red-500 shadow-md ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Image */}
      <div className="relative w-28 h-24 shrink-0 bg-gray-100">
        {property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <KeenIcon icon="picture" className="text-2xl text-gray-300" />
          </div>
        )}
        {/* Source Badge */}
        <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
          isLED ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {isLED ? 'LED' : 'FINX'}
        </span>
        {/* Sold Badge */}
        {isSold && (
          <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-gray-700 text-white px-1.5 py-0.5 rounded">
            ขายแล้ว
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-2.5 min-w-0">
        <h3 className="font-medium text-sm text-gray-800 line-clamp-2 leading-tight mb-1">
          {property.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-1 mb-2">
          📍 {property.location}
        </p>
        <p className={`font-bold text-sm ${isSold ? 'text-gray-500' : 'text-red-500'}`}>
          {property.formattedPrice}
        </p>
      </div>
    </div>
  );
}
