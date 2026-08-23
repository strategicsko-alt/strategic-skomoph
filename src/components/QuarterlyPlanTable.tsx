'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { Modal } from '@/components/Modal';

interface QuarterlyPlanTableProps {
  keyResult: any;
  themeColor: string;
  measurements: any[];
  onUpdate: () => void;
}

export function QuarterlyPlanTable({ keyResult, themeColor, measurements, onUpdate }: QuarterlyPlanTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const getMeasurementsByQuarter = (q: number) => {
    return measurements.filter(m => m.quarter === q).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  const handleOpenModal = (quarter: number, existing?: any) => {
    if (existing) {
      setFormData(existing);
    } else {
      // Create new
      const qMeasurements = getMeasurementsByQuarter(quarter);
      const nextIndex = qMeasurements.length;
      const autoId = `${keyResult.auto_id}-Q${quarter}.${nextIndex + 1}`;
      
      setFormData({
        key_result_id: keyResult.id,
        quarter: quarter,
        auto_id: autoId,
        kpi_name: '',
        target_value: '',
        order_index: nextIndex
      });
    }
    setIsModalOpen(true);
  };

  const saveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        key_result_id: formData.key_result_id,
        quarter: formData.quarter,
        auto_id: formData.auto_id,
        kpi_name: formData.kpi_name,
        target_value: formData.target_value,
        order_index: formData.order_index
      };

      if (formData.id) {
        const { error } = await supabase.from('action_plan_measurements').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('action_plan_measurements').insert([payload]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      onUpdate();
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('คุณต้องการลบตัวชี้วัดรายไตรมาสนี้ใช่หรือไม่?')) {
      const { error } = await supabase.from('action_plan_measurements').delete().eq('id', id);
      if (error) {
        alert('Error deleting: ' + error.message);
      } else {
        onUpdate();
      }
    }
  };

  const renderQuarterCol = (q: number) => {
    const items = getMeasurementsByQuarter(q);
    
    return (
      <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ backgroundColor: `${themeColor}20`, padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', color: themeColor, borderBottom: '1px solid var(--border)' }}>
          ไตรมาส {q}
        </div>
        <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--background)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: themeColor }}>[{item.auto_id}]</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => handleOpenModal(q, item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)' }}><Trash2 size={12} /></button>
                </div>
              </div>
              <div style={{ marginBottom: '0.25rem' }}><strong>KPI:</strong> {item.kpi_name}</div>
              <div><strong>เป้าหมาย:</strong> <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{item.target_value}</span></div>
            </div>
          ))}
          
          <button 
            onClick={() => handleOpenModal(q)}
            style={{ 
              width: '100%', padding: '0.4rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', 
              background: 'transparent', color: 'var(--secondary-foreground)', cursor: 'pointer', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem'
            }}
          >
            <Plus size={14} /> เพิ่มตัวชี้วัด Q{q}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {renderQuarterCol(1)}
        {renderQuarterCol(2)}
        {renderQuarterCol(3)}
        {renderQuarterCol(4)}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`จัดการตัวชี้วัด ไตรมาส ${formData.quarter}`}>
        <form onSubmit={saveMeasurement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>รหัส</label>
            <input type="text" className="input-field" value={formData.auto_id || ''} readOnly style={{ backgroundColor: 'var(--secondary)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>วิธีการวัดผล (KPI Name) <span style={{ color: 'red' }}>*</span></label>
            <textarea className="input-field" required value={formData.kpi_name || ''} onChange={e => setFormData({ ...formData, kpi_name: e.target.value })} rows={2} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>เป้าหมาย (Target) <span style={{ color: 'red' }}>*</span></label>
            <input type="text" className="input-field" required value={formData.target_value || ''} onChange={e => setFormData({ ...formData, target_value: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : <><Check size={18} /> บันทึก</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
