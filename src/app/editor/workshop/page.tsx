"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Folder, RefreshCw, Check } from 'lucide-react';
import { Modal } from '@/components/Modal';

export const RESPONSIBLE_GROUPS = [
  "กลุ่มงานบริหารทั่วไป",
  "กลุ่มงานบริหารทรัพยากรบุคคล",
  "กลุ่มกฎหมาย",
  "กลุ่มงานพัฒนายุทธศาสตร์สาธารณสุข",
  "กลุ่มงานสุขภาพดิจิทัล",
  "กลุ่มงานคุ้มครองผู้บริโภค",
  "กลุ่มงานพัฒนาคุณภาพและรูปแบบบริการ",
  "กลุ่มงานควบคุมโรคติดต่อ",
  "กลุ่มงานประกันสุขภาพ",
  "กลุ่มงานส่งเสริมสุขภาพ",
  "กลุ่มงานทันตสาธารณสุข",
  "กลุ่มงานอนามัยสิ่งแวดล้อมและอาชีวอนามัย",
  "กลุ่มงานควบคุมโรคไม่ติดต่อ",
  "กลุ่มงานปฐมภูมิและเครือข่ายสุขภาพ",
  "กลุ่มงานการแพทย์แผนไทยและการแพทย์ทางเลือก",
  "กลุ่มงานพัฒนาทรัพยากรบุคคล"
];

