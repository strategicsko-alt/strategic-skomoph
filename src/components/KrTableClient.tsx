'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/Modal';

interface KrTableClientProps {
  objective: any;
  themeColor: string;
}

export function KrTableClient({ objective, themeColor }: KrTableClientProps) {
  const [selectedKr, setSelectedKr] = useState<any>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleKrClick = async (kr: any) => {
    setSelectedKr(kr);
    setIsModalOpen(true);
    setIsLoading(true);
    setKpiData(null);

    const { data, error } = await supabase
      .from('kpi_dictionaries')
      .select('*')
      .eq('key_result_id', kr.id)
      .maybeSingle();

    if (!error && data) {
      setKpiData(data);
    }
    setIsLoading(false);
  };

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
                <button 
                  onClick={() => handleKrClick(kr)} 
                  style={{ background: 'none', border: 'none', padding: 0, margin: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left', display: 'inline', width: '100%' }}
                  className="hover:underline"
                >
                  <span style={{ color: 'var(--primary)' }}>[{kr.auto_id}]</span> {kr.name}
                </button>
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

      {/* KPI Dictionary Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="ข้อมูลตัวชี้วัด (KPI Dictionary)" maxWidth="800px">
        {selectedKr && (
          <div style={{ padding: '1rem 0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: themeColor }}>
              [{selectedKr.auto_id}] {selectedKr.name}
            </h3>
            
            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>กำลังโหลดข้อมูล KPI...</div>
            ) : kpiData ? (
              <div style={{ display: 'grid', gap: '1rem', backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>นิยามเชิงปฏิบัติการ</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.definition || '-'}</p>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>ผู้รับผิดชอบ</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.responsible_person || '-'}</p>
                  </div>
                </div>

                <hr style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>ตัวตั้ง (Numerator)</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.numerator || '-'}</p>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>ตัวหาร (Denominator)</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.denominator || '-'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>เกณฑ์นับเข้า (Inclusion)</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.inclusion_criteria || '-'}</p>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>เกณฑ์นับออก (Exclusion)</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.exclusion_criteria || '-'}</p>
                  </div>
                </div>

                <hr style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>แหล่งข้อมูล</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.data_source || '-'}</p>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>วันตัดข้อมูล</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.cutoff_date || '-'}</p>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.25rem' }}>ความถี่การวัด</h5>
                    <p style={{ fontSize: '0.95rem' }}>{kpiData.frequency || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--secondary-foreground)' }}>ยังไม่มีข้อมูล KPI Dictionary สำหรับตัวชี้วัดนี้</p>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setIsModalOpen(false)} className="btn-primary">ปิดหน้าต่าง</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
