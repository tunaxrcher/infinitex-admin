// src/features/maps/components/PropertyListings.tsx
'use client';

import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { KeenIcon } from '@src/shared/components/keenicons';
import { MapFilters, MapProperty, ProvinceStats } from '../types';
import { PropertyCard } from './PropertyCard';

interface PropertyListingsProps {
  properties: MapProperty[];
  isLoading: boolean;
  total: number;
  filters: MapFilters;
  selectedProvince?: string;
  stats?: {
    totalInternal: number;
    totalLED: number;
    provinceStats: ProvinceStats[];
  };
  onFilterChange: (filters: Partial<MapFilters>) => void;
  onPropertyClick: (property: MapProperty) => void;
  onClearProvince: () => void;
  selectedPropertyId?: string;
}

export function PropertyListings({
  properties,
  isLoading,
  total,
  filters,
  selectedProvince,
  stats,
  onFilterChange,
  onPropertyClick,
  onClearProvince,
  selectedPropertyId,
}: PropertyListingsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        {/* Tabs */}
        <div className="flex gap-2 border-b pb-3">
          <Button
            variant={
              filters.source === 'ALL' || !filters.source
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() => onFilterChange({ source: 'ALL' })}
            className="gap-2"
          >
            <KeenIcon icon="home" />
            <span>ทั้งหมด</span>
            {stats && (
              <Badge variant="secondary" className="ml-1">
                {stats.totalInternal + stats.totalLED}
              </Badge>
            )}
          </Button>
          <Button
            variant={filters.source === 'INTERNAL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ source: 'INTERNAL' })}
            className="gap-2"
          >
            <span>FINX</span>
            {stats && (
              <Badge variant="secondary" className="ml-1">
                {stats.totalInternal}
              </Badge>
            )}
          </Button>
          <Button
            variant={filters.source === 'LED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ source: 'LED' })}
            className="gap-2"
          >
            <span>LED</span>
            {stats && (
              <Badge variant="secondary" className="ml-1">
                {stats.totalLED}
              </Badge>
            )}
          </Button>
        </div>

        {/* Selected Province Badge */}
        {selectedProvince && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-2 py-1.5 px-3">
              <KeenIcon icon="geolocation" className="text-sm" />
              <span>{selectedProvince}</span>
              <button
                onClick={onClearProvince}
                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
              >
                <KeenIcon icon="cross" className="text-xs" />
              </button>
            </Badge>
          </div>
        )}

        {/* Result Count */}
        <p className="text-sm text-muted-foreground">
          เจอทรัพย์ที่ตรงตามเงื่อนไขของคุณ{' '}
          <strong className="text-foreground">
            {total.toLocaleString()} ทรัพย์
          </strong>
        </p>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="ค้นหา..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="h-9"
            />
          </div>
          <Select
            value={filters.status || 'ALL'}
            onValueChange={(value) => onFilterChange({ status: value as any })}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทั้งหมด</SelectItem>
              <SelectItem value="ขาย">ขาย</SelectItem>
              <SelectItem value="ขายแล้ว">ขายแล้ว</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[140px] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <KeenIcon
              icon="search-normal"
              className="text-5xl text-muted-foreground mb-4"
            />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              ไม่พบทรัพย์
            </h3>
            <p className="text-sm text-muted-foreground">
              ลองเปลี่ยนเงื่อนไขการค้นหา หรือกด &quot;รีเซ็ต&quot;
              เพื่อดูทรัพย์ทั้งหมด
            </p>
            {selectedProvince && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={onClearProvince}
              >
                รีเซ็ตมุมมอง
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => onPropertyClick(property)}
                isSelected={selectedPropertyId === property.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
