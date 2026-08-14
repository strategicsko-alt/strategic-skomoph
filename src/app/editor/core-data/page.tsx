"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';

export default function CoreDataPage() {
  const [coreData, setCoreData] = useState<any>(null);
  const [listItems, setListItems] = useState<any[]>([]);
  const [swotItems, setSwotItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isSwotModalOpen, setIsSwotModalOpen] = useState(false);

  // Form states
  const [visionForm, setVisionForm] = useState('');
  const [listForm, setListForm] = useState({ id: null, item_type: 'mission', detail: '' });
  const [swotFormData, setSwotFormData] = useState({ id: null, swot_type: 'S', detail: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Core Data (Vision)
    const { data: cData } = await supabase.from('core_organization').select('*').limit(1).maybeSingle();
    if (cData) {
      setCoreData(cData);
      setVisionForm(cData.vision || '');
    }

    // Fetch List Items (Mission, Goal)
    const { data: lData } = await supabase.from('core_list_items').select('*').order('created_at', { ascending: true });
    if (lData) setListItems(lData);

    // Fetch SWOT/TOWS Items
    const { data: sData } = await supabase.from('swot_items').select('*').order('created_at', { ascending: true });
    if (sData) setSwotItems(sData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers for Vision ---
  const handleSaveVision = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (coreData?.id) {
      await supabase.from('core_organization').update({ vision: visionForm }).eq('id', coreData.id);
    } else {
      // Create first row if not exist
      await supabase.from('core_organization').insert([{ vision: visionForm, mission: '', ultimate_goal: '' }]);
    }
    
    await fetchData();
    setIsVisionModalOpen(false);
    setIsSaving(false);
  };

  // --- Handlers for Mission / Goal (List Items) ---
  const handleOpenListModal = (type: string, item: any = null) => {
    if (item) {
      setListForm({ id: item.id, item_type: type, detail: item.detail });
    } else {
      setListForm({ id: null, item_type: type, detail: '' });
    }
    setIsListModalOpen(true);
  };

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (listForm.id) {
      await supabase.from('core_list_items').update({ detail: listForm.detail }).eq('id', listForm.id);
    } else {
      await supabase.from('core_list_items').insert([{ item_type: listForm.item_type, detail: listForm.detail }]);
    }
    
    await fetchData();
    setIsListModalOpen(false);
    setIsSaving(false);
  };

  const deleteList = async (id: string) => {
    if (!confirm('ยืนยันการลบข้อนี้?')) return;
    await supabase.from('core_list_items').delete().eq('id', id);
    fetchData();
  };

  // --- Handlers for SWOT / TOWS ---
  const handleOpenSwotModal = (type: string, item: any = null) => {
    if (item) {
      setSwotFormData({ id: item.id, swot_type: type, detail: item.detail });
    } else {
      setSwotFormData({ id: null, swot_type: type, detail: '' });
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
    if (!confirm('ยืนยันการลบข้อมูลข้อนี้?')) return;
    await supabase.from('swot_items').delete().eq('id', id);
    fetchData();
  };

  // --- Render Helpers ---
  const renderListSection = (type: string, title: string) => {
    const items = listItems.filter(l => l.item_type === type);
    return (
      <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', color: 'var(--primary)', fontWeight: 600 }}>{title}</h3>
          <button onClick={() => handleOpenListModal(type)} className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> เพิ่มข้อ
          </button>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item, idx) => (
            <li key={item.id} style={{ backgroundColor: 'var(--card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>{idx + 1}. {item.detail}</span>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                <button onClick={() => handleOpenListModal(type, item)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}><Edit2 size={14} /></button>
                <button onClick={() => deleteList(item.id)} style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
          {items.length === 0 && <li style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', fontStyle: 'italic' }}>ไม่มีข้อมูล</li>}
        </ul>
      </div>
    );
  };

  const renderSwotSection = (type: string, title: string, color: string) => {
    const items = swotItems.filter(s => s.swot_type === type);
    return (
      <div style={{ flex: 1, minWidth: '250px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${color}`, paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          <h4 style={{ fontWeight: 600, color: color }}>{title}</h4>
          <button onClick={() => handleOpenSwotModal(type)} style={{ background: 'none', border: 'none', color: color, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Plus size={16} />
          </button>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => (
            <li key={item.id} style={{ backgroundColor: 'var(--secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem' }}>{item.detail}</span>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                <button onClick={() => handleOpenSwotModal(type, item)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}><Edit2 size={14} /></button>
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
        <p style={{ color: 'var(--secondary-foreground)' }}>จัดการวิสัยทัศน์ พันธกิจ เป้าประสงค์ SWOT และ TOWS Matrix</p>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Vision Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>วิสัยทัศน์ (Vision)</h2>
              <button onClick={() => setIsVisionModalOpen(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <Edit2 size={16} /> แก้ไขวิสัยทัศน์
              </button>
            </div>
            <div style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 500, textAlign: 'center', color: 'var(--primary)' }}>{coreData?.vision || 'ยังไม่มีข้อมูลวิสัยทัศน์'}</p>
            </div>
          </div>

          {/* Mission & Goal Section */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>พันธกิจ และเป้าประสงค์สูงสุด</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              {renderListSection('mission', 'พันธกิจ (Mission)')}
              {renderListSection('goal', 'เป้าประสงค์สูงสุด (Ultimate Goal)')}
            </div>
          </div>

          {/* SWOT Section */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>ภาพรวมการประเมิน (SWOT Analysis)</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              {renderSwotSection('S', 'Strengths (จุดแข็ง)', 'var(--success)')}
              {renderSwotSection('W', 'Weaknesses (จุดอ่อน)', 'var(--destructive)')}
              {renderSwotSection('O', 'Opportunities (โอกาส)', 'var(--primary)')}
              {renderSwotSection('T', 'Threats (อุปสรรค)', 'var(--warning)')}
            </div>
          </div>

          {/* TOWS Section */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>กลยุทธ์จากสภาพแวดล้อม (TOWS Matrix)</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
              {renderSwotSection('SO', 'SO: กลยุทธ์เชิงรุก (รุก)', '#10b981')}
              {renderSwotSection('WO', 'WO: กลยุทธ์เชิงแก้ไข (แก้)', '#3b82f6')}
              {renderSwotSection('ST', 'ST: กลยุทธ์เชิงป้องกัน (กัน)', '#f59e0b')}
              {renderSwotSection('WT', 'WT: กลยุทธ์เชิงรับ (รับ)', '#ef4444')}
            </div>
          </div>
        </div>
      )}

      {/* Modal Vision */}
      <Modal isOpen={isVisionModalOpen} onClose={() => setIsVisionModalOpen(false)} title="แก้ไขวิสัยทัศน์">
        <form onSubmit={handleSaveVision} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>วิสัยทัศน์ (Vision)</label>
            <textarea className="input-field" rows={4} required value={visionForm} onChange={e => setVisionForm(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsVisionModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal List Items (Mission/Goal) */}
      <Modal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} title={listForm.id ? `แก้ไขข้อความ` : `เพิ่มรายการใหม่`}>
        <form onSubmit={handleSaveList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>รายละเอียด {listForm.item_type === 'mission' ? 'พันธกิจ' : 'เป้าประสงค์'}</label>
            <textarea className="input-field" rows={3} required value={listForm.detail} onChange={e => setListForm({...listForm, detail: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsListModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal SWOT/TOWS */}
      <Modal isOpen={isSwotModalOpen} onClose={() => setIsSwotModalOpen(false)} title={swotFormData.id ? `แก้ไขข้อมูล (${swotFormData.swot_type})` : `เพิ่มข้อมูล (${swotFormData.swot_type})`}>
        <form onSubmit={handleSaveSwot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>รายละเอียด</label>
            <textarea className="input-field" rows={3} required value={swotFormData.detail} onChange={e => setSwotFormData({...swotFormData, detail: e.target.value})} />
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