export default function WorkshopPage() {
  const [strategicIssues, setStrategicIssues] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIssue, setActiveIssue] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Form states
  const [editingIssue, setEditingIssue] = useState<any>(null);
  const [editingIndicator, setEditingIndicator] = useState<any>(null);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);
  const [editingObj, setEditingObj] = useState<any>(null);
  const [editingKr, setEditingKr] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [initiativeList, setInitiativeList] = useState<string[]>(['']);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingKr, setMovingKr] = useState<any>(null);
  const [moveDestinationType, setMoveDestinationType] = useState<'strategic_issue' | 'objective'>('objective');
  const [moveDestinationId, setMoveDestinationId] = useState<string>('');
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // --- Cascade Auto-Renumbering for All Hierarchy Levels ---
  const renumberAllHierarchy = async (issuesList: any[]) => {
    const updates: any[] = [];

    issuesList.forEach((issue, issueIdx) => {
      const issueNum = issueIdx + 1;
      const expectedIssueId = `S${issueNum}`;

      (issue.outcome_indicators || []).forEach((ind: any, indIdx: number) => {
        const indNum = indIdx + 1;
        const expectedIndId = `IND${issueNum}.${indNum}`;

        if (ind.auto_id !== expectedIndId || ind.order_index !== indIdx) {
          updates.push(
            supabase.from('key_results').update({
              auto_id: expectedIndId,
              order_index: indIdx
            }).eq('id', ind.id)
          );
          ind.auto_id = expectedIndId;
          ind.order_index = indIdx;
        }
      });

      if (issue.auto_id !== expectedIssueId || issue.order_index !== issueIdx) {
        updates.push(
          supabase.from('strategic_issues').update({
            auto_id: expectedIssueId,
            order_index: issueIdx
          }).eq('id', issue.id)
        );
        issue.auto_id = expectedIssueId;
        issue.order_index = issueIdx;
      }

      (issue.strategies || []).forEach((st: any, stIdx: number) => {
        const stNum = stIdx + 1;
        const expectedStId = `ST${issueNum}.${stNum}`;

        if (st.auto_id !== expectedStId || st.order_index !== stIdx) {
          updates.push(
            supabase.from('strategies').update({
              auto_id: expectedStId,
              order_index: stIdx
            }).eq('id', st.id)
          );
          st.auto_id = expectedStId;
          st.order_index = stIdx;
        }

        (st.objectives || []).forEach((obj: any, objIdx: number) => {
          const objNum = objIdx + 1;
          const expectedObjId = `O${issueNum}.${stNum}.${objNum}`;

          if (obj.auto_id !== expectedObjId || obj.order_index !== objIdx) {
            updates.push(
              supabase.from('objectives').update({
                auto_id: expectedObjId,
                order_index: objIdx
              }).eq('id', obj.id)
            );
            obj.auto_id = expectedObjId;
            obj.order_index = objIdx;
          }

          (obj.key_results || []).forEach((kr: any, krIdx: number) => {
            const krNum = krIdx + 1;
            const expectedKrId = `KR${issueNum}.${stNum}.${objNum}.${krNum}`;

            if (kr.auto_id !== expectedKrId || kr.order_index !== krIdx) {
              updates.push(
                supabase.from('key_results').update({
                  auto_id: expectedKrId,
                  order_index: krIdx
                }).eq('id', kr.id)
              );
              kr.auto_id = expectedKrId;
              kr.order_index = krIdx;
            }
          });
        });
      });
    });

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);

    const { data: issueData, error: issueError } = await supabase
      .from('strategic_issues')
      .select(`
        *,
        outcome_indicators:key_results!strategic_issue_id (*),
        strategies (
          *,
          objectives (
            *,
            key_results (*)
          )
        )
      `)
      .order('order_index', { ascending: true });

    if (issueError) console.error('fetchData error:', issueError.message);

    if (issueData) {
      const sorted = issueData.map((issue: any) => ({
        ...issue,
        outcome_indicators: (issue.outcome_indicators || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
        strategies: (issue.strategies || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((st: any) => ({
          ...st,
          objectives: (st.objectives || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((obj: any) => ({
            ...obj,
            key_results: (obj.key_results || []).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)),
          })),
        })),
      })).sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));

      // Auto synchronize all IDs across all hierarchy levels in database
      await renumberAllHierarchy(sorted);

      setStrategicIssues(sorted);
      if (sorted.length > 0 && !activeIssue) {
        setActiveIssue(sorted[0].id);
      }
    }

    const { data: projData, error: projError } = await supabase
      .from('projects')
      .select(`*, project_strategies(strategy_id)`)
      .order('order_index', { ascending: true });

    if (projError) console.error('fetchProjects error:', projError.message);
    if (projData) setProjects(projData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await fetchData();
    setIsSyncing(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  // Move Item Logic
  const saveMoveKr = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let payload: any = {};
    if (moveDestinationType === 'strategic_issue') {
      payload = { objective_id: null, strategic_issue_id: activeIssue };
    } else {
      payload = { strategic_issue_id: null, objective_id: moveDestinationId };
    }
    const { error } = await supabase.from('key_results').update(payload).eq('id', movingKr.id);
    if (error) alert('Error: ' + error.message);
    await fetchData();
    setIsMoveModalOpen(false);
    setIsSaving(false);
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
      const auto_id = `S${strategicIssues.length + 1}`;
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
    if (!confirm('ยืนยันการลบยุทธศาสตร์นี้? ข้อมูลทั้งหมดภายใต้จะถูกลบไปด้วย')) return;
    await supabase.from('strategic_issues').delete().eq('id', id);
    if (activeIssue === id) setActiveIssue(null);
    await fetchData();
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
      await supabase.from('strategies').update({ name: formData.name }).eq('id', editingStrategy.id);
    } else {
      const issueIdx = strategicIssues.findIndex(i => i.id === activeIssue);
      const currentIssue = strategicIssues[issueIdx];
      const issueNum = issueIdx >= 0 ? issueIdx + 1 : 1;
      const nextStNum = (currentIssue?.strategies?.length || 0) + 1;
      const auto_id = `ST${issueNum}.${nextStNum}`;

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
    if (!confirm('ยืนยันการลบกลยุทธ์นี้? ข้อมูลทั้งหมดภายใต้จะถูกลบไปด้วย')) return;
    await supabase.from('strategies').delete().eq('id', id);
    await fetchData();
  };

  // --- CRUD for Objectives ---
  const handleOpenObjModal = (stAutoId: string, stId: string, obj: any = null) => {
    setEditingObj({ ...obj, _stAutoId: stAutoId, _stId: stId });
    setFormData(obj || { name: '', initiative_activity: '', ia_ssjj: '', ia_rph: '', ia_ssor: '', ia_rphst: '', ia_phakee: '' });
    
    // Parse initiative_activity into array
    let ia_parsed = [''];
    const ia_raw = obj?.initiative_activity;
    if (ia_raw) {
      try {
        const parsed = JSON.parse(ia_raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          ia_parsed = parsed;
        } else {
          ia_parsed = [ia_raw];
        }
      } catch (e) {
        ia_parsed = [ia_raw];
      }
    }
    setInitiativeList(ia_parsed);
    
    setIsObjModalOpen(true);
  };

  const saveObj = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const cleanList = initiativeList.filter(i => i.trim() !== '');
    
    const iaPayload = {
      name: formData.name,
      initiative_activity: cleanList.length > 0 ? JSON.stringify(cleanList) : null,
      ia_ssjj: formData.ia_ssjj,
      ia_rph: formData.ia_rph,
      ia_ssor: formData.ia_ssor,
      ia_rphst: formData.ia_rphst,
      ia_phakee: formData.ia_phakee,
    };
    if (editingObj?.id) {
      const { error } = await supabase.from('objectives').update(iaPayload).eq('id', editingObj.id);
      if (error) alert('Error: ' + error.message);
    } else {
      let order_index = 0;
      let issueNum = 1;
      let stNum = 1;

      strategicIssues.forEach((issue, iIdx) => {
        const st = issue.strategies?.find((s: any, sIdx: number) => {
          if (s.id === editingObj._stId) {
            stNum = sIdx + 1;
            return true;
          }
          return false;
        });
        if (st) {
          issueNum = iIdx + 1;
          if (st.objectives) order_index = st.objectives.length;
        }
      });

      const auto_id = `O${issueNum}.${stNum}.${order_index + 1}`;

      const { error } = await supabase.from('objectives').insert([{
        strategy_id: editingObj._stId,
        auto_id,
        ...iaPayload,
        order_index
      }]);
      if (error) alert('Error: ' + error.message);
    }
    await fetchData();
    setIsObjModalOpen(false);
    setIsSaving(false);
  };

  const deleteObj = async (id: string) => {
    if (!confirm('ยืนยันการลบเป้าประสงค์นี้? Key Results ทั้งหมดจะถูกลบไปด้วย')) return;
    await supabase.from('objectives').delete().eq('id', id);
    await fetchData();
  };

  // --- CRUD for Key Results ---
  const handleOpenKrModal = (parentType: 'strategic_issue' | 'objective', parentAutoId: string, parentId: string, kr: any = null) => {
    setEditingKr({ ...kr, _parentType: parentType, _parentAutoId: parentAutoId, _parentId: parentId });
    setFormData(kr || {
      name: '', measurement_status: 'สร้างใหม่',
      target_2570: '', target_2571: '', target_2572: '', target_2573: '', target_2574: '',
      responsible_group: ''
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
      responsible_group: formData.responsible_group,
    };
    if (editingKr?.id) {
      const { error } = await supabase.from('key_results').update(payload).eq('id', editingKr.id);
      if (error) alert('Error: ' + error.message);
    } else {
      let auto_id = '';
      let insertData: any = { ...payload, order_index: 0 };
      
      if (editingKr._parentType === 'strategic_issue') {
        let issueNum = 1;
        let order_index = 0;
        strategicIssues.forEach((issue, iIdx) => {
          if (issue.id === editingKr._parentId) {
            issueNum = iIdx + 1;
            if (issue.outcome_indicators) order_index = issue.outcome_indicators.length;
          }
        });
        auto_id = `IND${issueNum}.${order_index + 1}`;
        insertData.strategic_issue_id = editingKr._parentId;
        insertData.auto_id = auto_id;
        insertData.order_index = order_index;
      } else {
        let order_index = 0;
        let issueNum = 1;
        let stNum = 1;
        let objNum = 1;
        strategicIssues.forEach((issue, iIdx) => {
          issue.strategies?.forEach((st: any, sIdx: number) => {
            const obj = st.objectives?.find((o: any, oIdx: number) => {
              if (o.id === editingKr._parentId) {
                objNum = oIdx + 1;
                return true;
              }
              return false;
            });
            if (obj) {
              issueNum = iIdx + 1;
              stNum = sIdx + 1;
              if (obj.key_results) order_index = obj.key_results.length;
            }
          });
        });
        auto_id = `KR${issueNum}.${stNum}.${objNum}.${order_index + 1}`;
        insertData.objective_id = editingKr._parentId;
        insertData.auto_id = auto_id;
        insertData.order_index = order_index;
      }

      const { error } = await supabase.from('key_results').insert([insertData]);
      if (error) alert('Error: ' + error.message);
    }
    await fetchData();
    setIsKrModalOpen(false);
    setIsSaving(false);
  };

  const deleteKr = async (id: string) => {
    if (!confirm('ยืนยันการลบ Key Result นี้?')) return;
    await supabase.from('key_results').delete().eq('id', id);
    await fetchData();
  };

  // --- CRUD for Projects ---
  const handleOpenProjectModal = (project: any = null) => {
    setEditingProject(project);
    setFormData(project || { name: '', description: '', responsible_group: '' });
    if (project?.id) {
      const linked = (project.project_strategies || []).map((ps: any) => ps.strategy_id);
      setSelectedStrategyIds(linked);
    } else {
      setSelectedStrategyIds([]);
    }
    setIsProjectModalOpen(true);
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let projectId = editingProject?.id;

    if (projectId) {
      await supabase.from('projects').update({
        name: formData.name,
        description: formData.description,
        responsible_group: formData.responsible_group,
      }).eq('id', projectId);
      await supabase.from('project_strategies').delete().eq('project_id', projectId);
    } else {
      const issueProjects = projects.filter((p: any) => p.strategic_issue_id === activeIssue);
      const { data, error } = await supabase.from('projects').insert([{
        strategic_issue_id: activeIssue,
        name: formData.name,
        description: formData.description,
        responsible_group: formData.responsible_group,
        order_index: issueProjects.length
      }]).select();
      if (error) { alert('Error: ' + error.message); setIsSaving(false); return; }
      projectId = data?.[0]?.id;
    }

    if (projectId && selectedStrategyIds.length > 0) {
      const links = selectedStrategyIds.map(sid => ({ project_id: projectId, strategy_id: sid }));
      const { error } = await supabase.from('project_strategies').insert(links);
      if (error) alert('Error linking strategies: ' + error.message);
    }

    await fetchData();
    setIsProjectModalOpen(false);
    setIsSaving(false);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('ยืนยันการลบโครงการนี้?')) return;
    await supabase.from('projects').delete().eq('id', id);
    await fetchData();
  };

  const toggleStrategySelection = (strategyId: string) => {
    setSelectedStrategyIds(prev =>
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
  };

  // --- Ordering Logic ---
  const swapOrder = async (table: string, id1: string, order1: number, id2: string, order2: number) => {
    setIsSaving(true);
    await Promise.all([
      supabase.from(table).update({ order_index: order2 }).eq('id', id1),
      supabase.from(table).update({ order_index: order1 }).eq('id', id2)
    ]);
    await fetchData();
    setIsSaving(false);
  };

  const moveItem = async (table: string, currentItem: any, direction: 'up' | 'down', list: any[]) => {
    const currentIndex = list.findIndex(i => i.id === currentItem.id);
    if (direction === 'up' && currentIndex > 0) {
      const prevItem = list[currentIndex - 1];
      await swapOrder(table, currentItem.id, currentIndex, prevItem.id, currentIndex - 1);
    } else if (direction === 'down' && currentIndex < list.length - 1) {
      const nextItem = list[currentIndex + 1];
      await swapOrder(table, currentItem.id, currentIndex, nextItem.id, currentIndex + 1);
    }
  };

  const currentIssueData = strategicIssues.find(issue => issue.id === activeIssue);
  const currentIssueProjects = projects.filter((p: any) => p.strategic_issue_id === activeIssue);
  const themeColor = currentIssueData?.theme_color || 'var(--primary)';

  const iconBtn = {
    background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem'
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 4rem)' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>ยุทธศาสตร์</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>เรียงตามลำดับ S1 - S4</span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              onClick={handleManualSync} 
              className="btn-secondary" 
              title="จัดเรียงรหัสลำดับอัตโนมัติทั้งหมด"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              disabled={isSyncing}
            >
              {syncSuccess ? <Check size={14} style={{ color: 'var(--success)' }} /> : <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />}
              {isSyncing ? '...' : syncSuccess ? 'ตรงแล้ว' : 'ซิงค์รหัส'}
            </button>
            <button onClick={() => handleOpenIssueModal()} className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
              <Plus size={16} /> เพิ่ม
            </button>
          </div>
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
                    flex: 1, textAlign: 'left', padding: '0.75rem 1rem',
                    backgroundColor: activeIssue === issue.id ? 'var(--secondary)' : 'transparent',
                    border: 'none', borderLeft: activeIssue === issue.id ? `4px solid ${issue.theme_color || 'var(--primary)'}` : '4px solid transparent',
                    cursor: 'pointer', fontWeight: activeIssue === issue.id ? 600 : 400,
                    color: activeIssue === issue.id ? 'var(--primary)' : 'var(--foreground)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary-foreground)', marginRight: '0.5rem' }}>[{issue.auto_id}]</span>
                  {issue.name}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: activeIssue === issue.id ? 'var(--secondary)' : 'transparent' }}>
                  <button disabled={idx === 0 || isSaving} onClick={() => moveItem('strategic_issues', issue, 'up', strategicIssues)} style={{ ...iconBtn, opacity: idx === 0 ? 0.3 : 1 }}><ArrowUp size={14} /></button>
                  <button disabled={idx === strategicIssues.length - 1 || isSaving} onClick={() => moveItem('strategic_issues', issue, 'down', strategicIssues)} style={{ ...iconBtn, opacity: idx === strategicIssues.length - 1 ? 0.3 : 1 }}><ArrowDown size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowY: 'auto', padding: '2rem' }}>
        {!currentIssueData ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary-foreground)' }}>
            <p>กรุณาเลือกหรือเพิ่มยุทธศาสตร์เพื่อดูข้อมูล</p>
          </div>
        ) : (
          <div>
            {/* Issue Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ backgroundColor: themeColor, color: 'white', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {currentIssueData.auto_id}
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: themeColor, margin: 0 }}>
                    {currentIssueData.name}
                  </h2>
                </div>
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

            {/* Outcome Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>ตัวชี้วัดยุทธศาสตร์ (Outcome Indicators)</h3>
              <button onClick={() => handleOpenKrModal('strategic_issue', currentIssueData.auto_id, currentIssueData.id)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> เพิ่มตัวชี้วัด
              </button>
            </div>
            {currentIssueData.outcome_indicators?.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <p style={{ color: 'var(--secondary-foreground)' }}>ยังไม่มีตัวชี้วัดยุทธศาสตร์</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: 'var(--secondary)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>รหัส</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left' }}>ตัวชี้วัดยุทธศาสตร์</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>สถานะ</th>
                      <th style={{ padding: '0.75rem 0.25rem', width: '52px', textAlign: 'center' }}>2570</th>
                      <th style={{ padding: '0.75rem 0.25rem', width: '52px', textAlign: 'center' }}>2571</th>
                      <th style={{ padding: '0.75rem 0.25rem', width: '52px', textAlign: 'center' }}>2572</th>
                      <th style={{ padding: '0.75rem 0.25rem', width: '52px', textAlign: 'center' }}>2573</th>
                      <th style={{ padding: '0.75rem 0.25rem', width: '52px', textAlign: 'center', fontWeight: 700 }}>2574</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentIssueData.outcome_indicators?.map((kr: any, krIdx: number) => (
                      <tr key={kr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: themeColor, fontSize: '0.8rem' }}>{kr.auto_id}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{kr.name}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ padding: '0.2rem 0.5rem', backgroundColor: kr.measurement_status === 'พร้อมวัด' ? 'var(--success)' : 'var(--warning)', color: 'white', borderRadius: '99px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {kr.measurement_status || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center' }}>{kr.target_2570 || '-'}</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center' }}>{kr.target_2571 || '-'}</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center' }}>{kr.target_2572 || '-'}</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center' }}>{kr.target_2573 || '-'}</td>
                        <td style={{ padding: '0.75rem 0.25rem', textAlign: 'center', fontWeight: 700 }}>{kr.target_2574 || '-'}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button disabled={krIdx === 0 || isSaving} onClick={() => moveItem('outcome_indicators', kr, 'up', currentIssueData.outcome_indicators)} style={{ ...iconBtn, opacity: krIdx === 0 ? 0.3 : 1 }}><ArrowUp size={14} /></button>
                            <button disabled={krIdx === currentIssueData.outcome_indicators.length - 1 || isSaving} onClick={() => moveItem('outcome_indicators', kr, 'down', currentIssueData.outcome_indicators)} style={{ ...iconBtn, opacity: krIdx === currentIssueData.outcome_indicators.length - 1 ? 0.3 : 1 }}><ArrowDown size={14} /></button>
                            <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>
                            <button onClick={() => { setMovingKr(kr); setMoveDestinationType('objective'); setIsMoveModalOpen(true); }} style={{ ...iconBtn, color: 'var(--primary)' }} title="ย้ายไปเป็น Key Result"><RefreshCw size={14} /></button>
                            <button onClick={() => handleOpenKrModal('strategic_issue', currentIssueData.auto_id, currentIssueData.id, kr)} style={{ ...iconBtn, color: 'var(--primary)' }}><Edit2 size={14} /></button>
                            <button onClick={() => deleteKr(kr.id)} style={{ ...iconBtn, color: 'var(--destructive)' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />

            {/* Strategies */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>กลยุทธ์ (Strategies)</h3>
              <button onClick={() => handleOpenStrategyModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> เพิ่มกลยุทธ์
              </button>
            </div>

            {currentIssueData.strategies?.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <p style={{ color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>ยังไม่มีกลยุทธ์</p>
                <button onClick={() => handleOpenStrategyModal()} className="btn-primary">เพิ่มกลยุทธ์แรก</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
                {currentIssueData.strategies?.map((st: any, stIdx: number) => (
                  <div key={st.id} style={{ border: `2px solid ${themeColor}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: `${themeColor}15`, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${themeColor}30` }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ backgroundColor: themeColor, color: 'white', padding: '0.2rem 0.65rem', borderRadius: '99px', fontWeight: 600, fontSize: '0.8rem' }}>{st.auto_id}</span>
                          <span style={{ color: themeColor, fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Strategy</span>
                        </div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>{st.name}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button disabled={stIdx === 0 || isSaving} onClick={() => moveItem('strategies', st, 'up', currentIssueData.strategies)} style={{ ...iconBtn, opacity: stIdx === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                        <button disabled={stIdx === currentIssueData.strategies.length - 1 || isSaving} onClick={() => moveItem('strategies', st, 'down', currentIssueData.strategies)} style={{ ...iconBtn, opacity: stIdx === currentIssueData.strategies.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
                        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border)', margin: '0 0.5rem' }}></div>
                        <button onClick={() => handleOpenStrategyModal(st)} className="btn-secondary" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                        <button onClick={() => deleteStrategy(st.id)} className="btn-secondary" style={{ padding: '0.5rem', color: 'var(--destructive)' }}><Trash2 size={16} /></button>
                      </div>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ fontWeight: 600, fontSize: '1rem' }}>เป้าประสงค์ (Objectives)</h5>
                        <button onClick={() => handleOpenObjModal(st.auto_id, st.id)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <Plus size={16} /> เพิ่มเป้าประสงค์
                        </button>
                      </div>

                      {st.objectives?.length === 0 ? (
                        <p style={{ color: 'var(--secondary-foreground)', fontStyle: 'italic', textAlign: 'center', padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>ยังไม่มีเป้าประสงค์</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {st.objectives?.map((obj: any, objIdx: number) => (
                            <div key={obj.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                              <div style={{ backgroundColor: 'var(--secondary)', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <span style={{ fontWeight: 600, color: themeColor, fontSize: '0.875rem' }}>{obj.auto_id}</span>
                                  <h6 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{obj.name}</h6>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <button disabled={objIdx === 0 || isSaving} onClick={() => moveItem('objectives', obj, 'up', st.objectives)} style={{ ...iconBtn, opacity: objIdx === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                                  <button disabled={objIdx === st.objectives.length - 1 || isSaving} onClick={() => moveItem('objectives', obj, 'down', st.objectives)} style={{ ...iconBtn, opacity: objIdx === st.objectives.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
                                  <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>
                                  <button onClick={() => handleOpenObjModal(st.auto_id, st.id, obj)} style={{ ...iconBtn, color: 'var(--primary)' }}><Edit2 size={16} /></button>
                                  <button onClick={() => deleteObj(obj.id)} style={{ ...iconBtn, color: 'var(--destructive)' }}><Trash2 size={16} /></button>
                                </div>
                              </div>

                              <div style={{ padding: '1rem' }}>
                                {(obj.initiative_activity || obj.ia_ssjj || obj.ia_rph || obj.ia_ssor || obj.ia_rphst || obj.ia_phakee) && (
                                  <div style={{ marginBottom: '0.75rem', border: `1px solid ${themeColor}40`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <div style={{ backgroundColor: `${themeColor}15`, padding: '0.5rem 0.875rem', borderBottom: `1px solid ${themeColor}30` }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>กิจกรรมริเริ่ม (Initiative Activities)</span>
                                    </div>
                                    {obj.initiative_activity && (
                                      <div style={{ padding: '0.65rem 0.875rem', borderBottom: `1px solid ${themeColor}20` }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>ภาพรวม</span>
                                        {(() => {
                                          try {
                                            const parsed = JSON.parse(obj.initiative_activity);
                                            if (Array.isArray(parsed)) {
                                              return (
                                                <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                                                  {parsed.map((item, i) => <li key={i}>{item}</li>)}
                                                </ul>
                                              );
                                            }
                                          } catch (e) {}
                                          return <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem' }}>{obj.initiative_activity}</p>;
                                        })()}
                                      </div>
                                    )}
                                    {[{key: 'ia_ssjj', label: 'สสจ.'}, {key: 'ia_rph', label: 'รพ.'}, {key: 'ia_ssor', label: 'สสอ.'}, {key: 'ia_rphst', label: 'รพ.สต.'}, {key: 'ia_phakee', label: 'ภาคี'}].map(({key, label}) =>
                                      obj[key] ? (
                                        <div key={key} style={{ padding: '0.65rem 0.875rem', borderBottom: `1px solid ${themeColor}20`, display: 'flex', gap: '0.75rem' }}>
                                          <span style={{ fontWeight: 700, color: themeColor, fontSize: '0.8rem', minWidth: '48px', flexShrink: 0 }}>{label}</span>
                                          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>{obj[key]}</p>
                                        </div>
                                      ) : null
                                    )}
                                  </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>เป้าหมาย (Key Results)</span>
                                  <button onClick={() => handleOpenKrModal('objective', obj.auto_id, obj.id)} style={{ ...iconBtn, color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
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
                                          <th style={{ padding: '0.5rem 0.25rem', width: '105px' }}>รหัส</th>
                                          <th style={{ padding: '0.5rem 0.25rem' }}>ชื่อเป้าหมาย</th>
                                          <th style={{ padding: '0.5rem 0.25rem', width: '90px', textAlign: 'center' }}>สถานะ</th>
                                          <th style={{ padding: '0.5rem 0.25rem', width: '52px', textAlign: 'center' }}>2570</th>
                                          <th style={{ padding: '0.5rem 0.25rem', width: '52px', textAlign: 'center' }}>2571</th>
                                          <th style={{ padding: '0.5rem 0.25rem', width: '52px', textAlign: 'center' }}>2572</th>
                                          <th style={{ padding: '0.5rem 0.25rem', width: '52px', textAlign: 'center' }}>2573</th>
                                          <th style={{ padding: '0.5rem 0.25rem', width: '52px', textAlign: 'center', fontWeight: 700 }}>2574</th>
                                          <th style={{ padding: '0.5rem 0.25rem', width: '90px', textAlign: 'right' }}>จัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {obj.key_results?.map((kr: any, krIdx: number) => (
                                          <tr key={kr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.5rem 0.25rem', fontWeight: 600, color: themeColor, fontSize: '0.8rem' }}>{kr.auto_id}</td>
                                            <td style={{ padding: '0.5rem 0.25rem' }}>{kr.name}</td>
                                            <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>
                                              <span style={{ padding: '0.15rem 0.4rem', backgroundColor: kr.measurement_status === 'พร้อมวัด' ? 'var(--success)' : 'var(--warning)', color: 'white', borderRadius: '99px', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                                {kr.measurement_status || '-'}
                                              </span>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{kr.target_2570 || '-'}</td>
                                            <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{kr.target_2571 || '-'}</td>
                                            <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{kr.target_2572 || '-'}</td>
                                            <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>{kr.target_2573 || '-'}</td>
                                            <td style={{ padding: '0.5rem 0.25rem', textAlign: 'center', fontWeight: 700 }}>{kr.target_2574 || '-'}</td>
                                            <td style={{ padding: '0.5rem 0.25rem' }}>
                                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <button disabled={krIdx === 0 || isSaving} onClick={() => moveItem('key_results', kr, 'up', obj.key_results)} style={{ ...iconBtn, opacity: krIdx === 0 ? 0.3 : 1 }}><ArrowUp size={13} /></button>
                                                <button disabled={krIdx === obj.key_results.length - 1 || isSaving} onClick={() => moveItem('key_results', kr, 'down', obj.key_results)} style={{ ...iconBtn, opacity: krIdx === obj.key_results.length - 1 ? 0.3 : 1 }}><ArrowDown size={13} /></button>
                                                <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border)', margin: '0 0.15rem' }}></div>
                                                <button onClick={() => { setMovingKr(kr); setMoveDestinationType('strategic_issue'); setIsMoveModalOpen(true); }} style={{ ...iconBtn, color: 'var(--primary)' }} title="ย้ายไปเป็นตัวชี้วัดยุทธศาสตร์"><RefreshCw size={13} /></button>
                                                <button onClick={() => handleOpenKrModal('objective', obj.auto_id, obj.id, kr)} style={{ ...iconBtn, color: 'var(--primary)' }}><Edit2 size={13} /></button>
                                                <button onClick={() => deleteKr(kr.id)} style={{ ...iconBtn, color: 'var(--destructive)' }}><Trash2 size={13} /></button>
                                              </div>
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

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />

            {/* Projects Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Folder size={20} style={{ color: themeColor }} /> โครงการ (Projects)
              </h3>
              <button onClick={() => handleOpenProjectModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Plus size={16} /> เพิ่มโครงการ
              </button>
            </div>

            {currentIssueProjects.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--secondary-foreground)', marginBottom: '1rem' }}>ยังไม่มีโครงการในยุทธศาสตร์นี้</p>
                <button onClick={() => handleOpenProjectModal()} className="btn-primary">เพิ่มโครงการแรก</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentIssueProjects.map((proj: any, projIdx: number) => {
                  const issueNum = strategicIssues.findIndex(i => i.id === activeIssue) + 1;
                  const projCode = `P${issueNum}.${projIdx + 1}`;
                  const linkedStrategyIds = (proj.project_strategies || []).map((ps: any) => ps.strategy_id);
                  const linkedStrategies: any[] = [];
                  strategicIssues.forEach(iss => {
                    iss.strategies?.forEach((st: any) => {
                      if (linkedStrategyIds.includes(st.id)) {
                        linkedStrategies.push({ ...st, _theme_color: iss.theme_color });
                      }
                    });
                  });
                  return (
                    <div key={proj.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{ backgroundColor: themeColor, color: 'white', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>{projCode}</span>
                            <Folder size={16} style={{ color: themeColor }} />
                            <h5 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{proj.name}</h5>
                          </div>
                          {proj.description && <p style={{ fontSize: '0.875rem', color: 'var(--secondary-foreground)', marginBottom: '0.75rem' }}>{proj.description}</p>}
                          {proj.responsible_group && <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}><strong>กลุ่มงาน:</strong> {proj.responsible_group}</p>}
                          {linkedStrategies.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                              {linkedStrategies.map((st: any) => (
                                <span key={st.id} style={{ padding: '0.2rem 0.6rem', backgroundColor: `${st._theme_color || themeColor}20`, color: st._theme_color || themeColor, borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600 }}>
                                  {st.auto_id} {st.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <button disabled={projIdx === 0 || isSaving} onClick={() => moveItem('projects', proj, 'up', currentIssueProjects)} style={{ ...iconBtn, opacity: projIdx === 0 ? 0.3 : 1 }}><ArrowUp size={16} /></button>
                          <button disabled={projIdx === currentIssueProjects.length - 1 || isSaving} onClick={() => moveItem('projects', proj, 'down', currentIssueProjects)} style={{ ...iconBtn, opacity: projIdx === currentIssueProjects.length - 1 ? 0.3 : 1 }}><ArrowDown size={16} /></button>
                          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border)', margin: '0 0.25rem' }}></div>
                          <button onClick={() => handleOpenProjectModal(proj)} style={{ ...iconBtn, color: 'var(--primary)' }}><Edit2 size={16} /></button>
                          <button onClick={() => deleteProject(proj.id)} style={{ ...iconBtn, color: 'var(--destructive)' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ MODALS ============ */}

      <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="ย้ายระดับ (Move Level)" maxWidth="500px">
        <form onSubmit={saveMoveKr} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem' }}>คุณกำลังย้าย: <strong>{movingKr?.name}</strong></p>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ย้ายไปยังระดับ</label>
            <select className="input-field" value={moveDestinationType} onChange={e => {
              setMoveDestinationType(e.target.value as any);
              setMoveDestinationId('');
            }}>
              <option value="strategic_issue">ตัวชี้วัดยุทธศาสตร์ (ระดับที่ 1)</option>
              <option value="objective">Key Result (ระดับที่ 3 เป้าประสงค์)</option>
            </select>
          </div>
          {moveDestinationType === 'objective' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>เลือกเป้าประสงค์ปลายทาง <span style={{ color: 'red' }}>*</span></label>
              <select className="input-field" required value={moveDestinationId} onChange={e => setMoveDestinationId(e.target.value)}>
                <option value="">-- เลือกเป้าประสงค์ --</option>
                {strategicIssues.find(s => s.id === activeIssue)?.strategies?.map((st: any) => (
                  <optgroup key={st.id} label={st.auto_id + ' ' + st.name}>
                    {st.objectives?.map((obj: any) => (
                      <option key={obj.id} value={obj.id}>{obj.auto_id} {obj.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsMoveModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" disabled={isSaving || (moveDestinationType === 'objective' && !moveDestinationId)} className="btn-primary">{isSaving ? 'กำลังย้าย...' : 'ยืนยันการย้าย'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title={editingIssue?.id ? 'แก้ไขยุทธศาสตร์' : 'เพิ่มยุทธศาสตร์ใหม่'}>
        <form onSubmit={saveIssue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อยุทธศาสตร์ <span style={{ color: 'red' }}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น การพัฒนาระบบบริการสุขภาพ..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>คำอธิบายเพิ่มเติม</label>
            <textarea className="input-field" rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="รายละเอียด..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>สีธีม</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="color" value={formData.theme_color || '#0284c7'} onChange={e => setFormData({ ...formData, theme_color: e.target.value })} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer' }} />
              <input type="text" className="input-field" value={formData.theme_color || '#0284c7'} onChange={e => setFormData({ ...formData, theme_color: e.target.value })} style={{ width: '120px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsIssueModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStrategyModalOpen} onClose={() => setIsStrategyModalOpen(false)} title={editingStrategy?.id ? `แก้ไขกลยุทธ์ (${editingStrategy.auto_id})` : 'เพิ่มกลยุทธ์ใหม่'}>
        <form onSubmit={saveStrategy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อกลยุทธ์ <span style={{ color: 'red' }}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น พัฒนาระบบปฐมภูมิ..." />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsStrategyModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isObjModalOpen} onClose={() => setIsObjModalOpen(false)} title={editingObj?.id ? `แก้ไขเป้าประสงค์ (${editingObj.auto_id})` : 'เพิ่มเป้าประสงค์ใหม่'} maxWidth="800px">
        <form onSubmit={saveObj} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อเป้าประสงค์ <span style={{ color: 'red' }}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น ลดอัตราป่วย..." />
          </div>
          <div style={{ backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>ภาพรวมกิจกรรมริเริ่ม (Initiative Activity)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {initiativeList.map((ini, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)', width: '20px' }}>{index + 1}.</span>
                  <input 
                    type="text" 
                    className="input-field" 
                    style={{ flex: 1, margin: 0 }} 
                    value={ini} 
                    onChange={e => {
                      const newList = [...initiativeList];
                      newList[index] = e.target.value;
                      setInitiativeList(newList);
                    }} 
                    placeholder="ระบุกิจกรรมหรือโครงการริเริ่ม..." 
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      const newList = initiativeList.filter((_, i) => i !== index);
                      setInitiativeList(newList.length ? newList : ['']);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setInitiativeList([...initiativeList, ''])}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', marginTop: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                <Plus size={16} /> เพิ่มกิจกรรมใหม่
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ backgroundColor: 'var(--secondary)', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>แยกตามหน่วยงาน</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginLeft: '0.5rem' }}>(กรอกข้อมูลเฉพาะหน่วยงานที่เกี่ยวข้อง)</span>
            </div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'ia_ssjj', label: 'สสจ.', placeholder: 'กิจกรรมที่สำนักงานสาธารณสุขจังหวัดรับผิดชอบ...' },
                { key: 'ia_rph', label: 'รพ.', placeholder: 'กิจกรรมที่โรงพยาบาลรับผิดชอบ...' },
                { key: 'ia_ssor', label: 'สสอ.', placeholder: 'กิจกรรมที่สำนักงานสาธารณสุขอำเภอรับผิดชอบ...' },
                { key: 'ia_rphst', label: 'รพ.สต.', placeholder: 'กิจกรรมที่โรงพยาบาลส่งเสริมสุขภาพตำบลรับผิดชอบ...' },
                { key: 'ia_phakee', label: 'ภาคี', placeholder: 'กิจกรรมที่ภาคีเครือข่ายรับผิดชอบ...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>{label}</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    value={formData[key] || ''}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={{ fontSize: '0.875rem', lineHeight: '1.6', resize: 'vertical', minHeight: '90px' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" onClick={() => setIsObjModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isKrModalOpen} onClose={() => setIsKrModalOpen(false)} title={editingKr?.id ? `แก้ไข Key Result (${editingKr.auto_id})` : 'เพิ่ม Key Result ใหม่'}>
        <form onSubmit={saveKr} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อเป้าหมาย (Key Result) <span style={{ color: 'red' }}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น อัตราผู้ป่วยเบาหวานที่ควบคุมได้..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>สถานะความพร้อมวัด</label>
              <select className="input-field" value={formData.measurement_status || 'สร้างใหม่'} onChange={e => setFormData({ ...formData, measurement_status: e.target.value })}>
                <option value="พร้อมวัด">พร้อมวัด</option>
                <option value="สร้างใหม่">สร้างใหม่</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>กลุ่มงานรับผิดชอบ</label>
              <select className="input-field" value={formData.responsible_group || ''} onChange={e => setFormData({ ...formData, responsible_group: e.target.value })}>
                <option value="">-- เลือกกลุ่มงาน --</option>
                {RESPONSIBLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>ค่าเป้าหมายรายปี (2570–2574)</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)', marginBottom: '0.75rem' }}>กรอกได้ทั้งตัวเลขและตัวอักษร เช่น "80%", "ร้อยละ 75", "500 ราย"</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[2570, 2571, 2572, 2573, 2574].map(year => (
                <div key={year}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--secondary-foreground)', fontWeight: year === 2574 ? 700 : 400 }}>
                    ปี {year}{year === 2574 ? ' ★' : ''}
                  </label>
                  <input type="text" className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={formData[`target_${year}`] || ''} onChange={e => setFormData({ ...formData, [`target_${year}`]: e.target.value })} placeholder="-" />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" onClick={() => setIsKrModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title={editingProject?.id ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่'}>
        <form onSubmit={saveProject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>ชื่อโครงการ <span style={{ color: 'red' }}>*</span></label>
            <input type="text" className="input-field" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น โครงการพัฒนาระบบ..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>คำอธิบายโครงการ</label>
            <textarea className="input-field" rows={2} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="รายละเอียด..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>กลุ่มงานรับผิดชอบ</label>
            <select className="input-field" value={formData.responsible_group || ''} onChange={e => setFormData({ ...formData, responsible_group: e.target.value })}>
              <option value="">-- เลือกกลุ่มงาน --</option>
              {RESPONSIBLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>
              กลยุทธ์ที่สัมพันธ์ <span style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', fontWeight: 400 }}>(สามารถเลือกข้ามยุทธศาสตร์ได้)</span>
            </label>
            {!strategicIssues.length ? (
              <p style={{ color: 'var(--secondary-foreground)', fontSize: '0.875rem', fontStyle: 'italic' }}>ยังไม่มีกลยุทธ์ในระบบ</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '250px', overflowY: 'auto', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                {strategicIssues.map(issue => (
                  <div key={issue.id} style={{ marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: issue.theme_color || 'var(--primary)', marginBottom: '0.5rem', borderBottom: `1px solid ${issue.theme_color || 'var(--primary)'}40`, paddingBottom: '0.25rem' }}>
                      [{issue.auto_id}] {issue.name}
                    </div>
                    {issue.strategies?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                        {issue.strategies.map((st: any) => (
                          <label key={st.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: selectedStrategyIds.includes(st.id) ? `${issue.theme_color || 'var(--primary)'}15` : 'transparent' }}>
                            <input
                              type="checkbox"
                              checked={selectedStrategyIds.includes(st.id)}
                              onChange={() => toggleStrategySelection(st.id)}
                              style={{ marginTop: '0.15rem', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '0.875rem' }}><strong style={{ color: issue.theme_color || 'var(--primary)' }}>{st.auto_id}</strong> {st.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div style={{ paddingLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--secondary-foreground)', fontStyle: 'italic' }}>ไม่มีกลยุทธ์</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" onClick={() => setIsProjectModalOpen(false)} className="btn-secondary">ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'กำลังบันทึก...' : 'บันทึกโครงการ'}</button>
          </div>
        </form>
      </Modal>



    </div>
  );
}
