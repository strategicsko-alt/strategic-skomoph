'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEditor } from '@/components/EditorContext';
import {
  SA_KAEO_DISTRICTS,
  SA_KAEO_HOSPITALS,
  fetchHdcTableData,
  aggregateHdcByLevel,
} from '@/lib/hdc';
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  Save, 
  Check, 
  AlertTriangle,
  FileSpreadsheet,
  CalendarDays
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const DISTRICTS = [
  "เมืองสระแก้ว","คลองหาด","ตาพระยา","วังน้ำเย็น",
  "วัฒนานคร","อรัญประเทศ","เขาฉกรรจ์","โคกสูง","วังสมบูรณ์"
];

const QUARTERS = ['Q1','Q2','Q3','Q4'];

const KPI_TYPES = [
  { id: 'all', label: 'ทุกประเภทตัวชี้วัด' },
  { id: 'strategic', label: 'ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)' },
  { id: 'ministry', label: 'ตัวชี้วัดกระทรวงสาธารณสุข' },
  { id: 'inspection', label: 'ตัวชี้วัดตรวจราชการ' },
  { id: 'standalone', label: 'ตัวชี้วัดอื่นๆ / นโยบายเร่งด่วน' },
];

const KPI_TYPE_LABELS: Record<string, string> = {
  strategic: 'ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)',
  ministry: 'ตัวชี้วัดกระทรวงสาธารณสุข',
  inspection: 'ตัวชี้วัดตรวจราชการ',
  standalone: 'ตัวชี้วัดอื่นๆ / นโยบายเร่งด่วน',
};

const SSJ_WORK_GROUPS = [
  "คุ้มครองผู้บริโภคและเภสัชสาธารณสุข",
  "บริหารทรัพยากรบุคคล",
  "กลุ่มกฎหมาย",
  "พัฒนายุทธศาสตร์สาธารณสุข",
  "สุขภาพดิจิทัล",
  "คุ้มครองผู้บริโภค",
  "พัฒนาคุณภาพและรูปแบบบริการ",
  "ควบคุมโรคติดต่อ",
  "ประกันสุขภาพ",
  "ส่งเสริมสุขภาพ",
  "ทันตสาธารณสุข",
  "บริหารทั่วไป",
  "อนามัยสิ่งแวดล้อมและอาชีวอนามัย",
  "ควบคุมโรคไม่ติดต่อ",
  "ปฐมภูมิและเครือข่ายสุขภาพ",
  "การแพทย์แผนไทยและการแพทย์ทางเลือก",
  "พัฒนาทรัพยากรบุคคล"
];
const UNIQUE_SSJ_WORK_GROUPS = Array.from(new Set(SSJ_WORK_GROUPS));

function normalizeWorkGroup(wg: string | null | undefined): string {
  if (!wg) return '';
  return wg.trim().replace(/^กลุ่มงาน/, '').trim();
}

function matchWorkGroup(wg1: string | null | undefined, wg2: string | null | undefined): boolean {
  if (!wg1 || !wg2) return false;
  return normalizeWorkGroup(wg1) === normalizeWorkGroup(wg2);
}

interface DataItem { id: string; label: string; }
interface KpiOption {
  kr_id: string | null;  // null = standalone
  dict_id: string;
  auto_id: string;
  kr_name: string;
  work_group: string;
  kpi_type: string;
  calc_type: string;
  calc_formula: string;
  measurement_level: string;
  data_items: DataItem[];
  target_operator: string;
  eval_criteria: Record<string, number>;
  api_enabled?: boolean;
  api_config_json?: any;
}

