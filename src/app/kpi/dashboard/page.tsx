'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import healthFacilitiesData from '@/data/sa_kaeo_health_facilities.json';

export const dynamic = 'force-dynamic';

const DISTRICTS = [
  "เมืองสระแก้ว", "คลองหาด", "ตาพระยา", "วังน้ำเย็น", 
  "วัฒนานคร", "อรัญประเทศ", "เขาฉกรรจ์", "โคกสูง", "วังสมบูรณ์"
];

// Reusing WORK_GROUPS from mock or defining them
const WORK_GROUPS = [
  "คุ้มครองผู้บริโภคและเภสัชสาธารณสุข",
  "บริหารทรัพยากรบุคคล",
  "กลุ่มกฎหมาย",
  "พัฒนายุทธศาสตร์สาธารณสุข",
  "สุขภาพดิจิทัล",
  "คุ้มครองผู้บริโภค",
  "พัฒนาคุณภาพและรูปแบบบริการ",
  "ควบคุมโรคติดต่อ",
  "ประกันสุขภาพ",
  "ส่งเสริมสุขภาพ",
  "ทันตสาธารณสุข",
  "บริหารทั่วไป",
  "อนามัยสิ่งแวดล้อมและอาชีวอนามัย",
  "ควบคุมโรคไม่ติดต่อ",
  "ปฐมภูมิและเครือข่ายสุขภาพ",
  "การแพทย์แผนไทยและการแพทย์ทางเลือก"
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'detail' | 'executive' | 'subdistrict'>('detail');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKpiId, setSelectedKpiId] = useState<string>('');

  // Subdistrict view states
  const [subdistrictDistrict, setSubdistrictDistrict] = useState<string>('เมืองสระแก้ว');
  const [subdistrictSearch, setSubdistrictSearch] = useState<string>('');
  const [subdistrictViewMode, setSubdistrictViewMode] = useState<'matrix' | 'list'>('matrix');

  useEffect(() => {
    async function fetchKPIs() {
      // ดึง Key Results ที่เชื่อมกับ KPI Dictionary
      const { data, error } = await supabase
        .from('key_results')
        .select(`
          id, name, auto_id, target_2570, measurement_status,
          objective:objectives(name, strategy:strategies(issue:strategic_issues(name))),
          kpi_dict:kpi_dictionaries(*),
          tags:key_result_tags(tag:kpi_tags(name)),
          measurements:kpi_measurements(*)
        `)
        .order('order_index', { ascending: true });
        
      if (data) {
        // Transform Supabase data to our UI format
        const transformed = data.map(kr => {
          const dict = kr.kpi_dict?.[0] || {};
          const tags = kr.tags?.map((t: any) => t.tag.name) || ['ยุทธศาสตร์สุขภาพ สระแก้ว'];
          
          let targetVal = null;
          let targetWarning = null;
          if (dict.evaluation_criteria_json) {
            const ev = typeof dict.evaluation_criteria_json === 'string' ? JSON.parse(dict.evaluation_criteria_json) : dict.evaluation_criteria_json;
            targetVal = ev.q4 || ev.green_target || null;
            targetWarning = ev.q4_warning || ev.yellow_target || null;
          }
          
          const district_results = DISTRICTS.map(d => {
            const m = (kr.measurements || []).find((x: any) => x.area_id === d && x.period === 'Q4'); // simplifying to Q4 or latest
            return { name: d, result: m ? Number(m.result_value) || 0 : 0 };
          });
          
          const prov_m = (kr.measurements || []).find((x: any) => x.area_id === 'province');
          const provResult = prov_m ? Number(prov_m.result_value) || 0 : 0;

          // Process status fallback
          const defaultStatus = kr.measurement_status === 'completed' ? 'success' : kr.measurement_status === 'failed' ? 'error' : 'pending';

          return {
            id: kr.id,
            auto_id: kr.auto_id,
            name: kr.name,
            tags: tags,
            responsible_group: dict.work_group || dict.responsible_person || kr.responsible_group || 'ไม่ระบุกลุ่มงาน',
            measurement_level: dict.measurement_level || 'province',
            formula: dict.calculation_type === 'process_status' ? 'เชิงกระบวนการ' : (dict.calculation_formula || 'ร้อยละ'),
            calculation_formula: dict.calculation_formula,
            calculation_type: dict.calculation_type || 'process_status',
            data_items: dict.data_items_json ? (typeof dict.data_items_json === 'string' ? JSON.parse(dict.data_items_json) : dict.data_items_json) : [],
            target: kr.target_2570,
            target_val: targetVal,
            target_warning_val: targetWarning,
            target_operator: dict.target_operator || '>=',
            frequency: 'รายไตรมาส',
            status: defaultStatus,
            provincial_result: provResult || (dict.calculation_type === 'process_status' ? (prov_m?.values_json?.description || 'รอดำเนินการ') : 0),
            district_results
          };
        });
        
        setKpis(transformed);
        if (transformed.length > 0) setSelectedKpiId(transformed[0].id);
      }
      setLoading(false);
    }
    fetchKPIs();
  }, []);

  const CATEGORIES = Array.from(new Set(kpis.flatMap(k => k.tags)));
  
  const filteredKpis = kpis.filter(k => 
    (filterGroup === '' || k.responsible_group === filterGroup) &&
    (filterCategory === '' || k.tags.includes(filterCategory)) &&
    (search === '' || k.name.includes(search))
  );

  const selectedKpi = kpis.find(k => k.id === selectedKpiId) || filteredKpis[0];

  const getStatusColor = (status: string) => {
    if (status === 'success') return '#22c55e'; // Green
    if (status === 'warning') return '#eab308'; // Yellow
    if (status === 'pending') return '#94a3b8'; // Gray
    return '#ef4444'; // Red
  };

  const evaluateStatus = (result: number, kpi: any) => {
    if (kpi.calculation_type === 'process_status') return kpi.status;
    if (kpi.target_val === null || kpi.target_val === undefined) return 'pending';
    
    const val = Number(result);
    const target = Number(kpi.target_val);
    const warning = Number(kpi.target_warning_val);

    if (kpi.target_operator === '>=') {
      if (val >= target) return 'success';
      if (warning && val >= warning) return 'warning';
      return 'error';
    }
    if (kpi.target_operator === '<=') {
      if (val <= target) return 'success';
      if (warning && val <= warning) return 'warning';
      return 'error';
    }
    return 'pending';
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>กำลังโหลดข้อมูลตัวชี้วัด...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>
      {/* Top Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard ตัวชี้วัด (KPIs) สสจ.สระแก้ว</h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setActiveTab('detail')} style={{ padding: '0.5rem 1rem', borderBottom: activeTab === 'detail' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === 'detail' ? 700 : 500, color: activeTab === 'detail' ? 'var(--primary)' : 'var(--secondary-foreground)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
              มุมมองรายตัวชี้วัด (Master-Detail)
            </button>
            <button onClick={() => setActiveTab('executive')} style={{ padding: '0.5rem 1rem', borderBottom: activeTab === 'executive' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === 'executive' ? 700 : 500, color: activeTab === 'executive' ? 'var(--primary)' : 'var(--secondary-foreground)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
              สรุปสำหรับผู้บริหาร (Executive Summary)
            </button>
            <button onClick={() => setActiveTab('subdistrict')} style={{ padding: '0.5rem 1rem', borderBottom: activeTab === 'subdistrict' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === 'subdistrict' ? 700 : 500, color: activeTab === 'subdistrict' ? 'var(--primary)' : 'var(--secondary-foreground)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
              ระดับ รพ.สต. (HDC Open Data)
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="input-field" style={{ width: '220px' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">-- ทุกหมวดหมู่ --</option>
            {CATEGORIES.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
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
                        <div style={{ marginBottom: '0.25rem' }}><span style={{color:'var(--primary)'}}>[{kpi.auto_id}]</span> {kpi.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{kpi.responsible_group}</span>
                          {kpi.tags.map((tag: string) => (
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
                        const dist = kpi.district_results.find((res: any) => res.name === d);
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

      
      {activeTab === 'subdistrict' && (() => {
        // Filter health facilities to only primary care / subdistrict health centers
        const rpostFacilities = (healthFacilitiesData as any[]).filter(f => 
          (f.type?.includes('ส่งเสริมสุขภาพตำบล') || f.name?.includes('สถานีอนามัย') || f.name?.includes('รพ.สต.'))
        );

        // Filter by selected district and search keyword
        const displayFacilities = rpostFacilities.filter(f => {
          const matchDistrict = subdistrictDistrict === 'ALL' || f.district === subdistrictDistrict;
          const matchSearch = !subdistrictSearch || 
            f.name.toLowerCase().includes(subdistrictSearch.toLowerCase()) || 
            (f.code5 && f.code5.includes(subdistrictSearch)) ||
            (f.code9_new && f.code9_new.toLowerCase().includes(subdistrictSearch.toLowerCase()));
          return matchDistrict && matchSearch;
        });

        // Calculate count per district for the dropdown
        const countByDistrict: Record<string, number> = {};
        DISTRICTS.forEach(d => { countByDistrict[d] = 0; });
        rpostFacilities.forEach(f => {
          if (f.district && countByDistrict[f.district] !== undefined) {
            countByDistrict[f.district]++;
          }
        });

        const cleanShortName = (name: string) => {
          return name
            .replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'รพ.สต.')
            .replace('โรงพยาบาลส่งเสริมสุขภาพบ้าน', 'รพ.สต.')
            .replace('สถานีอนามัยเฉลิมพระเกียรติ 60 พรรษา นวมินทราชินี', 'สอน.')
            .replace('สถานีอนามัย', 'สอน.');
        };

        const getBgColor = (status: string) => status === 'success' ? '#dcfce7' : status === 'warning' ? '#fef08a' : status === 'pending' ? '#e2e8f0' : '#fee2e2';
        const getTextColor = (status: string) => status === 'success' ? '#166534' : status === 'warning' ? '#854d0e' : status === 'pending' ? '#475569' : '#991b1b';
        const mockStatuses = ['success', 'warning', 'error', 'pending'];

        return (
          <div className="card" style={{ flex: 1, overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column' }}>
            {/* Filter and Control Bar */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  การติดตามตัวชี้วัดระดับ รพ.สต. (HDC Open Data)
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', marginTop: '0.25rem' }}>
                  ฐานข้อมูลหน่วยบริการสุขภาพปฐมภูมิ จ.สระแก้ว ({rpostFacilities.length} แห่ง) • รอดึงผลคะแนนจาก HDC API
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span> ผ่านเกณฑ์
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308', display: 'inline-block' }}></span> เฝ้าระวัง
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span> ไม่ผ่านเกณฑ์
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#94a3b8', display: 'inline-block' }}></span> รอดำเนินการ
                </span>
              </div>
            </div>

            {/* Filter Row */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>เลือกอำเภอ:</label>
                <select 
                  className="input-field" 
                  style={{ width: '220px', padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}
                  value={subdistrictDistrict} 
                  onChange={(e) => setSubdistrictDistrict(e.target.value)}
                >
                  <option value="ALL">📍 ทุกอำเภอ ({rpostFacilities.length} แห่ง)</option>
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      อำเภอ{d} ({countByDistrict[d] || 0} แห่ง)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '240px', padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
                  placeholder="ค้นหาชื่อ รพ.สต. หรือ รหัส 5 หลัก..."
                  value={subdistrictSearch}
                  onChange={(e) => setSubdistrictSearch(e.target.value)}
                />
                {subdistrictSearch && (
                  <button 
                    onClick={() => setSubdistrictSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}
                  >
                    ✕ ล้าง
                  </button>
                )}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setSubdistrictViewMode('matrix')}
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: subdistrictViewMode === 'matrix' ? 'var(--primary)' : '#fff',
                    color: subdistrictViewMode === 'matrix' ? '#fff' : 'var(--foreground)'
                  }}
                >
                  ตารางสถานะ (Heatmap)
                </button>
                <button 
                  onClick={() => setSubdistrictViewMode('list')}
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: subdistrictViewMode === 'list' ? 'var(--primary)' : '#fff',
                    color: subdistrictViewMode === 'list' ? '#fff' : 'var(--foreground)'
                  }}
                >
                  รายชื่อหน่วยบริการ ({displayFacilities.length})
                </button>
              </div>
            </div>

            {/* Content Area */}
            {subdistrictViewMode === 'matrix' ? (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${380 + displayFacilities.length * 52}px` }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card)', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', width: '320px', minWidth: '320px', position: 'sticky', left: 0, backgroundColor: 'var(--card)', zIndex: 11 }}>
                        ชื่อตัวชี้วัด (KPI)
                      </th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', width: '90px', minWidth: '90px', backgroundColor: '#f1f5f9', position: 'sticky', left: '320px', zIndex: 11 }}>
                        ภาพรวม
                      </th>
                      {displayFacilities.map((fac) => (
                        <th 
                          key={fac.code5 || fac.name}
                          title={`${fac.name} (${fac.district}) [รหัส 5 หลัก: ${fac.code5}]`}
                          style={{ 
                            padding: '0.75rem 0.25rem', 
                            textAlign: 'center', 
                            borderBottom: '2px solid var(--border)', 
                            borderRight: '1px solid var(--border)',
                            writingMode: 'vertical-rl', 
                            transform: 'rotate(180deg)', 
                            height: '140px',
                            minWidth: '46px',
                            fontSize: '0.75rem',
                            cursor: 'help'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '4px', display: 'inline-block' }}>{fac.code5}</span> {cleanShortName(fac.name)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKpis.map((kpi, idx) => {
                      const overallMockStatus = mockStatuses[idx % 4];
                      return (
                        <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.65rem 1rem', borderRight: '2px solid var(--border)', fontWeight: 500, position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 2 }}>
                            <div style={{ marginBottom: '0.2rem', fontSize: '0.875rem' }}>
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>[{kpi.auto_id}]</span> {kpi.name}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                {kpi.responsible_group}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '2px solid var(--border)', backgroundColor: getBgColor(overallMockStatus), color: getTextColor(overallMockStatus), fontWeight: 700, fontSize: '0.8rem', position: 'sticky', left: '320px', zIndex: 2 }}>
                            {overallMockStatus === 'success' ? 'ผ่าน' : overallMockStatus === 'pending' ? 'รอดำเนินการ' : overallMockStatus === 'warning' ? 'เฝ้าระวัง' : 'ไม่ผ่าน'}
                          </td>
                          {displayFacilities.map((fac, fIdx) => {
                            const status = mockStatuses[(idx + fIdx * 2) % 4];
                            return (
                              <td 
                                key={fac.code5 || fIdx} 
                                title={`${fac.name}\n${kpi.name}: ${status === 'success' ? 'ผ่านเกณฑ์' : status === 'warning' ? 'เฝ้าระวัง' : status === 'error' ? 'ไม่ผ่านเกณฑ์' : 'รอดำเนินการ'}`}
                                style={{ padding: '0.5rem 0.25rem', textAlign: 'center', borderRight: '1px solid var(--border)', cursor: 'pointer' }}
                              >
                                <div style={{ 
                                  width: '18px', 
                                  height: '18px', 
                                  borderRadius: '50%', 
                                  backgroundColor: status === 'success' ? '#22c55e' : status === 'warning' ? '#eab308' : status === 'pending' ? '#cbd5e1' : '#ef4444', 
                                  margin: '0 auto',
                                  transition: 'transform 0.1s'
                                }} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {filteredKpis.length === 0 && (
                      <tr>
                        <td colSpan={displayFacilities.length + 2} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
                          ไม่พบข้อมูลตัวชี้วัด
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* List View Mode */
              <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>รหัส 5 หลัก</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>รหัส 9 หลัก</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ชื่อสถานพยาบาล</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>อำเภอ</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ประเภทหน่วยบริการ</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>สถานะการส่งข้อมูล HDC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFacilities.map((fac) => (
                      <tr key={fac.code5 || fac.name} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {fac.code5 || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', color: 'var(--secondary-foreground)', fontSize: '0.8rem' }}>
                          {fac.code9_new || fac.code9 || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                          {fac.name}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            {fac.district}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--secondary-foreground)', fontSize: '0.8rem' }}>
                          {fac.type}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.15rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            รอเชื่อมต่อ HDC API
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'detail' && (
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
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
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, lineHeight: 1.4 }}><span style={{color:'var(--primary)'}}>[{kpi.auto_id}]</span> {kpi.name}</h4>
                </div>
              ))}
            </div>
          </div>

          {selectedKpi && (
            <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px' }}>
                  {selectedKpi.measurement_level.toUpperCase()}
                </span>
                {selectedKpi.tags.map((t: string) => (
                  <span key={t} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '4px', fontWeight: 500 }}>
                    🏷️ {t}
                  </span>
                ))}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}><span style={{color:'var(--primary)'}}>[{selectedKpi.auto_id}]</span> {selectedKpi.name}</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>เป้าหมาย (เขียว)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534' }}>
                    {selectedKpi.target || (selectedKpi.target_val !== null ? `${selectedKpi.target_operator} ${selectedKpi.target_val}` : '-')}
                  </div>
                  {selectedKpi.target_warning_val !== null && (
                     <div style={{ fontSize: '0.8rem', color: '#854d0e', marginTop: '0.25rem' }}>
                       (เฝ้าระวัง: {selectedKpi.target_operator} {selectedKpi.target_warning_val})
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

              {selectedKpi.calculation_type === 'process_status' ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>รายละเอียดความคืบหน้า (เชิงกระบวนการ)</h4>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                    {selectedKpi.provincial_result}
                  </p>
                </div>
              ) : (
                <>
                  {selectedKpi.district_results.length > 0 && selectedKpi.target_val !== null && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', height: '350px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>แผนภูมิผลงานรายพื้นที่เทียบกับเป้าหมาย</h4>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedKpi.district_results} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <ReferenceLine y={selectedKpi.target_val} label={{ position: 'top', value: `เป้าหมาย: ${selectedKpi.target_operator} ${selectedKpi.target_val}`, fill: '#166534', fontSize: 12, fontWeight: 'bold' }} stroke="#166534" strokeWidth={2} strokeDasharray="5 5" />
                          {selectedKpi.target_warning_val !== null && (
                             <ReferenceLine y={selectedKpi.target_warning_val} label={{ position: 'top', value: `เฝ้าระวัง: ${selectedKpi.target_operator} ${selectedKpi.target_warning_val}`, fill: '#854d0e', fontSize: 11 }} stroke="#eab308" strokeWidth={1} strokeDasharray="3 3" />
                          )}
                          <Bar dataKey="result" radius={[4, 4, 0, 0]}>
                            {selectedKpi.district_results.map((entry: any, index: number) => {
                              const dStatus = evaluateStatus(entry.result, selectedKpi);
                              return <Cell key={`cell-${index}`} fill={getStatusColor(dStatus)} />
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {selectedKpi.district_results.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>ผลงานรายพื้นที่ (9 แห่ง)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {selectedKpi.district_results.map((d: any) => {
                          const dStatus = evaluateStatus(d.result, selectedKpi);
                          return (
                          <div key={d.name} style={{ border: '1px solid', borderColor: dStatus === 'success' ? '#bbf7d0' : dStatus === 'warning' ? '#fde047' : '#fecaca', backgroundColor: dStatus === 'success' ? '#f0fdf4' : dStatus === 'warning' ? '#fefce8' : '#fef2f2', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{d.name}</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: getStatusColor(dStatus) }}>{d.result}</span>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                  {selectedKpi.data_items?.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>สูตรและการคำนวณ</h4>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>รูปแบบ: <strong>{selectedKpi.formula}</strong></p>
                      {selectedKpi.calculation_formula && <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--primary)' }}>สูตรคำนวณ: <strong style={{fontFamily: 'monospace', backgroundColor: '#e0f2fe', padding: '0.2rem 0.4rem', borderRadius: '4px'}}>{selectedKpi.calculation_formula}</strong></p>}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--secondary)' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>ตัวแปรรวม</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>รายละเอียดข้อมูล</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedKpi.data_items.map((item: any) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.id}</td>
                              <td style={{ padding: '0.5rem' }}>{item.label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
