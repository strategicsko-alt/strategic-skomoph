"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/Modal';

export default function WorkshopPage() {
  const [strategicIssues, setStrategicIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIssue, setActiveIssue] = useState<string | null>(null);

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);

  // Form states
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [editingObj, setEditingObj] = useState<any>(null);
  const [editingKr, setEditingKr] = useState<any>(null);

  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('strategic_issues')
      .select(`
        *,
        objectives (
          *,
          key_results (*)
        )
      `)
      .order('order_index', { ascending: true });
      
    if (data) {
      setStrategicIssues(data);
      if (data.length > 0 && !activeIssue) {
        setActiveIssue(data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Helpers for Auto-ID Generation ---
  // In a production app, this should ideally be done in a database function to prevent race conditions.
  // We'll calculate it on the client for simplicity.
  const generateObjId = () => {
    let maxId = 0;
    strategicIssues.forEach(issue => {
      issue.objectives?.forEach((obj: any) => {
        const num = parseInt(obj.auto_id.replace('O', ''));
        if (num > maxId) maxId = num;
      });
    });
    return `O${maxId + 1}`;
  };

  const generateKrId = (objId: string) => {
    // Find the objective
    let obj: any = null;
    strategicIssues.forEach(issue => {
      const found = issue.objectives?.find((o: any) => o.auto_id === objId);
      if (found) obj = found;
    });

    if (!obj) return 'KRX.1';

    let maxSubId = 0;
    obj.key_results?.forEach((kr: any) => {
      const parts = kr.auto_id.split('.');
      if (parts.length > 1) {
        const subId = parseInt(parts[1]);
        if (subId > maxSubId) maxSubId = subId;
      }
    });
    
    // Auto-ID format: KR[objNum].[subNum] e.g. KR16.1
    const objNum = objId.replace('O', '');
    return `KR${objNum}.${maxSubId + 1}`;
  };

  // --- CRUD for Strategic Issues ---
  const handleOpenIssueModal = (issue: any = null) => {
    setEditingIssue(issue);
    setFormData(issue || { name: '', description: '', theme_color: '#0284c7' });
    setIsIssueModalOpen(true);
  };

  const saveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (editingIssue?.id) {
      // Update
      await supabase.from('strategic_issues').update({ 
        name: formData.name, 
        description: formData.description,
        theme_color: formData.theme_color
      }).eq('id', editingIssue.id);
    } else {
      // Insert
      const { data } = await supabase.from('strategic_issues').insert([{ 
        name: formData.name, 
        description: formData.description,
        theme_color: formData.theme_color,
        order_index: strategicIssues.length
      }]).select();
      if (data && data[0]) setActiveIssue(data[0].id);
    }
    
    await fetchData();
    setIsIssueModalOpen(false);
    setIsSaving(false);
  };

  const deleteIssue = async (id: string) => {
    if (!confirm('ยืนยันการลบยุทธศาสตร์นี้? ข้อมูลกลยุทธ์และตัวชี้วัดทั้งหมดภายใต้ยุทธศาสตร์นี้จะถูกลบไปด้วย')) return;
    await supabase.from('strategic_issues').delete().eq('id', id);
    if (activeIssue === id) setActiveIssue(null);
    fetchData();
  };

  // --- CRUD for Objectives ---
  const handleOpenObjModal = (obj: any = null) => {
    setEditingObj(obj);
    setFormData(obj || { strategy_name: '', outcome_indicator: '' });
    setIsObjModalOpen(true);
  };

  const saveObj = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (editingObj?.id) {
      await supabase.from('objectives').update({ 
        strategy_name: formData.strategy_name, 
        outcome_indicator: formData.outcome_indicator 
      }).eq('id', editingObj.id);
    } else {
      const auto_id = generateObjId();
      await supabase.from('objectives').insert([{ 
        strategic_issue_id: activeIssue,
        auto_id,
        strategy_name: formData.strategy_name, 
        outcome_indicator: formData.outcome_indicator 
      }]);
    }
    
    await fetchData();
    setIsObjModalOpen(false);
    setIsSaving(false);
  };

  const deleteObj = async (id: string) => {
    if (!confirm('ยืนยันการลบกลยุทธ์นี้? Key Results ภายใต้กลยุทธ์นี้จะถูกลบไปด้วย')) return;
    await supabase.from('objectives').delete().eq('id', id);
    fetchData();
  };

  // --- CRUD for Key Results ---
  const handleOpenKrModal = (objAutoId: string, objId: string, kr: any = null) => {
    setEditingKr({ ...kr, _objAutoId: objAutoId, _objId: objId });
    setFormData(kr || { 
      name: '', measurement_status: 'ต้องสร้างระบบวัดใหม่', 
      target_2570: '', target_2571: '', target_2572: '', target_2573: '', target_2574: '',
      initiative_activity: '', project_name: '', responsible_group: ''
    });
    setIsKrModalOpen(true);
  };

  const saveKr = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      name: formData.name,
      measurement_status: formData.measurement_status,
      target_2570: formData.target_2570,
      target_2571: formData.target_2571,
      target_2572: formData.target_2572,
      target_2573: formData.target_2573,
      target_2574: formData.target_2574,
      initiative_activity: formData.initiative_activity,
      project_name: formData.project_name,
      responsible_group: formData.responsible_group,
    };

    if (editingKr?.id) {
      await supabase.from('key_results').update(payload).eq('id', editingKr.id);
    } else {
      const auto_id = generateKrId(editingKr._objAutoId);
      await supabase.from('key_results').insert([{ 
        ...payload,
        objective_id: editingKr._objId,
        auto_id
      }]);
    }
    
    await fetchData();
    setIsKrModalOpen(false);
    setIsSaving(false);
  };

  const deleteKr = async (id: string) => {
    if (!confirm('ยืนยันการลบ Key Result นี้?')) return;
    await supabase.from('key_results').delete().eq('id', id);
    fetchData();
  };

  const currentIssueData = strategicIssues.find(issue => issue.id === activeIssue);

  return (
    <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 4rem)' }}>
      {/* Sidebar for Strategic Issues */}
      <div style={{ width: '300px', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 600 }}>ยุทธศาสตร์</h3>
          <button onClick={() => handleOpenIssueModal()} className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
            <Plus size={16} /> เพิ่ม
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {loading ? (
            <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>กำลังโหลด...</p>
          ) : strategicIssues.length === 0 ? (
            <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--secondary-foreground)', fontSize: '0.875rem' }}>ยังไม่มีข้อมูลยุทธศาสตร์</p>
          ) : (
            strategicIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setActiveIssue(issue.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  backgroundColor: activeIssue === issue.id ? 'var(--secondary)' : 'transparent',
                  border: 'none',
                  borderLeft: activeIssue === issue.id ? `4px solid ${issue.theme_color || 'var(--primary)'}` : '4px solid transparent',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  cursor: 'pointer',
                  fontWeight: activeIssue === issue.id ? 600 : 400,
                  color: activeIssue === issue.id ? 'var(--primary)' : 'var(--foreground)',
                  marginBottom: '0.25rem'
                }}
              >
                {issue.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowY: 'auto', padding: '2rem' }}>
        {!currentIssueData ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-foreground)' }}>
            <p>กรุณาเลือกหรือเพิ่มยุทธศาสตร์เพื่อดูข้อมูล</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: currentIssueData.theme_color || 'var(--primary)', marginBottom: '0.5rem' }}>
                  {currentIssueData.name}
                </h2>
                <p style={{ color: 'var(--secondary-foreground)' }}>{currentIssueData.description || 'ไม่มีคำอธิบาย'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleOpenIssueModal(currentIssueData)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                  <Edit2 size={16} /> แก้ไข
                </button>
                <button onClick={() => deleteIssue(currentIssueData.id)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', color: 'var(--destructive)' }}>
                  <Trash2 size={16} /> ลบ
                </button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />

            {/* Objectives Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>กลยุทธ์ (Strategies & Objectives)</h3>
              <button onClick={() => handleOpenObjModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> เพิ่มกลยุทธ์
              </button>
            </div>

            {currentIssueData.objectives?.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>ยุทธศาสตร์นี้ยังไม่มีกลยุทธ์ใดๆ</p>
                <button onClick={() => handleOpenObjModal()} className="btn-primary">เพิ่มกลยุทธ์แรก</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {currentIssueData.objectives?.map((obj: any) => (
                  <div key={obj.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    {/* Objective Header */}
                    <div style={{ backgroundColor: 'var(--secondary)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontWeight: 600, fontSize: '0.875rem' }}>
                          {obj.auto_id}
                        </span>
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: '1.125rem' }}>{obj.strategy_name}</h4>
                          {obj.outcome_indicator && <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>ตัวชี้วัด: {obj.outcome_indicator}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenObjModal(obj)} className="btn-secondary" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                        <button onClick={() => deleteObj(obj.id)} className="btn-secondary" style={{ padding: '0.5rem', color: 'var(--destructive)' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    
                    {/* Key Results Section */}
                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ fontWeight: 600 }}>Key Results (เป้าหมาย)</h5>
                        <button onClick={() => handleOpenKrModal(obj.auto_id, obj.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
                          <Plus size={16} /> เพิ่ม KR
                        </button>
                      </div>

                      {obj.key_results?.length === 0 ? (
                        <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontStyle: 'italic' }}>ยังไม่มี Key Result</p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '800px' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.5rem 0', width: '80px' }}>รหัส</th>
                                <th style={{ padding: '0.5rem 0' }}>ชื่อเป้าหมาย</th>
                                <th style={{ padding: '0.5rem 0', width: '100px' }}>สถานะ</th>
                                <th style={{ padding: '0.5rem 0', width: '60px' }}>2570</th>
                                <th style={{ padding: '0.5rem 0', width: '60px' }}>2574</th>
                                <th style={{ padding: '0.5rem 0', width: '100px', textAlign: 'right' }}>จัดการ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {obj.key_results?.map((kr: any) => (
                                <tr key={kr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '0.75rem 0', fontWeight: 500, color: 'var(--primary)' }}>{kr.auto_id}</td>
                                  <td style={{ padding: '0.75rem 0' }}>{kr.name}</td>
                                  <td style={{ padding: '0.75rem 0' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: kr.measurement_status === 'พร้อมวัด' ? 'var(--success)' : 'var(--warning)', color: 'white', borderRadius: '99px', fontSize: '0.75rem' }}>
                                      {kr.measurement_status || '-'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem 0' }}>{kr.target_2570 || '-'}</td>
                                  <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{kr.target_2574 || '-'}</td>
                                  <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                                    <button onClick={() => handleOpenKrModal(obj.auto_id, obj.id, kr)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: '0.5rem' }}><Edit2 size={16} /></button>
                                    <button onClick={() => deleteKr(kr.id)} style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      
      {/* Strategic Issue Modal */}
      <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title={editingIssue?.id ? 'แก้ไขยุทธศาสตร์' : 'เพิ่มยุทธศาสตร์ใหม่'}>
        <form onSubmit={saveIssue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อยุทธศาสตร์ <span style={{color: 'red'}}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น การพัฒนาระบบบริการสุขภาพ..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>คำอธิบายเพิ่มเติม</label>
            <textarea className="input-field" rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="รายละเอียดของยุทธศาสตร์..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>สีธีม (Theme Color)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="color" value={formData.theme_color || '#0284c7'} onChange={e => setFormData({...formData, theme_color: e.target.value})} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer' }} />
              <input type="text" className="input-field" value={formData.theme_color || '#0284c7'} onChange={e => setFormData({...formData, theme_color: e.target.value})} style={{ width: '120px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsIssueModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      {/* Objective Modal */}
      <Modal isOpen={isObjModalOpen} onClose={() => setIsObjModalOpen(false)} title={editingObj?.id ? `แก้ไขกลยุทธ์ (${editingObj.auto_id})` : 'เพิ่มกลยุทธ์ใหม่ (Auto ID: O*)'}>
        <form onSubmit={saveObj} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อกลยุทธ์ (Strategy) <span style={{color: 'red'}}>*</span></label>
            <input type="text" className="input-field" required value={formData.strategy_name || ''} onChange={e => setFormData({...formData, strategy_name: e.target.value})} placeholder="เช่น พัฒนาระบบปฐมภูมิ..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ตัวชี้วัดยุทธศาสตร์ (Outcome Indicator)</label>
            <textarea className="input-field" rows={2} value={formData.outcome_indicator || ''} onChange={e => setFormData({...formData, outcome_indicator: e.target.value})} placeholder="ตัวชี้วัดที่ต้องการบรรลุระดับกลยุทธ์..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsObjModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      {/* Key Result Modal */}
      <Modal isOpen={isKrModalOpen} onClose={() => setIsKrModalOpen(false)} title={editingKr?.id ? `แก้ไข Key Result (${editingKr.auto_id})` : `เพิ่ม Key Result ใหม่ (Auto ID: KR${editingKr?._objAutoId?.replace('O', '')}.*)`}>
        <form onSubmit={saveKr} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อเป้าหมาย (Key Result) <span style={{color: 'red'}}>*</span></label>
              <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น อัตราผู้ป่วยเบาหวานที่ควบคุมได้..." />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>สถานะความพร้อมวัด</label>
              <select className="input-field" value={formData.measurement_status || 'ต้องสร้างระบบวัดใหม่'} onChange={e => setFormData({...formData, measurement_status: e.target.value})}>
                <option value="พร้อมวัด">พร้อมวัด</option>
                <option value="ต้องสร้างระบบวัดใหม่">ต้องสร้างระบบวัดใหม่</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>กลุ่มงานที่รับผิดชอบ</label>
              <input type="text" className="input-field" value={formData.responsible_group || ''} onChange={e => setFormData({...formData, responsible_group: e.target.value})} placeholder="เช่น กลุ่มงานควบคุมโรค..." />
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>ค่าเป้าหมายรายปี (2570-2574)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[2570, 2571, 2572, 2573, 2574].map(year => (
                <div key={year}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>ปี {year}</label>
                  <input type="text" className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={formData[`target_${year}`] || ''} onChange={e => setFormData({...formData, [`target_${year}`]: e.target.value})} placeholder="-" />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>กิจกรรมริเริ่ม (Initiative Activity)</label>
              <textarea className="input-field" rows={2} value={formData.initiative_activity || ''} onChange={e => setFormData({...formData, initiative_activity: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>โครงการ (Project)</label>
              <textarea className="input-field" rows={2} value={formData.project_name || ''} onChange={e => setFormData({...formData, project_name: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsKrModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
