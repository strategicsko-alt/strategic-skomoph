'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { QuarterlyPlanTable } from '@/components/QuarterlyPlanTable';
import { useEditor } from '@/components/EditorContext';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { CalendarDays, Target, CheckCircle2, Clock } from 'lucide-react';

export default function ActionPlanPage() {
  const { districtId, loading: ctxLoading } = useEditor();
  const [strategicIssues, setStrategicIssues] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (background = false) => {
    if (!districtId) return;
    if (!background) setLoading(true);

    try {
      // 1. Fetch structure
      const { data: issueData, error: issueError } = await supabase
        .from('strategic_issues')
        .select(`
          *,
          strategies (
            *,
            objectives (
              *,
              key_results (*)
            )
          )
        `)
        .eq('district_id', districtId)
        .order('order_index', { ascending: true });

      if (issueError) throw issueError;

      // Sort nested arrays
      if (issueData) {
        const sorted = issueData.map((issue: any) => ({
          ...issue,
          strategies: (issue.strategies || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((st: any) => ({
            ...st,
            objectives: (st.objectives || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((obj: any) => ({
              ...obj,
              key_results: (obj.key_results || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
            })),
          })),
        })).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
        
        setStrategicIssues(sorted);
      }

      // 2. Fetch measurements
      const { data: mData, error: mError } = await supabase
        .from('action_plan_measurements')
        .select('*')
        .eq('district_id', districtId);
        
      if (mError) {
        if (mError.code !== '42P01') {
          console.error(mError);
        }
        setMeasurements([]);
      } else {
        setMeasurements(mData || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    if (!ctxLoading) {
      fetchData(false);
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('action-plan-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'action_plan_measurements' }, () => {
        if (!ctxLoading) fetchData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ctxLoading, districtId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'Editor Portal', href: '/editor/dashboard' }, { label: 'แผนปฏิบัติการ 1 ปี' }]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', marginTop: '1.5rem' }}>
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
        <CardSkeleton lines={6} />
      </div>
    );
  }

  const q1Count = measurements.filter(m => m.quarter === 1).length;
  const q2Count = measurements.filter(m => m.quarter === 2).length;
  const q3Count = measurements.filter(m => m.quarter === 3).length;
  const q4Count = measurements.filter(m => m.quarter === 4).length;
  const passedCount = measurements.filter(m => m.status === 'ผ่าน').length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <Breadcrumbs items={[{ label: 'Editor Portal', href: '/editor/dashboard' }, { label: 'แผนปฏิบัติการ 1 ปี' }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            แผนปฏิบัติการ 1 ปี (Action Plan)
          </h1>
          <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>
            จัดการเป้าหมายและตัวชี้วัดรายไตรมาส (Q1 - Q4) โดยอิงจาก Key Result ปี 2570
          </p>
        </div>
        <button onClick={() => fetchData(false)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          🔄 รีเฟรชข้อมูล
        </button>
      </div>

      {/* Quarterly Progress Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
            <Target size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>ตัวชี้วัดรายไตรมาสทั้งหมด</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>{measurements.length} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--secondary-foreground)' }}>รายการ</span></div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)', color: '#2563eb' }}>
            <CalendarDays size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>การกระจายรายไตรมาส</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)', marginTop: '0.2rem' }}>
              Q1: {q1Count} · Q2: {q2Count} · Q3: {q3Count} · Q4: {q4Count}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)', color: 'var(--success-text)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: 500 }}>ผลงานประเมิน "ผ่าน"</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--success-text)' }}>
              {passedCount} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--secondary-foreground)' }}>/ {measurements.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {strategicIssues.map(issue => (
          <CollapsibleSection key={issue.id} title={`ยุทธศาสตร์ที่ ${issue.auto_id?.replace('S', '')}: ${issue.name}`} defaultOpen={true}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {issue.strategies?.map((strat: any) => (
                <div key={strat.id} className="strategy-card" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '1rem', color: issue.theme_color || 'var(--primary)' }}>
                    [{strat.auto_id}] {strat.name}
                  </h4>
                  
                  {strat.objectives?.map((obj: any) => (
                    <div key={obj.id} className="objective-block" style={{ marginBottom: '1.5rem', borderLeft: `3px solid ${issue.theme_color || 'var(--border)'}` }}>
                      <h5 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1.05rem' }}>
                        <span style={{ color: issue.theme_color || 'var(--primary)' }}>[{obj.auto_id}]</span> {obj.name}
                      </h5>

                      {/* List Key Results under this objective */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '1rem' }}>
                        {obj.key_results?.map((kr: any) => (
                          <div key={kr.id} style={{ backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--primary)' }}>[{kr.auto_id}]</span> {kr.name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>
                              เป้าหมายรวมปี 2570: <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{kr.target_2570 || '-'}</span>
                            </div>
                            
                            {/* Quarterly Plan Table for this KR */}
                            <QuarterlyPlanTable districtId={districtId!} 
                              keyResult={kr} 
                              themeColor={issue.theme_color || 'var(--primary)'}
                              measurements={measurements.filter(m => m.key_result_id === kr.id)}
                              onUpdate={() => fetchData(true)}
                            />
                          </div>
                        ))}
                        {(!obj.key_results || obj.key_results.length === 0) && (
                          <div style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                            ไม่มี Key Result ภายใต้เป้าประสงค์นี้
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
}
