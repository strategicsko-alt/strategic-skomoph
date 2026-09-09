'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  SA_KAEO_DISTRICTS,
  SA_KAEO_HOSPITALS,
  fetchHdcTableData,
  aggregateHdcByLevel,
} from '@/lib/hdc';

const DISTRICTS = [
  "เมืองสระแก้ว","คลองหาด","ตาพระยา","วังน้ำเย็น",
  "วัฒนานคร","อรัญประเทศ","เขาฉกรรจ์","โคกสูง","วังสมบูรณ์"
];

const QUARTERS = ['Q1','Q2','Q3','Q4'];

interface DataItem { id: string; label: string; }
interface KpiOption {
  kr_id: string | null;  // null = standalone
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
  api_enabled?: boolean;
  api_config_json?: any;
}

function computeResult(formula: string, vals: Record<string, string>): string {
  if (!formula) return '0.00';
  try {
    let eq = formula.toUpperCase();
    const isRatio = eq.includes('1:') || eq.includes('1 :');
    if (isRatio) eq = eq.replace(/1\s*:/,'').trim();
    // Replace variables A, B, C… with values
    eq = eq.replace(/\b([A-Z])\b/g, (m) => vals[m] || '0');
    const result = new Function('return (' + eq + ')')();
    if (!isFinite(result) || isNaN(result)) return '0.00';
    if (isRatio) return `1 : ${result.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
    return result.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  } catch {
    return '0.00';
  }
}

export default function ReportPage() {
  const [kpiOptions, setKpiOptions] = useState<KpiOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKpiDictId, setSelectedKpiDictId] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('Q4');
  const [saving, setSaving] = useState(false);
  const [syncingHdc, setSyncingHdc] = useState(false);
  const [hdcSyncMsg, setHdcSyncMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [processStatus, setProcessStatus] = useState('pending');
  const [processDesc, setProcessDesc] = useState('');

  const currentKpi = kpiOptions.find(k => k.dict_id === selectedKpiDictId);

  // โหลดรายการตัวชี้วัดที่ตั้งค่าแล้ว
  const fetchKPIs = useCallback(async () => {
    setLoading(true);

    // ดึง kpi_dictionaries ทั้งหมด
    const { data: dicts } = await supabase
      .from('kpi_dictionaries')
      .select('id, key_result_id, kpi_name, calculation_type, calculation_formula, data_items_json, measurement_level, target_operator, work_group, evaluation_criteria_json, api_enabled, api_config_json')
      .order('created_at', { ascending: true });

    if (!dicts || dicts.length === 0) {
      setKpiOptions([]);
      setLoading(false);
      return;
    }

    // ดึงชื่อ key_results แยกต่างหาก
    const krIds = dicts.filter((d: any) => d.key_result_id).map((d: any) => d.key_result_id);
    let krMap: Record<string, { auto_id: string; name: string }> = {};

    if (krIds.length > 0) {
      const { data: krs } = await supabase
        .from('key_results')
        .select('id, auto_id, name')
        .in('id', krIds);
      (krs || []).forEach((kr: any) => { krMap[kr.id] = kr; });
    }

    const opts: KpiOption[] = dicts.map((d: any) => {
      const kr = d.key_result_id ? krMap[d.key_result_id] : null;
      const dataItems = d.data_items_json
        ? (typeof d.data_items_json === 'string' ? JSON.parse(d.data_items_json) : d.data_items_json)
        : [];
      const evalCriteria = d.evaluation_criteria_json
        ? (typeof d.evaluation_criteria_json === 'string' ? JSON.parse(d.evaluation_criteria_json) : d.evaluation_criteria_json)
        : {};

      return {
        kr_id: d.key_result_id || null,
        dict_id: d.id,
        auto_id: kr?.auto_id || '',
        kr_name: kr?.name || d.kpi_name || 'ไม่มีชื่อ',
        work_group: d.work_group || 'ไม่ระบุกลุ่มงาน',
        calc_type: d.calculation_type || 'process_status',
        calc_formula: d.calculation_formula || '',
        measurement_level: d.measurement_level || 'province',
        data_items: dataItems,
        target_operator: d.target_operator || '>=',
        eval_criteria: evalCriteria,
        api_enabled: d.api_enabled || false,
        api_config_json: d.api_config_json,
      };
    });

    setKpiOptions(opts);
    if (opts.length > 0) setSelectedKpiDictId(opts[0].dict_id);
    setLoading(false);
  }, []);

  // โหลดข้อมูลที่บันทึกไว้แล้วสำหรับ KPI + ไตรมาสที่เลือก
  const loadMeasurements = useCallback(async () => {
    if (!selectedKpiDictId || !currentKpi?.kr_id) {
      setValues({}); setProcessStatus('pending'); setProcessDesc('');
      return;
    }
    setValues({}); setProcessStatus('pending'); setProcessDesc('');

    const { data } = await supabase
      .from('kpi_measurements')
      .select('*')
      .eq('key_result_id', currentKpi.kr_id)
      .eq('period', selectedQuarter);

    if (data) {
      if (currentKpi.calc_type === 'process_status') {
        const m = data[0];
        if (m) {
          setProcessStatus(String(m.result_value || 'pending'));
          setProcessDesc((m.values_json as any)?.description || '');
        }
      } else {
        const newVals: Record<string, Record<string, string>> = {};
        for (const m of data) {
          const vj = (m.values_json || {}) as Record<string, string>;
          newVals[m.area_id] = vj;
        }
        setValues(newVals);
      }
    }
  }, [selectedKpiDictId, selectedQuarter, currentKpi]);

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);
  useEffect(() => { loadMeasurements(); }, [loadMeasurements]);

  const setVal = (areaId: string, itemId: string, val: string) => {
    setValues(prev => ({ ...prev, [areaId]: { ...(prev[areaId] || {}), [itemId]: val } }));
  };

  const getAreas = () => {
    if (!currentKpi) return [];
    if (currentKpi.measurement_level === 'province') return ['province'];
    if (currentKpi.measurement_level === 'hospital') return SA_KAEO_HOSPITALS.map(h => h.name);
    return DISTRICTS;
  };

  const handleSyncHdc = async () => {
    if (!currentKpi || !currentKpi.api_enabled) return;
    const cfg = currentKpi.api_config_json || {};
    const tbl = (cfg.tableName || cfg.A?.tableName || '').trim();
    const yr = String(cfg.year || '2569').trim();
    const varMapping: Record<string, string> = cfg.variables || {
      A: cfg.A?.field || 'result',
      B: cfg.B?.field || 'target',
    };

    if (!tbl) {
      alert('ตัวชี้วัดนี้ยังไม่ได้ระบุชื่อตาราง HDC ในหน้าตั้งค่า Template');
      return;
    }

    setSyncingHdc(true);
    setHdcSyncMsg('');
    try {
      const raw = await fetchHdcTableData(tbl, yr);
      const level = (currentKpi.measurement_level || 'province') as 'province' | 'district' | 'hospital';
      const results = aggregateHdcByLevel(raw, level, varMapping, currentKpi.calc_formula);

      const newVals: Record<string, Record<string, string>> = { ...values };
      results.forEach(item => {
        newVals[item.id] = { ...(newVals[item.id] || {}) };
        Object.entries(item.variables).forEach(([k, v]) => {
          newVals[item.id][k] = String(v);
        });
      });

      setValues(newVals);
      const levelName = level === 'hospital' ? '9 โรงพยาบาล' : level === 'district' ? '9 อำเภอ' : 'ภาพรวมจังหวัด';
      setHdcSyncMsg(`✓ ดึงข้อมูลสดจาก HDC (${tbl} / ${yr}) สำหรับ ${levelName} สำเร็จแล้ว (${results.length} รายการ) กรุณาตรวจสอบแล้วกดบันทึก`);
      setTimeout(() => setHdcSyncMsg(''), 8000);
    } catch (err: any) {
      alert(`ไม่สามารถดึงข้อมูลจาก HDC ได้: ${err.message || err}`);
    } finally {
      setSyncingHdc(false);
    }
  };

  const handleSave = async () => {
    if (!currentKpi?.kr_id) {
      alert('ตัวชี้วัดนี้ไม่ได้เชื่อมกับ Key Result กรุณาเลือกตัวชี้วัดจากระบบแผน');
      return;
    }
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
        updated_at: new Date().toISOString(),
      };

      // Upsert: ค้นหาก่อน ถ้ามีให้ update, ถ้าไม่มีให้ insert
      const { data: existing } = await supabase
        .from('kpi_measurements')
        .select('id')
        .eq('key_result_id', currentKpi.kr_id)
        .eq('period', selectedQuarter)
        .eq('area_id', areaId)
        .maybeSingle();

      if (existing) {
        await supabase.from('kpi_measurements').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('kpi_measurements').insert(payload);
      }

      if (currentKpi.calc_type === 'process_status') break;
    }

    setSaving(false);
    setSuccessMsg(`บันทึก "${currentKpi.kr_name}" (${selectedQuarter}) สำเร็จ ✓`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getStatusColor = (resultStr: string, kpi: KpiOption): string => {
    const result = parseFloat(resultStr.replace(/,/g, ''));
    if (isNaN(result)) return '#94a3b8';
    const q = selectedQuarter.toLowerCase();
    const target = (kpi.eval_criteria as any)[q];
    const warning = (kpi.eval_criteria as any)[`${q}_warning`];
    if (target == null) return '#94a3b8';
    const op = kpi.target_operator;
    const pass = op === '>=' ? result >= target : op === '<=' ? result <= target :
      op === '>' ? result > target : op === '<' ? result < target : result === target;
    if (pass) return '#22c55e';
    const warn = warning != null && (op === '>=' ? result >= warning : op === '<=' ? result <= warning : false);
    return warn ? '#eab308' : '#ef4444';
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>กำลังโหลดรายการตัวชี้วัด...</div>;

  if (kpiOptions.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>ยังไม่มีตัวชี้วัดที่ตั้งค่าแล้ว</p>
        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.9rem' }}>
          กรุณาไปที่ <strong>📝 ตั้งค่าตัวชี้วัด (Templates)</strong> เพื่อกำหนดค่าตัวชี้วัดก่อน
        </p>
      </div>
    );
  }

  const areas = getAreas();
  const q = selectedQuarter.toLowerCase();
  const targetVal = currentKpi ? (currentKpi.eval_criteria as any)[q] : null;
  const warningVal = currentKpi ? (currentKpi.eval_criteria as any)[`${q}_warning`] : null;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>บันทึกผลการดำเนินงาน</h1>
          <p style={{ color: 'var(--secondary-foreground)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>สำหรับกลุ่มงาน สสจ.สระแก้ว · บันทึกยอดสะสมตั้งแต่ต้นปีงบประมาณ</p>
        </div>
        {successMsg && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}>
            {successMsg}
          </div>
        )}
      </div>

      {/* Step 1: Select KPI & Quarter */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>1. เลือกตัวชี้วัดและไตรมาส</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.88rem' }}>ตัวชี้วัด</label>
            <select className="input-field" value={selectedKpiDictId}
              onChange={e => { setSelectedKpiDictId(e.target.value); setValues({}); }}>
              {kpiOptions.map(k => (
                <option key={k.dict_id} value={k.dict_id}>
                  {k.work_group ? `[${k.work_group}] ` : ''}{k.auto_id ? `${k.auto_id} ` : ''}{k.kr_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.88rem' }}>ไตรมาส</label>
            <select className="input-field" value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
              {QUARTERS.map(q => <option key={q} value={q}>ไตรมาสที่ {q.replace('Q','')}</option>)}
            </select>
          </div>
        </div>

        {currentKpi && (
          <div style={{ marginTop: '0.875rem', padding: '0.625rem 0.875rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem', alignItems: 'center' }}>
            {currentKpi.work_group && <span>🏷️ กลุ่มงาน: <strong>{currentKpi.work_group}</strong></span>}
            <span>📐 ระดับ: <strong>{currentKpi.measurement_level === 'province' ? 'จังหวัด' : currentKpi.measurement_level === 'district' ? 'อำเภอ' : 'โรงพยาบาล'}</strong></span>
            {currentKpi.calc_type !== 'process_status' && (
              <span>🔢 สูตร: <code style={{ backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#0369a1' }}>{currentKpi.calc_formula}</code></span>
            )}
            {targetVal != null && (
              <span>🎯 เป้า {selectedQuarter}: <strong style={{ color: '#166534' }}>{currentKpi.target_operator} {targetVal}</strong>
                {warningVal != null && <span style={{ color: '#854d0e' }}> · เฝ้าระวัง {warningVal}</span>}
              </span>
            )}
            {!currentKpi.kr_id && (
              <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.78rem' }}>
                ⚠️ ตัวชี้วัดนี้เป็น Standalone (ไม่รองรับการบันทึกผล)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Data Entry */}
      {currentKpi && currentKpi.kr_id && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              2. กรอกข้อมูล {selectedQuarter} {currentKpi.calc_type === 'process_status' ? '(เชิงกระบวนการ)' : '(ยอดสะสม)'}
            </h3>
            <button onClick={loadMeasurements} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
              ↩ โหลดข้อมูลเดิม
            </button>
          </div>

          {/* HDC Auto Sync Banner */}
          {currentKpi.api_enabled && currentKpi.calc_type !== 'process_status' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                    ตัวชี้วัดนี้เชื่อมต่อกับ HDC Open Data (ตาราง: <code>{currentKpi.api_config_json?.tableName || currentKpi.api_config_json?.A?.tableName || 's_ttm27'}</code>)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                    ระดับ: {currentKpi.measurement_level === 'hospital' ? '9 โรงพยาบาล' : currentKpi.measurement_level === 'district' ? '9 อำเภอ (areacode 2701-2709)' : 'ภาพรวมจังหวัด'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {hdcSyncMsg && (
                  <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                    {hdcSyncMsg}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSyncHdc}
                  disabled={syncingHdc}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {syncingHdc ? '⏳ กำลังดึง HDC...' : '🔄 ดึงผลงานจาก HDC อัตโนมัติ'}
                </button>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', marginBottom: '1.25rem', fontSize: '0.83rem', color: '#854d0e' }}>
            💡 {currentKpi.calc_type === 'process_status'
              ? 'เลือกสถานะความคืบหน้า แล้วกรอกรายละเอียดผลการดำเนินงาน'
              : 'กรอกยอดสะสมตั้งแต่ 1 ต.ค. — ปัจจุบัน หรือกดปุ่ม "ดึงผลงานจาก HDC อัตโนมัติ" ด้านบน ระบบจะคำนวณผลลัพธ์ให้อัตโนมัติ'}
          </div>

          {currentKpi.calc_type === 'process_status' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.88rem' }}>สถานะการดำเนินงาน</label>
                <select className="input-field" value={processStatus} onChange={e => setProcessStatus(e.target.value)}>
                  <option value="success">✅ ผ่าน (ดำเนินการแล้วเสร็จ)</option>
                  <option value="warning">⚠️ ไม่ผ่าน (ล่าช้ากว่าแผน)</option>
                  <option value="pending">🔄 อยู่ระหว่างดำเนินการ</option>
                  <option value="error">❌ ยังไม่ดำเนินการ</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.88rem' }}>รายละเอียดผลการดำเนินงาน</label>
                <textarea className="input-field" rows={4}
                  placeholder="ระบุข้อความอธิบายความคืบหน้า ผลลัพธ์ที่ได้ หรือแนบลิงก์เอกสาร..."
                  value={processDesc} onChange={e => setProcessDesc(e.target.value)} />
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', width: '220px', fontSize: '0.85rem' }}>พื้นที่ / หน่วยบริการ</th>
                    {currentKpi.data_items.map(item => (
                      <th key={item.id} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.85rem' }}>
                        ตัวแปร {item.id}<br />
                        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--secondary-foreground)' }}>{item.label}</span>
                      </th>
                    ))}
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'center', width: '110px', fontSize: '0.85rem' }}>ผลลัพธ์</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map(area => {
                    const areaId = area === 'province' ? 'province' : area;
                    const areaVals = values[areaId] || {};
                    const result = computeResult(currentKpi.calc_formula, areaVals);
                    const statusColor = getStatusColor(result, currentKpi);
                    return (
                      <tr key={areaId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem 0.875rem', fontWeight: 500, fontSize: '0.88rem' }}>
                          {area === 'province' ? (
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>🏛️ ภาพรวมจังหวัดสระแก้ว</span>
                          ) : currentKpi.measurement_level === 'hospital' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{area}</span>
                              <span style={{ fontSize: '0.68rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 600 }}>
                                🏥 รพ.
                              </span>
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{area}</span>
                              <span style={{ fontSize: '0.68rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 600 }}>
                                🏘️ อ.
                              </span>
                            </span>
                          )}
                        </td>
                        {currentKpi.data_items.map(item => (
                          <td key={item.id} style={{ padding: '0.375rem 0.875rem' }}>
                            <input type="number" className="input-field"
                              placeholder={`ยอดสะสม`}
                              value={areaVals[item.id] || ''}
                              onChange={e => setVal(areaId, item.id, e.target.value)}
                              style={{ maxWidth: '120px' }} />
                          </td>
                        ))}
                        <td style={{ padding: '0.5rem 0.875rem', textAlign: 'center', fontWeight: 700, color: statusColor, fontSize: '0.95rem' }}>
                          {result}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : `💾 บันทึกผล ${selectedQuarter}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
