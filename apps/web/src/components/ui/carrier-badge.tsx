// components/ui/carrier-badge.tsx - Бейдж перевізника для timeline
'use client'

import { CarrierIcon } from './carrier-icon'

interface CarrierBadgeProps {
  carrier: string
  className?: string
}

export function CarrierBadge({ carrier, className = "" }: CarrierBadgeProps) {
  const getCarrierDisplayName = (carrierName: string) => {
    const carrierKey = carrierName.toLowerCase().replace(/\s+/g, '');
    
    if (carrierKey.includes('nova') || carrierKey.includes('нова')) {
      return 'Nova Poshta';
    }
    if (carrierKey.includes('ukr') || carrierKey.includes('укр')) {
      return 'Укрпошта';
    }
    if (carrierKey.includes('dhl')) {
      return 'DHL';
    }
    if (carrierKey.includes('meest') || carrierKey.includes('міст')) {
      return 'Meest';
    }
    if (carrierKey.includes('sat')) {
      return 'SAT';
    }
    if (carrierKey.includes('delivery')) {
      return 'Delivery Auto';
    }
    if (carrierKey.includes('upu') || carrierKey.includes('cainiao')) {
      return 'UPU';
    }
    
    return carrierName || 'Unknown';
  };

  return (
    <div className={`inline-flex items-center bg-gray-100 border border-gray-200 rounded overflow-hidden ${className}`}>
      {/* Іконка ліворуч */}
      <div className="flex items-center justify-center w-5 h-5 bg-contain bg-no-repeat bg-center">
        <CarrierIcon carrier={carrier} size={20} />
      </div>
      
      {/* Текст праворуч */}
      <span className="px-2 text-xs font-medium text-gray-700 whitespace-nowrap">
        {getCarrierDisplayName(carrier)}
      </span>
    </div>
  );
}