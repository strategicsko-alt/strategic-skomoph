import Link from 'next/link';
import React from 'react';

export default function KpiPrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <nav style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--primary)', fontWeight: 700, margin: 0, fontSize: '1.25rem' }}>KPI System Mockup</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/kpi-prototype/dashboard" className="btn-secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}>
            📊 Dashboard
          </Link>
          <Link href="/kpi-prototype/template" className="btn-secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}>
            📝 ตั้งค่าตัวชี้วัด (Templates)
          </Link>
          <Link href="/kpi-prototype/report" className="btn-secondary" style={{ padding: '0.5rem 1rem', textDecoration: 'none' }}>
            ✍️ รายงานผล (Data Entry)
          </Link>
        </div>
      </nav>
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
