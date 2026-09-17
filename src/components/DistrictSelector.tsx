"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

type District = {
  id: string;
  name: string;
  type: string;
};

export function DistrictSelector({ districts }: { districts: District[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const provinceDistrict = districts.find(d => d.type === 'province');
  const [selectedId, setSelectedId] = useState<string>(
    searchParams.get('district_id') || provinceDistrict?.id || ''
  );

  useEffect(() => {
    const id = searchParams.get('district_id');
    if (id) {
      setSelectedId(id);
    } else if (provinceDistrict) {
      setSelectedId(provinceDistrict.id);
    }
  }, [searchParams, provinceDistrict]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(4px)',
        padding: '0.4rem 0.85rem',
        borderRadius: 'var(--radius-full)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        transition: 'all var(--transition-fast)',
      }}
    >
      <MapPin size={16} style={{ color: 'white', flexShrink: 0 }} />
      <select 
        aria-label="เลือกพื้นที่หรืออำเภอ"
        value={selectedId}
        onChange={(e) => {
          const newId = e.target.value;
          setSelectedId(newId);
          router.push(`/?district_id=${newId}`);
        }}
        style={{
          backgroundColor: 'transparent',
          color: 'white',
          border: 'none',
          outline: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          appearance: 'none',
          paddingRight: '1.25rem',
          WebkitAppearance: 'none',
        }}
      >
        {districts.map(d => (
          <option key={d.id} value={d.id} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
            {d.name} {d.type === 'province' ? '(ภาพรวมจังหวัด)' : ''}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          color: 'white',
          position: 'absolute',
          right: '0.65rem',
          pointerEvents: 'none',
          opacity: 0.85,
        }}
      />
    </div>
  );
}

