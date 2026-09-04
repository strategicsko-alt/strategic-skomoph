'use client';
import React, { useState } from 'react';
import { WORK_GROUPS, MOCK_KPIS, DISTRICTS } from '../mockData';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function DashboardPrototype() {
  const [activeTab, setActiveTab] = useState<'detail' | 'executive'>('detail');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  
  const CATEGORIES = Array.from(new Set(MOCK_KPIS.flatMap(k => k.tags)));
  const [selectedKpiId, setSelectedKpiId] = useState(MOCK_KPIS[0].id);

  const filteredKpis = MOCK_KPIS.filter(k => 
    (filterGroup === '' || k.responsible_group === filterGroup) &&
    (filterCategory === '' || k.tags.includes(filterCategory)) &&
    (search === '' || k.name.includes(search))
  );

  const selectedKpi = MOCK_KPIS.find(k => k.id === selectedKpiId) || filteredKpis[0];

  const getStatusColor = (status: string) => {
    if (status === 'success') return '#22c55e'; // Green
    if (status === 'warning') return '#eab308'; // Yellow
    if (status === 'pending') return '#94a3b8'; // Gray
    return '#ef4444'; // Red
  };

  // ฟังก์ชันคำนวณสถานะอัตโนมัติจากผลลัพธ์และเกณฑ์
  const evaluateStatus = (result: number, kpi: any) => {
    if (kpi.calculation_type === 'process_status') return kpi.status; // ใช้ค่าเดิม
    if (kpi.target_val === null) return 'pending';
    
    const val = Number(result);
    const target = Number(kpi.target_val);
    const warning = Number(kpi.target_warning_val);

    if (kpi.target_operator === '>=') {
      if (val >= target) return 'success';
      if (val >= warning) return 'warning';
      return 'error';
    }
    if (kpi.target_operator === '<=') {
      if (val <= target) return 'success';
      if (val <= warning) return 'warning';
      return 'error';
    }
    return 'pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>
      
      {/* Top Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard ตัวชี้วัด (KPIs) สสจ.สระแก้ว</h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              onClick={() => setActiveTab('detail')}
              style={{ 
                padding: '0.5rem 1rem', 
                borderBottom: activeTab === 'detail' ? '3px solid var(--primary)' : '3px solid transparent',
                fontWeight: activeTab === 'detail' ? 700 : 500,
                color: activeTab === 'detail' ? 'var(--primary)' : 'var(--secondary-foreground)',
                background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer'
              }}
            >
              มุมมองรายตัวชี้วัด (Master-Detail)
            </button>
            <button 
              onClick={() => setActiveTab('executive')}
              style={{ 
                padding: '0.5rem 1rem', 
                borderBottom: activeTab === 'executive' ? '3px solid var(--primary)' : '3px solid transparent',
                fontWeight: activeTab === 'executive' ? 700 : 500,
                color: activeTab === 'executive' ? 'var(--primary)' : 'var(--secondary-foreground)',
                background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer'
              }}
            >
              สรุปสำหรับผู้บริหาร (Executive Summary)
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="input-field" style={{ width: '220px' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">-- ทุกหมวดหมู่ --</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field" style={{ width: '220px' }} value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
            <option value="">-- ทุกกลุ่มงาน --</option>
            {WORK_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {activeTab === 'executive' && (
        <div className="card" style={{ flex: 1, overflow: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>ตารางสถานะตัวชี้วัดแยกตามพื้นที่ (Heatmap)</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>แสดงผล: {filteredKpis.length} ตัวชี้วัด</div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', width: '300px', borderRight: '1px solid var(--border)' }}>ชื่อตัวชี้วัด</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderRight: '2px solid var(--border)', backgroundColor: '#f8fafc' }}>รวมจังหวัด</th>
                  {DISTRICTS.map(d => (
                    <th key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '120px' }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredKpis.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>ไม่พบตัวชี้วัดในหมวดหมู่ หรือกลุ่มงานที่เลือก</td>
                  </tr>
                )}
                {filteredKpis.map(kpi => {
                  let provStatus = kpi.status;
                  if (kpi.calculation_type !== 'process_status' && typeof kpi.provincial_result === 'number') {
                     provStatus = evaluateStatus(kpi.provincial_result, kpi);
                  }

                  const getBgColor = (status: string) => status === 'success' ? '#dcfce7' : status === 'warning' ? '#fef08a' : status === 'pending' ? '#e2e8f0' : '#fee2e2';
                  const getTextColor = (status: string) => status === 'success' ? '#166534' : status === 'warning' ? '#854d0e' : status === 'pending' ? '#475569' : '#991b1b';
                  
                  return (
                    <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border)', fontWeight: 500 }}>
                        <div style={{ marginBottom: '0.25rem' }}>{kpi.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{kpi.responsible_group}</span>
                          {kpi.tags.map(tag => (
                            <span key={tag} style={{ fontSize: '0.65rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderRight: '2px solid var(--border)', backgroundColor: getBgColor(provStatus), color: getTextColor(provStatus), fontWeight: 700 }}>
                        {kpi.calculation_type === 'process_status' ? (kpi.status === 'success' ? 'ผ่าน' : kpi.status === 'pending' ? 'รอดำเนินการ' : 'ไม่ผ่าน') : kpi.provincial_result}
                      </td>
                      {DISTRICTS.map(d => {
                        if (kpi.measurement_level === 'province') {
                           return <td key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: '#f1f5f9' }}>-</td>;
                        }
                        const dist = kpi.district_results.find(res => res.name === d);
                        if (!dist) return <td key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: '#f1f5f9' }}>-</td>;
                        
                        const dStatus = evaluateStatus(dist.result, kpi);
                        return (
                          <td key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: getBgColor(dStatus), color: getTextColor(dStatus), fontWeight: 600 }}>
                            {dist.result}
                          </td>
                        );
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'detail' && (
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
          {/* Left List Panel */}
          <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="ค้นหาตัวชี้วัด..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {filteredKpis.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--secondary-foreground)', marginTop: '2rem' }}>ไม่พบตัวชี้วัด</div>
              )}
              {filteredKpis.map(kpi => (
                <div 
                  key={kpi.id} 
                  onClick={() => setSelectedKpiId(kpi.id)}
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid',
                    borderColor: selectedKpiId === kpi.id ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: selectedKpiId === kpi.id ? '#f0f9ff' : 'var(--card)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', backgroundColor: kpi.status === 'success' ? '#dcfce7' : kpi.status === 'pending' ? '#e2e8f0' : '#fee2e2', color: kpi.status === 'success' ? '#166534' : kpi.status === 'pending' ? '#475569' : '#991b1b', borderRadius: '4px' }}>
                      {kpi.status === 'success' ? 'ผ่าน' : kpi.status === 'pending' ? 'รอดำเนินการ' : 'ไม่ผ่าน'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary-foreground)' }}>{kpi.responsible_group}</span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{kpi.name}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {kpi.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '0.65rem', backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Detail Panel */}
          {selectedKpi && (
            <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px' }}>
                  {selectedKpi.measurement_level.toUpperCase()}
                </span>
                {selectedKpi.tags.map(t => (
                  <span key={t} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '4px', fontWeight: 500 }}>
                    🏷️ {t}
                  </span>
                ))}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{selectedKpi.name}</h2>

              {/* Targets Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>เป้าหมาย (เขียว)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534' }}>
                    {selectedKpi.target_operator === '>=' ? '≥ ' : selectedKpi.target_operator === '<=' ? '≤ ' : ''}
                    {selectedKpi.target_val}
                  </div>
                  {selectedKpi.target_warning_val && (
                     <div style={{ fontSize: '0.8rem', color: '#854d0e', marginTop: '0.25rem' }}>
                       (เฝ้าระวัง: {selectedKpi.target_operator === '>=' ? '≥ ' : selectedKpi.target_operator === '<=' ? '≤ ' : ''}{selectedKpi.target_warning_val})
                     </div>
                  )}
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', backgroundColor: selectedKpi.calculation_type === 'process_status' ? '#f8fafc' : 'transparent' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>ผลงานภาพรวมจังหวัด</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: selectedKpi.calculation_type === 'process_status' ? getStatusColor(selectedKpi.status) : getStatusColor(evaluateStatus(Number(selectedKpi.provincial_result), selectedKpi)) }}>
                    {selectedKpi.calculation_type === 'process_status' ? (selectedKpi.status === 'success' ? 'ผ่าน' : selectedKpi.status === 'pending' ? 'รอดำเนินการ' : 'ไม่ผ่าน') : selectedKpi.provincial_result}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--secondary)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>รอบการประเมิน</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedKpi.frequency}</div>
                </div>
              </div>

              {/* Process Status Details OR Numeric Details */}
              {selectedKpi.calculation_type === 'process_status' ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>รายละเอียดความคืบหน้า (เชิงกระบวนการ)</h4>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                    {selectedKpi.provincial_result}
                  </p>
                </div>
              ) : (
                <>
                  {/* Chart Section */}
                  {selectedKpi.district_results.length > 0 && typeof selectedKpi.target_val === 'number' && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', height: '350px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>แผนภูมิผลงานรายพื้นที่เทียบกับเป้าหมาย</h4>
                        <span style={{ fontSize: '0.75rem', backgroundColor: selectedKpi.measurement_level === 'hospital' ? '#e0f2fe' : '#f3f4f6', color: selectedKpi.measurement_level === 'hospital' ? '#0369a1' : '#4b5563', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          หน่วย: {selectedKpi.measurement_level === 'hospital' ? 'โรงพยาบาล (รพ.)' : 'อำเภอ (อ.)'}
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedKpi.district_results} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <ReferenceLine 
                            y={selectedKpi.target_val} 
                            label={{ position: 'top', value: `เป้าหมาย: ${selectedKpi.target_operator} ${selectedKpi.target_val}`, fill: '#166534', fontSize: 12, fontWeight: 'bold' }} 
                            stroke="#166534" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                          />
                          {selectedKpi.target_warning_val && (
                             <ReferenceLine 
                              y={selectedKpi.target_warning_val} 
                              label={{ position: 'top', value: `เฝ้าระวัง: ${selectedKpi.target_operator} ${selectedKpi.target_warning_val}`, fill: '#854d0e', fontSize: 11 }} 
                              stroke="#eab308" 
                              strokeWidth={1} 
                              strokeDasharray="3 3" 
                            />
                          )}
                          <Bar dataKey="result" radius={[4, 4, 0, 0]}>
                            {selectedKpi.district_results.map((entry, index) => {
                              const dStatus = evaluateStatus(entry.result, selectedKpi);
                              return <Cell key={`cell-${index}`} fill={getStatusColor(dStatus)} />
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* District Grid */}
                  {selectedKpi.district_results.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>ผลงานรายพื้นที่ (9 แห่ง)</h4>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {selectedKpi.district_results.map(d => {
                          const dStatus = evaluateStatus(d.result, selectedKpi);
                          return (
                          <div key={d.name} style={{ 
                            border: '1px solid',
                            borderColor: dStatus === 'success' ? '#bbf7d0' : dStatus === 'warning' ? '#fde047' : '#fecaca',
                            backgroundColor: dStatus === 'success' ? '#f0fdf4' : dStatus === 'warning' ? '#fefce8' : '#fef2f2',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{d.name}</span>
                              <span style={{ fontSize: '0.65rem', backgroundColor: selectedKpi.measurement_level === 'hospital' ? '#bae6fd' : '#e2e8f0', color: selectedKpi.measurement_level === 'hospital' ? '#0369a1' : '#475569', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                                {selectedKpi.measurement_level === 'hospital' ? 'รพ.' : 'อ.'}
                              </span>
                            </div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: getStatusColor(dStatus) }}>
                              {d.result}
                            </span>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}

                  {/* Formula & Variables */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>สูตรและการคำนวณ</h4>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>รูปแบบ: <strong>{selectedKpi.formula}</strong></p>{selectedKpi.calculation_formula && <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--primary)' }}>สูตรคำนวณ: <strong style={{fontFamily: 'monospace', backgroundColor: '#e0f2fe', padding: '0.2rem 0.4rem', borderRadius: '4px'}}>{selectedKpi.calculation_formula}</strong></p>}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--secondary)' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>ตัวแปรรวม</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>รายละเอียดข้อมูลการประเมิน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedKpi.data_items.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.id}</td>
                            <td style={{ padding: '0.5rem' }}>{item.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
