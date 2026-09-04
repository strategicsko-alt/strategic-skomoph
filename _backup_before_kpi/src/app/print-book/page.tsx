'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { KrTableClient } from '@/components/KrTableClient';
import { Printer, ChevronLeft, Layers, Folder, Briefcase, GitBranch, Target, Activity, Home } from 'lucide-react';
import Link from 'next/link';

export default function PrintBookPage() {
  const [coreData, setCoreData] = useState<any>(null);
  const [coreListItems, setCoreListItems] = useState<any[]>([]);
  const [swotItems, setSwotItems] = useState<any[]>([]);
  const [strategicIssues, setStrategicIssues] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch Core Data
        const { data: cData } = await supabase.from('core_organization').select('*').limit(1).single();
        setCoreData(cData);

        const { data: clData } = await supabase.from('core_list_items').select('*').order('created_at');
        setCoreListItems(clData || []);

        const { data: sData } = await supabase.from('swot_items').select('*').order('created_at');
        setSwotItems(sData || []);

        // Fetch Strategies
        const { data: issueData } = await supabase
          .from('strategic_issues')
          .select(`
            *,
            outcome_indicators:key_results!strategic_issue_id (*),
            strategies (
              *,
              objectives (
                *,
                key_results (*)
              )
            )
          `)
          .order('order_index', { ascending: true });

        if (issueData) {
          const sorted = issueData.map((issue: any) => ({
            ...issue,
            outcome_indicators: (issue.outcome_indicators || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
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

        // Fetch KPI Dictionary (All Key Results with dictionary data)
        const { data: kpiData } = await supabase
          .from('key_results')
          .select(`
            *,
            kpi_dictionaries (*)
          `)
          .order('auto_id', { ascending: true });
        
        if (kpiData) setKpis(kpiData);

        const { data: pData } = await supabase.from('projects').select('id');
        setTotalProjects(pData?.length || 0);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
        // Add a slight delay for rendering before allowing print
        setTimeout(() => {
          document.title = "แผนยุทธศาสตร์สุขภาพ_5_ปี_จังหวัดสระแก้ว";
        }, 500);
      }
    };

    fetchAllData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontSize: '1.25rem' }}>กำลังเตรียมเอกสารรูปเล่ม...</div>;
  }

  // Helper for rendering lists
  const renderList = (items: any[], type: string, color: string, title: string) => {
    return (
      <div style={{ marginBottom: '2rem' }} className="page-break-avoid">
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color, borderBottom: `2px solid ${color}`, paddingBottom: '0.5rem', marginBottom: '1rem' }}>{title}</h3>
        {items.length === 0 ? <p style={{ color: 'var(--secondary-foreground)' }}>ไม่มีข้อมูล</p> : (
          <ul style={{ paddingLeft: '1.5rem', fontSize: '1.1rem', lineHeight: '1.8' }}>
            {items.map((item, idx) => (
              <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: color }}>{type}{idx + 1}.</span> {item.detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // Compute totals
  const totalIssues = strategicIssues.length;
  let totalStrategies = 0;
  let totalObjectives = 0;
  let totalKeyResults = 0;

  strategicIssues.forEach(issue => {
    totalKeyResults += issue.outcome_indicators?.length || 0;
    if (issue.strategies) {
      totalStrategies += issue.strategies.length;
      issue.strategies.forEach((st: any) => {
        if (st.objectives) {
          totalObjectives += st.objectives.length;
          st.objectives.forEach((obj: any) => {
            totalKeyResults += obj.key_results?.length || 0;
          });
        }
      });
    }
  });

  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      {/* Floating Print Action Bar (Hidden on print) */}
      <div className="hide-on-print" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', 
        padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button onClick={() => window.close()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          <ChevronLeft size={20} /> กลับ
        </button>
        <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: '0.5rem 1.5rem' }}>
          <Printer size={20} /> สั่งพิมพ์ (Print / Save as PDF)
        </button>
      </div>

      {/* A4 Paper Container */}
      <div style={{ 
        maxWidth: '1000px', margin: '0 auto', backgroundColor: 'white', 
        padding: '3rem 4rem', boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        marginTop: '80px', // space for fixed header
      }}>

        {/* --- COVER PAGE --- */}
        <div style={{ minHeight: '800px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '4rem 0' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem', lineHeight: '1.3' }}>
            แผนยุทธศาสตร์สุขภาพ 5 ปี
          </h1>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '3rem' }}>
            จังหวัดสระแก้ว
          </h2>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--secondary-foreground)', padding: '1rem 3rem', borderTop: '2px solid var(--border)', borderBottom: '2px solid var(--border)' }}>
            พ.ศ. 2570 - 2574
          </div>
        </div>

        {/* --- SECTION 1: CORE DATA --- */}
        <div className="page-break-before">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '3px solid var(--primary)' }}>
            ส่วนที่ 1: ข้อมูลองค์กร
          </h2>

          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>วิสัยทัศน์ (Vision)</h3>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.8', padding: '1.5rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)' }}>
              {coreData?.vision || 'ยังไม่มีข้อมูลวิสัยทัศน์'}
            </p>
          </div>

          {renderList(coreListItems.filter(i => i.item_type === 'mission'), 'M', '#db2777', 'พันธกิจ (Mission)')}
          {renderList(coreListItems.filter(i => i.item_type === 'goal'), 'G', '#16a34a', 'เป้าประสงค์รวม (Goal)')}

          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6', borderBottom: '2px solid #8b5cf6', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>การวิเคราะห์ SWOT</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid var(--success)', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '1rem' }}>จุดแข็ง (Strengths)</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'S').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid var(--destructive)', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--destructive)', marginBottom: '1rem' }}>จุดอ่อน (Weaknesses)</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'W').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid var(--primary)', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>โอกาส (Opportunities)</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'O').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid var(--warning)', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--warning)', marginBottom: '1rem' }}>อุปสรรค (Threats)</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'T').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>กลยุทธ์จากสภาพแวดล้อม (TOWS Matrix)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid #10b981', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981', marginBottom: '1rem' }}>SO: เชิงรุก</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'SO').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid #3b82f6', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '1rem' }}>WO: เชิงแก้ไข</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'WO').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid #f59e0b', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '1rem' }}>ST: เชิงป้องกัน</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'ST').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
              <div className="card page-break-avoid" style={{ borderTop: '4px solid #ef4444', padding: '1rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '1rem' }}>WT: เชิงรับ</h4>
                <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  {swotItems.filter(i => i.swot_type === 'WT').map(i => <li key={i.id} style={{ marginBottom: '0.5rem' }}>{i.detail}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: ROADMAP --- */}
        <div className="page-break-before">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '3px solid var(--primary)' }}>
            ส่วนที่ 2: แผนที่ยุทธศาสตร์ (Strategic Roadmap)
          </h2>

          {/* สรุปภาพรวมโครงสร้างยุทธศาสตร์ */}
          <div className="card page-break-avoid" style={{ padding: '1.5rem', backgroundColor: 'var(--card)', marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <Layers size={22} />
              สรุปภาพรวมโครงสร้างยุทธศาสตร์
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ padding: '1.25rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: '#e11d48', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Folder size={26} />
                </div>
                <div>
                  <p style={{ color: '#9f1239', fontSize: '0.85rem', fontWeight: 600 }}>โครงการ</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#4c0519', lineHeight: 1.1 }}>{totalProjects}</h3>
                </div>
              </div>
              <div style={{ padding: '1.25rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: '#0284c7', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={26} />
                </div>
                <div>
                  <p style={{ color: '#0369a1', fontSize: '0.85rem', fontWeight: 600 }}>ยุทธศาสตร์</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0c4a6e', lineHeight: 1.1 }}>{totalIssues}</h3>
                </div>
              </div>
              <div style={{ padding: '1.25rem', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: '#7c3aed', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitBranch size={26} />
                </div>
                <div>
                  <p style={{ color: '#6d28d9', fontSize: '0.85rem', fontWeight: 600 }}>กลยุทธ์</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#4c1d95', lineHeight: 1.1 }}>{totalStrategies}</h3>
                </div>
              </div>
              <div style={{ padding: '1.25rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: '#059669', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={26} />
                </div>
                <div>
                  <p style={{ color: '#047857', fontSize: '0.85rem', fontWeight: 600 }}>เป้าประสงค์</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#064e3b', lineHeight: 1.1 }}>{totalObjectives}</h3>
                </div>
              </div>
              <div style={{ padding: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', backgroundColor: '#d97706', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={26} />
                </div>
                <div>
                  <p style={{ color: '#b45309', fontSize: '0.85rem', fontWeight: 600 }}>เป้าหมาย</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#78350f', lineHeight: 1.1 }}>{totalKeyResults}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* House Model */}
          <div className="card page-break-avoid" style={{ padding: '1.75rem', backgroundColor: 'var(--card)', marginBottom: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--secondary)', padding: '0.35rem 1rem', borderRadius: '99px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                <Home size={18} />
                โมเดลบ้านยุทธศาสตร์ (Strategic House Model)
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
                กรอบทิศทางยุทธศาสตร์สุขภาพ 5 ปี จังหวัดสระแก้ว
              </h3>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9, display: 'block', marginBottom: '0.25rem' }}>วิสัยทัศน์ (Vision)</span>
              <p style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.4 }}>&ldquo;{coreData?.vision || 'ไม่มีข้อมูล'}&rdquo;</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
              {strategicIssues.map((issue: any, idx: number) => {
                const issueColor = issue.theme_color || '#0284c7';
                return (
                  <div key={issue.id} style={{ backgroundColor: 'white', border: `2px solid ${issueColor}`, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: issueColor, color: 'white', padding: '1rem', textAlign: 'center', borderBottom: `1px solid ${issueColor}` }}>
                      <div style={{ display: 'inline-block', backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        ยุทธศาสตร์ที่ {idx + 1} [{issue.auto_id}]
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{issue.name}</h4>
                    </div>
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-foreground)', textTransform: 'uppercase' }}>กลยุทธ์</span>
                        <span style={{ fontSize: '0.7rem', backgroundColor: `${issueColor}20`, color: issueColor, padding: '0.1rem 0.45rem', borderRadius: '99px', fontWeight: 700 }}>{issue.strategies?.length || 0}</span>
                      </div>
                      {issue.strategies?.map((strat: any) => (
                        <div key={strat.id} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.75rem', borderLeft: `4px solid ${issueColor}` }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: issueColor, marginBottom: '0.15rem' }}>[{strat.auto_id}]</div>
                          <div style={{ fontSize: '0.85rem', lineHeight: 1.4, color: 'var(--foreground)' }}>{strat.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {strategicIssues.map((issue) => (
            <div key={issue.id} style={{ marginBottom: '3rem' }}>
              <div style={{ backgroundColor: issue.theme_color || 'var(--primary)', color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>ประเด็นยุทธศาสตร์: [{issue.auto_id}] {issue.name}</h3>
              </div>
              
              <div style={{ border: `1px solid ${issue.theme_color || 'var(--border)'}`, padding: '1.5rem', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                {issue.outcome_indicators && issue.outcome_indicators.length > 0 && (
                  <div style={{ marginBottom: '2rem' }} className="page-break-avoid">
                    <h4 style={{ fontWeight: 'bold', color: issue.theme_color, marginBottom: '0.5rem', fontSize: '1.2rem' }}>ตัวชี้วัดยุทธศาสตร์ (Outcome Indicators)</h4>
                    <ul style={{ paddingLeft: '1.5rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
                      {issue.outcome_indicators.map((ind: any) => (
                        <li key={ind.id} style={{ marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 'bold' }}>[{ind.auto_id}]</span> {ind.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {issue.strategies?.map((strat: any) => (
                  <div key={strat.id} style={{ marginBottom: '2.5rem' }}>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', backgroundColor: 'var(--secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                      <span style={{ color: issue.theme_color }}>[{strat.auto_id}]</span> {strat.name}
                    </h4>

                    {strat.objectives?.map((obj: any) => (
                      <div key={obj.id} style={{ marginBottom: '2rem', paddingLeft: '1.5rem', borderLeft: `4px solid ${issue.theme_color}` }} className="page-break-avoid">
                        <h5 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                          <span style={{ color: issue.theme_color }}>[{obj.auto_id}]</span> {obj.name}
                        </h5>
                        <KrTableClient objective={obj} themeColor={issue.theme_color || 'var(--primary)'} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* --- SECTION 3: KPI DICTIONARY --- */}
        <div className="page-break-before">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '3px solid var(--primary)' }}>
            ส่วนที่ 3: รายละเอียดตัวชี้วัด (KPI Dictionary)
          </h2>

          {kpis.filter(kr => kr.kpi_dictionaries && (Array.isArray(kr.kpi_dictionaries) ? kr.kpi_dictionaries.length > 0 : Object.keys(kr.kpi_dictionaries).length > 0)).map((kr) => {
            const kpi = Array.isArray(kr.kpi_dictionaries) ? kr.kpi_dictionaries[0] : kr.kpi_dictionaries;
            if (!kpi) return null;

            return (
              <div key={kr.id} className="page-break-avoid" style={{ marginBottom: '3rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem 1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>[{kr.auto_id}] {kr.name}</h3>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '25%', padding: '1rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', backgroundColor: 'var(--secondary)', fontWeight: 'bold' }}>ประเภทตัวชี้วัด</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{kpi.kpi_type || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', backgroundColor: 'var(--secondary)', fontWeight: 'bold' }}>คำนิยาม</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>{kpi.definition || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', backgroundColor: 'var(--secondary)', fontWeight: 'bold' }}>สูตรการคำนวณ</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>{kpi.calculation_formula || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', backgroundColor: 'var(--secondary)', fontWeight: 'bold' }}>เกณฑ์การประเมิน</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>{kpi.evaluation_criteria || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', backgroundColor: 'var(--secondary)', fontWeight: 'bold' }}>หน่วยงานรับผิดชอบ</td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>{kpi.responsible_agency || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '1rem', borderRight: '1px solid var(--border)', backgroundColor: 'var(--secondary)', fontWeight: 'bold' }}>ฐานข้อมูล / แหล่งอ้างอิง</td>
                      <td style={{ padding: '1rem' }}>{kpi.data_source || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
