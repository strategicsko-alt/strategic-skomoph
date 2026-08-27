"use client";

import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';

type District = {
  id: string;
  name: string;
  type: string;
};

export function DistrictSelector({ districts, currentDistrictId }: { districts: District[], currentDistrictId: string }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.2)' }}>
      <MapPin size={16} style={{ color: 'white' }} />
      <select 
        value={currentDistrictId || ''}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set('district_id', e.target.value);
          router.push(url.pathname + url.search);
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
