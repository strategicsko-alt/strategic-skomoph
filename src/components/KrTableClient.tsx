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
      <div className="table-responsive">
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
      </div>

      {/* Initiative Activity & How To Section */}
      {(objective.initiative_activity || objective.ia_ssjj || objective.ia_rph || objective.ia_ssor || objective.ia_rphst || objective.ia_phakee) && (
        <div style={{ marginTop: '1rem', border: `1px solid ${themeColor}40`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          
          {/* Initiative Activity */}
          {objective.initiative_activity && (
            <div style={{ backgroundColor: `${themeColor}10`, padding: '1rem', borderBottom: `1px solid ${themeColor}20` }}>
              <h5 style={{ fontWeight: 700, fontSize: '0.9rem', color: themeColor, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '1rem', backgroundColor: themeColor, borderRadius: '4px' }}></span>
                กิจกรรมริเริ่ม (Initiative Activity)
              </h5>
              <div style={{ paddingLeft: '1rem', color: 'var(--foreground)', fontSize: '0.875rem' }}>
                {(() => {
                  try {
                    const parsed = JSON.parse(objective.initiative_activity);
                    if (Array.isArray(parsed)) {
                      return (
                        <ul style={{ listStyleType: 'disc', paddingLeft: '1rem', margin: 0 }}>
                          {parsed.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                          ))}
                        </ul>
                      );
                    }
                  } catch (e) {}
                  return <p style={{ margin: 0 }}>{objective.initiative_activity}</p>;
                })()}
              </div>
            </div>
          )}

          {/* How To (by level) */}
          <div style={{ padding: '0.5rem 0' }}>
            {[
              { key: 'ia_ssjj', label: 'สสจ.' }, 
              { key: 'ia_rph', label: 'รพ.' }, 
              { key: 'ia_ssor', label: 'สสอ.' }, 
              { key: 'ia_rphst', label: 'รพ.สต.' }, 
              { key: 'ia_phakee', label: 'ภาคีเครือข่าย' }
            ].map(({ key, label }) => {
              const content = objective[key];
              if (!content) return null;

              let parsedContent: React.ReactNode;
              try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                  parsedContent = (
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', listStyleType: 'decimal' }}>
                      {parsed.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                      ))}
                    </ul>
                  );
                } else {
                  parsedContent = <p style={{ margin: 0 }}>{content}</p>;
                }
              } catch (e) {
                parsedContent = <p style={{ margin: 0 }}>{content}</p>;
              }

              return (
                <div key={key} className="how-to-row" style={{ padding: '0.5rem 0', display: 'flex', gap: '0.75rem', borderBottom: `1px solid ${themeColor}15`, alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, color: themeColor, fontSize: '0.8rem', minWidth: '80px', flexShrink: 0, padding: '0.2rem 0.5rem', backgroundColor: `${themeColor}10`, borderRadius: '4px', textAlign: 'center' }}>
                    {label}
                  </span>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--secondary-foreground)' }}>
                    {parsedContent}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
export default KrTableClient;
