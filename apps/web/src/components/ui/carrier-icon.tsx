// components/ui/carrier-icon.tsx - З зовнішніми SVG та fallback
'use client'

import Image from 'next/image'

interface CarrierIconProps {
  carrier: string
  size?: number
  className?: string
}

export function CarrierIcon({ carrier, size = 20, className = "" }: CarrierIconProps) {
  const carrierKey = carrier.toLowerCase().replace(/\s+/g, '');
  
  // Мапінг перевізників до файлів логотипів
  const logoFiles: Record<string, string> = {
    'nova': '/logos/nova-poshta.svg',
    'нова': '/logos/nova-poshta.svg',
    'ukr': '/logos/ukrposhta.svg',
    'укр': '/logos/ukrposhta.svg',
    'dhl': '/logos/dhl.svg',
    'meest': '/logos/meest.svg',
    'міст': '/logos/meest.svg'
  };
  
  // Знаходимо відповідний файл логотипу
  const logoFile = Object.keys(logoFiles).find(key => 
    carrierKey.includes(key)
  );
  
  // Якщо є логотип - використовуємо Next.js Image
  if (logoFile) {
    return (
      <Image
        src={logoFiles[logoFile]}
        alt={carrier}
        width={size}
        height={size}
        className={`rounded ${className}`}
        priority={false}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          objectFit: 'contain'
        }}
      />
    );
  }
  
  // Fallback - універсальна іконка посилки
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect width="24" height="24" rx="3" fill="#6B7280"/>
      <path 
        d="M4 8l8-4 8 4v8l-8 4-8-4V8z" 
        fill="none" 
        stroke="white" 
        strokeWidth="1.5"
      />
      <path 
        d="M12 4v16M4 8l8 8M20 8l-8 8" 
        stroke="white" 
        strokeWidth="0.8" 
        opacity="0.7"
      />
    </svg>
  );
}