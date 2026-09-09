"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Activity, Target, Briefcase, GitBranch, Folder, AlertCircle } from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';

export default function EditorDashboard() {
  const [stats, setStats] = useState({
    issues: 0,
    strategies: 0,
    objectives: 0,
    keyResults: 0,
    projects: 0,
    missingKpiDict: 0
  });
  const [completenessData, setCompletenessData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      const [issueCount, stCount, objCount, krCount, projCount, treeRes, kpiDictRes] = await Promise.all([
        supabase.from('strategic_issues').select('id', { count: 'exact', head: true }),
        supabase.from('strategies').select('id', { count: 'exact', head: true }),
        supabase.from('objectives').select('id', { count: 'exact', head: true }),
        supabase.from('key_results').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('strategic_issues').select(`
          id, auto_id, name, order_index,
          outcome_indicators:key_results!strategic_issue_id ( id, auto_id, name ),
          strategies (
            id, auto_id, name,
            objectives (
              id, auto_id, name, initiative_activity, ia_ssjj, ia_rph, ia_ssor, ia_rphst, ia_phakee,
              key_results ( id, auto_id, name )
            )
          ),
          projects ( id )
        `).order('order_index', { ascending: true }),
        supabase.from('kpi_dictionaries').select('id, key_result_id, definition, numerator, denominator, inclusion_criteria, data_source')
      ]);

      // Map kpi_dictionaries by key_result_id
      const dictMap = new Map<string, any[]>();
      kpiDictRes.data?.forEach(dict => {
        if (dict.key_result_id) {
          const list = dictMap.get(dict.key_result_id) || [];
          list.push(dict);
          dictMap.set(dict.key_result_id, list);
        }
      });

      const hasKpiDictContent = (krId: string) => {
        const dicts = dictMap.get(krId);
        if (!dicts || dicts.length === 0) return false;
        return dicts.some(dict => 
          (dict.definition && String(dict.definition).trim() !== '') ||
          (dict.numerator && String(dict.numerator).trim() !== '') ||
          (dict.denominator && String(dict.denominator).trim() !== '') ||
          (dict.inclusion_criteria && String(dict.inclusion_criteria).trim() !== '') ||
          (dict.data_source && String(dict.data_source).trim() !== '')
        );
      };

      let totalSystemMissingKpiDict = 0;

      if (treeRes.data) {
        const cData = treeRes.data.map(issue => {
          let missingObjectives = 0;
          let missingKr = 0;
          let missingIa = 0;
          let missingHowTo = 0;
          let missingKpiDict = 0;
          let totalKeyResults = 0;
          
          let totalStrategies = issue.strategies?.length || 0;
          let totalObjectives = 0;

          // Check outcome indicators under strategic issue (IND)
          (issue as any).outcome_indicators?.forEach((kr: any) => {
            totalKeyResults++;
            if (!hasKpiDictContent(kr.id)) {
              missingKpiDict++;
            }
          });

          issue.strategies?.forEach((st: any) => {
            if (!st.objectives || st.objectives.length === 0) {
              missingObjectives++;
            } else {
              totalObjectives += st.objectives.length;
              st.objectives.forEach((obj: any) => {
                if (!obj.key_results || obj.key_results.length === 0) {
                  missingKr++;
                } else {
                  obj.key_results.forEach((kr: any) => {
                    totalKeyResults++;
                    if (!hasKpiDictContent(kr.id)) {
                      missingKpiDict++;
                    }
                  });
                }
                
                // Parse or check Initiative Activity
                let hasIa = false;
                if (obj.initiative_activity) {
                  try {
                    const parsed = JSON.parse(obj.initiative_activity);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].trim() !== '') {
                      hasIa = true;
                    }
                  } catch (e) {
                    hasIa = obj.initiative_activity.trim() !== '';
                  }
                }
                if (!hasIa) missingIa++;

                if (!obj.ia_ssjj || !obj.ia_rph || !obj.ia_ssor || !obj.ia_rphst || !obj.ia_phakee) {
                  missingHowTo++;
                }
              });
            }
          });

          totalSystemMissingKpiDict += missingKpiDict;

          return {
            ...issue,
            totalStrategies,
            totalObjectives,
            totalKeyResults,
            totalProjects: issue.projects?.length || 0,
            missingObjectives,
            missingKr,
            missingIa,
            missingHowTo,
            missingKpiDict
          };
        });
        setCompletenessData(cData);
      }

      setStats({
        issues: issueCount.count || 0,
        strategies: stCount.count || 0,
        objectives: objCount.count || 0,
        keyResults: krCount.count || 0,
        projects: projCount.count || 0,
        missingKpiDict: totalSystemMissingKpiDict
      });
      
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>ยินดีต้อนรับสู่ Editor Portal</h1>
        <p style={{ color: 'var(--secondary-foreground)' }}>ระบบจัดการและบันทึกข้อมูลยุทธศาสตร์สุขภาพ 5 ปี จังหวัดสระแก้ว</p>
      </div>

      <div className="bento-grid" style={{ padding: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.875rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)', flexShrink: 0 }}>
            <Briefcase size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.8rem', fontWeight: 500 }}>ยุทธศาสตร์ทั้งหมด</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '-' : stats.issues}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.875rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)', flexShrink: 0 }}>
            <GitBranch size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.8rem', fontWeight: 500 }}>กลยุทธ์ (Strategies)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '-' : stats.strategies}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.875rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)', flexShrink: 0 }}>
            <Target size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.8rem', fontWeight: 500 }}>เป้าประสงค์ (Objectives)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '-' : stats.objectives}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.875rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)', flexShrink: 0 }}>
            <Activity size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.8rem', fontWeight: 500 }}>เป้าหมาย (Key Results)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '-' : stats.keyResults}</h2>
            {!loading && (
              <p style={{ fontSize: '0.75rem', color: stats.missingKpiDict > 0 ? '#b91c1c' : 'var(--success)', fontWeight: 600, marginTop: '0.25rem' }}>
                {stats.missingKpiDict > 0 ? `ยังไม่ระบุ KPI Dict ${stats.missingKpiDict} รายการ` : 'ระบุ KPI Dict ครบถ้วน'}
              </p>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid #fecdd3', backgroundColor: '#fff1f2' }}>
          <div style={{ padding: '0.875rem', backgroundColor: '#e11d48', borderRadius: 'var(--radius-lg)', color: 'white', flexShrink: 0 }}>
            <Folder size={28} />
          </div>
          <div>
            <p style={{ color: '#9f1239', fontSize: '0.8rem', fontWeight: 500 }}>โครงการ (Projects)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#4c0519' }}>{loading ? '-' : stats.projects}</h2>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={24} style={{ color: 'var(--warning)' }} />
          สรุปความครบถ้วนของข้อมูล (Data Completeness Tracker)
        </h3>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--secondary-foreground)', padding: '2rem' }}>กำลังโหลดข้อมูล...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--secondary-foreground)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', width: '22%' }}>ยุทธศาสตร์</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>จำนวนโครงการ</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#b91c1c' }}>กลยุทธ์ที่ขาดเป้าประสงค์</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#b91c1c' }}>เป้าประสงค์ที่ขาด KR</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#b91c1c' }}>เป้าประสงค์ที่ขาด Initiative</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#b91c1c' }}>เป้าประสงค์ที่ระบุ How To ไม่ครบ</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#b91c1c' }}>KR ที่ยังไม่ระบุ KPI Dictionary</th>
                </tr>
              </thead>
              <tbody>
                {completenessData.map((issue) => (
                  <tr key={issue.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--primary)' }}>[{issue.auto_id}]</span> {issue.name}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>
                      {issue.totalProjects}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      {issue.missingObjectives > 0 ? (
                        <span style={{ padding: '0.2rem 0.6rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontWeight: 600 }}>
                          ขาด {issue.missingObjectives} กลยุทธ์
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)' }}>ครบถ้วน</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      {issue.missingKr > 0 ? (
                        <span style={{ padding: '0.2rem 0.6rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontWeight: 600 }}>
                          ขาด {issue.missingKr} เป้าประสงค์
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)' }}>ครบถ้วน</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      {issue.missingIa > 0 ? (
                        <span style={{ padding: '0.2rem 0.6rem', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '4px', fontWeight: 600 }}>
                          ขาด {issue.missingIa} เป้าประสงค์
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)' }}>ครบถ้วน</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      {issue.missingHowTo > 0 ? (
                        <span style={{ padding: '0.2rem 0.6rem', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '4px', fontWeight: 600 }}>
                          ไม่ครบ {issue.missingHowTo} เป้าประสงค์
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)' }}>ครบถ้วน</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      {issue.totalKeyResults === 0 ? (
                        <span style={{ color: 'var(--secondary-foreground)' }}>-</span>
                      ) : issue.missingKpiDict > 0 ? (
                        <Link 
                          href="/editor/kpi-dictionary"
                          title={`ระบุแล้ว ${issue.totalKeyResults - issue.missingKpiDict} จาก ${issue.totalKeyResults} KR (คลิกเพื่อไปจัดการ)`}
                          style={{ textDecoration: 'none' }}
                        >
                          <span style={{ 
                            padding: '0.2rem 0.6rem', 
                            backgroundColor: '#fee2e2', 
                            color: '#b91c1c', 
                            borderRadius: '4px', 
                            fontWeight: 600,
                            display: 'inline-block',
                            cursor: 'pointer'
                          }}>
                            ยังไม่ระบุ {issue.missingKpiDict} KR
                          </span>
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--success)' }} title={`ระบุครบทั้ง ${issue.totalKeyResults} KR`}>
                          ครบถ้วน
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>เริ่มต้นใช้งาน</h3>
          <ExportButton />
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
            <div>
              <p style={{ fontWeight: 600 }}>จัดการข้อมูลโครงสร้างยุทธศาสตร์</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>ไปที่เมนู <strong>Workshop</strong> เพื่อเพิ่ม ยุทธศาสตร์, กลยุทธ์ (O) และเป้าหมาย (KR)</p>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
            <div>
              <p style={{ fontWeight: 600 }}>สร้างพจนานุกรมตัวชี้วัด (KPI Dictionary)</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>ไปที่เมนู <strong>KPI Dictionary</strong> เพื่อระบุรายละเอียดของตัวชี้วัดตามรูปแบบ 14 ฟิลด์ ผูกกับ Key Results</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
