// src/features/maps/components/PropertyCard.tsx
'use client';

import Image from 'next/image';
import { Badge } from '@src/shared/components/ui/badge';
import { KeenIcon } from '@src/shared/components/keenicons';
import { MapProperty } from '../types';

interface PropertyCardProps {
  property: MapProperty;
  onClick?: () => void;
  isSelected?: boolean;
}

export function PropertyCard({
  property,
  onClick,
  isSelected,
}: PropertyCardProps) {
  const isSold = property.status === 'ขายแล้ว';
  const isLED = property.source === 'LED';

  return (
    <div
      className={`
        group bg-card border rounded-xl overflow-hidden cursor-pointer
        transition-all duration-200 hover:shadow-lg hover:-translate-y-1
        ${isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'}
      `}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-[140px] bg-muted overflow-hidden">
        {property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <KeenIcon
              icon="picture"
              className="text-4xl text-muted-foreground"
            />
          </div>
        )}

        {/* Status Badge */}
        <Badge
          variant={isSold ? 'secondary' : 'default'}
          className="absolute top-2 left-2"
        >
          {property.status}
        </Badge>

        {/* Source Badge */}
        <Badge
          variant="outline"
          className={`absolute top-2 right-2 text-white border-0 ${isLED ? 'bg-blue-500/90' : 'bg-red-500/90'}`}
        >
          {isLED ? 'LED' : 'FINX'}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <KeenIcon icon="geolocation" className="text-sm" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        {/* Details */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>{property.size}</span>
          <span className="w-[1px] h-3 bg-border" />
          <span className="line-clamp-1">{property.type}</span>
        </div>

        {/* Price */}
        <div className="text-lg font-bold text-primary">
          {property.formattedPrice}
        </div>
      </div>
    </div>
  );
}
