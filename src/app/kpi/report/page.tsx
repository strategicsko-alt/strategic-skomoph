'use client';
import React, { useState } from 'react';
import { DISTRICTS, MOCK_KPIS } from '../mockData';

export default function ReportPrototype() {
  const [selectedKpi, setSelectedKpi] = useState(MOCK_KPIS[0].id);
  const currentKpi = MOCK_KPIS.find(k => k.id === selectedKpi);

  // สร้าง state เก็บค่าตัวแปรจำลองสำหรับพื้นที่แรก (เมืองสระแก้ว)
  const [mockValues, setMockValues] = useState<Record<string, string>>({});

  const handleValueChange = (itemId: string, value: string) => {
    setMockValues(prev => ({ ...prev, [itemId]: value }));
  };

  // จำลองฟังก์ชันคำนวณสูตร
  const computeResult = (formula: string, vals: Record<string, string>) => {
    if (!formula) return "0.00";
    try {
       let eq = formula.toUpperCase();
       
       // Handle 1:N ratio display gracefully in mockup
       let isRatio = false;
       if (eq.includes('1 :')) {
          isRatio = true;
          eq = eq.replace('1 :', '').trim(); 
       }
       
       currentKpi?.data_items.forEach(item => {
         // แทนที่ A, B, C ด้วยค่าที่ผู้ใช้กรอก หรือ 0 ถ้าว่างเปล่า
         const val = vals[item.id] ? vals[item.id] : '0';
         eq = eq.replace(new RegExp(item.id, 'g'), val);
       });
       
       // ใช้ Function แทน eval เพื่อความปลอดภัยระดับนึงใน JS
       const result = new Function('return ' + eq)();
       
       if (!isFinite(result) || isNaN(result)) return "0.00";
       
       if (isRatio) return `1 : ${result.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
       return result.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } catch (e) {
       return "0.00";
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1.5rem' }}>บันทึกผลการดำเนินงาน (สำหรับกลุ่มงาน สสจ.)</h1>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>1. เลือกตัวชี้วัดที่ต้องการบันทึกผล</h3>
        
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ตัวชี้วัด</label>
          <select className="input-field" style={{ maxWidth: '800px' }} value={selectedKpi} onChange={e => { setSelectedKpi(e.target.value); setMockValues({}); }}>
            {MOCK_KPIS.map(k => <option key={k.id} value={k.id}>[{k.responsible_group}] {k.name}</option>)}
          </select>
        </div>
      </div>

      {currentKpi && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
              2. ตารางบันทึกผลงานสะสม {currentKpi.calculation_type === 'process_status' ? '(เชิงกระบวนการ)' : ''}
            </h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', backgroundColor: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                ระดับประเมิน: <strong>{currentKpi.measurement_level}</strong>
              </span>
              <span style={{ fontSize: '0.85rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.75rem', borderRadius: '1rem' }}>
                สูตร: <strong>{currentKpi.calculation_formula || currentKpi.formula}</strong>
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--secondary-foreground)', marginBottom: '1.5rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <strong>💡 คำแนะนำการบันทึกข้อมูล:</strong><br />
            {currentKpi.calculation_type === 'process_status' 
              ? "- เป็นการวัดเชิงกระบวนการ ให้เลือกสถานะความคืบหน้า และกรอกคำอธิบายผลการดำเนินงาน (สามารถระบุเป็นตัวเลข, ข้อความ หรือแนบลิงก์ได้)" 
              : "- นำยอดสะสมตั้งแต่เริ่มปีงบประมาณมาบันทึกในช่องตัวแปรต่างๆ\n- ผลลัพธ์สุทธิจะถูกคำนวณอัตโนมัติตามสูตรที่ตั้งไว้ใน Template"}
          </p>
          
          {currentKpi.calculation_type === 'process_status' ? (
            // Process Status UI
            <div style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>สถานะการดำเนินงาน (ภาพรวมจังหวัด)</label>
                  <select className="input-field" style={{ marginBottom: '1rem' }}>
                    <option value="success">ผ่าน (ดำเนินการแล้วเสร็จ)</option>
                    <option value="warning">ไม่ผ่าน (ล่าช้ากว่าแผน)</option>
                    <option value="pending" selected>ยังไม่ดำเนินการ / อยู่ระหว่างดำเนินการ</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>รายละเอียดผลการดำเนินงาน</label>
                  <textarea 
                    className="input-field" 
                    rows={4} 
                    placeholder="ระบุข้อความอธิบายความคืบหน้า หรือผลลัพธ์ที่ได้..."
                    defaultValue="อยู่ระหว่างรวบรวมข้อมูลจาก คปสอ."
                  ></textarea>
                </div>
              </div>
            </div>
          ) : (
            // Numeric Bulk Entry UI
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '25%' }}>พื้นที่ประเมิน</th>
                    {currentKpi.data_items.map(item => (
                      <th key={item.id} style={{ padding: '0.75rem 1rem', width: `${60 / currentKpi.data_items.length}%` }}>
                        ตัวแปร {item.id} <br/>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--secondary-foreground)' }}>{item.label}</span>
                      </th>
                    ))}
                    <th style={{ padding: '0.75rem 1rem', width: '15%' }}>ผลลัพธ์สุทธิ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentKpi.measurement_level === 'province' ? (
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>ภาพรวมจังหวัดสระแก้ว</td>
                      {currentKpi.data_items.map(item => (
                        <td key={item.id} style={{ padding: '0.75rem 1rem' }}>
                          <input 
                            type="number" 
                            className="input-field" 
                            placeholder={`ยอดสะสม ${item.id}`} 
                            value={mockValues[item.id] || ''}
                            onChange={(e) => handleValueChange(item.id, e.target.value)}
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                        {computeResult(currentKpi.calculation_formula, mockValues)}
                      </td>
                    </tr>
                  ) : (
                    DISTRICTS.map((d, idx) => (
                      <tr key={d} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {d}
                          <span style={{ 
                            fontSize: '0.65rem', 
                            backgroundColor: currentKpi.measurement_level === 'hospital' ? '#e0f2fe' : '#f3f4f6', 
                            color: currentKpi.measurement_level === 'hospital' ? '#0369a1' : '#4b5563',
                            padding: '0.1rem 0.3rem', 
                            borderRadius: '4px' 
                          }}>
                            {currentKpi.measurement_level === 'hospital' ? 'รพ.' : 'อ.'}
                          </span>
                        </td>
                        {currentKpi.data_items.map(item => (
                          <td key={item.id} style={{ padding: '0.75rem 1rem' }}>
                            <input 
                              type="number" 
                              className="input-field" 
                              placeholder={`ยอดสะสม ${item.id}`} 
                              value={idx === 0 ? (mockValues[item.id] || '') : ''} 
                              onChange={(e) => idx === 0 ? handleValueChange(item.id, e.target.value) : null}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                           {idx === 0 ? computeResult(currentKpi.calculation_formula, mockValues) : "0.00"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <p style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', marginTop: '0.5rem' }}>* หมายเหตุ: ใน Prototype นี้ แถวที่ 1 (เมืองสระแก้ว) สามารถคำนวณผลลัพธ์อัตโนมัติให้ดูเป็นตัวอย่างได้ทันที</p>
            </div>
          )}

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button className="btn-primary">บันทึกข้อมูลทั้งหมด</button>
            <button className="btn-secondary">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
