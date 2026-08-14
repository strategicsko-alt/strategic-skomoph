'use client';

import React from 'react';
import Link from 'next/link';

interface KrTableClientProps {
  objective: any;
  themeColor: string;
}

export function KrTableClient({ objective, themeColor }: KrTableClientProps) {
  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.875rem', backgroundColor: 'var(--card)' }}>
        <thead>
          <tr style={{ backgroundColor: themeColor || 'var(--primary)', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm) 0 0 0', width: '45%' }}>Key Result</th>
            <th style={{ padding: '0.75rem 0.5rem', width: '10%', textAlign: 'center' }}>สถานะ</th>
            <th style={{ padding: '0.75rem 0.5rem', width: '9%', textAlign: 'center' }}>ปี 2570</th>
            <th style={{ padding: '0.75rem 0.5rem', width: '9%', textAlign: 'center' }}>ปี 2571</th>
            <th style={{ padding: '0.75rem 0.5rem', width: '9%', textAlign: 'center' }}>ปี 2572</th>
            <th style={{ padding: '0.75rem 0.5rem', width: '9%', textAlign: 'center' }}>ปี 2573</th>
            <th style={{ padding: '0.75rem 0.5rem', borderRadius: '0 var(--radius-sm) 0 0', width: '9%', textAlign: 'center' }}>ปี 2574</th>
          </tr>
        </thead>
        <tbody>
          {objective.key_results?.map((kr: any) => (
            <tr key={kr.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>
                <Link 
                  href={`/kpi/${kr.id}`}
                  target="_blank"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block', width: '100%' }}
                  className="hover:underline"
                >
                  <span style={{ color: 'var(--primary)' }}>[{kr.auto_id}]</span> {kr.name}
                </Link>
              </td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: kr.measurement_status === 'พร้อมวัด' ? 'var(--success)' : 'var(--warning)', color: 'white', borderRadius: '99px', fontSize: '0.75rem' }}>
                  {kr.measurement_status || '-'}
                </span>
              </td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{kr.target_2570 || '-'}</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{kr.target_2571 || '-'}</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{kr.target_2572 || '-'}</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{kr.target_2573 || '-'}</td>
              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--primary)', textAlign: 'center' }}>{kr.target_2574 || '-'}</td>
            </tr>
          ))}
          {(!objective.key_results || objective.key_results.length === 0) && (
            <tr>
              <td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>ยังไม่มีข้อมูล Key Result</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
