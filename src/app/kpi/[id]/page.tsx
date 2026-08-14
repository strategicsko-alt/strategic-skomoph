import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function KpiViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch KR and KPI data
  const { data: kr, error } = await supabase
    .from('key_results')
    .select(`
      *,
      kpi_dictionaries (*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !kr) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--destructive, #ef4444)', marginBottom: '1rem' }}>
          ไม่พบข้อมูลตัวชี้วัด (Key Result)
        </h2>
        <p style={{ color: 'var(--secondary-foreground, #6b7280)', marginBottom: '0.5rem' }}>
          รหัสอ้างอิง: {id}
        </p>
        {error && (
          <p style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
            ข้อผิดพลาดจากฐานข้อมูล: {error.message}
          </p>
        )}
      </div>
    );
  }

  const kpiData = kr.kpi_dictionaries?.[0];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
          KPI Dictionary
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.3 }}>
          <span style={{ color: 'var(--primary)' }}>[{kr.auto_id}]</span> {kr.name}
        </h1>
        <p style={{ marginTop: '0.5rem', color: 'var(--secondary-foreground)' }}>
          กลุ่มงานรับผิดชอบ: <span style={{ fontWeight: 600 }}>{kr.responsible_group || 'ไม่ได้ระบุ'}</span>
        </p>
      </div>

      {!kpiData ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--secondary-foreground)', fontSize: '1.1rem' }}>ยังไม่มีข้อมูล KPI Dictionary สำหรับตัวชี้วัดนี้</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', backgroundColor: 'var(--card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>นิยามเชิงปฏิบัติการ</h5>
              <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{kpiData.definition || '-'}</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>ผู้รับผิดชอบตัวชี้วัด</h5>
              <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{kpiData.responsible_person || '-'}</p>
            </div>
          </div>

          <hr style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#166534', marginBottom: '0.5rem' }}>ตัวตั้ง (Numerator)</h5>
              <p style={{ fontSize: '1rem', color: '#14532d' }}>{kpiData.numerator || '-'}</p>
            </div>
            <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>ตัวหาร (Denominator)</h5>
              <p style={{ fontSize: '1rem', color: '#7f1d1d' }}>{kpiData.denominator || '-'}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '0.5rem' }}>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>เกณฑ์นับเข้า (Inclusion)</h5>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{kpiData.inclusion_criteria || '-'}</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>เกณฑ์นับออก (Exclusion)</h5>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{kpiData.exclusion_criteria || '-'}</p>
            </div>
          </div>

          <hr style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>แหล่งข้อมูล</h5>
              <p style={{ fontSize: '0.95rem' }}>{kpiData.data_source || '-'}</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>วันตัดข้อมูล</h5>
              <p style={{ fontSize: '0.95rem' }}>{kpiData.cutoff_date || '-'}</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>ความถี่การวัด</h5>
              <p style={{ fontSize: '0.95rem' }}>{kpiData.frequency || '-'}</p>
            </div>
          </div>
          
          <hr style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>เป้าหมายที่เสนอ (Proposed Target)</h5>
              <p style={{ fontSize: '0.95rem' }}>{kpiData.proposed_target || '-'}</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>เหตุผล (Rationale)</h5>
              <p style={{ fontSize: '0.95rem' }}>{kpiData.rationale || '-'}</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>ความเสี่ยง (Risk Warning)</h5>
              <p style={{ fontSize: '0.95rem' }}>{kpiData.risk_warning || '-'}</p>
            </div>
            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>สิ่งที่ต้องมีก่อน (Prerequisite)</h5>
              <p style={{ fontSize: '0.95rem' }}>{kpiData.prerequisite || '-'}</p>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
