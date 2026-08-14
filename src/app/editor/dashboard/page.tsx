"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Target, LayoutTemplate, Briefcase, Download } from 'lucide-react';

export default function EditorDashboard() {
  const [stats, setStats] = useState({
    strategies: 0,
    objectives: 0,
    keyResults: 0
  });
  const [loading, setLoading] = useState(true);

  const handleExport = async () => {
    const { data } = await supabase.from('key_results').select('*, objectives(strategy_name)');
    if (!data || data.length === 0) return alert('ไม่มีข้อมูลสำหรับส่งออก');
    
    const headers = ['รหัส KR', 'ชื่อเป้าหมาย', 'กลยุทธ์', 'สถานะ', 'เป้า 2570', 'เป้า 2574'];
    const csvContent = [
      headers.join(','),
      ...data.map((row: any) => [
        row.auto_id,
        `"${row.name?.replace(/"/g, '""') || ''}"`,
        `"${row.objectives?.strategy_name?.replace(/"/g, '""') || ''}"`,
        row.measurement_status,
        row.target_2570,
        row.target_2574
      ].join(','))
    ].join('\\n');
    
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strategic_health_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      const [strCount, objCount, krCount] = await Promise.all([
        supabase.from('strategic_issues').select('id', { count: 'exact', head: true }),
        supabase.from('objectives').select('id', { count: 'exact', head: true }),
        supabase.from('key_results').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        strategies: strCount.count || 0,
        objectives: objCount.count || 0,
        keyResults: krCount.count || 0
      });
      
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>ยินดีต้อนรับสู่ Editor Portal</h1>
        <p style={{ color: 'var(--secondary-foreground)' }}>ระบบจัดการและบันทึกข้อมูลยุทธศาสตร์สุขภาพ 5 ปี จังหวัดสระแก้ว</p>
      </div>

      <div className="bento-grid" style={{ padding: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
            <Briefcase size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontWeight: 500 }}>ยุทธศาสตร์ทั้งหมด</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '-' : stats.strategies}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
            <Target size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontWeight: 500 }}>กลยุทธ์ (Objectives)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '-' : stats.objectives}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-lg)', color: 'var(--primary)' }}>
            <Activity size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontWeight: 500 }}>เป้าหมาย (Key Results)</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{loading ? '-' : stats.keyResults}</h2>
          </div>
        </div>

      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>เริ่มต้นใช้งาน</h3>
          <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> ส่งออกข้อมูล (CSV)
          </button>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
            <div>
              <p style={{ fontWeight: 600 }}>จัดการข้อมูลโครงสร้างยุทธศาสตร์</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>ไปที่เมนู <strong>Workshop</strong> เพื่อเพิ่ม ยุทธศาสตร์, กลยุทธ์ (O) และเป้าหมาย (KR)</p>
            </div>
          </li>
          <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
            <div>
              <p style={{ fontWeight: 600 }}>สร้างพจนานุกรมตัวชี้วัด (KPI Dictionary)</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>ไปที่เมนู <strong>KPI Dictionary</strong> เพื่อระบุรายละเอียดของตัวชี้วัดตามรูปแบบ 14 ฟิลด์ ผูกกับ Key Results</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
