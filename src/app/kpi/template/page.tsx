'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const WORK_GROUPS = [
  "คุ้มครองผู้บริโภคและเภสัชสาธารณสุข","บริหารทรัพยากรบุคคล","กลุ่มกฎหมาย",
  "พัฒนายุทธศาสตร์สาธารณสุข","สุขภาพดิจิทัล","คุ้มครองผู้บริโภค",
  "พัฒนาคุณภาพและรูปแบบบริการ","ควบคุมโรคติดต่อ","ประกันสุขภาพ",
  "ส่งเสริมสุขภาพ","ทันตสาธารณสุข","บริหารทั่วไป",
  "อนามัยสิ่งแวดล้อมและอาชีวอนามัย","ควบคุมโรคไม่ติดต่อ",
  "ปฐมภูมิและเครือข่ายสุขภาพ","การแพทย์แผนไทยและการแพทย์ทางเลือก"
];

const TAGS_OPTIONS = [
  "ตัวชี้วัดกระทรวงสาธารณสุขปี 2570",
  "ตัวชี้วัดตรวจราชการฯ ปี 2570",
  "ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)",
  "ยุทธศาสตร์สุขภาพ สระแก้ว (รายไตรมาส)",
];

const KPI_TYPE_LABELS: Record<string, string> = {
  strategic: 'ยุทธศาสตร์สุขภาพ สระแก้ว',
  ministry: 'ตัวชี้วัดกระทรวงสาธารณสุข',
  inspection: 'ตัวชี้วัดตรวจราชการ',
  standalone: 'ตัวชี้วัดอื่นๆ',
};

interface DataItem { id: string; label: string; }
interface EvalCriteria {
  q1?: number; q2?: number; q3?: number; q4?: number;
  q1_warning?: number; q2_warning?: number; q3_warning?: number; q4_warning?: number;
}

interface KpiRow {
  kr_id: string | null;       // null = standalone (ไม่ได้มาจากระบบแผน)
  dict_id: string | null;
  auto_id: string;
  kr_name: string;            // ชื่อ KR หรือ kpi_name ถ้า standalone
  objective_name: string;
  kpi_type: string;
  calc_type: string;
  calc_formula: string;
  data_items: DataItem[];
  measurement_level: string;
  target_operator: string;
  work_group: string;
  eval_criteria: EvalCriteria;
  tags: string[];
  api_enabled: boolean;
  api_config: Record<string, { tableName: string; field: string; filter: string }>;
}

function emptyRow(overrides?: Partial<KpiRow>): KpiRow {
  return {
    kr_id: null, dict_id: null, auto_id: '', kr_name: '',
    objective_name: '', kpi_type: 'ministry',
    calc_type: 'percent', calc_formula: '(A/B)*100',
    data_items: [{ id: 'A', label: 'ตัวตั้ง' }, { id: 'B', label: 'ตัวหาร' }],
    measurement_level: 'province', target_operator: '>=',
    work_group: '', eval_criteria: {},
    tags: [], api_enabled: false, api_config: {},
    ...overrides,
  };
}

