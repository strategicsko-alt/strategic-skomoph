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

interface DataItem { id: string; label: string; }
interface EvalCriteria { q1?: number; q2?: number; q3?: number; q4?: number; q1_warning?: number; q2_warning?: number; q3_warning?: number; q4_warning?: number; }

interface KpiRow {
  kr_id: string;
  dict_id: string | null;
  auto_id: string;
  kr_name: string;
  objective_name: string;
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

function defaultDict(): Omit<KpiRow, 'kr_id' | 'dict_id' | 'auto_id' | 'kr_name' | 'objective_name' | 'tags'> {
  return {
    calc_type: 'process_status', calc_formula: '',
    data_items: [{ id: 'A', label: '' }, { id: 'B', label: '' }],
    measurement_level: 'province', target_operator: '>=',
    work_group: '', eval_criteria: {},
    api_enabled: false, api_config: {},
  };
}

export default function TemplateManagerPage() {
  const [kpis, setKpis] = useState<KpiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('key_results')
      .select(`
        id, name, auto_id,
        objective:objectives(name),
        kpi_dict:kpi_dictionaries(*),
        tags:key_result_tags(tag:kpi_tags(name))
      `)
      .order('order_index', { ascending: true });

    if (data) {
      const rows: KpiRow[] = data.map((kr: any) => {
        const dict = Array.isArray(kr.kpi_dict) ? kr.kpi_dict[0] : kr.kpi_dict;
        const tags = kr.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [];
        const dataItems = dict?.data_items_json
          ? (typeof dict.data_items_json === 'string' ? JSON.parse(dict.data_items_json) : dict.data_items_json)
          : [{ id: 'A', label: '' }, { id: 'B', label: '' }];
        const evalCriteria = dict?.evaluation_criteria_json
          ? (typeof dict.evaluation_criteria_json === 'string' ? JSON.parse(dict.evaluation_criteria_json) : dict.evaluation_criteria_json)
          : {};
        const apiConfig = dict?.api_config_json
          ? (typeof dict.api_config_json === 'string' ? JSON.parse(dict.api_config_json) : dict.api_config_json)
          : {};
        return {
          kr_id: kr.id,
          dict_id: dict?.id || null,
          auto_id: kr.auto_id || '',
          kr_name: kr.name,
          objective_name: kr.objective?.name || '',
          calc_type: dict?.calculation_type || 'process_status',
          calc_formula: dict?.calculation_formula || '',
          data_items: dataItems,
          measurement_level: dict?.measurement_level || 'province',
          target_operator: dict?.target_operator || '>=',
          work_group: dict?.work_group || '',
          eval_criteria: evalCriteria,
          tags,
          api_enabled: dict?.api_enabled || false,
          api_config: apiConfig,
        };
      });
      setKpis(rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);

  const openEdit = (kpi: KpiRow) => setEditingKpi({ ...kpi });

  const handleSave = async () => {
    if (!editingKpi) return;
    setSaving(true);
    const payload = {
      key_result_id: editingKpi.kr_id,
      calculation_type: editingKpi.calc_type,
      calculation_formula: editingKpi.calc_formula,
      data_items_json: editingKpi.data_items,
      measurement_level: editingKpi.measurement_level,
      target_operator: editingKpi.target_operator,
      work_group: editingKpi.work_group,
      evaluation_criteria_json: editingKpi.eval_criteria,
      api_enabled: editingKpi.api_enabled,
      api_config_json: editingKpi.api_config,
    };

    if (editingKpi.dict_id) {
      await supabase.from('kpi_dictionaries').update(payload).eq('id', editingKpi.dict_id);
    } else {
      await supabase.from('kpi_dictionaries').insert(payload);
    }

    // Upsert tags
    await supabase.from('key_result_tags').delete().eq('key_result_id', editingKpi.kr_id);
    for (const tagName of editingKpi.tags) {
      const { data: tagRow } = await supabase.from('kpi_tags').select('id').eq('name', tagName).single();
      if (tagRow) {
        await supabase.from('key_result_tags').insert({ key_result_id: editingKpi.kr_id, tag_id: tagRow.id });
      }
    }

    setSaving(false);
    setEditingKpi(null);
    setSuccessMsg(`บันทึก Template สำหรับ "${editingKpi.kr_name}" สำเร็จแล้ว`);
    setTimeout(() => setSuccessMsg(''), 4000);
    fetchKPIs();
  };

  const addDataItem = () => {
    if (!editingKpi) return;
    const nextId = String.fromCharCode(65 + editingKpi.data_items.length);
    setEditingKpi({ ...editingKpi, data_items: [...editingKpi.data_items, { id: nextId, label: '' }] });
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
    if (val === 'percent') formula = '(A / B) * 100';
    else if (val === 'per100k') formula = '(A / B) * 100000';
    else if (val === 'ratio_1_n') formula = '1 : (B / A)';
    else if (val === 'custom') formula = '(A - B) * 100 / C';
    else if (val === 'process_status') formula = '';
    setEditingKpi({ ...editingKpi, calc_type: val, calc_formula: formula });
  };

  const toggleTag = (tag: string) => {
    if (!editingKpi) return;
    const tags = editingKpi.tags.includes(tag) ? editingKpi.tags.filter(t => t !== tag) : [...editingKpi.tags, tag];
    setEditingKpi({ ...editingKpi, tags });
  };

  const updateApiConfig = (itemId: string, field: keyof { tableName: string; field: string; filter: string }, value: string) => {
    if (!editingKpi) return;
    const cfg = { ...editingKpi.api_config };
    cfg[itemId] = { ...cfg[itemId], [field]: value };
    setEditingKpi({ ...editingKpi, api_config: cfg });
  };

  const filtered = kpis.filter(k =>
    (filterGroup === '' || k.work_group === filterGroup) &&
    (searchTerm === '' || k.kr_name.includes(searchTerm) || k.auto_id.includes(searchTerm))
  );

  const statusBadge = (kpi: KpiRow) => {
    if (kpi.dict_id) return { label: 'ตั้งค่าแล้ว ✓', bg: '#dcfce7', color: '#166534' };
    return { label: 'ยังไม่ตั้งค่า', bg: '#fef9c3', color: '#854d0e' };
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>ตั้งค่าตัวชี้วัด (KPI Template)</h1>
          <p style={{ color: 'var(--secondary-foreground)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            ดึงรายการตัวชี้วัดจากระบบแผนยุทธศาสตร์ มาเพิ่มรายละเอียดการคำนวณและการรายงานผล
          </p>
        </div>
        {successMsg && (
          <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem' }}>
            ✓ {successMsg}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" className="input-field" placeholder="ค้นหาตัวชี้วัด..."
          style={{ flex: 1, minWidth: '200px' }} value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select className="input-field" style={{ width: '240px' }} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">-- ทุกกลุ่มงาน --</option>
          {WORK_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <span style={{ color: 'var(--secondary-foreground)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          แสดง {filtered.length} / {kpis.length} รายการ
        </span>
      </div>

      {/* KPI List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>กำลังโหลดข้อมูลจากระบบแผน...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(kpi => {
            const badge = statusBadge(kpi);
            return (
              <div key={kpi.kr_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', fontFamily: 'monospace', backgroundColor: 'var(--secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{kpi.auto_id}</span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: badge.bg, color: badge.color, padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>{badge.label}</span>
                    {kpi.work_group && <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>{kpi.work_group}</span>}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kpi.kr_name}</div>
                  {kpi.objective_name && <div style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', marginTop: '0.2rem' }}>📌 {kpi.objective_name}</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', padding: '0.25rem 0.75rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
                    {kpi.calc_type === 'process_status' ? '⚙️ กระบวนการ' : `🔢 ${kpi.calc_type}`}
                  </span>
                  <button className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => openEdit(kpi)}>
                    {kpi.dict_id ? '✏️ แก้ไข' : '+ ตั้งค่า'}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingKpi && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>ตั้งค่าตัวชี้วัด</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--secondary-foreground)', fontSize: '0.85rem' }}>{editingKpi.auto_id} · {editingKpi.kr_name}</p>
              </div>
              <button onClick={() => setEditingKpi(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--secondary-foreground)' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Row 1: Work Group + Measurement Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>กลุ่มงานรับผิดชอบ</label>
                  <select className="input-field" value={editingKpi.work_group} onChange={e => setEditingKpi({ ...editingKpi, work_group: e.target.value })}>
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
                    <option value="district">ระดับอำเภอ</option>
                    <option value="hospital">ระดับโรงพยาบาล</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>หมวดหมู่ตัวชี้วัด</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {TAGS_OPTIONS.map(tag => (
                    <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.3rem 0.75rem', borderRadius: '1rem', backgroundColor: editingKpi.tags.includes(tag) ? 'var(--primary)' : 'var(--secondary)', color: editingKpi.tags.includes(tag) ? 'white' : 'var(--foreground)', fontSize: '0.85rem', fontWeight: 500 }}>
                      <input type="checkbox" checked={editingKpi.tags.includes(tag)} onChange={() => toggleTag(tag)} style={{ display: 'none' }} />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <hr style={{ borderTop: '1px solid var(--border)' }} />

              {/* Calculation Type */}
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
                {editingKpi.calc_type !== 'process_status' && (
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>สูตรคำนวณ</label>
                    <input type="text" className="input-field"
                      style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#0369a1', backgroundColor: '#e0f2fe' }}
                      value={editingKpi.calc_formula}
                      onChange={e => setEditingKpi({ ...editingKpi, calc_formula: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Data Items */}
              {editingKpi.calc_type !== 'process_status' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label style={{ fontWeight: 600 }}>ตัวแปรในสูตร</label>
                    <button type="button" onClick={addDataItem} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>+ เพิ่มตัวแปร</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {editingKpi.data_items.map((item, idx) => (
                      <div key={item.id} style={{ backgroundColor: 'var(--secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--primary)' }}>ตัวแปร {item.id}</label>
                        <input type="text" className="input-field" placeholder="คำอธิบายค่า" value={item.label}
                          onChange={e => updateDataItem(idx, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderTop: '1px solid var(--border)' }} />

              {/* Target & Evaluation Criteria */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>เป้าหมายและเกณฑ์ประเมิน (รายไตรมาส)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: 600 }}>เงื่อนไขผ่านเกณฑ์</label>
                  <select className="input-field" style={{ maxWidth: '260px' }} value={editingKpi.target_operator}
                    onChange={e => setEditingKpi({ ...editingKpi, target_operator: e.target.value })}>
                    <option value=">=">{'>='} มากกว่าหรือเท่ากับ</option>
                    <option value=">">&gt; มากกว่า</option>
                    <option value="<=">{'<='} น้อยกว่าหรือเท่ากับ</option>
                    <option value="<">&lt; น้อยกว่า</option>
                    <option value="=">=  เท่ากับ</option>
                  </select>
                </div>
                {[{key:'q1',wKey:'q1_warning',label:'ไตรมาส 1'},{key:'q2',wKey:'q2_warning',label:'ไตรมาส 2'},{key:'q3',wKey:'q3_warning',label:'ไตรมาส 3'},{key:'q4',wKey:'q4_warning',label:'ไตรมาส 4'}].map(q => (
                  <div key={q.key} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{q.label}</span>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#166534', marginBottom: '0.2rem' }}>เป้าผ่าน (เขียว)</label>
                      <input type="number" className="input-field" placeholder="ค่าเป้าหมาย"
                        value={(editingKpi.eval_criteria as any)[q.key] ?? ''}
                        onChange={e => setEditingKpi({ ...editingKpi, eval_criteria: { ...editingKpi.eval_criteria, [q.key]: e.target.value === '' ? undefined : Number(e.target.value) } })} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#854d0e', marginBottom: '0.2rem' }}>เกณฑ์เฝ้าระวัง (เหลือง)</label>
                      <input type="number" className="input-field" placeholder="ค่าเฝ้าระวัง"
                        value={(editingKpi.eval_criteria as any)[q.wKey] ?? ''}
                        onChange={e => setEditingKpi({ ...editingKpi, eval_criteria: { ...editingKpi.eval_criteria, [q.wKey]: e.target.value === '' ? undefined : Number(e.target.value) } })} />
                    </div>
                  </div>
                ))}
              </div>

              {/* IT API Section */}
              {editingKpi.calc_type !== 'process_status' && (
                <>
                  <hr style={{ borderTop: '1px solid var(--border)' }} />
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 700 }}>⚙️ การเชื่อมต่อ HDC API (สำหรับกลุ่มงาน IT)</h4>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>ดึงข้อมูลจาก opendata.moph.go.th โดยอัตโนมัติ</p>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                        <input type="checkbox" checked={editingKpi.api_enabled}
                          onChange={e => setEditingKpi({ ...editingKpi, api_enabled: e.target.checked })} />
                        เปิดใช้งาน
                      </label>
                    </div>
                    {editingKpi.api_enabled && editingKpi.data_items.map(item => (
                      <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'white', marginBottom: '0.75rem' }}>
                        <h5 style={{ margin: '0 0 0.75rem 0', color: '#334155' }}>ตัวแปร <span style={{ color: 'var(--primary)' }}>{item.id}</span> · {item.label}</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Table Name</label>
                            <input type="text" className="input-field" placeholder="s_cmi_summary_drg"
                              value={editingKpi.api_config[item.id]?.tableName || ''}
                              onChange={e => updateApiConfig(item.id, 'tableName', e.target.value)} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>JSON Field</label>
                            <input type="text" className="input-field" placeholder="total_cases"
                              value={editingKpi.api_config[item.id]?.field || ''}
                              onChange={e => updateApiConfig(item.id, 'field', e.target.value)} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Filter (JSON)</label>
                            <input type="text" className="input-field" placeholder='{"type":"IPD"}'
                              value={editingKpi.api_config[item.id]?.filter || ''}
                              onChange={e => updateApiConfig(item.id, 'filter', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => setEditingKpi(null)} disabled={saving}>ยกเลิก</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
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
