'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const DISTRICTS = [
  "เมืองสระแก้ว","คลองหาด","ตาพระยา","วังน้ำเย็น",
  "วัฒนานคร","อรัญประเทศ","เขาฉกรรจ์","โคกสูง","วังสมบูรณ์"
];

const QUARTERS = ['Q1','Q2','Q3','Q4'];

interface DataItem { id: string; label: string; }
interface KpiOption {
  kr_id: string;
  dict_id: string;
  auto_id: string;
  kr_name: string;
  work_group: string;
  calc_type: string;
  calc_formula: string;
  measurement_level: string;
  data_items: DataItem[];
  target_operator: string;
  eval_criteria: Record<string, number>;
}

// ฟังก์ชันคำนวณตามสูตร
function computeResult(formula: string, vals: Record<string, string>): string {
  if (!formula) return '0.00';
  try {
    let eq = formula.toUpperCase();
    const isRatio = eq.includes('1 :');
    if (isRatio) eq = eq.replace('1 :', '').trim();
    eq = eq.replace(/[A-Z]/g, (m) => vals[m] || '0');
    const result = new Function('return ' + eq)();
    if (!isFinite(result) || isNaN(result)) return '0.00';
    if (isRatio) return `1 : ${result.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    return result.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } catch {
    return '0.00';
  }
}

export default function ReportPage() {
  const [kpiOptions, setKpiOptions] = useState<KpiOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKpiId, setSelectedKpiId] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('Q4');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Values: area -> itemId -> value
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [processStatus, setProcessStatus] = useState('pending');
  const [processDesc, setProcessDesc] = useState('');

  const currentKpi = kpiOptions.find(k => k.kr_id === selectedKpiId);

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('kpi_dictionaries')
      .select(`
        id, calculation_type, calculation_formula, data_items_json, measurement_level, target_operator, work_group, evaluation_criteria_json,
        key_result:key_results(id, auto_id, name)
      `)
      .order('created_at', { ascending: true });

    if (data) {
      const opts: KpiOption[] = data
        .filter((d: any) => d.key_result)
        .map((d: any) => ({
          kr_id: d.key_result.id,
          dict_id: d.id,
          auto_id: d.key_result.auto_id || '',
          kr_name: d.key_result.name,
          work_group: d.work_group || 'ไม่ระบุ',
          calc_type: d.calculation_type || 'process_status',
          calc_formula: d.calculation_formula || '',
          measurement_level: d.measurement_level || 'province',
          data_items: d.data_items_json
            ? (typeof d.data_items_json === 'string' ? JSON.parse(d.data_items_json) : d.data_items_json)
            : [],
          target_operator: d.target_operator || '>=',
          eval_criteria: d.evaluation_criteria_json
            ? (typeof d.evaluation_criteria_json === 'string' ? JSON.parse(d.evaluation_criteria_json) : d.evaluation_criteria_json)
            : {},
        }));
      setKpiOptions(opts);
      if (opts.length > 0) setSelectedKpiId(opts[0].kr_id);
    }
    setLoading(false);
  }, []);

  // Load existing measurements when KPI or Quarter changes
  const loadMeasurements = useCallback(async () => {
    if (!selectedKpiId || !currentKpi) return;
    setValues({});
    setProcessStatus('pending');
    setProcessDesc('');

    const { data } = await supabase
      .from('kpi_measurements')
      .select('*')
      .eq('key_result_id', selectedKpiId)
      .eq('period', selectedQuarter);

    if (data) {
      const newVals: Record<string, Record<string, string>> = {};
      for (const m of data) {
        const areaId = m.area_id;
        if (currentKpi.calc_type === 'process_status') {
          const vj = m.values_json || {};
          setProcessStatus(m.result_value || 'pending');
          setProcessDesc(vj.description || '');
        } else {
          const vj = m.values_json || {};
          newVals[areaId] = vj;
        }
      }
      setValues(newVals);
    }
  }, [selectedKpiId, selectedQuarter, currentKpi]);

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);
  useEffect(() => { loadMeasurements(); }, [loadMeasurements]);

  const setVal = (areaId: string, itemId: string, val: string) => {
    setValues(prev => ({ ...prev, [areaId]: { ...(prev[areaId] || {}), [itemId]: val } }));
  };

  const getAreas = () => {
    if (!currentKpi) return [];
    if (currentKpi.measurement_level === 'province') return ['province'];
    return DISTRICTS;
  };

  const handleSave = async () => {
    if (!currentKpi) return;
    setSaving(true);
    const areas = getAreas();

    for (const area of areas) {
      const areaId = area === 'province' ? 'province' : area;
      let resultValue: string;
      let valuesJson: Record<string, string>;

      if (currentKpi.calc_type === 'process_status') {
        resultValue = processStatus;
        valuesJson = { description: processDesc };
      } else {
        const areaVals = values[areaId] || {};
        resultValue = computeResult(currentKpi.calc_formula, areaVals);
        valuesJson = areaVals;
      }

      const payload = {
        key_result_id: currentKpi.kr_id,
        period: selectedQuarter,
        area_id: areaId,
        result_value: resultValue,
        values_json: valuesJson,
        reported_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('kpi_measurements')
        .select('id')
        .eq('key_result_id', currentKpi.kr_id)
        .eq('period', selectedQuarter)
        .eq('area_id', areaId)
        .single();

      if (existing) {
        await supabase.from('kpi_measurements').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('kpi_measurements').insert(payload);
      }

      // Process status only needs 1 row
      if (currentKpi.calc_type === 'process_status') break;
    }

    setSaving(false);
    setSuccessMsg(`บันทึกข้อมูล ${currentKpi.kr_name} (${selectedQuarter}) สำเร็จ`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getStatusColor = (resultStr: string, kpi: KpiOption) => {
    const result = parseFloat(resultStr.replace(/,/g, ''));
    if (isNaN(result)) return '#94a3b8';
    const q = selectedQuarter.toLowerCase();
    const target = (kpi.eval_criteria as any)[q];
    const warning = (kpi.eval_criteria as any)[`${q}_warning`];
    if (target == null) return '#94a3b8';
    const pass = kpi.target_operator === '>=' ? result >= target :
      kpi.target_operator === '<=' ? result <= target :
      kpi.target_operator === '>' ? result > target :
      kpi.target_operator === '<' ? result < target : result === target;
    if (pass) return '#22c55e';
    const warn = warning != null && (kpi.target_operator === '>=' ? result >= warning :
      kpi.target_operator === '<=' ? result <= warning : false);
    return warn ? '#eab308' : '#ef4444';
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>กำลังโหลดรายการตัวชี้วัด...</div>;

  if (kpiOptions.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--secondary-foreground)' }}>ยังไม่มีตัวชี้วัดที่ตั้งค่าแล้ว</p>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>กรุณาไปที่ <strong>ตั้งค่าตัวชี้วัด (Templates)</strong> เพื่อกำหนดค่าตัวชี้วัดก่อน</p>
      </div>
    );
  }

  const areas = getAreas();

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>บันทึกผลการดำเนินงาน</h1>
          <p style={{ color: 'var(--secondary-foreground)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>สำหรับกลุ่มงาน สสจ.สระแก้ว — บันทึกยอดสะสมตั้งแต่ต้นปีงบประมาณ</p>
        </div>
        {successMsg && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem' }}>
            ✓ {successMsg}
          </div>
        )}
      </div>

      {/* Step 1: Select KPI & Quarter */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>1. เลือกตัวชี้วัดและไตรมาส</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ตัวชี้วัด</label>
            <select className="input-field" value={selectedKpiId}
              onChange={e => { setSelectedKpiId(e.target.value); setValues({}); }}>
              {kpiOptions.map(k => (
                <option key={k.kr_id} value={k.kr_id}>[{k.work_group}] {k.auto_id} {k.kr_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ไตรมาสที่รายงาน</label>
            <select className="input-field" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
              {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        </div>

        {currentKpi && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <span>🏷️ กลุ่มงาน: <strong>{currentKpi.work_group}</strong></span>
            <span>📐 ระดับ: <strong>{currentKpi.measurement_level === 'province' ? 'จังหวัด' : currentKpi.measurement_level === 'district' ? 'อำเภอ' : 'โรงพยาบาล'}</strong></span>
            {currentKpi.calc_type !== 'process_status' && <span>🔢 สูตร: <code style={{ backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#0369a1' }}>{currentKpi.calc_formula}</code></span>}
            {(currentKpi.eval_criteria as any)[selectedQuarter.toLowerCase()] != null && (
              <span>🎯 เป้าหมาย {selectedQuarter}: <strong>{currentKpi.target_operator} {(currentKpi.eval_criteria as any)[selectedQuarter.toLowerCase()]}</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Data Entry */}
      {currentKpi && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>
            2. กรอกข้อมูล {selectedQuarter} {currentKpi.calc_type === 'process_status' ? '(เชิงกระบวนการ)' : '(ยอดสะสม)'}
          </h3>

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#854d0e' }}>
            💡 {currentKpi.calc_type === 'process_status'
              ? 'เลือกสถานะความคืบหน้าและกรอกรายละเอียดผลการดำเนินงาน'
              : 'กรอกยอดสะสมตั้งแต่ 1 ต.ค. — ปัจจุบัน ระบบจะคำนวณผลลัพธ์ให้อัตโนมัติ'}
          </div>

          {currentKpi.calc_type === 'process_status' ? (
            // Process Status
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>สถานะการดำเนินงาน</label>
                <select className="input-field" value={processStatus} onChange={e => setProcessStatus(e.target.value)}>
                  <option value="success">✅ ผ่าน (ดำเนินการแล้วเสร็จ)</option>
                  <option value="warning">⚠️ ไม่ผ่าน (ล่าช้ากว่าแผน)</option>
                  <option value="pending">🔄 อยู่ระหว่างดำเนินการ</option>
                  <option value="error">❌ ยังไม่ดำเนินการ</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>รายละเอียดผลการดำเนินงาน</label>
                <textarea className="input-field" rows={4}
                  placeholder="ระบุข้อความอธิบายความคืบหน้า ผลลัพธ์ที่ได้ หรือแนบลิงก์เอกสาร..."
                  value={processDesc} onChange={e => setProcessDesc(e.target.value)}
                />
              </div>
            </div>
          ) : (
            // Numeric Entry Table
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '200px' }}>พื้นที่</th>
                    {currentKpi.data_items.map(item => (
                      <th key={item.id} style={{ padding: '0.75rem 1rem' }}>
                        ตัวแปร {item.id}<br />
                        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--secondary-foreground)' }}>{item.label}</span>
                      </th>
                    ))}
                    <th style={{ padding: '0.75rem 1rem', width: '120px' }}>ผลลัพธ์สุทธิ</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map(area => {
                    const areaId = area === 'province' ? 'province' : area;
                    const areaVals = values[areaId] || {};
                    const result = computeResult(currentKpi.calc_formula, areaVals);
                    const resultColor = getStatusColor(result, currentKpi);
                    return (
                      <tr key={areaId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 500 }}>
                          {area === 'province' ? 'ภาพรวมจังหวัดสระแก้ว' : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {area}
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                                {currentKpi.measurement_level === 'hospital' ? 'รพ.' : 'อ.'}
                              </span>
                            </span>
                          )}
                        </td>
                        {currentKpi.data_items.map(item => (
                          <td key={item.id} style={{ padding: '0.4rem 1rem' }}>
                            <input type="number" className="input-field"
                              placeholder={`ยอดสะสม ${item.id}`}
                              value={areaVals[item.id] || ''}
                              onChange={e => setVal(areaId, item.id, e.target.value)}
                              style={{ maxWidth: '120px' }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '0.6rem 1rem', fontWeight: 700, color: resultColor, fontSize: '1rem' }}>
                          {result}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={loadMeasurements} disabled={saving}>↩ โหลดข้อมูลเดิม</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : `💾 บันทึกผล ${selectedQuarter}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
