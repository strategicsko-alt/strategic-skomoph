'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ExportButtonProps {
  data?: any[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const exportToExcel = async () => {
    try {
      let exportData = data;
      
      // If data is not provided, fetch it directly
      if (!exportData) {
        const { data: rawStrategies } = await supabase
          .from('strategic_issues')
          .select(`
            id, auto_id, name, order_index, theme_color,
            key_results (
              id, auto_id, name, order_index, target_2570, target_2571, target_2572, target_2573, target_2574, measurement_status
            ),
            strategies (
              id, auto_id, name, order_index,
              objectives (
                id, auto_id, name, order_index, initiative_activity, ia_ssjj, ia_rph, ia_ssor, ia_rphst, ia_phakee,
                key_results (
                  id, auto_id, name, order_index, target_2570, target_2571, target_2572, target_2573, target_2574, measurement_status, responsible_group
                )
              )
            )
          `)
          .order('order_index', { ascending: true });

        exportData = (rawStrategies || []).map((issue: any) => ({
          ...issue,
          // Extract outcome indicators (key_results attached to issue)
          key_results: (issue.key_results || []).sort((a: any, b: any) => a.order_index - b.order_index),
          strategies: (issue.strategies || []).sort((a: any, b: any) => a.order_index - b.order_index).map((st: any) => ({
            ...st,
            objectives: (st.objectives || []).sort((a: any, b: any) => a.order_index - b.order_index).map((obj: any) => ({
              ...obj,
              key_results: (obj.key_results || []).sort((a: any, b: any) => a.order_index - b.order_index),
            }))
          }))
        }));
      }

      const XLSX = await import('xlsx');
      const rows: any[] = [];

      exportData.forEach((issue) => {
        // 1. Outcome Indicators (attached directly to Strategic Issue)
        if (issue.key_results && issue.key_results.length > 0) {
          issue.key_results.forEach((kr: any) => {
            rows.push({
              'รหัสประเด็นยุทธศาสตร์': issue.auto_id,
              'ชื่อประเด็นยุทธศาสตร์': issue.name,
              'ตัวชี้วัดยุทธศาสตร์': kr.name,
              'ชื่อกลยุทธ์': '',
              'รหัสเป้าประสงค์': '',
              'ชื่อเป้าประสงค์': '',
              'กิจกรรมริเริ่ม': '',
              'How to - สสจ.': '',
              'How to - รพ.': '',
              'How to - สสอ.': '',
              'How to - รพ.สต.': '',
              'How to - ภาคีเครือข่าย': '',
              'รหัสตัวชี้วัด': kr.auto_id,
              'ชื่อตัวชี้วัดเป้าประสงค์': kr.name,
              'กลุ่มงานที่รับผิดชอบ': kr.responsible_group || '',
              'เป้าปี 2570': kr.target_2570 || '',
              'เป้าปี 2571': kr.target_2571 || '',
              'เป้าปี 2572': kr.target_2572 || '',
              'เป้าปี 2573': kr.target_2573 || '',
              'เป้าปี 2574': kr.target_2574 || '',
            });
          });
        }

        // 2. Strategies -> Objectives -> KRs
        if (issue.strategies && issue.strategies.length > 0) {
          issue.strategies.forEach((st: any) => {
            if (st.objectives && st.objectives.length > 0) {
              st.objectives.forEach((obj: any) => {
                // Parse initiatives
                let iniString = '';
                if (obj.initiative_activity) {
                  try {
                    const parsed = JSON.parse(obj.initiative_activity);
                    if (Array.isArray(parsed)) {
                      iniString = parsed.map((item: string, idx: number) => `${idx + 1}. ${item}`).join('\r\n');
                    } else {
                      iniString = obj.initiative_activity;
                    }
                  } catch (e) {
                    iniString = obj.initiative_activity;
                  }
                }

                if (obj.key_results && obj.key_results.length > 0) {
                  obj.key_results.forEach((kr: any) => {
                    rows.push({
                      'รหัสประเด็นยุทธศาสตร์': issue.auto_id,
                      'ชื่อประเด็นยุทธศาสตร์': issue.name,
                      'ตัวชี้วัดยุทธศาสตร์': '',
                      'ชื่อกลยุทธ์': st.name,
                      'รหัสเป้าประสงค์': obj.auto_id,
                      'ชื่อเป้าประสงค์': obj.name,
                      'กิจกรรมริเริ่ม': iniString,
                      'How to - สสจ.': obj.ia_ssjj || '',
                      'How to - รพ.': obj.ia_rph || '',
                      'How to - สสอ.': obj.ia_ssor || '',
                      'How to - รพ.สต.': obj.ia_rphst || '',
                      'How to - ภาคีเครือข่าย': obj.ia_phakee || '',
                      'รหัสตัวชี้วัด': kr.auto_id,
                      'ชื่อตัวชี้วัดเป้าประสงค์': kr.name,
                      'กลุ่มงานที่รับผิดชอบ': kr.responsible_group || '',
                      'เป้าปี 2570': kr.target_2570 || '',
                      'เป้าปี 2571': kr.target_2571 || '',
                      'เป้าปี 2572': kr.target_2572 || '',
                      'เป้าปี 2573': kr.target_2573 || '',
                      'เป้าปี 2574': kr.target_2574 || '',
                    });
                  });
                } else {
                  // If no KR, still add the row so Objective is not lost
                  rows.push({
                    'รหัสประเด็นยุทธศาสตร์': issue.auto_id,
                    'ชื่อประเด็นยุทธศาสตร์': issue.name,
                    'ตัวชี้วัดยุทธศาสตร์': '',
                    'ชื่อกลยุทธ์': st.name,
                    'รหัสเป้าประสงค์': obj.auto_id,
                    'ชื่อเป้าประสงค์': obj.name,
                    'กิจกรรมริเริ่ม': iniString,
                    'How to - สสจ.': obj.ia_ssjj || '',
                    'How to - รพ.': obj.ia_rph || '',
                    'How to - สสอ.': obj.ia_ssor || '',
                    'How to - รพ.สต.': obj.ia_rphst || '',
                    'How to - ภาคีเครือข่าย': obj.ia_phakee || '',
                    'รหัสตัวชี้วัด': '',
                    'ชื่อตัวชี้วัดเป้าประสงค์': '',
                    'กลุ่มงานที่รับผิดชอบ': '',
                    'เป้าปี 2570': '',
                    'เป้าปี 2571': '',
                    'เป้าปี 2572': '',
                    'เป้าปี 2573': '',
                    'เป้าปี 2574': '',
                  });
                }
              });
            }
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      
      // Auto-size columns slightly
      const wscols = [
        {wch: 15}, // รหัสประเด็นยุทธศาสตร์
        {wch: 30}, // ชื่อประเด็นยุทธศาสตร์
        {wch: 30}, // ตัวชี้วัดยุทธศาสตร์
        {wch: 25}, // ชื่อกลยุทธ์
        {wch: 15}, // รหัสเป้าประสงค์
        {wch: 35}, // ชื่อเป้าประสงค์
        {wch: 40}, // กิจกรรมริเริ่ม
        {wch: 30}, // How to - สสจ.
        {wch: 30}, // How to - รพ.
        {wch: 30}, // How to - สสอ.
        {wch: 30}, // How to - รพ.สต.
        {wch: 30}, // How to - ภาคีเครือข่าย
        {wch: 15}, // รหัสตัวชี้วัด
        {wch: 35}, // ชื่อตัวชี้วัดเป้าประสงค์
        {wch: 20}, // กลุ่มงานที่รับผิดชอบ
        {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Strategic Plan");
      XLSX.writeFile(workbook, "Strategic_Plan_Export.xlsx");
    } catch (error) {
      console.error("Failed to export Excel", error);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel");
    }
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="hide-on-print">
      <button 
        onClick={exportToExcel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: '#107c41', // Excel Green
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: 'var(--shadow-sm)',
          transition: 'transform 0.1s, box-shadow 0.1s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'none'}
      >
        <Download size={16} />
        ดาวน์โหลด Excel
      </button>
      
      <button 
        onClick={printDocument}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'white',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: 'var(--shadow-sm)',
          transition: 'background-color 0.1s'
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
      >
        <Printer size={16} />
        พิมพ์เอกสาร (PDF)
      </button>
    </div>
  );
}
