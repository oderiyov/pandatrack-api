// components/ui/carrier-icon.tsx - SVG іконки перевізників
'use client'

interface CarrierIconProps {
  carrier: string
  size?: number
  className?: string
}

export function CarrierIcon({ carrier, size = 20, className = "" }: CarrierIconProps) {
  const carrierKey = carrier.toLowerCase().replace(/\s+/g, '');
  
  const getIcon = () => {
    if (carrierKey.includes('nova') || carrierKey.includes('нова')) {
      // Nova Poshta - синій з помаранчевим
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="3" fill="#0074D9"/>
          <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" fill="#FF851B" stroke="white" strokeWidth="1"/>
          <path d="M12 4v16M4 8l8 8M20 8l-8 8" stroke="white" strokeWidth="0.5" opacity="0.7"/>
        </svg>
      );
    }
    
    if (carrierKey.includes('ukr') || carrierKey.includes('укр')) {
      // Ukrposhta - синій з жовтим
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="3" fill="#0074D9"/>
          <rect x="3" y="6" width="18" height="12" rx="2" fill="#FFDC00"/>
          <path d="M6 10h4M6 12h6M6 14h4" stroke="#0074D9" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="17" cy="10" r="1.5" fill="#0074D9"/>
        </svg>
      );
    }
    
    if (carrierKey.includes('dhl')) {
      // DHL - червоний з жовтим
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="3" fill="#D40511"/>
          <path d="M3 8h18l-2 8H5l-2-8z" fill="#FFDC00"/>
          <text x="12" y="13" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#D40511">DHL</text>
        </svg>
      );
    }
    
    if (carrierKey.includes('meest') || carrierKey.includes('міст')) {
      // Meest - зелений з білим
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="3" fill="#2ECC40"/>
          <path d="M6 8l6 3 6-3v8l-6 3-6-3V8z" fill="white" stroke="#2ECC40" strokeWidth="1"/>
          <circle cx="12" cy="12" r="2" fill="#2ECC40"/>
        </svg>
      );
    }
    
    if (carrierKey.includes('sat')) {
      // SAT - помаранчевий
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="3" fill="#FF851B"/>
          <path d="M4 10h16l-2 6H6l-2-6z" fill="white"/>
          <path d="M8 7h8v3H8V7z" fill="white"/>
          <text x="12" y="14" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#FF851B">SAT</text>
        </svg>
      );
    }
    
    if (carrierKey.includes('delivery')) {
      // Delivery Auto - синій
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="3" fill="#001f3f"/>
          <path d="M4 10h12l2 2v4h-2a2 2 0 11-4 0H8a2 2 0 11-4 0V10z" fill="white"/>
          <circle cx="7" cy="16" r="1" fill="#001f3f"/>
          <circle cx="15" cy="16" r="1" fill="#001f3f"/>
        </svg>
      );
    }
    
    if (carrierKey.includes('upu') || carrierKey.includes('cainiao')) {
      // UPU/International - синій міжнародний
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="3" fill="#0074D9"/>
          <circle cx="12" cy="12" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
          <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="white" strokeWidth="1"/>
        </svg>
      );
    }
    
    // Default - універсальна іконка посилки
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect width="24" height="24" rx="3" fill="#6B7280"/>
        <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" fill="none" stroke="white" strokeWidth="1.5"/>
        <path d="M12 4v16M4 8l8 8M20 8l-8 8" stroke="white" strokeWidth="0.8" opacity="0.7"/>
      </svg>
    );
  };
  
  return getIcon();
}