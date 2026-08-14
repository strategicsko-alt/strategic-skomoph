import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
  const { data: strategies } = await supabase
    .from('strategic_issues')
    .select(`
      id, auto_id, name, order_index, theme_color,
      strategic_outcome_indicators (
        id, name
      ),
      objectives (
        id, auto_id, strategy_name,
        key_results (
          id, auto_id, name, target_2570, target_2571, target_2572, target_2573, target_2574, measurement_status
        )
      )
    `)
    .order('order_index', { ascending: true })
    .order('order_index', { foreignTable: 'strategic_outcome_indicators', ascending: true })
    .order('order_index', { foreignTable: 'objectives', ascending: true })
    .order('order_index', { foreignTable: 'objectives.key_results', ascending: true });

  const vision = coreData?.vision || 'ยังไม่มีข้อมูลวิสัยทัศน์';
  const missions = coreListItems?.filter((i: any) => i.item_type === 'mission') || [];
  const goals = coreListItems?.filter((i: any) => i.item_type === 'goal') || [];
  
  const renderList = (items: any[]) => {
    if (items.length === 0) return <p style={{ fontStyle: 'italic', opacity: 0.8 }}>ยังไม่มีข้อมูล</p>;
    return (
      <ul style={{ listStylePosition: 'inside', paddingLeft: '0.5rem', listStyleType: 'disc' }}>
        {items.map((item, idx) => (
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
      {/* Header Section */}
      <header style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>ยุทธศาสตร์สุขภาพ 5 ปี จังหวัดสระแก้ว</h1>
        <p style={{ opacity: 0.9 }}>(พ.ศ. 2570 - 2574)</p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/editor/login" className="btn-secondary" style={{ backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.3)', color: 'white', fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
            เข้าสู่ระบบจัดการข้อมูล
          </Link>
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

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--primary)', marginBottom: '1rem' }}>ภาพรวมการประเมิน (SWOT)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {renderSwotBox('S', 'Strengths', 'var(--success)')}
            {renderSwotBox('W', 'Weaknesses', 'var(--destructive)')}
            {renderSwotBox('O', 'Opportunities', 'var(--primary)')}
            {renderSwotBox('T', 'Threats', 'var(--warning)')}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--primary)', marginBottom: '1rem' }}>กลยุทธ์จากสภาพแวดล้อม (TOWS Matrix)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {renderSwotBox('SO', 'SO: เชิงรุก', '#10b981')}
            {renderSwotBox('WO', 'WO: เชิงแก้ไข', '#3b82f6')}
            {renderSwotBox('ST', 'ST: เชิงป้องกัน', '#f59e0b')}
            {renderSwotBox('WT', 'WT: เชิงรับ', '#ef4444')}
          </div>
        </div>
      </section>

      {/* 5-Year Strategic Roadmap */}
      <section style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="card" style={{ overflowX: 'auto' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '0.75rem' }}>
            Roadmap ยุทธศาสตร์ 5 ปี
          </h2>
          
          {strategies && strategies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: '800px' }}>
              {strategies.map((strategy: any) => (
                <div key={strategy.id} style={{ borderLeft: `4px solid ${strategy.theme_color || 'var(--primary)'}`, paddingLeft: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: strategy.theme_color || 'var(--foreground)' }}>
                    <span style={{ color: 'var(--secondary-foreground)', marginRight: '0.5rem', fontWeight: 700 }}>[{strategy.auto_id}]</span>
                    {strategy.name}
                  </h3>
                  
                  {strategy.strategic_outcome_indicators?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '1rem', color: strategy.theme_color || 'var(--primary)', marginBottom: '0.5rem' }}>ตัวชี้วัดยุทธศาสตร์ (Outcome Indicators):</h4>
                      <ul style={{ listStylePosition: 'inside', paddingLeft: '0.5rem', listStyleType: 'disc' }}>
                        {strategy.strategic_outcome_indicators.map((ind: any) => (
                          <li key={ind.id} style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{ind.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {strategy.objectives?.map((obj: any) => (
                    <div key={obj.id} style={{ marginBottom: '1.5rem', backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                        <span style={{ color: strategy.theme_color || 'var(--primary)' }}>[{obj.auto_id}]</span> {obj.strategy_name}
                      </h4>
                      
                      {/* KR Timeline Table */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.875rem', backgroundColor: 'var(--card)' }}>
                        <thead>
                          <tr style={{ backgroundColor: strategy.theme_color || 'var(--primary)', color: 'white', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm) 0 0 0' }}>Key Result</th>
                            <th style={{ padding: '0.5rem' }}>สถานะ</th>
                            <th style={{ padding: '0.5rem' }}>ปี 2570</th>
                            <th style={{ padding: '0.5rem' }}>ปี 2571</th>
                            <th style={{ padding: '0.5rem' }}>ปี 2572</th>
                            <th style={{ padding: '0.5rem' }}>ปี 2573</th>
                            <th style={{ padding: '0.5rem', borderRadius: '0 var(--radius-sm) 0 0' }}>ปี 2574</th>
                          </tr>
                        </thead>
                        <tbody>
                          {obj.key_results?.map((kr: any) => (
                            <tr key={kr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>
                                <span style={{ color: 'var(--primary)' }}>[{kr.auto_id}]</span> {kr.name}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: kr.measurement_status === 'พร้อมวัด' ? 'var(--success)' : 'var(--warning)', color: 'white', borderRadius: '99px', fontSize: '0.75rem' }}>
                                  {kr.measurement_status || '-'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{kr.target_2570 || '-'}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{kr.target_2571 || '-'}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{kr.target_2572 || '-'}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>{kr.target_2573 || '-'}</td>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: 'var(--primary)' }}>{kr.target_2574 || '-'}</td>
                            </tr>
                          ))}
                          {(!obj.key_results || obj.key_results.length === 0) && (
                            <tr>
                              <td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>ยังไม่มีข้อมูล Key Result</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))}
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
