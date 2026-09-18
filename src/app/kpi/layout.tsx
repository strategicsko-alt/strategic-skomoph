import Link from 'next/link';
import React from 'react';

export default function KpiPrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <nav style={{ 
        backgroundColor: 'var(--card)', 
        borderBottom: '1px solid var(--border)', 
        padding: '0.85rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏥</span>
            <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.15rem' }}>KPI SKO-MOPH</span>
          </Link>
          <span style={{ color: 'var(--border)', fontSize: '1rem' }}>|</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>
            สำนักงานสาธารณสุขจังหวัดสระแก้ว
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/" 
            className="btn-secondary" 
            style={{ padding: '0.45rem 0.85rem', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>🏠</span>
            <span>ยุทธศาสตร์ 5 ปี</span>
          </Link>

          <Link 
            href="/kpi/dashboard" 
            className="btn-secondary" 
            style={{ padding: '0.45rem 0.85rem', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
          >
            <span>📊</span>
            <span>Dashboard ตัวชี้วัด</span>
          </Link>

          <a 
            href="https://sakaeo-epiwatch-ai.web.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-secondary" 
            title="เปิดระบบวิเคราะห์และเฝ้าระวังระบาดวิทยาอัจฉริยะ สำนักงานสาธารณสุขจังหวัดสระแก้ว (Sakaeo EpiWatch AI)"
            style={{ 
              padding: '0.45rem 0.85rem', 
              textDecoration: 'none', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem',
              backgroundColor: '#fff1f2',
              borderColor: '#fecdd3',
              color: '#be123c',
              boxShadow: '0 1px 2px rgba(225, 29, 72, 0.08)'
            }}
          >
            <span>🦠</span>
            <span>ระบาดวิทยาอัจฉริยะ (EpiWatch AI)</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>↗</span>
          </a>

          <Link 
            href="/manual" 
            className="btn-secondary" 
            style={{ padding: '0.45rem 0.85rem', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>📘</span>
            <span>คู่มือ</span>
          </Link>

          <Link 
            href="/editor/dashboard" 
            className="btn-secondary" 
            title="เข้าสู่ระบบจัดการและบันทึกข้อมูลยุทธศาสตร์"
            style={{ padding: '0.45rem 0.85rem', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <span>⚙️</span>
            <span>ระบบจัดการ</span>
          </Link>
        </div>
      </nav>
      <main style={{ padding: '1.5rem 2rem', maxWidth: '1800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
}
