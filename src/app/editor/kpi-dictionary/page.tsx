"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Plus, ChevronDown, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useEditor } from '@/components/EditorContext';

export default function KPIDictionaryPage() {
  const { districtId, loading: ctxLoading } = useEditor();
  const [keyResults, setKeyResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeKr, setActiveKr] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const RESPONSIBLE_GROUPS = [
    "กลุ่มงานบริหารทั่วไป", "กลุ่มงานบริหารทรัพยากรบุคคล", "กลุ่มกฎหมาย", 
    "กลุ่มงานพัฒนายุทธศาสตร์สาธารณสุข", "กลุ่มงานสุขภาพดิจิทัล", "กลุ่มงานคุ้มครองผู้บริโภค", 
    "กลุ่มงานพัฒนาคุณภาพและรูปแบบบริการ", "กลุ่มงานควบคุมโรคติดต่อ", "กลุ่มงานประกันสุขภาพ", 
    "กลุ่มงานส่งเสริมสุขภาพ", "กลุ่มงานทันตสาธารณสุข", "กลุ่มงานอนามัยสิ่งแวดล้อมและอาชีวอนามัย", 
    "กลุ่มงานควบคุมโรคไม่ติดต่อ", "กลุ่มงานปฐมภูมิและเครือข่ายสุขภาพ", 
    "กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก", "กลุ่มงานพัฒนาทรัพยากรบุคคล"
  ];

  const fetchData = async () => {
    if (!districtId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('key_results')
      .select(`
        id, auto_id, name, target_2574, responsible_group,
        kpi_dictionaries (*)
      `)
      .eq('district_id', districtId)
      .order('auto_id', { ascending: true });
      
    if (data) setKeyResults(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!ctxLoading) fetchData();

    const channel = supabase
      .channel('kpi-dictionary-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          if (!ctxLoading) fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ctxLoading, districtId]);

  const handleOpenModal = (kr: any) => {
    setActiveKr(kr);
    const existingKpi = Array.isArray(kr.kpi_dictionaries) ? kr.kpi_dictionaries[0] : kr.kpi_dictionaries;
    
    setFormData(existingKpi || {
      definition: '', numerator: '', denominator: '', 
      inclusion_criteria: '', exclusion_criteria: '',
      data_source: '', data_collection_method: '', cutoff_date: '',
      frequency: '', responsible_person: kr.responsible_group || '',
      proposed_target: kr.target_2574 || '', baseline: '',
      rationale: '', risk_warning: '', prerequisite: ''
    });
    
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      key_result_id: activeKr.id,
      definition: formData.definition,
      numerator: formData.numerator,
      denominator: formData.denominator,
      inclusion_criteria: formData.inclusion_criteria,
      exclusion_criteria: formData.exclusion_criteria,
      data_source: formData.data_source,
      data_collection_method: formData.data_collection_method,
      cutoff_date: formData.cutoff_date,
      frequency: formData.frequency,
      responsible_person: formData.responsible_person,
      proposed_target: formData.proposed_target,
      baseline: formData.baseline,
      rationale: formData.rationale,
      risk_warning: formData.risk_warning,
      prerequisite: formData.prerequisite
    };

    const existingKpi = Array.isArray(activeKr.kpi_dictionaries) ? activeKr.kpi_dictionaries[0] : activeKr.kpi_dictionaries;
    
    if (existingKpi?.id) {
      // Update
      const { error } = await supabase.from('kpi_dictionaries').update(payload).eq('id', existingKpi.id);
      if (error) alert('Error updating: ' + error.message);
    } else {
      // Insert
      const { error } = await supabase.from('kpi_dictionaries').insert([payload]);
      if (error) alert('Error inserting: ' + error.message);
    }
    
    await fetchData();
    setIsModalOpen(false);
    setIsSaving(false);
  };

  const handleGenerateKpi = async () => {
    if (!activeKr?.name) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpiName: activeKr.name })
      });
      
      if (!res.ok) throw new Error('Failed to generate');
      
      const data = await res.json();
      
      // Update form data, but keep existing fields that shouldn't be overridden
      setFormData((prev: any) => ({
        ...prev,
        ...data,
        responsible_person: prev.responsible_person,
        proposed_target: prev.proposed_target,
        baseline: prev.baseline
      }));
      
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการสร้างข้อมูลด้วย AI กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>KPI Dictionary</h1>
          <p style={{ color: 'var(--secondary-foreground)' }}>ระบบจัดการพจนานุกรมตัวชี้วัด 14 ฟิลด์ (ผูกกับ Key Results)</p>
        </div>
        <div>
          <select 
            className="input-field" 
            value={selectedGroup} 
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{ minWidth: '250px' }}
          >
            <option value="">-- กรองทุกกลุ่มงาน --</option>
            {RESPONSIBLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลดข้อมูล...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', width: '100px' }}>รหัส KR</th>
                <th style={{ padding: '1rem' }}>ชื่อเป้าหมาย (Key Result)</th>
                <th style={{ padding: '1rem', width: '200px' }}>กลุ่มงานรับผิดชอบ</th>
                <th style={{ padding: '1rem', width: '130px' }}>สถานะ KPI</th>
                <th style={{ padding: '1rem', width: '130px', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {(selectedGroup ? keyResults.filter(kr => kr.responsible_group === selectedGroup) : keyResults).map((kr) => {
                const kpi = Array.isArray(kr.kpi_dictionaries) ? kr.kpi_dictionaries[0] : kr.kpi_dictionaries;
                const hasKpi = !!kpi;
                
                let isComplete = false;
                if (hasKpi) {
                  const fields = [
                    kpi.definition, kpi.numerator, kpi.denominator, kpi.inclusion_criteria,
                    kpi.exclusion_criteria, kpi.data_source, kpi.data_collection_method,
                    kpi.cutoff_date, kpi.frequency, kpi.responsible_person,
                    kpi.proposed_target, kpi.baseline, kpi.rationale, kpi.risk_warning, kpi.prerequisite
                  ];
                  // Consider complete only if all fields have some text
                  isComplete = fields.every(field => field && String(field).trim() !== '');
                }
                
                return (
                  <tr key={kr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>{kr.auto_id}</td>
                    <td style={{ padding: '1rem' }}>{kr.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ backgroundColor: 'var(--secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {kr.responsible_group || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {hasKpi ? (
                        isComplete ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontWeight: 500 }}>
                            <CheckCircle2 size={16} /> สมบูรณ์
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', fontWeight: 500 }}>
                            <Edit2 size={14} /> ไม่สมบูรณ์
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--secondary-foreground)' }}>ยังไม่ระบุ</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleOpenModal(kr)}
                        className={hasKpi ? "btn-secondary" : "btn-primary"} 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        {hasKpi ? <><Edit2 size={16} style={{marginRight: '0.5rem'}} /> แก้ไข KPI</> : <><Plus size={16} style={{marginRight: '0.5rem'}} /> สร้าง KPI</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {keyResults.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>ไม่พบข้อมูล Key Result กรุณาไปเพิ่มที่หน้า Workshop ก่อน</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`KPI Dictionary: ${activeKr?.auto_id}`}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{activeKr?.name}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>เป้าหมายปี 2574 (ตั้งต้น): <strong>{activeKr?.target_2574 || '-'}</strong></p>
            
            <button 
              type="button" 
              onClick={handleGenerateKpi} 
              disabled={isGenerating}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: isGenerating ? 0.7 : 1 }}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isGenerating ? 'AI กำลังร่างข้อมูล...' : '✨ ให้ AI ช่วยร่างข้อมูล'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>1. นิยามและเกณฑ์</h4>
            
            <div>
              <label className="form-label">นิยามเชิงปฏิบัติการ (Definition)</label>
              <textarea className="input-field" rows={3} value={formData.definition || ''} onChange={e => setFormData({...formData, definition: e.target.value})} />
            </div>
            
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">ตัวตั้ง (Numerator)</label>
                <textarea className="input-field" rows={2} value={formData.numerator || ''} onChange={e => setFormData({...formData, numerator: e.target.value})} />
              </div>
              <div>
                <label className="form-label">ตัวหาร (Denominator)</label>
                <textarea className="input-field" rows={2} value={formData.denominator || ''} onChange={e => setFormData({...formData, denominator: e.target.value})} />
              </div>
            </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">เกณฑ์นับเข้า (Inclusion Criteria)</label>
                <textarea className="input-field" rows={2} value={formData.inclusion_criteria || ''} onChange={e => setFormData({...formData, inclusion_criteria: e.target.value})} />
              </div>
              <div>
                <label className="form-label">เกณฑ์นับออก (Exclusion Criteria)</label>
                <textarea className="input-field" rows={2} value={formData.exclusion_criteria || ''} onChange={e => setFormData({...formData, exclusion_criteria: e.target.value})} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>2. การจัดการข้อมูล</h4>
            
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">แหล่งข้อมูล (Data Source)</label>
                <input type="text" className="input-field" value={formData.data_source || ''} onChange={e => setFormData({...formData, data_source: e.target.value})} />
              </div>
              <div>
                <label className="form-label">วิธีดึงข้อมูล (Collection Method)</label>
                <input type="text" className="input-field" value={formData.data_collection_method || ''} onChange={e => setFormData({...formData, data_collection_method: e.target.value})} />
              </div>
            </div>
            
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">ความถี่การวัด</label>
                <input type="text" className="input-field" value={formData.frequency || ''} onChange={e => setFormData({...formData, frequency: e.target.value})} placeholder="เช่น รายเดือน, รายไตรมาส" />
              </div>
              <div>
                <label className="form-label">วันตัดข้อมูล</label>
                <input type="text" className="input-field" value={formData.cutoff_date || ''} onChange={e => setFormData({...formData, cutoff_date: e.target.value})} placeholder="เช่น วันที่ 5 ของเดือน" />
              </div>
              <div>
                <label className="form-label">กลุ่มงานผู้รับผิดชอบ</label>
                <select className="input-field" value={formData.responsible_person || ''} onChange={e => setFormData({...formData, responsible_person: e.target.value})}>
                  <option value="">-- เลือกกลุ่มงาน --</option>
                  {RESPONSIBLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1rem' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>3. เป้าหมายและความเสี่ยง</h4>
            
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">ข้อมูลฐาน (Baseline)</label>
                <input type="text" className="input-field" value={formData.baseline || ''} onChange={e => setFormData({...formData, baseline: e.target.value})} placeholder="เช่น ปี 2566: 80%" />
              </div>
              <div>
                <label className="form-label">ค่าเป้าหมายที่เสนอ (Proposed Target)</label>
                <input type="text" className="input-field" value={formData.proposed_target || ''} onChange={e => setFormData({...formData, proposed_target: e.target.value})} />
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginTop: '0.25rem' }}>* ระบบดึงค่าเบื้องต้นมาจากเป้าหมายปี 2574</p>
              </div>
            </div>
            
            <div>
              <label className="form-label">เหตุผลประกอบ (Rationale)</label>
              <textarea className="input-field" rows={2} value={formData.rationale || ''} onChange={e => setFormData({...formData, rationale: e.target.value})} />
            </div>

            <div>
              <label className="form-label">ข้อควรระวัง / ความเสี่ยง (Risk & Warning)</label>
              <textarea className="input-field" rows={2} value={formData.risk_warning || ''} onChange={e => setFormData({...formData, risk_warning: e.target.value})} />
            </div>

            <div>
              <label className="form-label">สิ่งที่ต้องทำก่อนจึงจะวัดได้ (Prerequisite)</label>
              <textarea className="input-field" rows={2} value={formData.prerequisite || ''} onChange={e => setFormData({...formData, prerequisite: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกพจนานุกรมตัวชี้วัด'}</button>
          </div>
        </form>

        <style dangerouslySetInnerHTML={{__html: `
          .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; }
        `}} />
      </Modal>

    </div>
  );
}
