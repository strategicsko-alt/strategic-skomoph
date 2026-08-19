import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { KrTableClient } from '@/components/KrTableClient';
import { ExportButton } from '@/components/ExportButton';
import { 
  Briefcase, 
  GitBranch, 
  Target, 
  Activity, 
  Layers, 
  Home, 
  Lock,
  Compass,
  Folder
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch Core Organization Data
  const { data: coreData } = await supabase
    .from('core_organization')
    .select('vision')
    .limit(1)
    .maybeSingle();

  const { data: coreListItems } = await supabase
    .from('core_list_items')
    .select('*')
    .order('created_at', { ascending: true });

  const { data: swotItems } = await supabase
    .from('swot_items')
    .select('*')
    .order('created_at', { ascending: true });

  // Fetch Strategic Issues and Objectives for the Roadmap
  const { data: rawStrategies } = await supabase
    .from('strategic_issues')
    .select(`
      id, auto_id, name, order_index, theme_color,
      outcome_indicators:key_results!strategic_issue_id (
        id, auto_id, name, measurement_status, target_2570, target_2571, target_2572, target_2573, target_2574, order_index
      ),
      projects (
        id, name, description, responsible_group, order_index,
        project_strategies ( strategy_id )
      ),
      strategies (
        id, auto_id, name, order_index,
        objectives (
          id, auto_id, name, order_index, initiative_activity, ia_ssjj, ia_rph, ia_ssor, ia_rphst, ia_phakee,
          key_results (
            id, auto_id, name, order_index, target_2570, target_2571, target_2572, target_2573, target_2574, measurement_status
          )
        )
      )
    `)
    .order('order_index', { ascending: true });

  // Sort nested relations in JS
  const strategies = (rawStrategies || []).map((issue: any) => ({
    ...issue,
    outcome_indicators: (issue.outcome_indicators || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    projects: (issue.projects || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    strategies: (issue.strategies || []).sort((a: any, b: any) => a.order_index - b.order_index).map((st: any) => ({
      ...st,
      objectives: (st.objectives || []).sort((a: any, b: any) => a.order_index - b.order_index).map((obj: any) => ({
        ...obj,
        key_results: (obj.key_results || []).sort((a: any, b: any) => a.order_index - b.order_index),
      })),
    })),
  }));

  // Calculate totals for stats summary
  const totalIssues = strategies.length;
  let totalStrategies = 0;
  let totalObjectives = 0;
  let totalKeyResults = 0;
  let totalProjects = 0;

  strategies.forEach((issue: any) => {
    if (issue.projects) {
      totalProjects += issue.projects.length;
    }
    if (issue.strategies) {
      totalStrategies += issue.strategies.length;
      issue.strategies.forEach((st: any) => {
        if (st.objectives) {
          totalObjectives += st.objectives.length;
          st.objectives.forEach((obj: any) => {
            if (obj.key_results) {
              totalKeyResults += obj.key_results.length;
            }
          });
        }
      });
    }
  });

  const vision = coreData?.vision || 'ยังไม่มีข้อมูลวิสัยทัศน์';
  const missions = coreListItems?.filter((i: any) => i.item_type === 'mission') || [];
  const goals = coreListItems?.filter((i: any) => i.item_type === 'goal') || [];
  
  const renderList = (items: any[]) => {
    if (items.length === 0) return <p style={{ fontStyle: 'italic', opacity: 0.8 }}>ยังไม่มีข้อมูล</p>;
    return (
      <ul style={{ listStylePosition: 'inside', paddingLeft: '0.5rem', listStyleType: 'disc' }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '0.25rem', lineHeight: '1.5' }}>{item.detail}</li>
        ))}
      </ul>
    );
  };

  const renderSwotBox = (type: string, title: string, color: string) => {
    const items = swotItems?.filter((i: any) => i.swot_type === type) || [];
    return (
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h4 style={{ fontWeight: 600, color, marginBottom: '0.5rem', borderBottom: `2px solid ${color}`, paddingBottom: '0.25rem' }}>{title}</h4>
        <ul style={{ listStylePosition: 'inside', paddingLeft: '0', listStyleType: 'none' }}>
          {items.length === 0 ? <li style={{ color: 'var(--secondary-foreground)', fontStyle: 'italic', fontSize: '0.875rem' }}>ไม่มีข้อมูล</li> : null}
          {items.map((item, idx) => (
            <li key={item.id} style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, color }}>{type}{idx + 1}.</span>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Header Section with Top-Right Login Button */}
      <header style={{ 
        backgroundColor: 'var(--primary)', 
        color: 'var(--primary-foreground)', 
        padding: '1.75rem 1.5rem',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              ยุทธศาสตร์สุขภาพ 5 ปี จังหวัดสระแก้ว
            </h1>
            <p style={{ opacity: 0.9, fontSize: '1rem', fontWeight: 500 }}>
              (พ.ศ. 2570 - 2574)
            </p>
          </div>
          <div>
            <Link 
              href="/editor/login" 
              className="btn-secondary" 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.18)', 
                borderColor: 'rgba(255,255,255,0.4)', 
                color: 'white', 
                fontSize: '0.875rem', 
                fontWeight: 600,
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                transition: 'all 0.2s'
              }}
            >
              <Lock size={16} />
              เข้าสู่ระบบจัดการข้อมูล
            </Link>
          </div>
        </div>
      </header>

      {/* Bento Grid - Core Data */}
      <section className="bento-grid">
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>วิสัยทัศน์ (Vision)</h2>
          <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>{vision}</p>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>พันธกิจ (Mission)</h2>
          <div style={{ fontSize: '1rem' }}>{renderList(missions)}</div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: 'white' }}>
          <h2 style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '0.75rem' }}>เป้าประสงค์สูงสุด (Ultimate Goal)</h2>
          <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>{renderList(goals)}</div>
        </div>

        {/* 1. สรุปภาพรวมโครงสร้างยุทธศาสตร์ (4 Stats Cards) */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: '1.5rem', backgroundColor: 'var(--card)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <Layers size={22} />
            สรุปภาพรวมโครงสร้างยุทธศาสตร์
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {/* โครงการ */}
            <div style={{ padding: '1.25rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#e11d48', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Folder size={26} />
              </div>
              <div>
                <p style={{ color: '#9f1239', fontSize: '0.85rem', fontWeight: 600 }}>โครงการ (Projects)</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#4c0519', lineHeight: 1.1 }}>{totalProjects}</h3>
              </div>
            </div>

            {/* ยุทธศาสตร์ */}
            <div style={{ padding: '1.25rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#0284c7', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={26} />
              </div>
              <div>
                <p style={{ color: '#0369a1', fontSize: '0.85rem', fontWeight: 600 }}>ยุทธศาสตร์ (Issues)</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0c4a6e', lineHeight: 1.1 }}>{totalIssues}</h3>
              </div>
            </div>

            {/* กลยุทธ์ */}
            <div style={{ padding: '1.25rem', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#7c3aed', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GitBranch size={26} />
              </div>
              <div>
                <p style={{ color: '#6d28d9', fontSize: '0.85rem', fontWeight: 600 }}>กลยุทธ์ (Strategies)</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#4c1d95', lineHeight: 1.1 }}>{totalStrategies}</h3>
              </div>
            </div>

            {/* เป้าประสงค์ */}
            <div style={{ padding: '1.25rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#059669', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={26} />
              </div>
              <div>
                <p style={{ color: '#047857', fontSize: '0.85rem', fontWeight: 600 }}>เป้าประสงค์ (Objectives)</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#064e3b', lineHeight: 1.1 }}>{totalObjectives}</h3>
              </div>
            </div>

            {/* เป้าหมาย */}
            <div style={{ padding: '1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#d97706', color: 'white', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={26} />
              </div>
              <div>
                <p style={{ color: '#b45309', fontSize: '0.85rem', fontWeight: 600 }}>เป้าหมาย (Key Results)</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#78350f', lineHeight: 1.1 }}>{totalKeyResults}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* 2. House Model แสดง 4 กล่องยุทธศาสตร์และกลยุทธ์ */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: '1.75rem', backgroundColor: 'var(--card)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--secondary)', padding: '0.35rem 1rem', borderRadius: '99px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              <Home size={18} />
              โมเดลบ้านยุทธศาสตร์ (Strategic House Model)
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
              กรอบทิศทางยุทธศาสตร์สุขภาพ 5 ปี จังหวัดสระแก้ว
            </h2>
          </div>

          {/* Roof / Top of House: Vision Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9, display: 'block', marginBottom: '0.25rem' }}>
              วิสัยทัศน์ (Vision)
            </span>
            <p style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.4 }}>
              &ldquo;{vision}&rdquo;
            </p>
          </div>

          {/* 4 Pillars / 4 Boxes of Strategic Issues and their Strategies */}
          {strategies && strategies.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              alignItems: 'stretch'
            }}>
              {strategies.map((issue: any, idx: number) => {
                const issueColor = issue.theme_color || '#0284c7';
                return (
                  <div
                    key={issue.id}
                    style={{
                      backgroundColor: 'var(--background)',
                      border: `2px solid ${issueColor}`,
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {/* Pillar Header */}
                    <div style={{
                      backgroundColor: issueColor,
                      color: 'white',
                      padding: '1rem',
                      textAlign: 'center',
                      borderBottom: `1px solid ${issueColor}`
                    }}>
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        padding: '0.15rem 0.6rem',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        marginBottom: '0.35rem'
                      }}>
                        ยุทธศาสตร์ที่ {idx + 1} [{issue.auto_id}]
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
                        {issue.name}
                      </h3>
                    </div>

                    {/* Pillar Content: List of Strategies */}
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-foreground)', textTransform: 'uppercase' }}>
                          กลยุทธ์ (Strategies)
                        </span>
                        <span style={{ fontSize: '0.7rem', backgroundColor: `${issueColor}20`, color: issueColor, padding: '0.1rem 0.45rem', borderRadius: '99px', fontWeight: 700 }}>
                          {issue.strategies?.length || 0} กลยุทธ์
                        </span>
                      </div>

                      {issue.strategies && issue.strategies.length > 0 ? (
                        issue.strategies.map((strat: any) => (
                          <div
                            key={strat.id}
                            style={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.65rem 0.75rem',
                              borderLeft: `4px solid ${issueColor}`,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                color: issueColor, 
                                backgroundColor: `${issueColor}15`, 
                                padding: '0.1rem 0.4rem', 
                                borderRadius: '4px',
                                flexShrink: 0
                              }}>
                                {strat.auto_id}
                              </span>
                              <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: 'var(--foreground)', lineHeight: 1.4 }}>
                                {strat.name}
                              </p>
                            </div>
                            {strat.objectives && strat.objectives.length > 0 && (
                              <div style={{ marginTop: '0.35rem', paddingLeft: '0.2rem', fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                                <span>🎯 {strat.objectives.length} เป้าประสงค์</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p style={{ color: 'var(--secondary-foreground)', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                          ยังไม่มีกลยุทธ์ในยุทธศาสตร์นี้
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--secondary-foreground)', padding: '2rem' }}>
              ยังไม่มีข้อมูลยุทธศาสตร์
            </p>
          )}

          {/* House Foundation / Base */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <Compass size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>
              ฐานรากการขับเคลื่อน: นวัตกรรมสุขภาพ ธรรมาภิบาล และการมีส่วนร่วมของเครือข่ายทุกภาคส่วนในจังหวัดสระแก้ว
            </span>
          </div>
        </div>

        <CollapsibleSection title="ภาพรวมการประเมิน (SWOT)" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {renderSwotBox('S', 'Strengths', 'var(--success)')}
            {renderSwotBox('W', 'Weaknesses', 'var(--destructive)')}
            {renderSwotBox('O', 'Opportunities', 'var(--primary)')}
            {renderSwotBox('T', 'Threats', 'var(--warning)')}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="กลยุทธ์จากสภาพแวดล้อม (TOWS Matrix)" defaultOpen={false}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {renderSwotBox('SO', 'SO: เชิงรุก', '#10b981')}
            {renderSwotBox('WO', 'WO: เชิงแก้ไข', '#3b82f6')}
            {renderSwotBox('ST', 'ST: เชิงป้องกัน', '#f59e0b')}
            {renderSwotBox('WT', 'WT: เชิงรับ', '#ef4444')}
          </div>
        </CollapsibleSection>
      </section>

      {/* 5-Year Strategic Roadmap */}
      <section style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '0.75rem' }}>
            Roadmap ยุทธศาสตร์ 5 ปี
          </h2>
          
          {strategies && strategies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
              {strategies.map((strategy: any, issueIdx: number) => {
                const issueNum = issueIdx + 1;
                return (
                  <CollapsibleSection key={strategy.id} title={`ยุทธศาสตร์: [${strategy.auto_id}] ${strategy.name}`} defaultOpen={true}>
                    <div style={{ padding: '0.5rem 0' }}>
                      
                      {strategy.outcome_indicators?.length > 0 && (
                        <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontWeight: 600, fontSize: '1rem', color: strategy.theme_color || 'var(--primary)', marginBottom: '0.5rem' }}>ตัวชี้วัดยุทธศาสตร์ (Outcome Indicators):</h4>
                          <ul style={{ listStylePosition: 'inside', paddingLeft: '0.5rem', listStyleType: 'disc' }}>
                            {strategy.outcome_indicators.map((ind: any) => (
                              <li key={ind.id} style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 600, color: strategy.theme_color || 'var(--primary)' }}>[{ind.auto_id}]</span> {ind.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {strategy.strategies?.map((strat: any) => (
                        <div key={strat.id} style={{ marginBottom: '1.5rem', backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                          <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>
                            <span style={{ color: strategy.theme_color || 'var(--primary)' }}>[{strat.auto_id}]</span> {strat.name}
                          </h4>
                          
                          {strat.objectives?.map((obj: any) => (
                            <div key={obj.id} style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: `3px solid ${strategy.theme_color || 'var(--border)'}` }}>
                              <h5 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                <span style={{ color: strategy.theme_color || 'var(--primary)' }}>[{obj.auto_id}]</span> {obj.name}
                              </h5>

                              {/* KR Timeline Table & How-To Info */}
                              <KrTableClient objective={obj} themeColor={strategy.theme_color || 'var(--primary)'} />
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Projects Section */}
                      {strategy.projects && strategy.projects.length > 0 && (
                        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--card)', border: `1px solid ${strategy.theme_color || 'var(--primary)'}`, borderRadius: 'var(--radius-md)' }}>
                          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: strategy.theme_color || 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Folder size={20} />
                            โครงการภายใต้ยุทธศาสตร์ (Projects)
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                            {strategy.projects.map((proj: any, projIdx: number) => {
                              const projCode = `P${issueNum}.${projIdx + 1}`;
                              // Resolve linked strategies across all issues
                              const linkedIds = (proj.project_strategies || []).map((ps: any) => ps.strategy_id);
                              const linkedStNames: string[] = [];
                              strategies.forEach((iss: any) => {
                                iss.strategies?.forEach((st: any) => {
                                  if (linkedIds.includes(st.id)) {
                                    linkedStNames.push(`[${st.auto_id}] ${st.name}`);
                                  }
                                });
                              });
                              
                              return (
                                <div key={proj.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--background)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ backgroundColor: strategy.theme_color || 'var(--primary)', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{projCode}</span>
                                    <h5 style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{proj.name}</h5>
                                  </div>
                                  {proj.description && <p style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>{proj.description}</p>}
                                  {proj.responsible_group && <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}><strong>กลุ่มงาน:</strong> {proj.responsible_group}</p>}
                                  {linkedStNames.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                      <strong>เชื่อมโยง:</strong> <span style={{ color: strategy.theme_color || 'var(--primary)' }}>{linkedStNames.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary-foreground)' }}>
              ยังไม่มีข้อมูลยุทธศาสตร์ กรุณาเพิ่มข้อมูลในระบบจัดการ
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