export default function TemplateManagerPage() {
  const [kpis, setKpis] = useState<KpiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiRow | null>(null);
  const [isNewKpi, setIsNewKpi] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterType, setFilterType] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchKPIs = useCallback(async () => {
    setLoading(true);

    // 1. ดึง key_results จากระบบแผน + dict ที่เชื่อมอยู่
    const { data: krData } = await supabase
      .from('key_results')
      .select('id, name, auto_id, objective:objectives(name), tags:key_result_tags(tag:kpi_tags(name))')
      .order('order_index', { ascending: true });

    // 2. ดึง kpi_dictionaries ทั้งหมด (รวม standalone ที่ไม่มี key_result_id)
    const { data: dictData } = await supabase
      .from('kpi_dictionaries')
      .select('id, key_result_id, kpi_name, kpi_type, calculation_type, calculation_formula, data_items_json, measurement_level, target_operator, work_group, evaluation_criteria_json, api_enabled, api_config_json');

    const dictMap: Record<string, any> = {};
    (dictData || []).forEach((d: any) => {
      if (d.key_result_id) dictMap[d.key_result_id] = d;
    });

    const rows: KpiRow[] = [];

    // ตัวชี้วัดจากระบบแผน
    (krData || []).forEach((kr: any) => {
      const dict = dictMap[kr.id] || null;
      const tags = kr.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [];
      const dataItems = dict?.data_items_json
        ? (typeof dict.data_items_json === 'string' ? JSON.parse(dict.data_items_json) : dict.data_items_json)
        : [{ id: 'A', label: 'ตัวตั้ง' }, { id: 'B', label: 'ตัวหาร' }];
      const evalCriteria = dict?.evaluation_criteria_json
        ? (typeof dict.evaluation_criteria_json === 'string' ? JSON.parse(dict.evaluation_criteria_json) : dict.evaluation_criteria_json)
        : {};
      const apiConfig = dict?.api_config_json
        ? (typeof dict.api_config_json === 'string' ? JSON.parse(dict.api_config_json) : dict.api_config_json)
        : {};

      rows.push({
        kr_id: kr.id, dict_id: dict?.id || null, auto_id: kr.auto_id || '',
        kr_name: kr.name, objective_name: kr.objective?.name || '',
        kpi_type: dict?.kpi_type || 'strategic',
        calc_type: dict?.calculation_type || 'percent',
        calc_formula: dict?.calculation_formula || '(A/B)*100',
        data_items: dataItems,
        measurement_level: dict?.measurement_level || 'province',
        target_operator: dict?.target_operator || '>=',
        work_group: dict?.work_group || '',
        eval_criteria: evalCriteria, tags,
        api_enabled: dict?.api_enabled || false, api_config: apiConfig,
      });
    });

    // ตัวชี้วัด standalone (ไม่มี key_result_id)
    (dictData || []).filter((d: any) => !d.key_result_id).forEach((dict: any) => {
      const dataItems = dict?.data_items_json
        ? (typeof dict.data_items_json === 'string' ? JSON.parse(dict.data_items_json) : dict.data_items_json)
        : [];
      const evalCriteria = dict?.evaluation_criteria_json
        ? (typeof dict.evaluation_criteria_json === 'string' ? JSON.parse(dict.evaluation_criteria_json) : dict.evaluation_criteria_json)
        : {};
      const apiConfig = dict?.api_config_json
        ? (typeof dict.api_config_json === 'string' ? JSON.parse(dict.api_config_json) : dict.api_config_json)
        : {};

      rows.push({
        kr_id: null, dict_id: dict.id, auto_id: '',
        kr_name: dict.kpi_name || 'ไม่มีชื่อ', objective_name: '',
        kpi_type: dict.kpi_type || 'ministry',
        calc_type: dict.calculation_type || 'percent',
        calc_formula: dict.calculation_formula || '(A/B)*100',
        data_items: dataItems,
        measurement_level: dict.measurement_level || 'province',
        target_operator: dict.target_operator || '>=',
        work_group: dict.work_group || '',
        eval_criteria: evalCriteria, tags: [],
        api_enabled: dict.api_enabled || false, api_config: apiConfig,
      });
    });

    setKpis(rows);
    setLoading(false);
  }, []);

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);

  const openNewKpi = () => {
    setIsNewKpi(true);
    setEditingKpi(emptyRow());
  };

  const openEdit = (kpi: KpiRow) => {
    setIsNewKpi(false);
    setEditingKpi({ ...kpi });
  };

  const handleSave = async () => {
    if (!editingKpi) return;
    setSaving(true);

    const payload: any = {
      calculation_type: editingKpi.calc_type,
      calculation_formula: editingKpi.calc_formula,
      data_items_json: editingKpi.data_items,
      measurement_level: editingKpi.measurement_level,
      target_operator: editingKpi.target_operator,
      work_group: editingKpi.work_group,
      evaluation_criteria_json: editingKpi.eval_criteria,
      api_enabled: editingKpi.api_enabled,
      api_config_json: editingKpi.api_config,
      kpi_type: editingKpi.kpi_type,
    };

    if (editingKpi.kr_id) {
      payload.key_result_id = editingKpi.kr_id;
    } else {
      payload.kpi_name = editingKpi.kr_name;
      payload.key_result_id = null;
    }

    let newDictId = editingKpi.dict_id;

    if (editingKpi.dict_id) {
      await supabase.from('kpi_dictionaries').update(payload).eq('id', editingKpi.dict_id);
    } else {
      const { data: inserted } = await supabase.from('kpi_dictionaries').insert(payload).select('id').single();
      newDictId = inserted?.id;
    }

    // Update tags (only for KRs from strategic plan)
    if (editingKpi.kr_id) {
      await supabase.from('key_result_tags').delete().eq('key_result_id', editingKpi.kr_id);
      for (const tagName of editingKpi.tags) {
        const { data: tagRow } = await supabase.from('kpi_tags').select('id').eq('name', tagName).single();
        if (tagRow) {
          await supabase.from('key_result_tags').insert({ key_result_id: editingKpi.kr_id, tag_id: tagRow.id });
        }
      }
    }

    setSaving(false);
    setEditingKpi(null);
    setIsNewKpi(false);
    setSuccessMsg(`บันทึก "${editingKpi.kr_name}" สำเร็จ`);
    setTimeout(() => setSuccessMsg(''), 4000);
    fetchKPIs();
  };

  const addDataItem = () => {
    if (!editingKpi) return;
    const nextId = String.fromCharCode(65 + editingKpi.data_items.length);
    setEditingKpi({ ...editingKpi, data_items: [...editingKpi.data_items, { id: nextId, label: '' }] });
  };

  const removeDataItem = (idx: number) => {
    if (!editingKpi || editingKpi.data_items.length <= 1) return;
    const items = editingKpi.data_items.filter((_, i) => i !== idx)
      .map((item, i) => ({ ...item, id: String.fromCharCode(65 + i) }));
    // Rebuild formula with new ids
    setEditingKpi({ ...editingKpi, data_items: items });
  };

  const updateDataItem = (idx: number, label: string) => {
    if (!editingKpi) return;
    const items = [...editingKpi.data_items];
    items[idx] = { ...items[idx], label };
    setEditingKpi({ ...editingKpi, data_items: items });
  };

  const handleCalcTypeChange = (val: string) => {
    if (!editingKpi) return;
    let formula = editingKpi.calc_formula;
    if (val === 'percent') formula = '(A/B)*100';
    else if (val === 'per100k') formula = '(A/B)*100000';
    else if (val === 'per1k') formula = '(A/B)*1000';
    else if (val === 'ratio_1_n') formula = '1:(B/A)';
    else if (val === 'custom') formula = '(A-B)*100/C';
    else if (val === 'process_status') formula = '';
    setEditingKpi({ ...editingKpi, calc_type: val, calc_formula: formula });
  };

  const toggleTag = (tag: string) => {
    if (!editingKpi) return;
    const tags = editingKpi.tags.includes(tag)
      ? editingKpi.tags.filter(t => t !== tag)
      : [...editingKpi.tags, tag];
    setEditingKpi({ ...editingKpi, tags });
  };

  const updateApiConfig = (itemId: string, field: string, value: string) => {
    if (!editingKpi) return;
    const cfg = { ...editingKpi.api_config, [itemId]: { ...editingKpi.api_config[itemId], [field]: value } };
    setEditingKpi({ ...editingKpi, api_config: cfg });
  };

  const setEvalVal = (key: string, value: string) => {
    if (!editingKpi) return;
    const ev = { ...editingKpi.eval_criteria, [key]: value === '' ? undefined : Number(value) };
    setEditingKpi({ ...editingKpi, eval_criteria: ev as EvalCriteria });
  };

  const filtered = kpis.filter(k =>
    (filterGroup === '' || k.work_group === filterGroup) &&
    (filterType === '' || k.kpi_type === filterType) &&
    (searchTerm === '' || k.kr_name.toLowerCase().includes(searchTerm.toLowerCase()) || k.auto_id.includes(searchTerm))
  );

  const getBadge = (kpi: KpiRow) => {
    if (kpi.dict_id) return { label: 'ตั้งค่าแล้ว ✓', bg: '#dcfce7', color: '#166534' };
    return { label: 'ยังไม่ตั้งค่า', bg: '#fef9c3', color: '#854d0e' };
  };

  const getTypeBadgeColor = (type: string) => {
    if (type === 'ministry') return { bg: '#fce7f3', color: '#9d174d' };
    if (type === 'inspection') return { bg: '#ede9fe', color: '#5b21b6' };
    if (type === 'standalone') return { bg: '#f1f5f9', color: '#475569' };
    return { bg: '#dbeafe', color: '#1e40af' };
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>ตั้งค่าตัวชี้วัด (KPI Template)</h1>
          <p style={{ color: 'var(--secondary-foreground)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            จัดการตัวชี้วัดจากระบบแผนยุทธศาสตร์ หรือสร้างตัวชี้วัดใหม่ (กระทรวง/ตรวจราชการ)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {successMsg && (
            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem' }}>
              ✓ {successMsg}
            </div>
          )}
          <button className="btn-primary" onClick={openNewKpi} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            + สร้างตัวชี้วัดใหม่
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" className="input-field" placeholder="🔍 ค้นหาชื่อตัวชี้วัด / รหัส KR..."
          style={{ flex: 1, minWidth: '200px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select className="input-field" style={{ width: '200px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">-- ทุกประเภท --</option>
          {Object.entries(KPI_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input-field" style={{ width: '220px' }} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">-- ทุกกลุ่มงาน --</option>
          {WORK_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <span style={{ color: 'var(--secondary-foreground)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          {filtered.length} / {kpis.length} รายการ
        </span>
      </div>

      {/* KPI List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>กำลังโหลด...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(kpi => {
            const badge = getBadge(kpi);
            const typeBadge = getTypeBadgeColor(kpi.kpi_type);
            return (
              <div key={kpi.dict_id || kpi.kr_id} className="card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    {kpi.auto_id && (
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', backgroundColor: 'var(--secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--secondary-foreground)' }}>{kpi.auto_id}</span>
                    )}
                    <span style={{ fontSize: '0.7rem', backgroundColor: badge.bg, color: badge.color, padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>{badge.label}</span>
                    <span style={{ fontSize: '0.7rem', backgroundColor: typeBadge.bg, color: typeBadge.color, padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 500 }}>{KPI_TYPE_LABELS[kpi.kpi_type] || kpi.kpi_type}</span>
                    {kpi.work_group && <span style={{ fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{kpi.work_group}</span>}
                  </div>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>{kpi.kr_name}</div>
                  {kpi.objective_name && <div style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)', marginTop: '0.15rem' }}>📌 {kpi.objective_name}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                  {kpi.dict_id && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)', padding: '0.2rem 0.6rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
                      {kpi.calc_type === 'process_status' ? '⚙️ กระบวนการ' : `🔢 ${kpi.calc_formula}`}
                    </span>
                  )}
                  <button className="btn-primary" style={{ padding: '0.35rem 0.875rem', fontSize: '0.82rem' }} onClick={() => openEdit(kpi)}>
                    {kpi.dict_id ? '✏️ แก้ไข' : '+ ตั้งค่า'}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>ไม่พบรายการ</div>
          )}
        </div>
      )}

      {/* Edit/Create Modal */}
      {editingKpi && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  {isNewKpi ? '➕ สร้างตัวชี้วัดใหม่' : '✏️ แก้ไข Template'}
                </h2>
                {!isNewKpi && editingKpi.auto_id && (
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--secondary-foreground)', fontSize: '0.82rem' }}>{editingKpi.auto_id} · {editingKpi.kr_name}</p>
                )}
              </div>
              <button onClick={() => { setEditingKpi(null); setIsNewKpi(false); }}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--secondary-foreground)', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* ชื่อตัวชี้วัด (แก้ได้เฉพาะ standalone) */}
              {(isNewKpi || !editingKpi.kr_id) && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ชื่อตัวชี้วัด <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" className="input-field"
                    placeholder="เช่น อัตราผู้ป่วยวัณโรครักษาหายขาด"
                    value={editingKpi.kr_name}
                    onChange={e => setEditingKpi({ ...editingKpi, kr_name: e.target.value })} />
                </div>
              )}

              {/* Row 1: ประเภท + กลุ่มงาน + ระดับ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ประเภทตัวชี้วัด</label>
                  <select className="input-field" value={editingKpi.kpi_type}
                    onChange={e => setEditingKpi({ ...editingKpi, kpi_type: e.target.value })}>
                    {Object.entries(KPI_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>กลุ่มงานรับผิดชอบ</label>
                  <select className="input-field" value={editingKpi.work_group}
                    onChange={e => setEditingKpi({ ...editingKpi, work_group: e.target.value })}>
                    <option value="">-- เลือกกลุ่มงาน --</option>
                    {WORK_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ระดับพื้นที่ประเมิน</label>
                  <select className="input-field" value={editingKpi.measurement_level}
                    disabled={editingKpi.calc_type === 'process_status'}
                    onChange={e => setEditingKpi({ ...editingKpi, measurement_level: e.target.value })}>
                    <option value="province">ภาพรวมจังหวัด</option>
                    <option value="district">ระดับอำเภอ (9 อำเภอ)</option>
                    <option value="hospital">ระดับโรงพยาบาล</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              {editingKpi.kr_id && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>หมวดหมู่ตัวชี้วัด</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {TAGS_OPTIONS.map(tag => (
                      <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', padding: '0.3rem 0.75rem', borderRadius: '1rem', border: `1px solid ${editingKpi.tags.includes(tag) ? 'var(--primary)' : 'var(--border)'}`, backgroundColor: editingKpi.tags.includes(tag) ? 'var(--primary)' : 'transparent', color: editingKpi.tags.includes(tag) ? 'white' : 'var(--foreground)', fontSize: '0.83rem', fontWeight: 500, userSelect: 'none' }}>
                        <input type="checkbox" checked={editingKpi.tags.includes(tag)} onChange={() => toggleTag(tag)} style={{ display: 'none' }} />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />

              {/* Calculation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>รูปแบบการคำนวณ</label>
                  <select className="input-field" value={editingKpi.calc_type} onChange={e => handleCalcTypeChange(e.target.value)}>
                    <option value="percent">ร้อยละ</option>
                    <option value="ratio_1_n">อัตราส่วน 1:N</option>
                    <option value="per1k">อัตราต่อพัน</option>
                    <option value="per100k">อัตราต่อแสน</option>
                    <option value="count">จำนวนสะสม</option>
                    <option value="custom">กำหนดสูตรเอง</option>
                    <option value="process_status">เชิงกระบวนการ</option>
                  </select>
                </div>
                {editingKpi.calc_type !== 'process_status' ? (
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>สูตรคำนวณ</label>
                    <input type="text" className="input-field"
                      style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#0369a1', backgroundColor: '#e0f2fe' }}
                      value={editingKpi.calc_formula}
                      onChange={e => setEditingKpi({ ...editingKpi, calc_formula: e.target.value })} />
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#fffbeb', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', alignSelf: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#854d0e' }}>💡 ผู้รายงานจะบันทึกสถานะ (ผ่าน/ไม่ผ่าน) และข้อความบรรยาย</span>
                  </div>
                )}
              </div>

              {/* Data Items */}
              {editingKpi.calc_type !== 'process_status' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label style={{ fontWeight: 600 }}>ตัวแปรในสูตร</label>
                    <button type="button" onClick={addDataItem} className="btn-secondary" style={{ padding: '0.2rem 0.65rem', fontSize: '0.8rem' }}>+ เพิ่มตัวแปร</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {editingKpi.data_items.map((item, idx) => (
                      <div key={idx} style={{ backgroundColor: 'var(--secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <label style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>ตัวแปร {item.id}</label>
                          {editingKpi.data_items.length > 1 && (
                            <button onClick={() => removeDataItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem', padding: '0' }}>✕</button>
                          )}
                        </div>
                        <input type="text" className="input-field" placeholder="คำอธิบายค่า" value={item.label}
                          onChange={e => updateDataItem(idx, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />

              {/* Evaluation Criteria */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: 600 }}>เป้าหมายและเกณฑ์ประเมิน (รายไตรมาส)</label>
                  <select className="input-field" style={{ width: '240px' }} value={editingKpi.target_operator}
                    onChange={e => setEditingKpi({ ...editingKpi, target_operator: e.target.value })}>
                    <option value=">=">{'>='} มากกว่าหรือเท่ากับ</option>
                    <option value=">">&gt; มากกว่า</option>
                    <option value="<=">{'<='} น้อยกว่าหรือเท่ากับ</option>
                    <option value="<">&lt; น้อยกว่า</option>
                    <option value="=">=  เท่ากับ</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: '0.5rem', alignItems: 'center' }}>
                  <div></div>
                  {['Q1','Q2','Q3','Q4'].map(q => <div key={q} style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: 'var(--secondary-foreground)' }}>{q}</div>)}

                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534' }}>เขียว</div>
                  {['q1','q2','q3','q4'].map(q => (
                    <input key={q} type="number" className="input-field" placeholder="เป้า"
                      value={(editingKpi.eval_criteria as any)[q] ?? ''}
                      onChange={e => setEvalVal(q, e.target.value)} />
                  ))}

                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#854d0e' }}>เหลือง</div>
                  {['q1_warning','q2_warning','q3_warning','q4_warning'].map(q => (
                    <input key={q} type="number" className="input-field" placeholder="เฝ้าระวัง"
                      value={(editingKpi.eval_criteria as any)[q] ?? ''}
                      onChange={e => setEvalVal(q, e.target.value)} />
                  ))}
                </div>
              </div>

              {/* IT API Section */}
              {editingKpi.calc_type !== 'process_status' && (
                <>
                  <hr style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editingKpi.api_enabled ? '1rem' : '0' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>⚙️ เชื่อมต่อ HDC API (สำหรับ IT)</span>
                        <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.78rem', color: 'var(--secondary-foreground)' }}>ดึงข้อมูลจาก opendata.moph.go.th อัตโนมัติ</p>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={editingKpi.api_enabled}
                          onChange={e => setEditingKpi({ ...editingKpi, api_enabled: e.target.checked })} />
                        เปิดใช้งาน
                      </label>
                    </div>
                    {editingKpi.api_enabled && editingKpi.data_items.map(item => (
                      <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.875rem', backgroundColor: 'white', marginBottom: '0.5rem' }}>
                        <h5 style={{ margin: '0 0 0.75rem 0', color: '#334155', fontSize: '0.88rem' }}>
                          ตัวแปร <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.id}</span> · {item.label}
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                          {[['tableName', 'Table Name', 's_cmi_summary'], ['field', 'JSON Field', 'total_cases'], ['filter', 'Filter (JSON)', '{"type":"IPD"}']].map(([fk, label, ph]) => (
                            <div key={fk}>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>{label}</label>
                              <input type="text" className="input-field" placeholder={ph}
                                value={(editingKpi.api_config[item.id] as any)?.[fk] || ''}
                                onChange={e => updateApiConfig(item.id, fk, e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => { setEditingKpi(null); setIsNewKpi(false); }} disabled={saving}>ยกเลิก</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving || (!editingKpi.kr_name && isNewKpi)}>
                  {saving ? 'กำลังบันทึก...' : '💾 บันทึก Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
