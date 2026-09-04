'use client';
import React, { useState } from 'react';
import { WORK_GROUPS } from '../mockData';

export default function TemplateManagerPrototype() {
  const [calcType, setCalcType] = useState('percent');
  const [dataItems, setDataItems] = useState([
    { id: 'A', label: '' },
    { id: 'B', label: '' }
  ]);
  const [formulaStr, setFormulaStr] = useState('(A / B) * 100');
  const [enableApi, setEnableApi] = useState(false);

  const addDataItem = () => {
    const nextId = String.fromCharCode(65 + dataItems.length);
    setDataItems([...dataItems, { id: nextId, label: '' }]);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCalcType(val);
    if (val === 'percent') setFormulaStr('(A / B) * 100');
    else if (val === 'per100k') setFormulaStr('(A / B) * 100000');
    else if (val === 'ratio_1_n') setFormulaStr('1 : (B / A)');
    else if (val === 'custom') setFormulaStr('(A - B) * 100 / C');
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1.5rem' }}>สร้าง/แก้ไข Template ตัวชี้วัด</h1>
      
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ชื่อตัวชี้วัด</label>
            <input type="text" className="input-field" placeholder="เช่น อัตราส่วนการตายมารดาต่อการเกิดมีชีพแสนคน" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ระดับพื้นที่ประเมิน</label>
              <select className="input-field" disabled={calcType === 'process_status'}>
                {calcType === 'process_status' ? (
                  <option value="province">ภาพรวมจังหวัด (บังคับ)</option>
                ) : (
                  <>
                    <option value="province">ภาพรวมจังหวัด (1 แถว)</option>
                    <option value="district">ระดับอำเภอ (9 แถว)</option>
                    <option value="hospital">ระดับโรงพยาบาล (9 แถว)</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>กลุ่มงานรับผิดชอบ</label>
              <select className="input-field">
                <option value="">-- เลือกกลุ่มงาน --</option>
                {WORK_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>หมวดหมู่ (เลือกได้หลายข้อ)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label><input type="checkbox" /> ตัวชี้วัดกระทรวงสาธารณสุขปี 2570</label>
                <label><input type="checkbox" /> ตัวชี้วัดตรวจราชการฯ ปี 2570</label>
                <label><input type="checkbox" /> ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)</label>
                <label><input type="checkbox" /> ยุทธศาสตร์สุขภาพ สระแก้ว (รายไตรมาส)</label>
              </div>
            </div>
          </div>

          <hr style={{ borderTop: '1px solid var(--border)', margin: '1rem 0' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>รูปแบบการคำนวณและตัวแปร</h3>
            {calcType !== 'process_status' && (
              <button type="button" onClick={addDataItem} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                + เพิ่มตัวแปร
              </button>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>รูปแบบ</label>
                <select className="input-field" value={calcType} onChange={handleTypeChange}>
                  <option value="percent">ร้อยละ</option>
                  <option value="ratio_1_n">อัตราส่วน 1 : N</option>
                  <option value="per1k">อัตราต่อพัน</option>
                  <option value="per100k">อัตราต่อแสน</option>
                  <option value="count">จำนวนสะสมทั่วไป</option>
                  <option value="custom">กำหนดสูตรเอง (Custom Formula)</option>
                  <option value="process_status">เชิงกระบวนการ (Process Status)</option>
                </select>
              </div>

              {calcType !== 'process_status' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>ตั้งค่าสูตรคำนวณ</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#0369a1', backgroundColor: '#e0f2fe' }}
                    value={formulaStr}
                    onChange={e => setFormulaStr(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            {calcType === 'process_status' ? (
              <div style={{ backgroundColor: '#fffbeb', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#854d0e' }}>
                  <strong>💡 เชิงกระบวนการ:</strong> ไม่จำเป็นต้องกำหนดชุดข้อมูลตัวแปร (A, B) ผู้รายงานจะบันทึกสถานะ (ผ่าน/ไม่ผ่าน) และข้อความบรรยายผลการดำเนินงานเท่านั้น
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {dataItems.map(item => (
                  <div key={item.id} style={{ backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                      ตัวแปร {item.id}
                    </label>
                    <input type="text" className="input-field" placeholder="อธิบายค่าที่ต้องกรอก" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr style={{ borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>เป้าหมายและการประเมิน (สะสมรายไตรมาส)</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 4fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>เงื่อนไขผ่านเกณฑ์ (Operator)</label>
              <select className="input-field">
                <option value=">=">มากกว่า หรือ เท่ากับ ({'>='})</option>
                <option value=">">มากกว่า ({'>'})</option>
                <option value="<=">น้อยกว่า หรือ เท่ากับ ({"<="})</option>
                <option value="<">น้อยกว่า ({"<"})</option>
                <option value="=">เท่ากับ (=)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(4, 1fr)', gap: '1rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: '#166534', backgroundColor: '#dcfce7', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}>ผ่าน (เขียว)</div>
                <div><input type="number" className="input-field" placeholder="เป้า Q1" /></div>
                <div><input type="number" className="input-field" placeholder="เป้า Q2" /></div>
                <div><input type="number" className="input-field" placeholder="เป้า Q3" /></div>
                <div><input type="number" className="input-field" placeholder="เป้า Q4" /></div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(4, 1fr)', gap: '1rem', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: '#854d0e', backgroundColor: '#fef08a', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}>เฝ้าระวัง (เหลือง)</div>
                <div><input type="number" className="input-field" placeholder="เกณฑ์ Q1" /></div>
                <div><input type="number" className="input-field" placeholder="เกณฑ์ Q2" /></div>
                <div><input type="number" className="input-field" placeholder="เกณฑ์ Q3" /></div>
                <div><input type="number" className="input-field" placeholder="เกณฑ์ Q4" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IT API Integration Section */}
      {calcType !== 'process_status' && (
        <div className="card" style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <span>⚙️</span> การเชื่อมต่อ HDC API (สำหรับกลุ่มงาน IT)
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>
                ตั้งค่าเพื่อให้ระบบดึงข้อมูลจาก `opendata.moph.go.th` มาเติมในช่องตัวแปรอัตโนมัติ (ไม่ต้องคีย์มือ)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" style={{ width: '1.2rem', height: '1.2rem' }} checked={enableApi} onChange={e => setEnableApi(e.target.checked)} />
                เปิดใช้งานการเชื่อมต่อ API
              </label>
            </div>
          </div>

          {enableApi && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {dataItems.map(item => (
                <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'white' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontWeight: 600, color: '#334155' }}>
                    ตั้งค่าการดึงข้อมูลสำหรับ <span style={{ color: 'var(--primary)', backgroundColor: '#e0f2fe', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>ตัวแปร {item.id}</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Table Name (สธ.)</label>
                      <input type="text" className="input-field" placeholder="เช่น s_cmi_summary_drg" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>ฟิลด์ผลลัพธ์ (JSON Field)</label>
                      <input type="text" className="input-field" placeholder="เช่น total_cases" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>เงื่อนไขเพิ่มเติม (Where / Filter)</label>
                      <input type="text" className="input-field" placeholder="เช่น { type: 'IPD' }" />
                    </div>
                  </div>
                </div>
              ))}
              
              <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '4px', fontSize: '0.85rem', color: '#475569' }}>
                <strong>📌 อธิบายการทำงาน:</strong> เมื่อผู้ใช้งานกดปุ่ม "ดึงข้อมูลจาก HDC" ในหน้ารายงานผล ระบบจะยิง <code>POST /api/report_data</code> ไปที่ MOPH โดยนำค่า Table Name ด้านบนส่งไปพร้อมพารามิเตอร์ <code>year</code> และ <code>province=27</code> แล้วนำผลลัพธ์จากฟิลด์ที่ระบุ มาจัดกลุ่มตามรหัสอำเภอ (amp_code) เพื่อกรอกลงตารางให้โดยอัตโนมัติ
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button className="btn-primary">บันทึก Template</button>
        <button className="btn-secondary">ยกเลิก</button>
      </div>

    </div>
  );
}
