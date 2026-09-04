"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.2)' }}>
      <MapPin size={16} style={{ color: 'white' }} />
      <select 
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
          paddingRight: '1rem'
        }}
      >
        {districts.map(d => (
          <option key={d.id} value={d.id} style={{ color: 'black' }}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}
