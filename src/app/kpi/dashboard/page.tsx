'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import healthFacilitiesData from '@/data/sa_kaeo_health_facilities.json';
import realAnc5Data from '@/data/real_anc5_2569.json';

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

  // Subdistrict & HDC States
  const [subdistrictDistrict, setSubdistrictDistrict] = useState<string>('ALL');
  const [subdistrictSearch, setSubdistrictSearch] = useState<string>('');
  const [subdistrictViewMode, setSubdistrictViewMode] = useState<'matrix' | 'list'>('matrix');
  const [isAddHdcModalOpen, setIsAddHdcModalOpen] = useState<boolean>(false);
  const [fetchingHdcId, setFetchingHdcId] = useState<string | null>(null);

  // Dedicated HDC KPIs list (Real Data from MOPH HDC Open Data)
  const [hdcKpis, setHdcKpis] = useState<Array<{
    id: string;
    code: string;
    name: string;
    tableName: string;
    year: string;
    targetOperator: string;
    targetValue: number;
    results: Record<string, { value: number | string; status: 'success' | 'warning' | 'error' | 'pending'; detail?: string }>;
  }>>([
    {
      id: 'hdc-anc5',
      code: 'HDC-01',
      name: 'ร้อยละหญิงตั้งครรภ์ที่ได้รับการดูแลก่อนคลอด 5 ครั้ง ตามเกณฑ์',
      tableName: 's_anc5',
      year: '2569',
      targetOperator: '>=',
      targetValue: 75,
      results: realAnc5Data as Record<string, any>
    }
  ]);

  const [newHdcForm, setNewHdcForm] = useState({
    code: 'HDC-02',
    name: '',
    tableName: 's_ttm27',
    year: '2569',
    targetOperator: '>=',
    targetValue: 20
  });

  // Fetch real data from MOPH HDC Open Data Web Service
  const handleFetchHdcData = async (kpiId: string) => {
    const targetKpi = hdcKpis.find(k => k.id === kpiId);
    if (!targetKpi) return;
    setFetchingHdcId(kpiId);
    try {
      const res = await fetch('/api/hdc/report-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: targetKpi.tableName,
          year: targetKpi.year,
          province: '27'
        })
      });
      const result = await res.json();
      if (result && Array.isArray(result.data)) {
        // Aggregate records by hospcode
        const byHosp: Record<string, { target: number; result: number }> = {};
        result.data.forEach((row: any) => {
          const hc = String(row.hospcode).padStart(5, '0');
          if (!byHosp[hc]) byHosp[hc] = { target: 0, result: 0 };

          if (row.target !== undefined && row.result !== undefined) {
            byHosp[hc].target += Number(row.target) || 0;
            byHosp[hc].result += Number(row.result) || 0;
          } else if (row.op_service_pt_q1 !== undefined && row.tm_service_pt_q1 !== undefined) {
            byHosp[hc].target += Number(row.op_service_pt_q1) || 0;
            byHosp[hc].result += Number(row.tm_service_pt_q1) || 0;
          } else if (row.target4 !== undefined && row.result4 !== undefined) {
            byHosp[hc].target += Number(row.target4) || 0;
            byHosp[hc].result += Number(row.result4) || 0;
          }
        });

        const newResults: Record<string, any> = {};
        Object.entries(byHosp).forEach(([hc, vals]) => {
          if (vals.target > 0) {
            const pct = Math.round((vals.result / vals.target) * 1000) / 10;
            const isPass = targetKpi.targetOperator === '>=' ? pct >= targetKpi.targetValue : pct <= targetKpi.targetValue;
            const isWarn = pct >= targetKpi.targetValue * 0.8;
            newResults[hc] = {
              value: `${pct}%`,
              status: isPass ? 'success' : isWarn ? 'warning' : 'error',
              detail: `${vals.result}/${vals.target} คน`
            };
          } else {
            newResults[hc] = {
              value: '0%',
              status: 'error',
              detail: '0/0 คน'
            };
          }
        });

        setHdcKpis(prev => prev.map(k => k.id === kpiId ? { ...k, results: newResults } : k));
        alert(`✅ ดึงข้อมูลสดจาก HDC Open Data สำเร็จ!\nตาราง: ${targetKpi.tableName} (ปี ${targetKpi.year})\nพบข้อมูลหน่วยบริการ: ${Object.keys(newResults).length} แห่ง`);
      } else {
        alert('เชื่อมต่อ HDC สำเร็จ แต่ไม่พบข้อมูลของตาราง ' + targetKpi.tableName);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ HDC: ' + err.message);
    } finally {
      setFetchingHdcId(null);
    }
  };

  const handleCreateHdcKpi = () => {
    if (!newHdcForm.name) {
      alert('กรุณากรอกชื่อตัวชี้วัด');
      return;
    }
    const newKpi = {
      id: `hdc-${Date.now()}`,
      code: newHdcForm.code || `HDC-0${hdcKpis.length + 1}`,
      name: newHdcForm.name,
      tableName: newHdcForm.tableName,
      year: newHdcForm.year,
      targetOperator: newHdcForm.targetOperator,
      targetValue: Number(newHdcForm.targetValue) || 0,
      results: {}
    };
    setHdcKpis(prev => [...prev, newKpi]);
    setIsAddHdcModalOpen(false);
    setNewHdcForm({
      code: `HDC-0${hdcKpis.length + 2}`,
      name: '',
      tableName: 's_ttm27',
      year: '2569',
      targetOperator: '>=',
      targetValue: 80
    });
  };

  useEffect(() => {
    async function fetchKPIs() {
      // ดึง Key Results ที่เชื่อมกับ KPI Dictionary
      const { data, error } = await supabase
        .from('key_results')
        .select(`
          id, name, auto_id, target_2570, measurement_status, responsible_group,
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
            responsible_group: kr.responsible_group || dict.work_group || dict.responsible_person || 'ไม่ระบุกลุ่มงาน',
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
        // Filter strictly to ONLY 'โรงพยาบาลส่งเสริมสุขภาพตำบล' (exactly 108 facilities)
        const allRpost = (healthFacilitiesData as any[]).filter(f => f.type === 'โรงพยาบาลส่งเสริมสุขภาพตำบล');

        // Filter by selected district and search keyword
        const displayFacilities = allRpost.filter(f => {
          const matchDistrict = subdistrictDistrict === 'ALL' || f.district === subdistrictDistrict;
          const matchSearch = !subdistrictSearch || 
            f.name.toLowerCase().includes(subdistrictSearch.toLowerCase()) || 
            (f.code5 && f.code5.includes(subdistrictSearch));
          return matchDistrict && matchSearch;
        });

        // Calculate count per district for the dropdown and grouping
        const countByDistrict: Record<string, number> = {};
        DISTRICTS.forEach(d => { countByDistrict[d] = 0; });
        allRpost.forEach(f => {
          if (f.district && countByDistrict[f.district] !== undefined) {
            countByDistrict[f.district]++;
          }
        });

        const cleanShortName = (name: string) => {
          return name
            .replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', '')
            .replace('โรงพยาบาลส่งเสริมสุขภาพบ้าน', '')
            .replace('สถานีอนามัยเฉลิมพระเกียรติ 60 พรรษา นวมินทราชินี', 'สอน.')
            .replace('สถานีอนามัย', 'สอน.')
            .trim();
        };

        const getCellBg = (status: string) => {
          if (status === 'success') return '#22c55e'; // Green
          if (status === 'warning') return '#eab308'; // Yellow
          if (status === 'error') return '#ef4444';   // Red
          return '#e2e8f0';                           // Gray
        };

        const getCellTextColor = (status: string) => {
          if (status === 'pending') return '#475569';
          return '#ffffff';
        };

        // Group facilities by district for when 'ALL' is selected
        const groupedByDistrict: { district: string; facilities: any[] }[] = [];
        if (subdistrictDistrict === 'ALL') {
          DISTRICTS.forEach(d => {
            const facs = displayFacilities.filter(f => f.district === d);
            if (facs.length > 0) {
              groupedByDistrict.push({ district: d, facilities: facs });
            }
          });
        } else {
          groupedByDistrict.push({ district: subdistrictDistrict, facilities: displayFacilities });
        }

        return (
          <div className="card" style={{ flex: 1, overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column' }}>
            {/* Filter and Control Bar */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    การติดตามตัวชี้วัดระดับ รพ.สต. (HDC Open Data)
                  </h2>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 600 }}>
                    {allRpost.length} รพ.สต. ในสระแก้ว
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', marginTop: '0.25rem' }}>
                  แถว: รายชื่อ รพ.สต. แยกตามอำเภอ • คอลัมน์: ตัวชี้วัด HDC • สีเต็มช่องตามระดับผลงาน
                </div>
              </div>

              {/* Action Buttons & Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#22c55e', display: 'inline-block' }}></span> ผ่านเกณฑ์
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#eab308', display: 'inline-block' }}></span> เฝ้าระวัง
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444', display: 'inline-block' }}></span> ไม่ผ่านเกณฑ์
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#e2e8f0', display: 'inline-block' }}></span> รอดำเนินการ
                  </span>
                </div>

                <button
                  onClick={() => setIsAddHdcModalOpen(true)}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <span>+</span> เพิ่มตัวชี้วัด HDC
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>เลือกอำเภอ:</label>
                <select 
                  className="input-field" 
                  style={{ width: '230px', padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}
                  value={subdistrictDistrict} 
                  onChange={(e) => setSubdistrictDistrict(e.target.value)}
                >
                  <option value="ALL">📍 แสดงทุกอำเภอ (108 รพ.สต.)</option>
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
                  style={{ width: '260px', padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
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
                  ตาราง Heatmap ({displayFacilities.length} แห่ง)
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
                  รายชื่อ รพ.สต.
                </button>
              </div>
            </div>

            {/* Content Area */}
            {subdistrictViewMode === 'matrix' ? (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card)', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                    <tr>
                      <th style={{ padding: '0.85rem 0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', width: '85px', minWidth: '85px', backgroundColor: 'var(--card)', position: 'sticky', left: 0, zIndex: 11 }}>
                        รหัส 5 หลัก
                      </th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', width: '250px', minWidth: '250px', backgroundColor: 'var(--card)', position: 'sticky', left: '85px', zIndex: 11 }}>
                        ชื่อ รพ.สต.
                      </th>
                      {hdcKpis.map((kpi) => (
                        <th 
                          key={kpi.id}
                          style={{ 
                            padding: '0.75rem 0.5rem', 
                            textAlign: 'center', 
                            borderBottom: '2px solid var(--border)', 
                            borderRight: '1px solid var(--border)',
                            minWidth: '180px',
                            backgroundColor: '#f8fafc'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                {kpi.code}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                                ({kpi.tableName})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>
                              {kpi.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                                เป้าหมาย: <strong>{kpi.targetOperator} {kpi.targetValue}%</strong>
                              </span>
                              <button
                                onClick={() => handleFetchHdcData(kpi.id)}
                                disabled={fetchingHdcId === kpi.id}
                                title="กดเพื่อดึงผลงานสดจาก HDC Open Data Web Service"
                                style={{
                                  padding: '0.15rem 0.4rem',
                                  fontSize: '0.7rem',
                                  borderRadius: '4px',
                                  border: '1px solid #0284c7',
                                  backgroundColor: '#f0f9ff',
                                  color: '#0284c7',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                {fetchingHdcId === kpi.id ? '⏳ กำลังดึง...' : '🔄 ดึง HDC'}
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--border)', width: '60px', backgroundColor: '#f8fafc' }}>
                        <button
                          onClick={() => setIsAddHdcModalOpen(true)}
                          title="เพิ่มตัวชี้วัด HDC ใหม่"
                          style={{
                            background: 'none',
                            border: '1px dashed var(--primary)',
                            borderRadius: '4px',
                            color: 'var(--primary)',
                            padding: '0.3rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          + เพิ่ม
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByDistrict.map(({ district: distName, facilities: distFacilities }) => (
                      <React.Fragment key={distName}>
                        {/* District Divider Row */}
                        <tr style={{ backgroundColor: '#e2e8f0' }}>
                          <td 
                            colSpan={2 + hdcKpis.length + 1} 
                            style={{ 
                              padding: '0.55rem 1rem', 
                              fontWeight: 700, 
                              color: '#0f172a', 
                              fontSize: '0.875rem',
                              borderTop: '2px solid #cbd5e1',
                              borderBottom: '2px solid #cbd5e1'
                            }}
                          >
                            📍 อำเภอ{distName} ({distFacilities.length} แห่ง)
                          </td>
                        </tr>

                        {/* Facilities rows in this district */}
                        {distFacilities.map((fac) => (
                          <tr key={fac.code5 || fac.name} style={{ borderBottom: '1px solid var(--border)' }}>
                            {/* Column 1: รหัส 5 หลัก */}
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', backgroundColor: '#fff', position: 'sticky', left: 0, zIndex: 2 }}>
                              {fac.code5 || '-'}
                            </td>

                            {/* Column 2: ชื่อ รพ.สต. */}
                            <td style={{ padding: '0.5rem 1rem', borderRight: '2px solid var(--border)', backgroundColor: '#fff', position: 'sticky', left: '85px', zIndex: 2 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                รพ.สต.{cleanShortName(fac.name)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                                อ.{fac.district}
                              </div>
                            </td>

                            {/* HDC KPI Result Cells (Full-cell background color with percentage) */}
                            {hdcKpis.map((kpi) => {
                              const res = kpi.results[fac.code5];
                              const status = res?.status || 'pending';
                              const valDisplay = res?.value || 'รอผล';
                              const bgColor = getCellBg(status);
                              const textColor = getCellTextColor(status);

                              return (
                                <td 
                                  key={kpi.id}
                                  title={`[${fac.name}]\nตัวชี้วัด: ${kpi.name}\nผลงาน: ${valDisplay}${res?.detail ? ` (${res.detail})` : ''} (เป้าหมาย: ${kpi.targetOperator} ${kpi.targetValue}%)`}
                                  style={{ 
                                    padding: '0', 
                                    textAlign: 'center', 
                                    borderRight: '1px solid #e2e8f0',
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    height: '46px'
                                  }}
                                >
                                  <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontWeight: 700, 
                                    fontSize: '0.875rem',
                                    letterSpacing: '0.02em',
                                    textShadow: status !== 'pending' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                                  }}>
                                    {valDisplay}
                                  </div>
                                </td>
                              );
                            })}

                            <td style={{ borderRight: '1px solid var(--border)', backgroundColor: '#fafafa' }}></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    {displayFacilities.length === 0 && (
                      <tr>
                        <td colSpan={2 + hdcKpis.length + 1} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
                          ไม่พบข้อมูล รพ.สต. ตามเงื่อนไขที่เลือก
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
                      <th style={{ padding: '0.75rem 0.5rem' }}>ชื่อ รพ.สต.</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>อำเภอ</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ประเภท</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>สถานะการเชื่อมต่อ HDC</th>
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
                          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            พร้อมเชื่อม HDC API
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal: เพิ่มตัวชี้วัด HDC */}
            {isAddHdcModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
              }}>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: '560px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ➕ เพิ่มตัวชี้วัด HDC Open Data (ระดับ รพ.สต.)
                    </h3>
                    <button 
                      onClick={() => setIsAddHdcModalOpen(false)}
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          รหัสตัวชี้วัด
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.code}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, code: e.target.value })}
                          placeholder="เช่น HDC-04"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ชื่อตัวชี้วัด *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.name}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, name: e.target.value })}
                          placeholder="เช่น ร้อยละหญิงตั้งครรภ์ฝากครรภ์ครั้งแรกก่อน 12 สัปดาห์"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ชื่อตาราง HDC (tableName) *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.tableName}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, tableName: e.target.value })}
                          placeholder="เช่น s_ttm27, s_ncd_dm"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ปีงบประมาณ (year)
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.year}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, year: e.target.value })}
                          placeholder="2569"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          เครื่องหมายเป้าหมาย
                        </label>
                        <select
                          className="input-field"
                          value={newHdcForm.targetOperator}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, targetOperator: e.target.value })}
                        >
                          <option value=">=">&gt;= (มากกว่าหรือเท่ากับ)</option>
                          <option value="<=">&lt;= (น้อยกว่าหรือเท่ากับ)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ค่าเป้าหมาย (%)
                        </label>
                        <input
                          type="number"
                          className="input-field"
                          value={newHdcForm.targetValue}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, targetValue: Number(e.target.value) })}
                          placeholder="เช่น 80"
                        />
                      </div>
                    </div>

                    {/* API Code Preview */}
                    <div style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', padding: '0.85rem', color: '#f8fafc', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      <div style={{ color: '#94a3b8', marginBottom: '0.4rem' }}>// โครงสร้าง Web Service (POST https://opendata.moph.go.th/api/report_data):</div>
                      <pre style={{ margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
{`{
  "tableName": "${newHdcForm.tableName || 's_ttm27'}",
  "year": "${newHdcForm.year || '2569'}",
  "province": "27",
  "type": "json"
}`}
                      </pre>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddHdcModalOpen(false)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateHdcKpi}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        บันทึกตัวชี้วัด
                      </button>
                    </div>
                  </div>
                </div>
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
