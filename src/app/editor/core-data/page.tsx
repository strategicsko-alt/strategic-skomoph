"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Plus, Trash2, Save } from 'lucide-react';
import { Modal } from '@/components/Modal';

export default function CoreDataPage() {
  const [coreData, setCoreData] = useState<any>(null);
  const [swotItems, setSwotItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCoreModalOpen, setIsCoreModalOpen] = useState(false);
  const [isSwotModalOpen, setIsSwotModalOpen] = useState(false);

  // Form states
  const [coreFormData, setCoreFormData] = useState({ vision: '', mission: '', ultimate_goal: '' });
  const [swotFormData, setSwotFormData] = useState({ id: null, swot_type: 'S', detail: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Core Data
    const { data: cData } = await supabase.from('core_organization').select('*').limit(1).single();
    if (cData) {
      setCoreData(cData);
      setCoreFormData({ vision: cData.vision, mission: cData.mission, ultimate_goal: cData.ultimate_goal });
    }

    // Fetch SWOT Items
    const { data: sData } = await supabase.from('swot_items').select('*').order('created_at', { ascending: true });
    if (sData) setSwotItems(sData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCoreData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (coreData?.id) {
      await supabase.from('core_organization').update(coreFormData).eq('id', coreData.id);
    } else {
      await supabase.from('core_organization').insert([coreFormData]);
    }
    
    await fetchData();
    setIsCoreModalOpen(false);
    setIsSaving(false);
  };

  const handleOpenSwotModal = (item: any = null) => {
    if (item) {
      setSwotFormData({ id: item.id, swot_type: item.swot_type, detail: item.detail });
    } else {
      setSwotFormData({ id: null, swot_type: 'S', detail: '' });
    }
    setIsSwotModalOpen(true);
  };

  const handleSaveSwot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (swotFormData.id) {
      await supabase.from('swot_items').update({ 
        swot_type: swotFormData.swot_type, 
        detail: swotFormData.detail 
      }).eq('id', swotFormData.id);
    } else {
      await supabase.from('swot_items').insert([{ 
        swot_type: swotFormData.swot_type, 
        detail: swotFormData.detail 
      }]);
    }
    
    await fetchData();
    setIsSwotModalOpen(false);
    setIsSaving(false);
  };

  const deleteSwot = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อมูล SWOT ข้อนี้?')) return;
    await supabase.from('swot_items').delete().eq('id', id);
    fetchData();
  };

  const renderSwotSection = (type: string, title: string, color: string) => {
    const items = swotItems.filter(s => s.swot_type === type);
    return (
      <div style={{ flex: 1, minWidth: '250px' }}>
        <h4 style={{ fontWeight: 600, color: color, marginBottom: '0.75rem', borderBottom: `2px solid ${color}`, paddingBottom: '0.5rem' }}>{title}</h4>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => (
            <li key={item.id} style={{ backgroundColor: 'var(--secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>{item.detail}</span>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                <button onClick={() => handleOpenSwotModal(item)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}><Edit2 size={14} /></button>
                <button onClick={() => deleteSwot(item.id)} style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', fontStyle: 'italic' }}>ไม่มีข้อมูล</li>}
        </ul>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>ข้อมูลองค์กร (Core Data)</h1>
        <p style={{ color: 'var(--secondary-foreground)' }}>จัดการวิสัยทัศน์ พันธกิจ เป้าประสงค์ และ SWOT Analysis</p>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Core Info Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>วิสัยทัศน์ พันธกิจ และเป้าประสงค์</h2>
              <button onClick={() => setIsCoreModalOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={16} /> แก้ไขข้อมูล
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>เป้าประสงค์สูงสุด (Ultimate Goal)</h3>
                <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{coreData?.ultimate_goal || '-'}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>วิสัยทัศน์ (Vision)</h3>
                  <p>{coreData?.vision || '-'}</p>
                </div>
                <div style={{ backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>พันธกิจ (Mission)</h3>
                  <p>{coreData?.mission || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SWOT Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>ภาพรวมการประเมิน (SWOT Analysis)</h2>
              <button onClick={() => handleOpenSwotModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> เพิ่มรายการ SWOT
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              {renderSwotSection('S', 'Strengths (จุดแข็ง)', 'var(--success)')}
              {renderSwotSection('W', 'Weaknesses (จุดอ่อน)', 'var(--destructive)')}
              {renderSwotSection('O', 'Opportunities (โอกาส)', 'var(--primary)')}
              {renderSwotSection('T', 'Threats (อุปสรรค)', 'var(--warning)')}
            </div>
          </div>
        </div>
      )}

      {/* Modal Core Data */}
      <Modal isOpen={isCoreModalOpen} onClose={() => setIsCoreModalOpen(false)} title="แก้ไขข้อมูลองค์กรหลัก">
        <form onSubmit={handleSaveCoreData} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>เป้าประสงค์สูงสุด (Ultimate Goal)</label>
            <textarea className="input-field" rows={2} required value={coreFormData.ultimate_goal} onChange={e => setCoreFormData({...coreFormData, ultimate_goal: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>วิสัยทัศน์ (Vision)</label>
            <textarea className="input-field" rows={3} required value={coreFormData.vision} onChange={e => setCoreFormData({...coreFormData, vision: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>พันธกิจ (Mission)</label>
            <textarea className="input-field" rows={3} required value={coreFormData.mission} onChange={e => setCoreFormData({...coreFormData, mission: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsCoreModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal SWOT */}
      <Modal isOpen={isSwotModalOpen} onClose={() => setIsSwotModalOpen(false)} title={swotFormData.id ? "แก้ไข SWOT" : "เพิ่มรายการ SWOT"}>
        <form onSubmit={handleSaveSwot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ประเภท (Type)</label>
            <select className="input-field" value={swotFormData.swot_type} onChange={e => setSwotFormData({...swotFormData, swot_type: e.target.value})}>
              <option value="S">Strengths (จุดแข็ง)</option>
              <option value="W">Weaknesses (จุดอ่อน)</option>
              <option value="O">Opportunities (โอกาส)</option>
              <option value="T">Threats (อุปสรรค)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>รายละเอียด</label>
            <textarea className="input-field" rows={3} required value={swotFormData.detail} onChange={e => setSwotFormData({...swotFormData, detail: e.target.value})} placeholder="อธิบายจุดแข็ง จุดอ่อน หรือปัจจัยต่างๆ..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsSwotModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