function computeResult(formula: string, vals: Record<string, string>): string {
  if (!formula) return '0.00';
  try {
    let eq = formula.toUpperCase();
    const isRatio = eq.includes('1:') || eq.includes('1 :');
    if (isRatio) eq = eq.replace(/1\s*:/,'').trim();
    // Replace variables A, B, C… with values
    eq = eq.replace(/\b([A-Z])\b/g, (m) => vals[m] || '0');
    const result = new Function('return (' + eq + ')')();
    if (!isFinite(result) || isNaN(result)) return '0.00';
    if (isRatio) return `1 : ${result.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
    return result.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  } catch {
    return '0.00';
  }
}

export default function ReportPage() {
  const { toast } = useToast();
  const { profile, loading: ctxLoading } = useEditor();
  const isSuperAdmin = profile?.role === 'province_super_admin' || profile?.role === 'district_super_admin';
  const userWorkGroup = profile?.work_group || '';

  // Filter states
  const [selectedKpiType, setSelectedKpiType] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('');
  const [selectedKpiDictId, setSelectedKpiDictId] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q4');

  // KPI Options
  const [kpiOptions, setKpiOptions] = useState<KpiOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-KR states (Action Plan)
  const [subKrs, setSubKrs] = useState<any[]>([]);
  const [loadingSubKrs, setLoadingSubKrs] = useState<boolean>(false);
  const [savingSubKrs, setSavingSubKrs] = useState<boolean>(false);
  const [subKrSaveMsg, setSubKrSaveMsg] = useState<string>('');
  const [subKrValues, setSubKrValues] = useState<Record<string, { result_value: string; status: string }>>({});

  // Cumulative / Section 3 states
  const [saving, setSaving] = useState(false);
  const [syncingHdc, setSyncingHdc] = useState(false);
  const [hdcSyncMsg, setHdcSyncMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [processStatus, setProcessStatus] = useState('pending');
  const [processDesc, setProcessDesc] = useState('');

  // โหลดรายการตัวชี้วัดที่ตั้งค่าแล้ว
  const fetchKPIs = useCallback(async () => {
    setLoading(true);

    // ดึง kpi_dictionaries ทั้งหมด
    const { data: dicts } = await supabase
      .from('kpi_dictionaries')
      .select('id, key_result_id, kpi_name, kpi_type, calculation_type, calculation_formula, data_items_json, measurement_level, target_operator, work_group, evaluation_criteria_json, api_enabled, api_config_json')
      .order('created_at', { ascending: true });

    if (!dicts || dicts.length === 0) {
      setKpiOptions([]);
      setLoading(false);
      return;
    }

    // ดึงชื่อ key_results และกลุ่มงานที่รับผิดชอบ
    const krIds = dicts.filter((d: any) => d.key_result_id).map((d: any) => d.key_result_id);
    let krMap: Record<string, { auto_id: string; name: string; responsible_group: string }> = {};

    if (krIds.length > 0) {
      const { data: krs } = await supabase
        .from('key_results')
        .select('id, auto_id, name, responsible_group')
        .in('id', krIds);
      (krs || []).forEach((kr: any) => { krMap[kr.id] = kr; });
    }

    const opts: KpiOption[] = dicts.map((d: any) => {
      const kr = d.key_result_id ? krMap[d.key_result_id] : null;
      const dataItems = d.data_items_json
        ? (typeof d.data_items_json === 'string' ? JSON.parse(d.data_items_json) : d.data_items_json)
        : [];
      const evalCriteria = d.evaluation_criteria_json
        ? (typeof d.evaluation_criteria_json === 'string' ? JSON.parse(d.evaluation_criteria_json) : d.evaluation_criteria_json)
        : {};

      const effectiveWorkGroup = d.work_group || kr?.responsible_group || '';
      const effectiveKpiType = d.kpi_type || (d.key_result_id ? 'strategic' : 'standalone');

      return {
        kr_id: d.key_result_id || null,
        dict_id: d.id,
        auto_id: kr?.auto_id || '',
        kr_name: kr?.name || d.kpi_name || 'ไม่มีชื่อ',
        work_group: effectiveWorkGroup,
        kpi_type: effectiveKpiType,
        calc_type: d.calculation_type || 'process_status',
        calc_formula: d.calculation_formula || '',
        measurement_level: d.measurement_level || 'province',
        data_items: dataItems,
        target_operator: d.target_operator || '>=',
        eval_criteria: evalCriteria,
        api_enabled: d.api_enabled || false,
        api_config_json: d.api_config_json,
      };
    });

    setKpiOptions(opts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  // กรองตัวชี้วัดตาม: 1) ประเภทตัวชี้วัด 2) สิทธิ์กลุ่มงานของผู้ใช้
  const filteredKpis = useMemo(() => {
    return kpiOptions.filter(k => {
      // กรองตามประเภทตัวชี้วัด
      if (selectedKpiType !== 'all' && k.kpi_type !== selectedKpiType) {
        return false;
      }

      // กรองตามสิทธิ์กลุ่มงาน
      if (!isSuperAdmin) {
        // ผู้ใช้ทั่วไป: ต้องตรงกับกลุ่มงานของตนเอง
        if (!userWorkGroup) return false;
        return matchWorkGroup(k.work_group, userWorkGroup);
      } else {
        // Super Admin: ถ้าเลือกกลุ่มงานเฉพาะให้กรองตามนั้น
        if (selectedGroupFilter) {
          return matchWorkGroup(k.work_group, selectedGroupFilter);
        }
      }
      return true;
    });
  }, [kpiOptions, selectedKpiType, selectedGroupFilter, isSuperAdmin, userWorkGroup]);

  // ซิงค์ selectedKpiDictId ให้ตรงกับ filteredKpis ตัวแรกเสมอเมื่อมีการเปลี่ยน filter
  useEffect(() => {
    if (filteredKpis.length > 0) {
      const exists = filteredKpis.some(k => k.dict_id === selectedKpiDictId);
      if (!exists) {
        setSelectedKpiDictId(filteredKpis[0].dict_id);
      }
    } else {
      setSelectedKpiDictId('');
    }
  }, [filteredKpis, selectedKpiDictId]);

  const currentKpi = kpiOptions.find(k => k.dict_id === selectedKpiDictId);

  // คำนวณเลขไตรมาส (1-4)
  const quarterNum = useMemo(() => {
    return parseInt(selectedQuarter.replace('Q', ''), 10) || 1;
  }, [selectedQuarter]);

  // โหลด KR ย่อยจากแผนปฏิบัติการ 1 ปี (เฉพาะประเภทยุทธศาสตร์สุขภาพ สระแก้ว)
  const loadSubKrs = useCallback(async (krId: string, qNum: number) => {
    setLoadingSubKrs(true);
    try {
      const { data, error } = await supabase
        .from('action_plan_measurements')
        .select('*')
        .eq('key_result_id', krId)
        .eq('quarter', qNum)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching sub KRs:', error);
        setSubKrs([]);
        return;
      }

      setSubKrs(data || []);
      const initVals: Record<string, { result_value: string; status: string }> = {};
      (data || []).forEach((item: any) => {
        initVals[item.id] = {
          result_value: item.result_value != null ? String(item.result_value) : '',
          status: item.status || 'กำลังดำเนินการ',
        };
      });
      setSubKrValues(initVals);
    } catch (err: any) {
      console.error('Error loading sub KRs:', err);
    } finally {
      setLoadingSubKrs(false);
    }
  }, []);

  useEffect(() => {
    if (currentKpi?.kpi_type === 'strategic' && currentKpi?.kr_id) {
      loadSubKrs(currentKpi.kr_id, quarterNum);
    } else {
      setSubKrs([]);
      setSubKrValues({});
    }
  }, [currentKpi, quarterNum, loadSubKrs]);

  const handleSubKrChange = (id: string, field: 'result_value' | 'status', val: string) => {
    setSubKrValues(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { result_value: '', status: 'กำลังดำเนินการ' }),
        [field]: val,
      }
    }));
  };

  const handleSaveSubKrs = async () => {
    if (!currentKpi?.kr_id || subKrs.length === 0) return;
    setSavingSubKrs(true);
    setSubKrSaveMsg('');

    try {
      for (const item of subKrs) {
        const v = subKrValues[item.id] || { result_value: '', status: 'กำลังดำเนินการ' };
        const payload: any = {
          result_value: v.result_value || '',
          status: v.status || 'กำลังดำเนินการ',
          reported_at: new Date().toISOString(),
        };
        if (profile?.id) {
          payload.reported_by = profile.id;
        }

        const { error } = await supabase
          .from('action_plan_measurements')
          .update(payload)
          .eq('id', item.id);

        if (error) {
          if (error.code === '42703') {
            toast.error(
              'ฐานข้อมูลยังไม่มีคอลัมน์ result_value และ status ในตาราง action_plan_measurements กรุณาติดต่อผู้ดูแลระบบ'
            );
            setSavingSubKrs(false);
            return;
          }
          throw error;
        }
      }

      toast.success(`บันทึกผล KR ย่อย (${selectedQuarter}) สำเร็จ`);
      setSubKrSaveMsg(`✓ บันทึกผล KR ย่อย (${selectedQuarter}) สำเร็จ`);
      setTimeout(() => setSubKrSaveMsg(''), 4000);
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก KR ย่อย: ' + (err.message || err));
    } finally {
      setSavingSubKrs(false);
    }
  };

  // โหลดข้อมูลที่บันทึกไว้แล้วสำหรับ KPI + ไตรมาสที่เลือก (Section 3 หรือ 2)
  const loadMeasurements = useCallback(async () => {
    if (!selectedKpiDictId || !currentKpi?.kr_id) {
      setValues({}); setProcessStatus('pending'); setProcessDesc('');
      return;
    }
    setValues({}); setProcessStatus('pending'); setProcessDesc('');

    const { data } = await supabase
      .from('kpi_measurements')
      .select('*')
      .eq('key_result_id', currentKpi.kr_id)
      .eq('period', selectedQuarter);

    if (data) {
      if (currentKpi.calc_type === 'process_status') {
        const m = data[0];
        if (m) {
          setProcessStatus(String(m.result_value || 'pending'));
          setProcessDesc((m.values_json as any)?.description || '');
        }
      } else {
        const newVals: Record<string, Record<string, string>> = {};
        for (const m of data) {
          const vj = (m.values_json || {}) as Record<string, string>;
          newVals[m.area_id] = vj;
        }
        setValues(newVals);
      }
    }
  }, [selectedKpiDictId, selectedQuarter, currentKpi]);

  useEffect(() => { loadMeasurements(); }, [loadMeasurements]);

  const setVal = (areaId: string, itemId: string, val: string) => {
    setValues(prev => ({ ...prev, [areaId]: { ...(prev[areaId] || {}), [itemId]: val } }));
  };

  const getAreas = () => {
    if (!currentKpi) return [];
    if (currentKpi.measurement_level === 'province') return ['province'];
    if (currentKpi.measurement_level === 'hospital') return SA_KAEO_HOSPITALS.map(h => h.name);
    return DISTRICTS;
  };

  const handleSyncHdc = async () => {
    if (!currentKpi || !currentKpi.api_enabled) return;
    const cfg = currentKpi.api_config_json || {};
    const tbl = (cfg.tableName || cfg.A?.tableName || '').trim();
    const yr = String(cfg.year || '2569').trim();
    const varMapping: Record<string, string> = cfg.variables || {
      A: cfg.A?.field || 'result',
      B: cfg.B?.field || 'target',
    };

    if (!tbl) {
      toast.warning('ตัวชี้วัดนี้ยังไม่ได้ระบุชื่อตาราง HDC ในหน้าตั้งค่า Template');
      return;
    }

    setSyncingHdc(true);
    setHdcSyncMsg('');
    try {
      const raw = await fetchHdcTableData(tbl, yr);
      const level = (currentKpi.measurement_level || 'province') as 'province' | 'district' | 'hospital';
      const results = aggregateHdcByLevel(raw, level, varMapping, currentKpi.calc_formula);

      const newVals: Record<string, Record<string, string>> = { ...values };
      results.forEach(item => {
        newVals[item.id] = { ...(newVals[item.id] || {}) };
        Object.entries(item.variables).forEach(([k, v]) => {
          newVals[item.id][k] = String(v);
        });
      });

      setValues(newVals);
      const levelName = level === 'hospital' ? '9 โรงพยาบาล' : level === 'district' ? '9 อำเภอ' : 'ภาพรวมจังหวัด';
      toast.success(`ดึงข้อมูลสดจาก HDC (${tbl}) สำเร็จ (${results.length} รายการ)`);
      setHdcSyncMsg(`✓ ดึงข้อมูลสดจาก HDC (${tbl} / ${yr}) สำหรับ ${levelName} สำเร็จแล้ว (${results.length} รายการ) กรุณาตรวจสอบแล้วกดบันทึก`);
      setTimeout(() => setHdcSyncMsg(''), 8000);
    } catch (err: any) {
      toast.error(`ไม่สามารถดึงข้อมูลจาก HDC ได้: ${err.message || err}`);
    } finally {
      setSyncingHdc(false);
    }
  };

  const handleSave = async () => {
    if (!currentKpi?.kr_id) {
      toast.warning('ตัวชี้วัดนี้ไม่ได้เชื่อมกับ Key Result กรุณาเลือกตัวชี้วัดจากระบบแผน');
      return;
    }
    setSaving(true);
    const areas = getAreas();

    for (const area of areas) {
      const areaId = area === 'province' ? 'province' : area;
      let resultValue: string;
      let valuesJson: Record<string, string>;

      if (currentKpi.calc_type === 'process_status') {
        resultValue = processStatus;
        valuesJson = { description: processDesc };
      } else {
        const areaVals = values[areaId] || {};
        resultValue = computeResult(currentKpi.calc_formula, areaVals);
        valuesJson = areaVals;
      }

      const payload = {
        key_result_id: currentKpi.kr_id,
        period: selectedQuarter,
        area_id: areaId,
        result_value: resultValue,
        values_json: valuesJson,
        reported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Upsert: ค้นหาก่อน ถ้ามีให้ update, ถ้าไม่มีให้ insert
      const { data: existing } = await supabase
        .from('kpi_measurements')
        .select('id')
        .eq('key_result_id', currentKpi.kr_id)
        .eq('period', selectedQuarter)
        .eq('area_id', areaId)
        .maybeSingle();

      if (existing) {
        await supabase.from('kpi_measurements').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('kpi_measurements').insert(payload);
      }

      if (currentKpi.calc_type === 'process_status') break;
    }

    // หากเป็นการรายงานระดับอำเภอหรือโรงพยาบาล ให้คำนวณและบันทึกผลงานรวมระดับจังหวัด (area_id = 'province') ด้วย
    if (currentKpi.calc_type !== 'process_status' && currentKpi.measurement_level !== 'province' && areas.length > 0) {
      const provVals: Record<string, number> = {};
      areas.forEach(areaId => {
        const areaVals = values[areaId] || {};
        Object.entries(areaVals).forEach(([k, v]) => {
          const num = parseFloat(String(v).replace(/,/g, ''));
          if (!isNaN(num)) {
            provVals[k] = (provVals[k] || 0) + num;
          }
        });
      });

      const provValsStr: Record<string, string> = {};
      Object.entries(provVals).forEach(([k, v]) => {
        provValsStr[k] = String(v);
      });

      const provResultValue = computeResult(currentKpi.calc_formula, provValsStr);

      const provPayload = {
        key_result_id: currentKpi.kr_id,
        period: selectedQuarter,
        area_id: 'province',
        result_value: provResultValue,
        values_json: provValsStr,
        reported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: existingProv } = await supabase
        .from('kpi_measurements')
        .select('id')
        .eq('key_result_id', currentKpi.kr_id)
        .eq('period', selectedQuarter)
        .eq('area_id', 'province')
        .maybeSingle();

      if (existingProv) {
        await supabase.from('kpi_measurements').update(provPayload).eq('id', existingProv.id);
      } else {
        await supabase.from('kpi_measurements').insert(provPayload);
      }
    }

    setSaving(false);
    toast.success(`บันทึกผลยอดสะสม "${currentKpi.kr_name}" (${selectedQuarter}) สำเร็จ`);
    setSuccessMsg(`บันทึกผลยอดสะสม "${currentKpi.kr_name}" (${selectedQuarter}) สำเร็จ ✓`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getStatusColor = (resultStr: string, kpi: KpiOption): string => {
    const result = parseFloat(resultStr.replace(/,/g, ''));
    if (isNaN(result)) return '#94a3b8';
    const q = selectedQuarter.toLowerCase();
    const target = (kpi.eval_criteria as any)[q];
    const warning = (kpi.eval_criteria as any)[`${q}_warning`];
    if (target == null) return '#94a3b8';
    const op = kpi.target_operator;
    const pass = op === '>=' ? result >= target : op === '<=' ? result <= target :
      op === '>' ? result > target : op === '<' ? result < target : result === target;
    if (pass) return '#22c55e';
    const warn = warning != null && (op === '>=' ? result >= warning : op === '<=' ? result <= warning : false);
    return warn ? '#eab308' : '#ef4444';
  };

  if (loading || ctxLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>กำลังโหลดข้อมูลตัวชี้วัด...</div>;
  }

  const areas = getAreas();
  const q = selectedQuarter.toLowerCase();
  const targetVal = currentKpi ? (currentKpi.eval_criteria as any)[q] : null;
  const warningVal = currentKpi ? (currentKpi.eval_criteria as any)[`${q}_warning`] : null;

  // ตรวจสอบว่าต้องมี Section 2 (KR ย่อย แผนปฏิบัติการ 1 ปี) หรือไม่
  const hasSubKrSection = currentKpi && currentKpi.kpi_type === 'strategic' && currentKpi.kr_id;
  const cumulativeSectionNum = hasSubKrSection ? '3' : '2';

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <Breadcrumbs items={[{ label: 'Editor Portal', href: '/editor/dashboard' }, { label: 'บันทึกผลการดำเนินงาน' }]} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>บันทึกผลการดำเนินงาน</h1>
          <p style={{ color: 'var(--secondary-foreground)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            สำหรับกลุ่มงาน สสจ.สระแก้ว · บันทึกผลตามตัวชี้วัดย่อยและยอดสะสม
          </p>
        </div>

        {/* User Group Info Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isSuperAdmin ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              <span>👑</span>
              <span>สิทธิ์ Super Admin (สามารถเลือกดูกลุ่มงานใดก็ได้)</span>
            </div>
          ) : userWorkGroup ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              <Building2 size={16} />
              <span>กลุ่มงานของคุณ: <strong>{userWorkGroup}</strong> (แสดงเฉพาะตัวชี้วัดที่รับผิดชอบ)</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              <ShieldAlert size={16} />
              <span>บัญชีของคุณยังไม่ได้ระบุกลุ่มงาน กรุณาติดต่อผู้ดูแลระบบ</span>
            </div>
          )}

          {successMsg && (
            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.85rem' }}>
              {successMsg}
            </div>
          )}
        </div>
      </div>

      {/* Warning for users without work_group */}
      {!isSuperAdmin && !userWorkGroup && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <AlertTriangle size={20} color="#b45309" />
          <div style={{ fontSize: '0.88rem', color: '#92400e' }}>
            <strong>ยังไม่มีการกำหนดกลุ่มงาน:</strong> บัญชีผู้ใช้งานของคุณยังไม่ได้ผูกกับกลุ่มงานใดใน สสจ.สระแก้ว ระบบจึงไม่สามารถกรองตัวชี้วัดที่รับผิดชอบได้ กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดกลุ่มงานในเมนู <strong>"จัดการสิทธิ์ (Users)"</strong>
          </div>
        </div>
      )}

      {/* Step 1: Select KPI Type, Work Group (Admin), KPI & Quarter */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
          1. เลือกตัวชี้วัดและไตรมาส
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isSuperAdmin ? '1fr 1fr 2fr 1fr' : '1.2fr 2.5fr 1fr',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          {/* Filter 1: ประเภทตัวชี้วัด */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              ประเภทตัวชี้วัด
            </label>
            <select
              className="input-field"
              value={selectedKpiType}
              onChange={e => setSelectedKpiType(e.target.value)}
            >
              {KPI_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: กลุ่มงาน (เฉพาะ Super Admin) */}
          {isSuperAdmin && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                กลุ่มงาน (ผู้รับผิดชอบ)
              </label>
              <select
                className="input-field"
                value={selectedGroupFilter}
                onChange={e => setSelectedGroupFilter(e.target.value)}
              >
                <option value="">-- ทุกกลุ่มงาน --</option>
                {UNIQUE_SSJ_WORK_GROUPS.map(wg => (
                  <option key={wg} value={wg}>{wg}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter 3: ตัวชี้วัด */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                ตัวชี้วัด ({filteredKpis.length} รายการ)
              </label>
              {filteredKpis.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>ไม่พบตัวชี้วัด</span>
              )}
            </div>
            <select
              className="input-field"
              value={selectedKpiDictId}
              disabled={filteredKpis.length === 0}
              onChange={e => { setSelectedKpiDictId(e.target.value); setValues({}); }}
            >
              {filteredKpis.length === 0 ? (
                <option value="">(ไม่มีตัวชี้วัดที่ตรงกับเงื่อนไข)</option>
              ) : (
                filteredKpis.map(k => (
                  <option key={k.dict_id} value={k.dict_id}>
                    {k.work_group ? `[${k.work_group}] ` : ''}{k.auto_id ? `${k.auto_id} ` : ''}{k.kr_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Filter 4: ไตรมาส */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              ไตรมาส ({selectedQuarter})
            </label>
            <div style={{ display: 'flex', gap: '0.35rem' }} role="group" aria-label="เลือกไตรมาส">
              {QUARTERS.map(q => {
                const active = selectedQuarter === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuarter(q)}
                    style={{
                      flex: 1,
                      padding: '0.55rem 0.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: active ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: active ? 'var(--primary)' : 'var(--card)',
                      color: active ? '#ffffff' : 'var(--foreground)',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                    }}
                    aria-pressed={active}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current KPI Detail Pills */}
        {currentKpi && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--secondary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: '1.25rem',
            flexWrap: 'wrap',
            fontSize: '0.82rem',
            alignItems: 'center'
          }}>
            <span>📑 ประเภท: <strong style={{ color: 'var(--primary)' }}>{KPI_TYPE_LABELS[currentKpi.kpi_type] || currentKpi.kpi_type}</strong></span>
            {currentKpi.work_group && <span>🏢 กลุ่มงาน: <strong>{currentKpi.work_group}</strong></span>}
            <span>📐 ระดับ: <strong>{currentKpi.measurement_level === 'province' ? 'จังหวัด' : currentKpi.measurement_level === 'district' ? 'อำเภอ' : 'โรงพยาบาล'}</strong></span>
            {currentKpi.calc_type !== 'process_status' && (
              <span>🔢 สูตร: <code style={{ backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#0369a1' }}>{currentKpi.calc_formula}</code></span>
            )}
            {targetVal != null && (
              <span>🎯 เป้า {selectedQuarter}: <strong style={{ color: '#166534' }}>{currentKpi.target_operator} {targetVal}</strong>
                {warningVal != null && <span style={{ color: '#854d0e' }}> · เฝ้าระวัง {warningVal}</span>}
              </span>
            )}
            {!currentKpi.kr_id && (
              <span style={{ backgroundColor: '#fef9c3', color: '#854d0e', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.78rem' }}>
                ⚠️ ตัวชี้วัดนี้เป็น Standalone (ไม่ผูกกับ KR ยุทธศาสตร์)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 2: บันทึกผลตัวชี้วัดย่อยรายไตรมาส (เฉพาะประเภทยุทธศาสตร์สุขภาพ สระแก้ว) */}
      {hasSubKrSection && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid #bfdbfe', backgroundColor: '#fafcff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarDays size={18} />
                2. บันทึกผลตัวชี้วัดย่อยรายไตรมาส (แผนปฏิบัติการ 1 ปี - {selectedQuarter})
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>
                เชื่อมโยงกับแผนปฏิบัติการ 1 ปี · รายงานผลได้ทั้งตัวเลขและข้อความสรุปผล พร้อมเลือกสถานะการดำเนินงาน
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {subKrSaveMsg && (
                <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                  {subKrSaveMsg}
                </span>
              )}
              <button
                type="button"
                onClick={() => currentKpi?.kr_id && loadSubKrs(currentKpi.kr_id, quarterNum)}
                className="btn-secondary"
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <RefreshCw size={12} /> รีเฟรช KR ย่อย
              </button>
            </div>
          </div>

          {loadingSubKrs ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)', fontSize: '0.88rem' }}>
              กำลังโหลดข้อมูล KR ย่อยในแผนปฏิบัติการ 1 ปี...
            </div>
          ) : subKrs.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed #cbd5e1'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <p style={{ fontWeight: 600, margin: '0 0 0.35rem 0', color: 'var(--foreground)', fontSize: '0.92rem' }}>
                ยังไม่มีการกำหนด KR ย่อยสำหรับ {selectedQuarter} ในแผนปฏิบัติการ 1 ปี
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--secondary-foreground)', margin: '0 0 1rem 0' }}>
                หากต้องการติดตามตัวชี้วัดย่อย/กิจกรรมรายไตรมาส สามารถเพิ่มได้ที่หน้าแผนปฏิบัติการ 1 ปี (เพิ่มแล้วจะมาแสดงที่นี่อัตโนมัติ)
              </p>
              <Link
                href="/editor/action-plan"
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', fontSize: '0.82rem' }}
              >
                <ExternalLink size={14} /> ไปที่หน้า แผนปฏิบัติการ 1 ปี
              </Link>
            </div>
          ) : (
            <div>
              <div className="table-container" style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <table className="table-sticky-header" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', width: '130px', fontSize: '0.85rem' }}>รหัส</th>
                      <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.85rem' }}>วิธีการวัดผล (KR ย่อย)</th>
                      <th style={{ padding: '0.625rem 0.875rem', textAlign: 'center', width: '140px', fontSize: '0.85rem' }}>เกณฑ์เป้าหมาย</th>
                      <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', width: '280px', fontSize: '0.85rem' }}>
                        ช่องรายงานผล (เลข/ข้อความ)
                      </th>
                      <th style={{ padding: '0.625rem 0.875rem', textAlign: 'center', width: '170px', fontSize: '0.85rem' }}>
                        สถานะดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subKrs.map((item, idx) => {
                      const v = subKrValues[item.id] || { result_value: '', status: 'กำลังดำเนินการ' };
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600, color: '#1d4ed8', fontSize: '0.85rem' }}>
                            {item.auto_id}
                          </td>
                          <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.88rem', lineHeight: '1.4' }}>
                            {item.kpi_name}
                          </td>
                          <td style={{ padding: '0.625rem 0.875rem', textAlign: 'center', fontWeight: 600, fontSize: '0.88rem', color: '#0f766e' }}>
                            <span style={{ backgroundColor: '#ccfbf1', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                              {item.target_value || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.875rem' }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="ระบุผลงาน (เช่น 85% หรือ จัดอบรมแล้ว)"
                              value={v.result_value}
                              onChange={e => handleSubKrChange(item.id, 'result_value', e.target.value)}
                              style={{ width: '100%', fontSize: '0.85rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem 0.875rem', textAlign: 'center' }}>
                            <select
                              className="input-field"
                              value={v.status}
                              onChange={e => handleSubKrChange(item.id, 'status', e.target.value)}
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: v.status === 'ผ่าน' ? '#166534' : v.status === 'ไม่ผ่าน' ? '#991b1b' : '#854d0e',
                                backgroundColor: v.status === 'ผ่าน' ? '#f0fdf4' : v.status === 'ไม่ผ่าน' ? '#fef2f2' : '#fffbeb',
                                borderColor: v.status === 'ผ่าน' ? '#bbf7d0' : v.status === 'ไม่ผ่าน' ? '#fecaca' : '#fde68a',
                              }}
                            >
                              <option value="ผ่าน">✅ ผ่าน</option>
                              <option value="กำลังดำเนินการ">🔄 กำลังดำเนินการ</option>
                              <option value="ไม่ผ่าน">❌ ไม่ผ่าน</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)' }}>
                  * รายการ KR ย่อยเชื่อมโยงกับหน้าแผนปฏิบัติการ 1 ปี (เพิ่มหรือลบในแผนจะอัปเดตตรงนี้ทันที)
                </span>
                <button
                  type="button"
                  onClick={handleSaveSubKrs}
                  disabled={savingSubKrs}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1.25rem' }}
                >
                  <Save size={16} />
                  {savingSubKrs ? 'กำลังบันทึก KR ย่อย...' : `💾 บันทึกผล KR ย่อย (${selectedQuarter})`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3 (หรือ 2 สำหรับตัวชี้วัดประเภทอื่นๆ): กรอกข้อมูลยอดสะสม / ภาพรวมตามเดิม */}
      {currentKpi && currentKpi.kr_id && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileSpreadsheet size={18} />
                {cumulativeSectionNum}. กรอกข้อมูล {selectedQuarter} {currentKpi.calc_type === 'process_status' ? '(เชิงกระบวนการ)' : '(ยอดสะสม / ภาพรวม)'}
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--secondary-foreground)' }}>
                {currentKpi.calc_type === 'process_status'
                  ? 'บันทึกสถานะการดำเนินงานภาพรวมและคำอธิบายความก้าวหน้า'
                  : 'บันทึกข้อมูลตัวแปรตามสูตรคำนวณและระดับการวัดผล'}
              </p>
            </div>
            <button onClick={loadMeasurements} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
              ↩ โหลดข้อมูลเดิม
            </button>
          </div>

          {/* HDC Auto Sync Banner */}
          {currentKpi.api_enabled && currentKpi.calc_type !== 'process_status' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
                    ตัวชี้วัดนี้เชื่อมต่อกับ HDC Open Data (ตาราง: <code>{currentKpi.api_config_json?.tableName || currentKpi.api_config_json?.A?.tableName || 's_ttm27'}</code>)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                    ระดับ: {currentKpi.measurement_level === 'hospital' ? '9 โรงพยาบาล' : currentKpi.measurement_level === 'district' ? '9 อำเภอ (areacode 2701-2709)' : 'ภาพรวมจังหวัด'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {hdcSyncMsg && (
                  <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                    {hdcSyncMsg}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSyncHdc}
                  disabled={syncingHdc}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {syncingHdc ? '⏳ กำลังดึง HDC...' : '🔄 ดึงผลงานจาก HDC อัตโนมัติ'}
                </button>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', marginBottom: '1.25rem', fontSize: '0.83rem', color: '#854d0e' }}>
            💡 {currentKpi.calc_type === 'process_status'
              ? 'เลือกสถานะความคืบหน้า แล้วกรอกรายละเอียดผลการดำเนินงาน'
              : 'กรอกยอดสะสมตั้งแต่ 1 ต.ค. — ปัจจุบัน หรือกดปุ่ม "ดึงผลงานจาก HDC อัตโนมัติ" ด้านบน ระบบจะคำนวณผลลัพธ์ให้อัตโนมัติ'}
          </div>

          {currentKpi.calc_type === 'process_status' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.88rem' }}>สถานะการดำเนินงาน</label>
                <select className="input-field" value={processStatus} onChange={e => setProcessStatus(e.target.value)}>
                  <option value="success">✅ ผ่าน (ดำเนินการแล้วเสร็จ)</option>
                  <option value="warning">⚠️ ไม่ผ่าน (ล่าช้ากว่าแผน)</option>
                  <option value="pending">🔄 อยู่ระหว่างดำเนินการ</option>
                  <option value="error">❌ ยังไม่ดำเนินการ</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.88rem' }}>รายละเอียดผลการดำเนินงาน</label>
                <textarea className="input-field" rows={4}
                  placeholder="ระบุข้อความอธิบายความคืบหน้า ผลลัพธ์ที่ได้ หรือแนบลิงก์เอกสาร..."
                  value={processDesc} onChange={e => setProcessDesc(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table-sticky-header" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', width: '220px', fontSize: '0.85rem' }}>พื้นที่ / หน่วยบริการ</th>
                    {currentKpi.data_items.map(item => (
                      <th key={item.id} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.85rem' }}>
                        ตัวแปร {item.id}<br />
                        <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--secondary-foreground)' }}>{item.label}</span>
                      </th>
                    ))}
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'center', width: '110px', fontSize: '0.85rem' }}>ผลลัพธ์</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map(area => {
                    const areaId = area === 'province' ? 'province' : area;
                    const areaVals = values[areaId] || {};
                    const result = computeResult(currentKpi.calc_formula, areaVals);
                    const statusColor = getStatusColor(result, currentKpi);
                    return (
                      <tr key={areaId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.5rem 0.875rem', fontWeight: 500, fontSize: '0.88rem' }}>
                          {area === 'province' ? (
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>🏛️ ภาพรวมจังหวัดสระแก้ว</span>
                          ) : currentKpi.measurement_level === 'hospital' ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{area}</span>
                              <span style={{ fontSize: '0.68rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 600 }}>
                                🏥 รพ.
                              </span>
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{area}</span>
                              <span style={{ fontSize: '0.68rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '3px', fontWeight: 600 }}>
                                🏘️ อ.
                              </span>
                            </span>
                          )}
                        </td>
                        {currentKpi.data_items.map(item => (
                          <td key={item.id} style={{ padding: '0.375rem 0.875rem' }}>
                            <input type="number" className="input-field"
                              placeholder={`ยอดสะสม`}
                              value={areaVals[item.id] || ''}
                              onChange={e => setVal(areaId, item.id, e.target.value)}
                              style={{ maxWidth: '120px' }} />
                          </td>
                        ))}
                        <td style={{ padding: '0.5rem 0.875rem', textAlign: 'center', fontWeight: 700, color: statusColor, fontSize: '0.95rem' }}>
                          {result}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {currentKpi.measurement_level !== 'province' && areas.length > 1 && (() => {
                  const provTotals: Record<string, number> = {};
                  areas.forEach(areaId => {
                    const areaVals = values[areaId] || {};
                    Object.entries(areaVals).forEach(([k, v]) => {
                      const num = parseFloat(String(v).replace(/,/g, ''));
                      if (!isNaN(num)) {
                        provTotals[k] = (provTotals[k] || 0) + num;
                      }
                    });
                  });
                  const provTotalsStr: Record<string, string> = {};
                  Object.entries(provTotals).forEach(([k, v]) => {
                    provTotalsStr[k] = String(v);
                  });
                  const provResult = computeResult(currentKpi.calc_formula, provTotalsStr);
                  const provStatusColor = getStatusColor(provResult, currentKpi);

                  return (
                    <tfoot>
                      <tr style={{ backgroundColor: 'var(--secondary)', borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                        <td style={{ padding: '0.75rem 0.875rem', color: 'var(--primary)' }}>
                          🏛️ รวมยอดสะสมทั้งจังหวัด (คำนวณอัตโนมัติ)
                        </td>
                        {currentKpi.data_items.map(item => (
                          <td key={item.id} style={{ padding: '0.75rem 0.875rem', color: 'var(--foreground)' }}>
                            {(provTotals[item.id] || 0).toLocaleString()}
                          </td>
                        ))}
                        <td style={{ padding: '0.75rem 0.875rem', textAlign: 'center', color: provStatusColor, fontSize: '1.05rem' }}>
                          {provResult}
                        </td>
                      </tr>
                    </tfoot>
                  );
                })()}
              </table>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : `💾 บันทึกผลภาพรวม/พื้นที่ (${selectedQuarter})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
