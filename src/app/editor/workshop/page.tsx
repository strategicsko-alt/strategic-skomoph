"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronRight, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal } from '@/components/Modal';

export default function WorkshopPage() {
  const [strategicIssues, setStrategicIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIssue, setActiveIssue] = useState<string | null>(null);

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);

  // Form states
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [editingIndicator, setEditingIndicator] = useState<any>(null);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);
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
        strategic_outcome_indicators (*),
        strategies (
          *,
          objectives (
            *,
            key_results (*)
          )
        )
      `)
      .order('order_index', { ascending: true });

    if (error) console.error('fetchData error:', error.message);
      
    if (data) {
      // Sort nested relations in JavaScript (Supabase doesn't support deeply nested foreignTable ordering)
      const sorted = data.map((issue: any) => ({
        ...issue,
        strategic_outcome_indicators: (issue.strategic_outcome_indicators || []).sort((a: any, b: any) => a.order_index - b.order_index),
        strategies: (issue.strategies || []).sort((a: any, b: any) => a.order_index - b.order_index).map((st: any) => ({
          ...st,
          objectives: (st.objectives || []).sort((a: any, b: any) => a.order_index - b.order_index).map((obj: any) => ({
            ...obj,
            key_results: (obj.key_results || []).sort((a: any, b: any) => a.order_index - b.order_index),
          })),
        })),
      }));
      setStrategicIssues(sorted);
      if (sorted.length > 0 && !activeIssue) {
        setActiveIssue(sorted[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Helpers for Auto-ID Generation ---
  const generateIssueId = () => {
    let maxId = 0;
    strategicIssues.forEach(issue => {
      if (issue.auto_id) {
        const num = parseInt(issue.auto_id.replace('S', ''));
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    });
    return `S${maxId + 1}`;
  };

  const generateStrategyId = (issueAutoId: string) => {
    let maxId = 0;
    const issue = strategicIssues.find(i => i.auto_id === issueAutoId);
    if (issue && issue.strategies) {
      issue.strategies.forEach((st: any) => {
        if (st.auto_id) {
          const parts = st.auto_id.split('.');
          if (parts.length > 1) {
            const num = parseInt(parts[1]);
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        }
      });
    }
    const parentNum = issueAutoId ? issueAutoId.replace('S', '') : 'X';
    return `ST${parentNum}.${maxId + 1}`;
  };

  const generateObjId = (stAutoId: string) => {
    let maxId = 0;
    strategicIssues.forEach(issue => {
      const st = issue.strategies?.find((s: any) => s.auto_id === stAutoId);
      if (st && st.objectives) {
        st.objectives.forEach((obj: any) => {
          if (obj.auto_id) {
            const parts = obj.auto_id.split('.');
            if (parts.length > 2) {
              const num = parseInt(parts[2]);
              if (!isNaN(num) && num > maxId) maxId = num;
            }
          }
        });
      }
    });
    
    const parentStr = stAutoId ? stAutoId.replace('ST', 'O') : 'OX.X';
    return `${parentStr}.${maxId + 1}`;
  };

  const generateKrId = (objAutoId: string) => {
    let maxId = 0;
    strategicIssues.forEach(issue => {
      issue.strategies?.forEach((st: any) => {
        const obj = st.objectives?.find((o: any) => o.auto_id === objAutoId);
        if (obj && obj.key_results) {
          obj.key_results.forEach((kr: any) => {
            if (kr.auto_id) {
              const parts = kr.auto_id.split('.');
              if (parts.length > 3) {
                const num = parseInt(parts[3]);
                if (!isNaN(num) && num > maxId) maxId = num;
              }
            }
          });
        }
      });
    });
    
    const parentStr = objAutoId ? objAutoId.replace('O', 'KR') : 'KRX.X.X';
    return `${parentStr}.${maxId + 1}`;
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
      const { error } = await supabase.from('strategic_issues').update({ 
        name: formData.name, 
        description: formData.description,
        theme_color: formData.theme_color
      }).eq('id', editingIssue.id);
      if (error) alert('Error updating: ' + error.message);
    } else {
      const auto_id = generateIssueId();
      const { data, error } = await supabase.from('strategic_issues').insert([{ 
        auto_id,
        name: formData.name, 
        description: formData.description,
        theme_color: formData.theme_color,
        order_index: strategicIssues.length
      }]).select();
      if (error) alert('Error inserting: ' + error.message);
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

  // --- CRUD for Outcome Indicators ---
  const handleOpenIndicatorModal = (indicator: any = null) => {
    setEditingIndicator(indicator);
    setFormData(indicator || { name: '' });
    setIsIndicatorModalOpen(true);
  };

  const saveIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (editingIndicator?.id) {
      const { error } = await supabase.from('strategic_outcome_indicators').update({ 
        name: formData.name
      }).eq('id', editingIndicator.id);
      if (error) alert('Error updating: ' + error.message);
    } else {
      const { error } = await supabase.from('strategic_outcome_indicators').insert([{ 
        strategic_issue_id: activeIssue,
        name: formData.name
      }]);
      if (error) alert('Error inserting: ' + error.message);
    }
    
    await fetchData();
    setIsIndicatorModalOpen(false);
    setIsSaving(false);
  };

  const deleteIndicator = async (id: string) => {
    if (!confirm('ยืนยันการลบตัวชี้วัดนี้?')) return;
    await supabase.from('strategic_outcome_indicators').delete().eq('id', id);
    fetchData();
  };

  // --- CRUD for Strategies ---
  const handleOpenStrategyModal = (strategy: any = null) => {
    setEditingStrategy(strategy);
    setFormData(strategy || { name: '' });
    setIsStrategyModalOpen(true);
  };

  const saveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (editingStrategy?.id) {
      await supabase.from('strategies').update({ 
        name: formData.name
      }).eq('id', editingStrategy.id);
    } else {
      const currentIssue = strategicIssues.find(i => i.id === activeIssue);
      const auto_id = generateStrategyId(currentIssue?.auto_id);
      await supabase.from('strategies').insert([{ 
        strategic_issue_id: activeIssue,
        auto_id,
        name: formData.name,
        order_index: currentIssue?.strategies?.length || 0
      }]);
    }
    
    await fetchData();
    setIsStrategyModalOpen(false);
    setIsSaving(false);
  };

  const deleteStrategy = async (id: string) => {
    if (!confirm('ยืนยันการลบกลยุทธ์นี้? ข้อมูล Objective ภายใต้กลยุทธ์นี้จะถูกลบไปด้วย')) return;
    await supabase.from('strategies').delete().eq('id', id);
    fetchData();
  };

  // --- CRUD for Objectives ---
  const handleOpenObjModal = (stAutoId: string, stId: string, obj: any = null) => {
    setEditingObj({ ...obj, _stAutoId: stAutoId, _stId: stId });
    setFormData(obj || { name: '' });
    setIsObjModalOpen(true);
  };

  const saveObj = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (editingObj?.id) {
      await supabase.from('objectives').update({ 
        name: formData.name
      }).eq('id', editingObj.id);
    } else {
      const auto_id = generateObjId(editingObj._stAutoId);
      let order_index = 0;
      strategicIssues.forEach(issue => {
        const st = issue.strategies?.find((s: any) => s.id === editingObj._stId);
        if (st && st.objectives) order_index = st.objectives.length;
      });
      await supabase.from('objectives').insert([{ 
        strategy_id: editingObj._stId,
        auto_id,
        name: formData.name,
        order_index
      }]);
    }
    
    await fetchData();
    setIsObjModalOpen(false);
    setIsSaving(false);
  };

  const deleteObj = async (id: string) => {
    if (!confirm('ยืนยันการลบเป้าประสงค์นี้? Key Results ทั้งหมดจะถูกลบไปด้วย')) return;
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
      let order_index = 0;
      strategicIssues.forEach(issue => {
        issue.strategies?.forEach((st: any) => {
          const obj = st.objectives?.find((o: any) => o.id === editingKr._objId);
          if (obj && obj.key_results) order_index = obj.key_results.length;
        });
      });
      await supabase.from('key_results').insert([{ 
        ...payload,
        objective_id: editingKr._objId,
        auto_id,
        order_index
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

  // --- Ordering Logic ---
  const swapOrder = async (table: string, id1: string, order1: number, id2: string, order2: number) => {
    setIsSaving(true);
    let newOrder1 = order2;
    let newOrder2 = order1;
    if (order1 === order2) {
      newOrder1 = order1 - 1;
      newOrder2 = order2 + 1;
    }
    await Promise.all([
      supabase.from(table).update({ order_index: newOrder1 }).eq('id', id1),
      supabase.from(table).update({ order_index: newOrder2 }).eq('id', id2)
    ]);
    await fetchData();
    setIsSaving(false);
  };

  const moveItem = async (table: string, currentItem: any, direction: 'up' | 'down', list: any[]) => {
    const currentIndex = list.findIndex(i => i.id === currentItem.id);
    if (direction === 'up' && currentIndex > 0) {
      const prevItem = list[currentIndex - 1];
      await swapOrder(table, currentItem.id, currentItem.order_index, prevItem.id, prevItem.order_index);
    } else if (direction === 'down' && currentIndex < list.length - 1) {
      const nextItem = list[currentIndex + 1];
      await swapOrder(table, currentItem.id, currentItem.order_index, nextItem.id, nextItem.order_index);
    }
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
            strategicIssues.map((issue, idx) => (
              <div key={issue.id} style={{ display: 'flex', marginBottom: '0.25rem' }}>
                <button
                  onClick={() => setActiveIssue(issue.id)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    backgroundColor: activeIssue === issue.id ? 'var(--secondary)' : 'transparent',
                    border: 'none',
                    borderLeft: activeIssue === issue.id ? `4px solid ${issue.theme_color || 'var(--primary)'}` : '4px solid transparent',
                    cursor: 'pointer',
                    fontWeight: activeIssue === issue.id ? 600 : 400,
                    color: activeIssue === issue.id ? 'var(--primary)' : 'var(--foreground)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary-foreground)', marginRight: '0.5rem' }}>[{issue.auto_id}]</span>
                  {issue.name}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: activeIssue === issue.id ? 'var(--secondary)' : 'transparent', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                  <button disabled={idx === 0 || isSaving} onClick={() => moveItem('strategic_issues', issue, 'up', strategicIssues)} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, padding: '0.25rem' }}><ArrowUp size={14} /></button>
                  <button disabled={idx === strategicIssues.length - 1 || isSaving} onClick={() => moveItem('strategic_issues', issue, 'down', strategicIssues)} style={{ background: 'none', border: 'none', cursor: idx === strategicIssues.length - 1 ? 'default' : 'pointer', opacity: idx === strategicIssues.length - 1 ? 0.3 : 1, padding: '0.25rem' }}><ArrowDown size={14} /></button>
                </div>
              </div>
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

            {/* Strategic Outcome Indicators Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>ตัวชี้วัดยุทธศาสตร์ (Outcome Indicators)</h3>
              <button onClick={() => handleOpenIndicatorModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> เพิ่มตัวชี้วัด
              </button>
            </div>

            {currentIssueData.strategic_outcome_indicators?.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <p style={{ color: 'var(--secondary-foreground)' }}>ยังไม่มีตัวชี้วัดยุทธศาสตร์</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                {currentIssueData.strategic_outcome_indicators?.map((ind: any, idx: number) => (
                  <li key={ind.id} style={{ backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, color: currentIssueData.theme_color || 'var(--primary)' }}>{idx + 1}.</span>
                      <span style={{ fontWeight: 500 }}>{ind.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button disabled={idx === 0 || isSaving} onClick={() => moveItem('strategic_outcome_indicators', ind, 'up', currentIssueData.strategic_outcome_indicators)} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                      <button disabled={idx === currentIssueData.strategic_outcome_indicators.length - 1 || isSaving} onClick={() => moveItem('strategic_outcome_indicators', ind, 'down', currentIssueData.strategic_outcome_indicators)} style={{ background: 'none', border: 'none', cursor: idx === currentIssueData.strategic_outcome_indicators.length - 1 ? 'default' : 'pointer', opacity: idx === currentIssueData.strategic_outcome_indicators.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
                      <div style={{ width: '1px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>
                      <button onClick={() => handleOpenIndicatorModal(ind)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                      <button onClick={() => deleteIndicator(ind.id)} style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />

            {/* Strategies Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>กลยุทธ์ (Strategies)</h3>
              <button onClick={() => handleOpenStrategyModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> เพิ่มกลยุทธ์
              </button>
            </div>

            {currentIssueData.strategies?.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>ยุทธศาสตร์นี้ยังไม่มีกลยุทธ์ใดๆ</p>
                <button onClick={() => handleOpenStrategyModal()} className="btn-primary">เพิ่มกลยุทธ์แรก</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {currentIssueData.strategies?.map((st: any, stIdx: number) => (
                  <div key={st.id} style={{ border: `2px solid ${currentIssueData.theme_color || 'var(--primary)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    {/* Strategy Header */}
                    <div style={{ backgroundColor: currentIssueData.theme_color ? `${currentIssueData.theme_color}15` : 'var(--secondary)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${currentIssueData.theme_color || 'var(--primary)'}30` }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ backgroundColor: currentIssueData.theme_color || 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontWeight: 600, fontSize: '0.875rem' }}>
                            {st.auto_id}
                          </span>
                          <span style={{ color: currentIssueData.theme_color || 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase' }}>Strategy</span>
                        </div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.25rem' }}>{st.name}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button disabled={stIdx === 0 || isSaving} onClick={() => moveItem('strategies', st, 'up', currentIssueData.strategies)} style={{ background: 'none', border: 'none', cursor: stIdx === 0 ? 'default' : 'pointer', opacity: stIdx === 0 ? 0.3 : 1, padding: '0.5rem' }}><ArrowUp size={16} /></button>
                        <button disabled={stIdx === currentIssueData.strategies.length - 1 || isSaving} onClick={() => moveItem('strategies', st, 'down', currentIssueData.strategies)} style={{ background: 'none', border: 'none', cursor: stIdx === currentIssueData.strategies.length - 1 ? 'default' : 'pointer', opacity: stIdx === currentIssueData.strategies.length - 1 ? 0.3 : 1, padding: '0.5rem' }}><ArrowDown size={16} /></button>
                        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border)', margin: '0 0.5rem' }}></div>
                        <button onClick={() => handleOpenStrategyModal(st)} className="btn-secondary" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                        <button onClick={() => deleteStrategy(st.id)} className="btn-secondary" style={{ padding: '0.5rem', color: 'var(--destructive)' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    
                    {/* Objectives Section within Strategy */}
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h5 style={{ fontWeight: 600, fontSize: '1.125rem' }}>เป้าประสงค์ (Objectives)</h5>
                        <button onClick={() => handleOpenObjModal(st.auto_id, st.id)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <Plus size={16} /> เพิ่มเป้าประสงค์
                        </button>
                      </div>

                      {st.objectives?.length === 0 ? (
                        <p style={{ color: 'var(--secondary-foreground)', fontStyle: 'italic', textAlign: 'center', padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>ยังไม่มีเป้าประสงค์ภายใต้กลยุทธ์นี้</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {st.objectives?.map((obj: any, objIdx: number) => (
                            <div key={obj.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                              
                              {/* Objective Header */}
                              <div style={{ backgroundColor: 'var(--secondary)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{obj.auto_id}</span>
                                  <h6 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{obj.name}</h6>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <button disabled={objIdx === 0 || isSaving} onClick={() => moveItem('objectives', obj, 'up', st.objectives)} style={{ background: 'none', border: 'none', cursor: objIdx === 0 ? 'default' : 'pointer', opacity: objIdx === 0 ? 0.3 : 1, padding: '0.25rem' }}><ArrowUp size={16} /></button>
                                  <button disabled={objIdx === st.objectives.length - 1 || isSaving} onClick={() => moveItem('objectives', obj, 'down', st.objectives)} style={{ background: 'none', border: 'none', cursor: objIdx === st.objectives.length - 1 ? 'default' : 'pointer', opacity: objIdx === st.objectives.length - 1 ? 0.3 : 1, padding: '0.25rem' }}><ArrowDown size={16} /></button>
                                  <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>
                                  <button onClick={() => handleOpenObjModal(st.auto_id, st.id, obj)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}><Edit2 size={16} /></button>
                                  <button onClick={() => deleteObj(obj.id)} style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={16} /></button>
                                </div>
                              </div>

                              {/* Key Results Section */}
                              <div style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>เป้าหมาย (Key Results)</span>
                                  <button onClick={() => handleOpenKrModal(obj.auto_id, obj.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                    <Plus size={14} /> เพิ่ม KR
                                  </button>
                                </div>

                                {obj.key_results?.length === 0 ? (
                                  <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.75rem', fontStyle: 'italic' }}>ยังไม่มี Key Result</p>
                                ) : (
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--secondary-foreground)' }}>
                                          <th style={{ padding: '0.5rem 0', width: '90px' }}>รหัส</th>
                                          <th style={{ padding: '0.5rem 0' }}>ชื่อเป้าหมาย</th>
                                          <th style={{ padding: '0.5rem 0', width: '100px' }}>สถานะ</th>
                                          <th style={{ padding: '0.5rem 0', width: '60px' }}>2570</th>
                                          <th style={{ padding: '0.5rem 0', width: '60px' }}>2574</th>
                                          <th style={{ padding: '0.5rem 0', width: '100px', textAlign: 'right' }}>จัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {obj.key_results?.map((kr: any, krIdx: number) => (
                                          <tr key={kr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.5rem 0', fontWeight: 500, color: 'var(--primary)' }}>{kr.auto_id}</td>
                                            <td style={{ padding: '0.5rem 0' }}>{kr.name}</td>
                                            <td style={{ padding: '0.5rem 0' }}>
                                              <span style={{ padding: '0.15rem 0.5rem', backgroundColor: kr.measurement_status === 'พร้อมวัด' ? 'var(--success)' : 'var(--warning)', color: 'white', borderRadius: '99px', fontSize: '0.7rem' }}>
                                                {kr.measurement_status || '-'}
                                              </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 0' }}>{kr.target_2570 || '-'}</td>
                                            <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{kr.target_2574 || '-'}</td>
                                            <td style={{ padding: '0.5rem 0', textAlign: 'right', display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                              <button disabled={krIdx === 0 || isSaving} onClick={() => moveItem('key_results', kr, 'up', obj.key_results)} style={{ background: 'none', border: 'none', cursor: krIdx === 0 ? 'default' : 'pointer', opacity: krIdx === 0 ? 0.3 : 1 }}><ArrowUp size={14} /></button>
                                              <button disabled={krIdx === obj.key_results.length - 1 || isSaving} onClick={() => moveItem('key_results', kr, 'down', obj.key_results)} style={{ background: 'none', border: 'none', cursor: krIdx === obj.key_results.length - 1 ? 'default' : 'pointer', opacity: krIdx === obj.key_results.length - 1 ? 0.3 : 1 }}><ArrowDown size={14} /></button>
                                              <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>
                                              <button onClick={() => handleOpenKrModal(obj.auto_id, obj.id, kr)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                              <button onClick={() => deleteKr(kr.id)} style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer' }}><Trash2 size={14} /></button>
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

      {/* Strategy Modal */}
      <Modal isOpen={isStrategyModalOpen} onClose={() => setIsStrategyModalOpen(false)} title={editingStrategy?.id ? `แก้ไขกลยุทธ์ (${editingStrategy.auto_id})` : 'เพิ่มกลยุทธ์ใหม่ (Auto ID: ST*)'}>
        <form onSubmit={saveStrategy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อกลยุทธ์ (Strategy) <span style={{color: 'red'}}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น พัฒนาระบบปฐมภูมิ..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsStrategyModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      {/* Objective Modal */}
      <Modal isOpen={isObjModalOpen} onClose={() => setIsObjModalOpen(false)} title={editingObj?.id ? `แก้ไขเป้าประสงค์ (${editingObj.auto_id})` : `เพิ่มเป้าประสงค์ใหม่ (Auto ID: O${editingObj?._stAutoId?.replace('ST', '')}.*)`}>
        <form onSubmit={saveObj} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อเป้าประสงค์ (Objective) <span style={{color: 'red'}}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น ลดอัตราป่วย..." />
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

      {/* Indicator Modal */}
      <Modal isOpen={isIndicatorModalOpen} onClose={() => setIsIndicatorModalOpen(false)} title={editingIndicator?.id ? 'แก้ไขตัวชี้วัดยุทธศาสตร์' : 'เพิ่มตัวชี้วัดยุทธศาสตร์ใหม่'}>
        <form onSubmit={saveIndicator} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ตัวชี้วัดยุทธศาสตร์ (Outcome Indicator) <span style={{color: 'red'}}>*</span></label>
            <textarea className="input-field" required rows={3} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น อัตราผู้สูงอายุที่มีคุณภาพชีวิตที่ดี..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsIndicatorModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
