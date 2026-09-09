"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, Upload, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const TABLES_TO_BACKUP = [
  'core_organization',
  'core_list_items',
  'swot_items',
  'strategic_issues',
  'strategies',
  'objectives',
  'key_results',
  'kpi_dictionaries'
];

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [file, setFile] = useState<File | null>(null);

  const handleBackup = async () => {
    setLoading(true);
    setMessage({ text: 'กำลังรวบรวมข้อมูล...', type: 'info' });

    try {
      const backupData: Record<string, any[]> = {};

      for (const table of TABLES_TO_BACKUP) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        backupData[table] = data || [];
      }

      // Add metadata
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: backupData
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `strategic_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setMessage({ text: 'ดาวน์โหลดข้อมูลสำรองเรียบร้อยแล้ว', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `เกิดข้อผิดพลาดในการสำรองข้อมูล: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!file) {
      setMessage({ text: 'กรุณาเลือกไฟล์ Backup ก่อน', type: 'error' });
      return;
    }

    const confirmRestore = window.confirm(
      'คำเตือน: การกู้คืนข้อมูลจะ *ลบข้อมูลปัจจุบันทั้งหมดในระบบ* และแทนที่ด้วยข้อมูลจากไฟล์ Backup นี้\n\nคุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?'
    );

    if (!confirmRestore) return;

    setLoading(true);
    setMessage({ text: 'กำลังอ่านไฟล์...', type: 'info' });

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || typeof backup.data !== 'object') {
        throw new Error('รูปแบบไฟล์ Backup ไม่ถูกต้อง');
      }

      setMessage({ text: 'กำลังล้างข้อมูลเก่า...', type: 'info' });

      // 1. Delete existing data (Reverse order to handle foreign keys gracefully)
      // We explicitly delete all rows since ON DELETE CASCADE will handle children of strategic_issues, but we'll do it thoroughly
      
      const { error: delErr1 } = await supabase.from('strategic_issues').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (delErr1) console.error("Error deleting strategic_issues:", delErr1);
      
      const { error: delErr2 } = await supabase.from('swot_items').delete().gte('id', 0);
      if (delErr2) console.error("Error deleting swot_items:", delErr2);
      
      const { error: delErr3 } = await supabase.from('core_list_items').delete().gte('id', 0);
      if (delErr3) console.error("Error deleting core_list_items:", delErr3);
      
      const { error: delErr4 } = await supabase.from('core_organization').delete().gte('id', 0);
      if (delErr4) console.error("Error deleting core_organization:", delErr4);

      // We might need to ensure all tables are clean just in case Cascade didn't catch them
      await supabase.from('kpi_dictionaries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('key_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('objectives').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('strategies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      setMessage({ text: 'กำลังเขียนข้อมูลใหม่...', type: 'info' });

      // 2. Insert new data (Normal order)
      for (const table of TABLES_TO_BACKUP) {
        const rows = backup.data[table];
        if (rows && rows.length > 0) {
          // Chunk inserts to avoid payload limits if too many rows
          const chunkSize = 100;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const { error } = await supabase.from(table).insert(chunk);
            if (error) {
              throw new Error(`เกิดข้อผิดพลาดในการนำเข้าข้อมูลตาราง ${table}: ${error.message}`);
            }
          }
        }
      }

      setMessage({ text: 'กู้คืนข้อมูลเสร็จสมบูรณ์! ระบบพร้อมใช้งาน', type: 'success' });
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `ล้มเหลว: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>สำรองและกู้คืนข้อมูล (Backup & Restore)</h1>
        <p style={{ color: 'var(--secondary-foreground)' }}>จัดการดาวน์โหลดไฟล์สำรองข้อมูล และอัปโหลดไฟล์เพื่อกู้คืนระบบ</p>
      </div>

      {message.text && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '2rem', 
          borderRadius: 'var(--radius-md)', 
          backgroundColor: message.type === 'error' ? '#fee2e2' : message.type === 'success' ? '#dcfce7' : '#e0f2fe',
          color: message.type === 'error' ? '#991b1b' : message.type === 'success' ? '#166534' : '#075985',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {message.type === 'error' && <AlertTriangle size={20} />}
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.type === 'info' && <Loader2 size={20} className="animate-spin" />}
          <span style={{ fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      <div className="bento-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Backup Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
            <Download size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>สำรองข้อมูล (Backup)</h2>
          </div>
          <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', flex: 1 }}>
            ดาวน์โหลดข้อมูลทั้งหมดในระบบออกมาเป็นไฟล์ .json เพื่อเก็บไว้เป็นข้อมูลสำรอง ป้องกันการสูญหาย
          </p>
          <button 
            onClick={handleBackup} 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            ดาวน์โหลด Backup
          </button>
        </div>

        {/* Restore Section */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c' }}>
            <Upload size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>กู้คืนข้อมูล (Restore)</h2>
          </div>
          <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', flex: 1 }}>
            อัปโหลดไฟล์ Backup เพื่อกู้คืนข้อมูล <strong>(ข้อมูลปัจจุบันจะถูกลบและแทนที่ด้วยข้อมูลจากไฟล์)</strong>
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              disabled={loading}
              className="input-field"
              style={{ padding: '0.5rem', fontSize: '0.875rem' }}
            />
            <button 
              onClick={handleRestore} 
              disabled={loading || !file}
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '0.5rem',
                backgroundColor: file ? '#b91c1c' : '#fca5a5',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                cursor: file && !loading ? 'pointer' : 'not-allowed',
                fontWeight: 600
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              กู้คืนข้อมูลระบบ
            </button>
          </div>
        </div>

        {/* Vital Statistics Database Management Section */}
        <div className="card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0284c7' }}>
              <CheckCircle size={24} />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>ฐานข้อมูลสถิติประชากร เกิด ตาย (Vital Statistics Database)</h2>
                <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                  ระบบบูรณาการฐานข้อมูลสถิติประชากร การเกิด และสาเหตุการตาย สสจ.สระแก้ว
                </p>
              </div>
            </div>
            <a
              href="/kpi/dashboard"
              className="btn-primary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              📊 ไปยังแดชบอร์ดสถิติชีพ
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>ตาราง dopa_populations</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>20,394 เรคคอร์ด</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>ปี 2558 - 2568 (18 ทะเบียน 9 อำเภอ)</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>ตาราง dopa_deaths</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>20,896 เรคคอร์ด</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>ปี 2564 - 2568 (ICD-10 & มะเร็ง)</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>ตาราง dopa_births</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>19,667 เรคคอร์ด</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>ปี 2564 - 2568 (น้ำหนัก & อายุมารดา)</div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.85rem 1rem', fontSize: '0.825rem', color: '#1e40af' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>💡 การจัดการข้อมูลดิบผ่านคำสั่ง Command Line / SQL:</div>
            <div>• ไฟล์ Migration: <code>vital_statistics_schema.sql</code> (สำหรับสร้างตาราง Index และ RLS ใน Supabase SQL Editor)</div>
            <div style={{ marginTop: '0.2rem' }}>• คำสั่ง Seeding นำเข้าข้อมูล: <code>node scripts/seed_vital_stats.js</code></div>
            <div style={{ marginTop: '0.2rem' }}>• คำสั่งประมวลผล Fast Cache: <code>node scripts/build_vital_cache.js</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
