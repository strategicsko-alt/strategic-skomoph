'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import healthFacilitiesData from '@/data/sa_kaeo_health_facilities.json';
import realAnc5Data from '@/data/real_anc5_2569.json';
import realAnc12Data from '@/data/real_anc12_2569.json';
import PopulationVitalDashboard from '@/components/vital-stats/PopulationVitalDashboard';
import { SA_KAEO_HOSPITALS } from '@/lib/hdc';

export const dynamic = 'force-dynamic';

const DISTRICTS = [
  "เมืองสระแก้ว", "คลองหาด", "ตาพระยา", "วังน้ำเย็น", 
  "วัฒนานคร", "อรัญประเทศ", "เขาฉกรรจ์", "โคกสูง", "วังสมบูรณ์"
];

// Reusing WORK_GROUPS from mock or defining them
const WORK_GROUPS = [
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

const UNIQUE_WORK_GROUPS = Array.from(new Set(WORK_GROUPS));

const KPI_TYPE_OPTIONS = [
  { id: 'strategic', label: 'ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)' },
  { id: 'all', label: 'ทุกประเภทตัวชี้วัด' },
  { id: 'ministry', label: 'ตัวชี้วัดกระทรวงสาธารณสุข' },
  { id: 'inspection', label: 'ตัวชี้วัดตรวจราชการ' },
  { id: 'standalone', label: 'ตัวชี้วัดอื่นๆ / นโยบายเร่งด่วน' },
];

// HDC Taxonomy (Major Category & Subcategory)
export const HDC_CATEGORIES: Record<string, string[]> = {
  "การเข้าถึงบริการ": [
    "CMI",
    "การบำบัดรักษาและฟื้นฟูผู้ติดยาเสพติด จากระบบ(บสต.)",
    "การเข้าถึงระบบบริการสุขภาพจิต",
    "การใช้บริการสาธารณสุข",
    "ต่างด้าว",
    "ทันตกรรม(บริการ)",
    "สุขภาพประชากรข้ามชาติ",
    "เภสัชกรรม",
    "แพทย์แผนจีน",
    "แพทย์แผนไทย",
    "โรคจากการประกอบอาชีพและสิ่งแวดล้อมแรงงานต่างด้าว",
    "โรคมาลาเรีย"
  ],
  "ข้อมูลตอบสนอง service plan": [
    "ข้อมูลเพื่อตอบสนอง Service Plan 4 สาขาหลัก",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขา Intermediate & Palliative Care",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขา RDU",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขากัญชา",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาตา",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาทารกแรกเกิด",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขามะเร็ง",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขายาเสพติด",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาสุขภาพจิตและจิตเวช",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาสุขภาพช่องปาก",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาออร์โธปิดิกส์",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาอายุรกรรม",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาแม่และเด็ก",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาโรคปอดอุดกั้นเรื้อรัง(COPD)",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาโรคหัวใจ และหลอดเลือด",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาโรคไม่ติดต่อ (NCD DM,HT,CVD)",
    "ข้อมูลเพื่อตอบสนอง Service Plan สาขาไต"
  ],
  "ข้อมูลทั่วไป": [
    "ข้อมูลพื้นฐานและสรุปผู้รับบริการ",
    "ความครอบคลุมการมีหลักประกันสุขภาพโดยรัฐ",
    "จำนวนหน่วยงานสาธารณสุข",
    "บุคลากรสาธารณสุข",
    "ประชากร",
    "โรงเรียนและนักเรียน"
  ],
  "ส่งเสริมป้องกัน": [
    "การคัดกรอง",
    "การสร้างเสริมภูมิคุ้มกันโรค",
    "การเฝ้าระวัง",
    "การเฝ้าระวังด้านส่งเสริมสุขภาพและอนามัยสิ่งแวดล้อม",
    "งานโภชนาการ",
    "ส่งเสริมและป้องกันปัญหาสุขภาพจิต",
    "อนามัยแม่และเด็ก",
    "อนามัยโรงเรียน"
  ],
  "สถานะสุขภาพ": [
    "กลุ่มพระภิกษุ-สามเณร",
    "การป่วยด้วยโรคจากมลพิษทางอากาศ",
    "การป่วยด้วยโรคติดต่อที่สำคัญ",
    "การป่วยด้วยโรคไม่ติดต่อที่สำคัญ",
    "การรายงานโรคตามพรบ.โรคติดต่อ พ.ศ. 2558",
    "งานวัณโรค",
    "สาเหตุการป่วย/ตาย",
    "โรคจากการประกอบอาชีพและสิ่งแวดล้อม"
  ]
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'detail' | 'executive' | 'subdistrict' | 'vital'>('executive');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q4');
  const [filterKpiType, setFilterKpiType] = useState<string>('strategic');
  const [statusQuickFilter, setStatusQuickFilter] = useState<'all' | 'success' | 'warning' | 'error' | 'pending'>('all');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [kpis, setKpis] = useState<any[]>([]);
  const [strategicIssues, setStrategicIssues] = useState<any[]>([]);
  const [actionPlanMeasurements, setActionPlanMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKpiId, setSelectedKpiId] = useState<string>('');
  const [heatmapAreaMode, setHeatmapAreaMode] = useState<'district' | 'hospital'>('district');
  const [syncingAllHdc, setSyncingAllHdc] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string>('');

  // Subdistrict & HDC States
  const [subdistrictDistrict, setSubdistrictDistrict] = useState<string>('ALL');
  const [subdistrictSearch, setSubdistrictSearch] = useState<string>('');
  const [subdistrictViewMode, setSubdistrictViewMode] = useState<'matrix' | 'list'>('matrix');
  const [isAddHdcModalOpen, setIsAddHdcModalOpen] = useState<boolean>(false);
  const [fetchingHdcId, setFetchingHdcId] = useState<string | null>(null);
  const [isSubdistrictFullscreen, setIsSubdistrictFullscreen] = useState<boolean>(false);

  // Category filters for HDC KPIs
  const [hdcFilterMainCategory, setHdcFilterMainCategory] = useState<string>('ALL');
  const [hdcFilterSubCategory, setHdcFilterSubCategory] = useState<string>('ALL');

  // Edit HDC KPI State
  const [isEditHdcModalOpen, setIsEditHdcModalOpen] = useState<boolean>(false);
  const [editingHdcKpi, setEditingHdcKpi] = useState<{
    id: string;
    code: string;
    name: string;
    tableName: string;
    year: string;
    mainCategory: string;
    subCategory: string;
    targetOperator: string;
    targetValue: number;
    warningValue?: number;
    resultColumn?: string;
    targetColumn?: string;
    refetchOnSave: boolean;
  } | null>(null);

  // Auto-sync HDC States (Daily 08:00 AM)
  const [autoSyncStatus, setAutoSyncStatus] = useState<string>('');
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const isSyncingRef = useRef<boolean>(false);

  // HDC Schema Inspector State (for live column detection & sample preview)
  const [inspectingHdc, setInspectingHdc] = useState<boolean>(false);
  const [inspectedSchema, setInspectedSchema] = useState<{
    tableName: string;
    sampleRow: any;
    availableCols: string[];
  } | null>(null);

  // Dedicated HDC KPIs list (Real Data from MOPH HDC Open Data)
  const [hdcKpis, setHdcKpis] = useState<Array<{
    id: string;
    code: string;
    name: string;
    tableName: string;
    year: string;
    mainCategory?: string;
    subCategory?: string;
    targetOperator: string;
    targetValue: number;
    warningValue?: number;
    resultColumn?: string;
    targetColumn?: string;
    results: Record<string, { value: number | string; status: 'success' | 'warning' | 'error' | 'pending'; detail?: string }>;
  }>>([
    {
      id: 'hdc-anc5',
      code: 'HDC-01',
      name: 'ร้อยละหญิงตั้งครรภ์ที่ได้รับการดูแลก่อนคลอด 5 ครั้ง ตามเกณฑ์',
      tableName: 's_anc5',
      year: '2569',
      mainCategory: 'ส่งเสริมป้องกัน',
      subCategory: 'อนามัยแม่และเด็ก',
      targetOperator: '>=',
      targetValue: 75,
      warningValue: 60,
      resultColumn: 'result',
      targetColumn: 'target',
      results: realAnc5Data as Record<string, any>
    },
    {
      id: 'hdc-anc12',
      code: 'HDC-02',
      name: 'ร้อยละหญิงตั้งครรภ์ได้รับการฝากครรภ์ครั้งแรกก่อนหรือเท่ากับ 12 สัปดาห์',
      tableName: 's_kpi_anc12',
      year: '2569',
      mainCategory: 'ส่งเสริมป้องกัน',
      subCategory: 'อนามัยแม่และเด็ก',
      targetOperator: '>=',
      targetValue: 75,
      warningValue: 60,
      resultColumn: 'result',
      targetColumn: 'target',
      results: realAnc12Data as Record<string, any>
    }
  ]);

  const [newHdcForm, setNewHdcForm] = useState({
    code: 'HDC-03',
    name: '',
    tableName: 's_labor_hct',
    year: '2569',
    mainCategory: 'ส่งเสริมป้องกัน',
    subCategory: 'อนามัยแม่และเด็ก',
    targetOperator: '<=',
    targetValue: 11,
    warningValue: 15,
    resultColumn: 'result2',
    targetColumn: 'target'
  });

  // Inspect table schema directly from HDC API
  const handleInspectHdcTable = async (tableName: string, year: string) => {
    const cleanTable = (tableName || '').trim();
    if (!cleanTable) {
      alert('กรุณาระบุชื่อตาราง HDC ก่อนตรวจสอบ');
      return;
    }
    setInspectingHdc(true);
    setInspectedSchema(null);
    try {
      let result: any = null;
      try {
        const directRes = await fetch('https://opendata.moph.go.th/api/report_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName: cleanTable,
            year: String(year || '2569'),
            province: '27',
            type: 'json'
          })
        });
        if (directRes.ok) result = await directRes.json();
      } catch (e) {}

      if (!result || !result.data) {
        const res = await fetch('/api/hdc/report-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName: cleanTable,
            year: String(year || '2569'),
            province: '27'
          })
        });
        if (res.ok) result = await res.json();
      }

      if (result && Array.isArray(result.data) && result.data.length > 0) {
        const sample = result.data.find((r: any) => r && typeof r === 'object') || result.data[0];
        const ignoreKeys = ['id', 'areacode', 'flag_sent', 'date_com', 'b_year', 'ip'];
        const numCols = Object.keys(sample).filter(k => !ignoreKeys.includes(k) && k !== 'hospcode');
        setInspectedSchema({
          tableName: cleanTable,
          sampleRow: sample,
          availableCols: numCols
        });
      } else {
        alert(`เชื่อมต่อได้ แต่ไม่พบข้อมูลในตาราง "${cleanTable}" ของจังหวัดสระแก้ว ประจำปี ${year}`);
      }
    } catch (err: any) {
      alert(`ไม่สามารถตรวจสอบตารางได้: ${err.message || err}`);
    } finally {
      setInspectingHdc(false);
    }
  };

  // Fetch real data from MOPH HDC Open Data Web Service
  // Load saved custom HDC KPIs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hdc_kpis_custom_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure HDC-02 (s_kpi_anc12) is available
          const hasAnc12 = parsed.some((k: any) => k.tableName === 's_kpi_anc12');
          if (!hasAnc12) {
            parsed.push({
              id: 'hdc-anc12',
              code: 'HDC-02',
              name: 'ร้อยละหญิงตั้งครรภ์ได้รับการฝากครรภ์ครั้งแรกก่อนหรือเท่ากับ 12 สัปดาห์',
              tableName: 's_kpi_anc12',
              year: '2569',
              mainCategory: 'ส่งเสริมป้องกัน',
              subCategory: 'อนามัยแม่และเด็ก',
              targetOperator: '>=',
              targetValue: 75,
              warningValue: 60,
              resultColumn: 'result',
              targetColumn: 'target',
              results: realAnc12Data as Record<string, any>
            });
          }
          // Enrich any items that lack categories or have old s_labor_hct defaults
          const enriched = parsed.map((k: any) => {
            let mainCat = k.mainCategory;
            let subCat = k.subCategory;
            let resCol = k.resultColumn;
            let tarCol = k.targetColumn || 'target';
            if (!mainCat || !subCat) {
              if (k.tableName === 's_anc5' || k.tableName === 's_kpi_anc12') {
                mainCat = 'ส่งเสริมป้องกัน';
                subCat = 'อนามัยแม่และเด็ก';
              } else if (k.tableName === 's_ttm27') {
                mainCat = 'การเข้าถึงบริการ';
                subCat = 'แพทย์แผนไทย';
              } else {
                mainCat = 'ข้อมูลทั่วไป';
                subCat = 'ข้อมูลพื้นฐานและสรุปผู้รับบริการ';
              }
            }
            if (k.tableName === 's_labor_hct') {
              if (!resCol) {
                // For anemia (<='), result2 is the anemia cases column!
                resCol = k.targetOperator === '<=' ? 'result2' : 'result1';
              }
              if (k.targetOperator === '<=' && (!k.warningValue || k.warningValue <= k.targetValue)) {
                k.warningValue = 15;
              }
            }
            return {
              ...k,
              mainCategory: mainCat,
              subCategory: subCat,
              resultColumn: resCol,
              targetColumn: tarCol
            };
          });
          setHdcKpis(enriched);

          // Auto-refetch any KPI that has empty or all-0% results (such as freshly added s_labor_hct)
          enriched.forEach((k: any) => {
            const hasRealData = k.results && Object.values(k.results).some((r: any) => r && r.value && r.value !== '0%' && r.value !== '-');
            if (!hasRealData && k.tableName) {
              setTimeout(() => {
                handleFetchHdcData(k.id, k, true);
              }, 600);
            }
          });
        }
      }
    } catch (e) {}

    // Initialize auto-sync status text from storage
    try {
      const savedDate = localStorage.getItem('hdc_daily_last_sync_date');
      const savedTime = localStorage.getItem('hdc_daily_last_sync_time');
      const todayKey = new Date().toISOString().slice(0, 10);
      if (savedDate === todayKey && savedTime) {
        setAutoSyncStatus(`อัปเดตอัตโนมัติรอบ 08:00 น. แล้ว (${savedTime} น.)`);
      } else {
        setAutoSyncStatus('รอบการอัปเดตถัดไป: 08:00 น.');
      }
    } catch (e) {}
  }, []);

  // Listen for Escape key to exit fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSubdistrictFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFetchHdcData = async (kpiId: string, kpiObj?: any, silent = false) => {
    const targetKpi = kpiObj || hdcKpis.find(k => k.id === kpiId);
    if (!targetKpi) return;
    setFetchingHdcId(kpiId);
    try {
      let result: any = null;
      let fetchSuccess = false;

      // 1. Direct browser fetch (Thai residential/commercial IP, avoids Cloudflare US datacenter IP block)
      try {
        const directRes = await fetch('https://opendata.moph.go.th/api/report_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName: targetKpi.tableName,
            year: String(targetKpi.year),
            province: '27',
            type: 'json'
          })
        });

        if (directRes.status === 429) {
          throw new Error('HDC_RATE_LIMIT');
        }

        if (directRes.ok) {
          result = await directRes.json();
          fetchSuccess = true;
        }
      } catch (directErr: any) {
        if (directErr.message === 'HDC_RATE_LIMIT') {
          throw new Error('ระบบ HDC Open Data มีการจำกัดความถี่ในการเชื่อมต่อ (ไม่เกิน 10 ครั้ง/นาที)\nกรุณารอสักครู่ (ประมาณ 30-60 วินาที) แล้วลองกดดึงข้อมูลใหม่อีกครั้ง');
        }
        console.warn('Direct client HDC fetch failed, falling back to server proxy...', directErr);
      }

      // 2. Fallback to server proxy if direct fetch was blocked by network/browser
      if (!fetchSuccess) {
        const res = await fetch('/api/hdc/report-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName: targetKpi.tableName,
            year: targetKpi.year,
            province: '27'
          })
        });

        if (res.status === 429) {
          throw new Error('ระบบ HDC Open Data มีการจำกัดความถี่ในการเชื่อมต่อ (ไม่เกิน 10 ครั้ง/นาที)\nกรุณารอสักครู่ (ประมาณ 30-60 วินาที) แล้วลองกดดึงข้อมูลใหม่อีกครั้ง');
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `เซิร์ฟเวอร์ตอบกลับสถานะ ${res.status}`);
        }
        result = await res.json();
      }

      if (result && Array.isArray(result.data)) {
        if (result.data.length === 0) {
          if (!silent) {
            alert(`เชื่อมต่อ HDC สำเร็จ แต่ไม่พบข้อมูลในตาราง "${targetKpi.tableName}" ของจังหวัดสระแก้ว ประจำปี ${targetKpi.year}`);
          }
          return;
        }

        // Resolve result and target columns (explicit or smart auto-detection)
        let resolvedResultCol = targetKpi.resultColumn?.trim() || '';
        let resolvedTargetCol = targetKpi.targetColumn?.trim() || 'target';

        if (!resolvedResultCol && result.data.length > 0) {
          const sample = result.data.find((r: any) => r && typeof r === 'object') || result.data[0];
          if (sample) {
            // For s_labor_hct with <= operator (anemia rate), result2 is the positive anemia cases!
            if (targetKpi.tableName === 's_labor_hct' && targetKpi.targetOperator === '<=') {
              resolvedResultCol = 'result2';
            } else if (sample.result !== undefined && sample.result !== null) {
              resolvedResultCol = 'result';
            } else if (sample.result1 !== undefined && sample.result1 !== null) {
              resolvedResultCol = 'result1';
            } else if (sample.result2 !== undefined && sample.result2 !== null) {
              resolvedResultCol = 'result2';
            } else if (sample.result4 !== undefined) {
              resolvedResultCol = 'result4';
            }
          }
        }
        if (!resolvedResultCol) resolvedResultCol = 'result';

        // Aggregate records by hospcode
        const byHosp: Record<string, { target: number; result: number }> = {};
        result.data.forEach((row: any) => {
          const hc = String(row.hospcode).padStart(5, '0');
          if (!byHosp[hc]) byHosp[hc] = { target: 0, result: 0 };

          // 1. Target (Denominator)
          let tVal = 0;
          if (row[resolvedTargetCol] !== undefined && row[resolvedTargetCol] !== null) {
            tVal = Number(row[resolvedTargetCol]) || 0;
          } else if (row.target !== undefined && row.target !== null) {
            tVal = Number(row.target) || 0;
          } else if (row.target4 !== undefined) {
            tVal = Number(row.target4) || 0;
          } else if (row.op_service_pt_q1 !== undefined) {
            const opSum = (Number(row.op_service_pt_q1) || 0) + (Number(row.op_service_pt_q2) || 0) + (Number(row.op_service_pt_q3) || 0) + (Number(row.op_service_pt_q4) || 0);
            tVal = opSum > 0 ? opSum : (Number(row.op_service_pt_q1) || 0);
          }

          // 2. Result (Numerator)
          let rVal = 0;
          if (row[resolvedResultCol] !== undefined && row[resolvedResultCol] !== null) {
            rVal = Number(row[resolvedResultCol]) || 0;
          } else if (row.result !== undefined && row.result !== null) {
            rVal = Number(row.result) || 0;
          } else if (row.result1 !== undefined && row.result1 !== null) {
            rVal = Number(row.result1) || 0;
          } else if (row.result2 !== undefined && row.result2 !== null) {
            rVal = Number(row.result2) || 0;
          } else if (row.result4 !== undefined) {
            rVal = Number(row.result4) || 0;
          } else if (row.tm_service_pt_q1 !== undefined) {
            const tmSum = (Number(row.tm_service_pt_q1) || 0) + (Number(row.tm_service_pt_q2) || 0) + (Number(row.tm_service_pt_q3) || 0) + (Number(row.tm_service_pt_q4) || 0);
            rVal = tmSum > 0 ? tmSum : (Number(row.tm_service_pt_q1) || 0);
          }

          byHosp[hc].target += tVal;
          byHosp[hc].result += rVal;
        });

        const newResults: Record<string, any> = {};
        Object.entries(byHosp).forEach(([hc, vals]) => {
          if (vals.target > 0) {
            const pct = Math.round((vals.result / vals.target) * 1000) / 10;
            const isLessBetter = targetKpi.targetOperator === '<=';

            let warnThreshold: number;
            if (targetKpi.warningValue !== undefined && targetKpi.warningValue !== null && !isNaN(Number(targetKpi.warningValue))) {
              warnThreshold = Number(targetKpi.warningValue);
            } else {
              warnThreshold = isLessBetter 
                ? Math.round(targetKpi.targetValue * 1.3 * 10) / 10 
                : Math.round(targetKpi.targetValue * 0.8 * 10) / 10;
            }

            let isPass = false;
            let isWarn = false;

            if (isLessBetter) {
              // <= (น้อยกว่าหรือเท่ากับ: ยิ่งน้อยยิ่งดี)
              isPass = pct <= targetKpi.targetValue;
              isWarn = !isPass && pct <= warnThreshold;
            } else {
              // >= (มากกว่าหรือเท่ากับ: ยิ่งมากยิ่งดี)
              isPass = pct >= targetKpi.targetValue;
              isWarn = !isPass && pct >= warnThreshold;
            }

            newResults[hc] = {
              value: `${pct}%`,
              status: isPass ? 'success' : isWarn ? 'warning' : 'error',
              detail: `${vals.result}/${vals.target} คน`
            };
          } else {
            // Target is 0 -> pending/gray (no target group)
            newResults[hc] = {
              value: '-',
              status: 'pending',
              detail: '0/0 คน (ไม่มีกลุ่มเป้าหมาย)'
            };
          }
        });

        setHdcKpis(prev => {
          const updated = prev.map(k => k.id === kpiId ? { ...k, results: newResults } : k);
          try { localStorage.setItem('hdc_kpis_custom_v1', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });

        if (!silent) {
          alert(`✅ ดึงข้อมูลสดจาก HDC Open Data สำเร็จ!\nตาราง: ${targetKpi.tableName} (ปี ${targetKpi.year})\nพบข้อมูลหน่วยบริการ: ${Object.keys(newResults).length} แห่ง`);
        }
      } else {
        if (!silent) {
          alert(`ไม่สามารถดึงข้อมูลจาก HDC ได้\n${result?.message || result?.error || 'กรุณาลองใหม่อีกครั้ง'}`);
        }
      }
    } catch (err: any) {
      if (!silent) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ HDC:\n' + err.message);
      }
    } finally {
      setFetchingHdcId(null);
    }
  };

  // Daily auto-sync at 08:00 AM check
  const checkAndRunDailySync = async (listToSync?: any[]) => {
    if (isSyncingRef.current) return;
    const currentList = listToSync || hdcKpis;
    if (!currentList || currentList.length === 0) return;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const lastSyncDate = localStorage.getItem('hdc_daily_last_sync_date');
    const currentHour = now.getHours();

    // Check if 08:00 AM or later and haven't synced today yet
    if (currentHour >= 8 && lastSyncDate !== todayKey) {
      isSyncingRef.current = true;
      setIsAutoSyncing(true);
      setAutoSyncStatus('⏳ กำลังอัปเดตข้อมูลอัตโนมัติรอบ 08:00 น. ...');
      
      try {
        for (const kpi of currentList) {
          await handleFetchHdcData(kpi.id, kpi, true);
          // Wait 600ms between requests to avoid exceeding MOPH rate limit
          await new Promise(r => setTimeout(r, 600));
        }
        localStorage.setItem('hdc_daily_last_sync_date', todayKey);
        const syncTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem('hdc_daily_last_sync_time', syncTimeStr);
        setAutoSyncStatus(`✅ อัปเดตอัตโนมัติรอบ 08:00 น. แล้ว (${syncTimeStr} น.)`);
      } catch (err) {
        setAutoSyncStatus('รอบการอัปเดต 08:00 น. ขัดข้อง จะลองใหม่');
      } finally {
        setIsAutoSyncing(false);
        isSyncingRef.current = false;
      }
    } else if (lastSyncDate === todayKey) {
      const savedTime = localStorage.getItem('hdc_daily_last_sync_time') || '08:00';
      setAutoSyncStatus(`✅ อัปเดตอัตโนมัติรอบ 08:00 น. แล้ว (${savedTime} น.)`);
    } else {
      setAutoSyncStatus('รอบการอัปเดตถัดไป: 08:00 น.');
    }
  };

  // Auto-sync interval & mount check
  useEffect(() => {
    if (hdcKpis.length > 0) {
      checkAndRunDailySync(hdcKpis);
    }
    const interval = setInterval(() => {
      checkAndRunDailySync();
    }, 60000);
    return () => clearInterval(interval);
  }, [hdcKpis.length]);

  // Force sync all HDC KPIs at once
  const handleSyncAllHdc = async () => {
    if (isAutoSyncing || fetchingHdcId !== null) return;
    setIsAutoSyncing(true);
    setAutoSyncStatus('⏳ กำลังซิงค์ข้อมูลทุกตัวชี้วัด...');
    try {
      for (const kpi of hdcKpis) {
        await handleFetchHdcData(kpi.id, kpi, true);
        await new Promise(r => setTimeout(r, 600));
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem('hdc_daily_last_sync_date', now.toISOString().slice(0, 10));
      localStorage.setItem('hdc_daily_last_sync_time', timeStr);
      setAutoSyncStatus(`✅ อัปเดตล่าสุด: วันนี้ ${timeStr} น.`);
      alert(`✅ ซิงค์ข้อมูลสดจาก HDC Open Data ครบทั้ง ${hdcKpis.length} ตัวชี้วัดเรียบร้อยแล้ว!`);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดขณะซิงค์ข้อมูล: ' + err.message);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Edit HDC KPI handlers
  const handleOpenEditHdcModal = (kpi: any) => {
    const isLess = kpi.targetOperator === '<=';
    const defaultWarn = isLess
      ? (kpi.warningValue !== undefined && kpi.warningValue > kpi.targetValue ? kpi.warningValue : Math.round(kpi.targetValue * 1.3) || (kpi.targetValue + 4))
      : (kpi.warningValue !== undefined ? kpi.warningValue : Math.round(kpi.targetValue * 0.8));

    setEditingHdcKpi({
      id: kpi.id,
      code: kpi.code,
      name: kpi.name,
      tableName: kpi.tableName,
      year: String(kpi.year || '2569'),
      mainCategory: kpi.mainCategory || 'ส่งเสริมป้องกัน',
      subCategory: kpi.subCategory || 'อนามัยแม่และเด็ก',
      targetOperator: kpi.targetOperator || '>=',
      targetValue: kpi.targetValue,
      warningValue: defaultWarn,
      resultColumn: kpi.resultColumn || (kpi.tableName === 's_labor_hct' ? (kpi.targetOperator === '<=' ? 'result2' : 'result1') : ''),
      targetColumn: kpi.targetColumn || 'target',
      refetchOnSave: true
    });
    setInspectedSchema(null);
    setIsEditHdcModalOpen(true);
  };

  const handleSaveEditHdcKpi = async () => {
    if (!editingHdcKpi) return;
    if (!editingHdcKpi.name.trim()) {
      alert('กรุณากรอกชื่อตัวชี้วัด');
      return;
    }
    const cleanTable = editingHdcKpi.tableName.trim();
    if (!cleanTable) {
      alert('กรุณากรอกชื่อตาราง HDC Open Data');
      return;
    }

    const currentKpi = hdcKpis.find(k => k.id === editingHdcKpi.id);
    const tableOrYearChanged = currentKpi && (currentKpi.tableName !== cleanTable || String(currentKpi.year) !== String(editingHdcKpi.year));
    const columnChanged = currentKpi && (
      (currentKpi.resultColumn || '') !== (editingHdcKpi.resultColumn || '') ||
      (currentKpi.targetColumn || 'target') !== (editingHdcKpi.targetColumn || 'target')
    );
    const isLess = editingHdcKpi.targetOperator === '<=';
    const targetVal = Number(editingHdcKpi.targetValue);
    const warnVal = editingHdcKpi.warningValue !== undefined && !isNaN(Number(editingHdcKpi.warningValue))
      ? Number(editingHdcKpi.warningValue)
      : (isLess ? Math.round(targetVal * 1.3) || (targetVal + 4) : Math.round(targetVal * 0.8));

    const updatedKpi = {
      ...(currentKpi || {}),
      id: editingHdcKpi.id,
      code: editingHdcKpi.code,
      name: editingHdcKpi.name.trim(),
      tableName: cleanTable,
      year: String(editingHdcKpi.year || '2569'),
      mainCategory: editingHdcKpi.mainCategory || 'ส่งเสริมป้องกัน',
      subCategory: editingHdcKpi.subCategory || 'อนามัยแม่และเด็ก',
      targetOperator: editingHdcKpi.targetOperator,
      targetValue: targetVal,
      warningValue: warnVal,
      resultColumn: editingHdcKpi.resultColumn?.trim() || '',
      targetColumn: editingHdcKpi.targetColumn?.trim() || 'target',
      results: currentKpi?.results || {}
    };

    const updatedList = hdcKpis.map(k => k.id === editingHdcKpi.id ? updatedKpi : k);
    setHdcKpis(updatedList);
    try {
      localStorage.setItem('hdc_kpis_custom_v1', JSON.stringify(updatedList));
    } catch (e) {}

    setIsEditHdcModalOpen(false);

    if (editingHdcKpi.refetchOnSave || tableOrYearChanged || columnChanged) {
      await handleFetchHdcData(updatedKpi.id, updatedKpi);
    } else {
      // Recalculate heatmap statuses with new target/warning values
      const currentResults = updatedKpi.results || {};
      const recalculated: Record<string, any> = {};
      Object.entries(currentResults).forEach(([hc, r]: [string, any]) => {
        if (r && r.value && r.value !== '-') {
          const pct = parseFloat(String(r.value).replace('%', ''));
          if (!isNaN(pct)) {
            const isLessBetter = updatedKpi.targetOperator === '<=';
            const warnTarget = updatedKpi.warningValue !== undefined && !isNaN(Number(updatedKpi.warningValue))
              ? Number(updatedKpi.warningValue)
              : (isLessBetter ? Math.round(updatedKpi.targetValue * 1.3) : Math.round(updatedKpi.targetValue * 0.8));
            
            let isPass = false;
            let isWarn = false;
            if (isLessBetter) {
              isPass = pct <= updatedKpi.targetValue;
              isWarn = !isPass && pct <= warnTarget;
            } else {
              isPass = pct >= updatedKpi.targetValue;
              isWarn = !isPass && pct >= warnTarget;
            }

            recalculated[hc] = {
              ...r,
              status: isPass ? 'success' : isWarn ? 'warning' : 'error'
            };
          } else {
            recalculated[hc] = r;
          }
        } else {
          recalculated[hc] = r;
        }
      });
      const finalUpdatedList = updatedList.map(k => k.id === updatedKpi.id ? { ...k, results: recalculated } : k);
      setHdcKpis(finalUpdatedList);
      try {
        localStorage.setItem('hdc_kpis_custom_v1', JSON.stringify(finalUpdatedList));
      } catch (e) {}
      alert('✅ บันทึกการแก้ไขตัวชี้วัดเรียบร้อยแล้ว');
    }
  };

  const handleCreateHdcKpi = async () => {
    if (!newHdcForm.name.trim()) {
      alert('กรุณากรอกชื่อตัวชี้วัด');
      return;
    }
    const cleanTable = newHdcForm.tableName.trim();
    if (!cleanTable) {
      alert('กรุณากรอกชื่อตาราง HDC Open Data (เช่น s_labor_hct, s_anc5)');
      return;
    }
    const isLess = newHdcForm.targetOperator === '<=';
    const targetVal = Number(newHdcForm.targetValue) || 0;
    const warnVal = newHdcForm.warningValue !== undefined && !isNaN(Number(newHdcForm.warningValue))
      ? Number(newHdcForm.warningValue)
      : (isLess ? Math.round(targetVal * 1.3) || (targetVal + 4) : Math.round(targetVal * 0.8));

    const newKpi = {
      id: `hdc-${Date.now()}`,
      code: newHdcForm.code || `HDC-0${hdcKpis.length + 1}`,
      name: newHdcForm.name.trim(),
      tableName: cleanTable,
      year: newHdcForm.year || '2569',
      mainCategory: newHdcForm.mainCategory || 'ส่งเสริมป้องกัน',
      subCategory: newHdcForm.subCategory || 'อนามัยแม่และเด็ก',
      targetOperator: newHdcForm.targetOperator || '>=',
      targetValue: targetVal,
      warningValue: warnVal,
      resultColumn: newHdcForm.resultColumn?.trim() || '',
      targetColumn: newHdcForm.targetColumn?.trim() || 'target',
      results: {}
    };
    const updated = [...hdcKpis, newKpi];
    setHdcKpis(updated);
    try {
      localStorage.setItem('hdc_kpis_custom_v1', JSON.stringify(updated));
    } catch (e) {}
    setIsAddHdcModalOpen(false);
    setInspectedSchema(null);
    setNewHdcForm({
      code: `HDC-0${updated.length + 1}`,
      name: '',
      tableName: 's_labor_hct',
      year: '2569',
      mainCategory: 'ส่งเสริมป้องกัน',
      subCategory: 'อนามัยแม่และเด็ก',
      targetOperator: '<=',
      targetValue: 11,
      warningValue: 15,
      resultColumn: 'result2',
      targetColumn: 'target'
    });
    // Auto-fetch data from HDC right away!
    handleFetchHdcData(newKpi.id, newKpi);
  };

  const handleDeleteHdcKpi = (kpiId: string) => {
    if (confirm('คุณต้องการลบตัวชี้วัดนี้ออกจากตารางหรือไม่?')) {
      const updated = hdcKpis.filter(k => k.id !== kpiId);
      setHdcKpis(updated);
      try {
        localStorage.setItem('hdc_kpis_custom_v1', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const fetchKPIs = useCallback(async () => {
    // ดึงเฉพาะ Key Results ของระดับจังหวัด (สสจ.) ไม่ดึงของอำเภออื่นมารวม
    const { data: provDist } = await supabase
      .from('districts')
      .select('id')
      .eq('type', 'province')
      .maybeSingle();

    const [krsRes, dictsRes, measRes, issuesRes, apmRes] = await Promise.all([
      supabase
        .from('key_results')
        .select(`
          id, name, auto_id, target_2570, measurement_status, responsible_group, strategic_issue_id,
          objective:objectives(name, strategy:strategies(issue:strategic_issues(id, auto_id, name, theme_color))),
          tags:key_result_tags(tag:kpi_tags(name))
        `)
        .eq('district_id', provDist?.id || '')
        .order('order_index', { ascending: true }),
      supabase
        .from('kpi_dictionaries')
        .select('*')
        .order('created_at', { ascending: true }),
      supabase
        .from('kpi_measurements')
        .select('*'),
      supabase
        .from('strategic_issues')
        .select('id, auto_id, name, theme_color, order_index')
        .eq('district_id', provDist?.id || '')
        .order('auto_id', { ascending: true }),
      supabase
        .from('action_plan_measurements')
        .select('id, key_result_id, quarter, auto_id, kpi_name, target_value, result_value, status, order_index')
        .order('order_index', { ascending: true })
    ]);

    const issues = issuesRes.data || [];
    const apmData = apmRes.data || [];
    setStrategicIssues(issues);
    setActionPlanMeasurements(apmData);

    const issueMap: Record<string, any> = {};
    issues.forEach(iss => { issueMap[iss.id] = iss; });

    const dictMap: Record<string, any> = {};
    (dictsRes.data || []).forEach((d: any) => {
      if (d.key_result_id) dictMap[d.key_result_id] = d;
    });

    const measMap: Record<string, any[]> = {};
    (measRes.data || []).forEach((m: any) => {
      if (!measMap[m.key_result_id]) measMap[m.key_result_id] = [];
      measMap[m.key_result_id].push(m);
    });

    if (krsRes.data) {
      const transformed = krsRes.data.map(kr => {
        const dict = dictMap[kr.id] || {};
        const tags = kr.tags?.map((t: any) => t.tag.name) || ['ยุทธศาสตร์สุขภาพ สระแก้ว'];
        
        let evalCriteria: any = {};
        if (dict.evaluation_criteria_json) {
          evalCriteria = typeof dict.evaluation_criteria_json === 'string'
            ? JSON.parse(dict.evaluation_criteria_json)
            : dict.evaluation_criteria_json;
        }

        // Resolve Strategic Issue
        let matchedIssue = kr.strategic_issue_id ? issueMap[kr.strategic_issue_id] : kr.objective?.strategy?.issue;
        if (!matchedIssue) {
          const auto = kr.auto_id || '';
          const code = auto.includes('1') ? 'S1' : auto.includes('2') ? 'S2' : auto.includes('3') ? 'S3' : auto.includes('4') ? 'S4' : 'S1';
          matchedIssue = issues.find(i => i.auto_id === code) || { auto_id: code, name: 'ยุทธศาสตร์ ' + code, theme_color: '#0284c7' };
        }

        const kpiSubKrs = apmData.filter((a: any) => a.key_result_id === kr.id);
        const effectiveKpiType = dict.kpi_type || (kr.id ? 'strategic' : 'standalone');

        const calcType = dict.calculation_type || 'percentage';
        const isProcess = calcType === 'process_status';

        const apiConfig = dict.api_config_json
          ? (typeof dict.api_config_json === 'string' ? JSON.parse(dict.api_config_json) : dict.api_config_json)
          : {};

        return {
          id: kr.id,
          auto_id: kr.auto_id,
          name: kr.name,
          tags: tags,
          responsible_group: kr.responsible_group || dict.work_group || dict.responsible_person || 'ไม่ระบุกลุ่มงาน',
          measurement_level: dict.measurement_level || 'province',
          formula: isProcess ? 'เชิงกระบวนการ' : (dict.calculation_formula || 'ร้อยละ'),
          calculation_formula: dict.calculation_formula,
          calculation_type: calcType,
          data_items: dict.data_items_json ? (typeof dict.data_items_json === 'string' ? JSON.parse(dict.data_items_json) : dict.data_items_json) : [],
          target: kr.target_2570,
          target_operator: dict.target_operator || '>=',
          frequency: 'รายไตรมาส',
          kpi_type: effectiveKpiType,
          strategic_issue: matchedIssue,
          evalCriteria,
          rawMeasurements: measMap[kr.id] || [],
          sub_krs: kpiSubKrs,
          api_enabled: dict.api_enabled || false,
          api_config: apiConfig,
        };
      });
      
      setKpis(transformed);
      if (transformed.length > 0) setSelectedKpiId(transformed[0].id);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const handleSyncMainHdc = async () => {
    setSyncingAllHdc(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/cron/sync-hdc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: selectedQuarter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ซิงค์ไม่สำเร็จ');
      setSyncMsg(`✓ ดึงข้อมูล HDC สำเร็จ (${data.kpiCount} ตัวชี้วัด)`);
      setTimeout(() => setSyncMsg(''), 6000);
      await fetchKPIs();
    } catch (err: any) {
      alert(`ไม่สามารถดึงข้อมูล HDC ได้: ${err.message || err}`);
    } finally {
      setSyncingAllHdc(false);
    }
  };

  const quarterNum = useMemo(() => {
    return parseInt(selectedQuarter.replace('Q', ''), 10) || 1;
  }, [selectedQuarter]);

  // Evaluates a KPI's performance for a given quarter
  const evaluateKpiStatus = useCallback((kpi: any, qStr: string): 'success' | 'warning' | 'error' | 'pending' => {
    const qKey = qStr.toLowerCase();
    const ev = kpi.evalCriteria || {};
    const target = ev[qKey] ?? ev.green_target ?? null;
    const warning = ev[`${qKey}_warning`] ?? ev.yellow_target ?? null;

    const prov_m = (kpi.rawMeasurements || []).find((x: any) => x.period === qStr && x.area_id === 'province');

    if (kpi.calculation_type === 'process_status') {
      if (!prov_m) return 'pending';
      const res = String(prov_m.result_value || '').toLowerCase();
      if (res === 'success' || res === 'ผ่าน') return 'success';
      if (res === 'warning' || res === 'ไม่ผ่าน' || res === 'error') return 'error';
      return 'pending';
    }

    let val: number | null = null;
    if (prov_m && prov_m.result_value !== null && prov_m.result_value !== undefined) {
      val = Number(prov_m.result_value);
    } else {
      const isHosp = kpi.measurement_level === 'hospital';
      const areaList = isHosp ? (kpi.hospital_results || []) : (kpi.district_results || []);
      const rep = (areaList || []).filter((x: any) => x.hasData);
      if (rep.length > 0) {
        val = rep.reduce((sum: number, x: any) => sum + x.result, 0) / rep.length;
      }
    }

    if (val === null || isNaN(val) || target === null || target === undefined) {
      return 'pending';
    }

    const targetNum = Number(target);
    const warningNum = warning !== null && warning !== undefined ? Number(warning) : null;
    const op = kpi.target_operator || '>=';

    if (op === '>=') {
      if (val >= targetNum) return 'success';
      if (warningNum !== null && val >= warningNum) return 'warning';
      return 'error';
    }
    if (op === '<=') {
      if (val <= targetNum) return 'success';
      if (warningNum !== null && val <= warningNum) return 'warning';
      return 'error';
    }
    if (op === '>') {
      if (val > targetNum) return 'success';
      if (warningNum !== null && val > warningNum) return 'warning';
      return 'error';
    }
    if (op === '<') {
      if (val < targetNum) return 'success';
      if (warningNum !== null && val < warningNum) return 'warning';
      return 'error';
    }
    return val === targetNum ? 'success' : 'error';
  }, []);

  // Dynamically evaluate each KPI for the active selectedQuarter
  const evaluatedKpis = useMemo(() => {
    const qKey = selectedQuarter.toLowerCase();
    return kpis.map(k => {
      const ev = k.evalCriteria || {};
      const targetVal = ev[qKey] ?? ev.green_target ?? null;
      const targetWarning = ev[`${qKey}_warning`] ?? ev.yellow_target ?? null;

      const prov_m = (k.rawMeasurements || []).find((x: any) => x.period === selectedQuarter && x.area_id === 'province');

      const district_results = DISTRICTS.map(d => {
        const m = (k.rawMeasurements || []).find((x: any) => x.area_id === d && x.period === selectedQuarter);
        return { name: d, result: m ? Number(m.result_value) || 0 : 0, hasData: !!m };
      });

      const hospital_results = SA_KAEO_HOSPITALS.map(h => {
        const m = (k.rawMeasurements || []).find((x: any) =>
          (x.area_id === h.name || x.area_id === h.fullName || x.area_id === h.code5) &&
          x.period === selectedQuarter
        );
        return { name: h.name, code5: h.code5, districtName: h.districtName, result: m ? Number(m.result_value) || 0 : 0, hasData: !!m };
      });

      const isHospitalLevel = k.measurement_level === 'hospital';
      const activeAreaResults = isHospitalLevel ? hospital_results : district_results;
      const reportedAreas = activeAreaResults.filter(a => a.hasData);

      let provResult: any;
      if (prov_m) {
        provResult = k.calculation_type === 'process_status'
          ? (prov_m.values_json?.description || prov_m.result_value || 'รอดำเนินการ')
          : Number(prov_m.result_value) || 0;
      } else if (k.calculation_type !== 'process_status' && reportedAreas.length > 0) {
        const avg = reportedAreas.reduce((sum, a) => sum + a.result, 0) / reportedAreas.length;
        provResult = Math.round(avg * 100) / 100;
      } else {
        provResult = k.calculation_type === 'process_status' ? 'รอดำเนินการ' : 0;
      }

      const currentSubKrs = (k.sub_krs || []).filter((s: any) => s.quarter === quarterNum);
      const currentStatus = evaluateKpiStatus({
        ...k,
        district_results,
        hospital_results,
      }, selectedQuarter);

      return {
        ...k,
        target_val: targetVal,
        target_warning_val: targetWarning,
        provincial_result: provResult,
        hasProvData: !!prov_m || reportedAreas.length > 0,
        status: currentStatus,
        district_results,
        hospital_results,
        currentSubKrs,
      };
    });
  }, [kpis, selectedQuarter, quarterNum, evaluateKpiStatus]);

  const CATEGORIES = useMemo(() => Array.from(new Set(kpis.flatMap(k => k.tags))), [kpis]);

  // Base KPIs filtered by group, category, kpi_type, search (used to compute Scorecard stats)
  const baseKpis = useMemo(() => {
    return evaluatedKpis.filter(k => {
      let groupMatch = true;
      if (filterGroup !== '') {
        const cleanFilter = filterGroup.replace(/^กลุ่มงาน/, '').trim();
        const cleanKr = (k.responsible_group || '').replace(/^กลุ่มงาน/, '').trim();
        groupMatch = k.responsible_group === filterGroup || cleanKr === cleanFilter;
      }
      const categoryMatch = filterCategory === '' || k.tags.includes(filterCategory);
      const typeMatch = filterKpiType === 'all' || k.kpi_type === filterKpiType;
      const searchMatch = search === '' || k.name.toLowerCase().includes(search.toLowerCase()) || (k.auto_id && k.auto_id.toLowerCase().includes(search.toLowerCase()));

      return groupMatch && categoryMatch && typeMatch && searchMatch;
    });
  }, [evaluatedKpis, filterGroup, filterCategory, filterKpiType, search]);

  // Scorecard Stats
  const scorecardStats = useMemo(() => {
    const total = baseKpis.length;
    const success = baseKpis.filter(k => k.status === 'success').length;
    const warning = baseKpis.filter(k => k.status === 'warning').length;
    const error = baseKpis.filter(k => k.status === 'error').length;
    const pending = baseKpis.filter(k => k.status === 'pending').length;

    return {
      total,
      success,
      warning,
      error,
      pending,
      successPct: total > 0 ? ((success / total) * 100).toFixed(1) : '0',
      warningPct: total > 0 ? ((warning / total) * 100).toFixed(1) : '0',
      errorPct: total > 0 ? ((error / total) * 100).toFixed(1) : '0',
      pendingPct: total > 0 ? ((pending / total) * 100).toFixed(1) : '0',
    };
  }, [baseKpis]);

  // Filtered KPIs: Apply statusQuickFilter on baseKpis
  const filteredKpis = useMemo(() => {
    if (statusQuickFilter === 'all') return baseKpis;
    return baseKpis.filter(k => k.status === statusQuickFilter);
  }, [baseKpis, statusQuickFilter]);

  const selectedKpi = useMemo(() => {
    return filteredKpis.find(k => k.id === selectedKpiId) || filteredKpis[0] || baseKpis[0];
  }, [filteredKpis, baseKpis, selectedKpiId]);

  // Strategic Issue Breakdown (S1 - S4)
  const strategicBreakdown = useMemo(() => {
    const defaultIssues = [
      { id: '1', auto_id: 'S1', name: 'การสร้างระบบสุขภาพเพื่อประชาชนที่ทุกคนเป็นเจ้าของ', theme_color: '#02c570' },
      { id: '2', auto_id: 'S2', name: 'การจัดบริการสุขภาพที่มีคุณภาพและเป็นเลิศ', theme_color: '#0284c7' },
      { id: '3', auto_id: 'S3', name: 'ยกระดับสู่องค์กรอัจฉริยะ พัฒนากำลังคน และบริหารจัดการฯ', theme_color: '#c53302' },
      { id: '4', auto_id: 'S4', name: 'การบริหารจัดการการสาธารณสุขชายแดนและความมั่นคงทางสุขภาพ', theme_color: '#0502c5' },
    ];
    const issues = strategicIssues.length > 0 ? strategicIssues : defaultIssues;

    return issues.map(issue => {
      const issueKpis = evaluatedKpis.filter(k => {
        // ต้องเป็นตัวชี้วัดประเภท "ยุทธศาสตร์สุขภาพ สระแก้ว" เท่านั้น
        const isStrategicType = k.kpi_type === 'strategic' || (k.tags && k.tags.some((t: string) => t.includes('ยุทธศาสตร์สุขภาพ สระแก้ว')));
        if (!isStrategicType) return false;

        const i = k.strategic_issue;
        if (i && (i.id === issue.id || i.auto_id === issue.auto_id)) return true;
        const auto = k.auto_id || '';
        return auto.startsWith(`KR${issue.auto_id?.replace('S', '')}`) || auto.startsWith(`IND${issue.auto_id?.replace('S', '')}`);
      });

      const total = issueKpis.length;
      const success = issueKpis.filter(k => k.status === 'success').length;
      const warning = issueKpis.filter(k => k.status === 'warning').length;
      const error = issueKpis.filter(k => k.status === 'error').length;
      const pending = issueKpis.filter(k => k.status === 'pending').length;
      const passPct = total > 0 ? Math.round((success / total) * 100) : 0;

      return {
        ...issue,
        total,
        success,
        warning,
        error,
        pending,
        passPct,
      };
    });
  }, [strategicIssues, evaluatedKpis]);

  // Department Performance Breakdown (17 SSJ Work Groups)
  const departmentBreakdown = useMemo(() => {
    return UNIQUE_WORK_GROUPS.map(groupName => {
      const cleanGroup = groupName.replace(/^กลุ่มงาน/, '').trim();
      const groupKpis = evaluatedKpis.filter(k => {
        const cleanKr = (k.responsible_group || '').replace(/^กลุ่มงาน/, '').trim();
        return cleanKr === cleanGroup || k.responsible_group === groupName;
      });

      const total = groupKpis.length;
      const success = groupKpis.filter(k => k.status === 'success').length;
      const warning = groupKpis.filter(k => k.status === 'warning').length;
      const error = groupKpis.filter(k => k.status === 'error').length;
      const pending = groupKpis.filter(k => k.status === 'pending').length;
      const passPct = total > 0 ? Math.round((success / total) * 100) : 0;

      return {
        name: groupName,
        total,
        success,
        warning,
        error,
        pending,
        passPct,
      };
    }).sort((a, b) => b.total - a.total || b.passPct - a.passPct);
  }, [evaluatedKpis]);

  const getStatusColor = (status: string) => {
    if (status === 'success') return '#22c55e'; // Green
    if (status === 'warning') return '#eab308'; // Yellow
    if (status === 'pending') return '#94a3b8'; // Gray
    return '#ef4444'; // Red
  };

  const evaluateStatus = (result: number, kpi: any) => {
    return evaluateKpiStatus(kpi, selectedQuarter);
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>กำลังโหลดข้อมูลตัวชี้วัด...</div>;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: (activeTab === 'subdistrict' || activeTab === 'vital') ? '0.75rem' : '1.5rem', 
      height: isSubdistrictFullscreen ? '100vh' : (activeTab === 'subdistrict' || activeTab === 'vital' ? 'auto' : 'calc(100vh - 100px)'),
      minHeight: (activeTab === 'subdistrict' || activeTab === 'vital') && !isSubdistrictFullscreen ? 'calc(100vh - 80px)' : undefined
    }}>
      {/* Top Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>Dashboard ตัวชี้วัด (KPIs) สสจ.สระแก้ว</h1>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
              ปีงบประมาณ 2568
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('executive')} style={{ padding: '0.45rem 0.9rem', borderBottom: activeTab === 'executive' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === 'executive' ? 700 : 500, color: activeTab === 'executive' ? 'var(--primary)' : 'var(--secondary-foreground)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
              สรุปสำหรับผู้บริหาร (Executive Summary)
            </button>
            <button onClick={() => setActiveTab('detail')} style={{ padding: '0.45rem 0.9rem', borderBottom: activeTab === 'detail' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === 'detail' ? 700 : 500, color: activeTab === 'detail' ? 'var(--primary)' : 'var(--secondary-foreground)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
              มุมมองรายตัวชี้วัด (Master-Detail)
            </button>
            <button onClick={() => setActiveTab('subdistrict')} style={{ padding: '0.45rem 0.9rem', borderBottom: activeTab === 'subdistrict' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === 'subdistrict' ? 700 : 500, color: activeTab === 'subdistrict' ? 'var(--primary)' : 'var(--secondary-foreground)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
              ระดับ รพ.สต. (HDC Open Data)
            </button>
            <button onClick={() => setActiveTab('vital')} style={{ padding: '0.45rem 0.9rem', borderBottom: activeTab === 'vital' ? '3px solid var(--primary)' : '3px solid transparent', fontWeight: activeTab === 'vital' ? 700 : 500, color: activeTab === 'vital' ? 'var(--primary)' : 'var(--secondary-foreground)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}>
              สถิติประชากร เกิด ตาย (Vital Statistics)
            </button>
          </div>
        </div>
        
        {activeTab !== 'subdistrict' && activeTab !== 'vital' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary-foreground)', padding: '0 0.5rem' }}>รอบประเมิน:</span>
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuarter(q)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: selectedQuarter === q ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedQuarter === q ? 'var(--primary)' : 'transparent',
                    color: selectedQuarter === q ? '#fff' : 'var(--foreground)',
                    boxShadow: selectedQuarter === q ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {q === 'Q1' ? 'Q1 (ต.ค.-ธ.ค.)' : q === 'Q2' ? 'Q2 (ม.ค.-มี.ค.)' : q === 'Q3' ? 'Q3 (เม.ย.-มิ.ย.)' : 'Q4 (สะสม/สิ้นปี)'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSyncMainHdc}
              disabled={syncingAllHdc}
              title="ดึงข้อมูลจาก HDC Open Data สำหรับทุกตัวชี้วัดที่เชื่อมต่อไว้ (ระบบตั้งค่าดึงให้อัตโนมัติทุกวันเวลา 08.00 น.)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: syncingAllHdc ? 'not-allowed' : 'pointer',
                opacity: syncingAllHdc ? 0.7 : 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
              }}
            >
              {syncingAllHdc ? '⏳ กำลังซิงค์ HDC...' : '🔄 ดึงข้อมูล HDC สด'}
            </button>
            {syncMsg && (
              <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, backgroundColor: '#dcfce7', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                {syncMsg}
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Outermost Quick Add HDC Button - บนสุดของจอ ในกล่องนอกสุด */}
            <button
              onClick={() => setIsAddHdcModalOpen(true)}
              title="เพิ่มตัวชี้วัด HDC Open Data ตัวใหม่"
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ fontSize: '1rem' }}>➕</span> เพิ่มตัวชี้วัด HDC
            </button>

            {/* Outermost Fullscreen Toggle */}
            <button
              onClick={() => setIsSubdistrictFullscreen(!isSubdistrictFullscreen)}
              title={isSubdistrictFullscreen ? 'ออกจากโหมดเต็มจอ (Esc)' : 'ขยายตารางเต็มจอ'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: isSubdistrictFullscreen ? '1px solid #ef4444' : '1px solid #0284c7',
                backgroundColor: isSubdistrictFullscreen ? '#dc2626' : '#f0f9ff',
                color: isSubdistrictFullscreen ? '#fff' : '#0284c7',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <span>{isSubdistrictFullscreen ? '✖ ย่อกลับ' : '⛶ เต็มจอ'}</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Controls Bar & Scorecards for Executive & Detail views */}
      {(activeTab === 'executive' || activeTab === 'detail') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Global Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            backgroundColor: 'var(--card)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
              {/* KPI Type Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>ประเภท:</span>
                <select
                  className="input-field"
                  style={{ width: '220px', fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                  value={filterKpiType}
                  onChange={(e) => setFilterKpiType(e.target.value)}
                >
                  {KPI_TYPE_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Work Group Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>กลุ่มงาน:</span>
                <select
                  className="input-field"
                  style={{ width: '220px', fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                >
                  <option value="">-- ทุกกลุ่มงาน (17 กลุ่มงาน) --</option>
                  {UNIQUE_WORK_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Tag / Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>หมวดหมู่:</span>
                <select
                  className="input-field"
                  style={{ width: '180px', fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">-- ทุกหมวดหมู่ --</option>
                  {CATEGORIES.map(c => (
                    <option key={c as string} value={c as string}>{c as string}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(filterKpiType !== 'strategic' || filterGroup !== '' || filterCategory !== '' || search !== '' || statusQuickFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterKpiType('strategic');
                  setFilterGroup('');
                  setFilterCategory('');
                  setSearch('');
                  setStatusQuickFilter('all');
                }}
                style={{
                  fontSize: '0.78rem',
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✕ รีเซ็ตตัวกรองทั้งหมด
              </button>
            )}
          </div>

          {/* 5 Executive Scorecards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {/* Card 1: ทั้งหมด */}
            <div
              onClick={() => setStatusQuickFilter('all')}
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                border: statusQuickFilter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: statusQuickFilter === 'all' ? '#eff6ff' : 'var(--card)',
                cursor: 'pointer',
                boxShadow: statusQuickFilter === 'all' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--secondary-foreground)' }}>📋 ตัวชี้วัดทั้งหมด</span>
                {statusQuickFilter === 'all' && (
                  <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--primary)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '999px', fontWeight: 700 }}>เลือกอยู่</span>
                )}
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.2 }}>
                {scorecardStats.total} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--secondary-foreground)' }}>ตัว</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--secondary-foreground)', marginTop: '0.35rem' }}>
                รอบ {selectedQuarter} • คลิกเพื่อดูทั้งหมด
              </div>
            </div>

            {/* Card 2: ผ่านเกณฑ์ */}
            <div
              onClick={() => setStatusQuickFilter(statusQuickFilter === 'success' ? 'all' : 'success')}
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                border: statusQuickFilter === 'success' ? '2px solid #22c55e' : '1px solid var(--border)',
                backgroundColor: statusQuickFilter === 'success' ? '#f0fdf4' : 'var(--card)',
                cursor: 'pointer',
                boxShadow: statusQuickFilter === 'success' ? '0 4px 12px rgba(34, 197, 94, 0.2)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>🟢 ผ่านเกณฑ์</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', backgroundColor: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {scorecardStats.successPct}%
                </span>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#166534', lineHeight: 1.2 }}>
                {scorecardStats.success} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--secondary-foreground)' }}>ตัว</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.35rem' }}>
                {statusQuickFilter === 'success' ? '✓ กำลังกรองเฉพาะที่ผ่าน (คลิกเพื่อยกเลิก)' : 'คลิกเพื่อกรองเฉพาะที่ผ่าน'}
              </div>
            </div>

            {/* Card 3: เฝ้าระวัง */}
            <div
              onClick={() => setStatusQuickFilter(statusQuickFilter === 'warning' ? 'all' : 'warning')}
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                border: statusQuickFilter === 'warning' ? '2px solid #eab308' : '1px solid var(--border)',
                backgroundColor: statusQuickFilter === 'warning' ? '#fefce8' : 'var(--card)',
                cursor: 'pointer',
                boxShadow: statusQuickFilter === 'warning' ? '0 4px 12px rgba(234, 179, 8, 0.2)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#854d0e' }}>🟡 เฝ้าระวัง</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#854d0e', backgroundColor: '#fef08a', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {scorecardStats.warningPct}%
                </span>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#854d0e', lineHeight: 1.2 }}>
                {scorecardStats.warning} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--secondary-foreground)' }}>ตัว</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#854d0e', marginTop: '0.35rem' }}>
                {statusQuickFilter === 'warning' ? '✓ กำลังกรองเฝ้าระวัง (คลิกเพื่อยกเลิก)' : 'คลิกเพื่อกรองตัวชี้วัดเฝ้าระวัง'}
              </div>
            </div>

            {/* Card 4: ไม่ผ่านเกณฑ์ */}
            <div
              onClick={() => setStatusQuickFilter(statusQuickFilter === 'error' ? 'all' : 'error')}
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                border: statusQuickFilter === 'error' ? '2px solid #ef4444' : '1px solid var(--border)',
                backgroundColor: statusQuickFilter === 'error' ? '#fef2f2' : 'var(--card)',
                cursor: 'pointer',
                boxShadow: statusQuickFilter === 'error' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#991b1b' }}>🔴 ไม่ผ่านเกณฑ์</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', backgroundColor: '#fee2e2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {scorecardStats.errorPct}%
                </span>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#991b1b', lineHeight: 1.2 }}>
                {scorecardStats.error} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--secondary-foreground)' }}>ตัว</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#991b1b', marginTop: '0.35rem' }}>
                {statusQuickFilter === 'error' ? '✓ กำลังกรองที่ไม่ผ่าน (คลิกเพื่อยกเลิก)' : 'คลิกเพื่อกรองที่ไม่ผ่าน'}
              </div>
            </div>

            {/* Card 5: รอดำเนินการ / รอประเมิน */}
            <div
              onClick={() => setStatusQuickFilter(statusQuickFilter === 'pending' ? 'all' : 'pending')}
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                border: statusQuickFilter === 'pending' ? '2px solid #64748b' : '1px solid var(--border)',
                backgroundColor: statusQuickFilter === 'pending' ? '#f8fafc' : 'var(--card)',
                cursor: 'pointer',
                boxShadow: statusQuickFilter === 'pending' ? '0 4px 12px rgba(100, 116, 139, 0.15)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>🔄 รอผล / รอดำเนินการ</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', backgroundColor: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                  {scorecardStats.pendingPct}%
                </span>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#475569', lineHeight: 1.2 }}>
                {scorecardStats.pending} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--secondary-foreground)' }}>ตัว</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.35rem' }}>
                {statusQuickFilter === 'pending' ? '✓ กำลังกรองที่รอผล (คลิกเพื่อยกเลิก)' : 'ตัวชี้วัดที่รอรอบประเมิน/บันทึก'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'executive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.25rem' }}>
          {/* Active Quick Filter Alert Bar */}
          {statusQuickFilter !== 'all' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: statusQuickFilter === 'success' ? '#f0fdf4' : statusQuickFilter === 'warning' ? '#fefce8' : statusQuickFilter === 'error' ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${statusQuickFilter === 'success' ? '#86efac' : statusQuickFilter === 'warning' ? '#fde047' : statusQuickFilter === 'error' ? '#fca5a5' : '#cbd5e1'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 1rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔍</span>
                <span>
                  กำลังแสดงเฉพาะตัวชี้วัดสถานะ: <strong>{statusQuickFilter === 'success' ? '🟢 ผ่านเกณฑ์' : statusQuickFilter === 'warning' ? '🟡 เฝ้าระวัง' : statusQuickFilter === 'error' ? '🔴 ไม่ผ่านเกณฑ์' : '🔄 รอดำเนินการ'}</strong> (พบ {filteredKpis.length} จาก {baseKpis.length} ตัวชี้วัด)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStatusQuickFilter('all')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ล้างตัวกรองสถานะ (แสดงทั้งหมด)
              </button>
            </div>
          )}

          {/* Section 1: Strategic Breakdown (S1 - S4) - แสดงเฉพาะประเภท ยุทธศาสตร์สุขภาพ สระแก้ว เท่านั้น */}
          {filterKpiType === 'strategic' ? (
            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📊</span> ความก้าวหน้ารายประเด็นยุทธศาสตร์สุขภาพ (S1 - S4)
                    </h2>
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      เฉพาะประเภท: ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--secondary-foreground)', marginTop: '0.2rem' }}>
                    ภาพรวมผลการดำเนินงานแบ่งตาม 4 ยุทธศาสตร์หลัก ในรอบ {selectedQuarter}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {strategicBreakdown.map(s => (
                  <div
                    key={s.code}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      backgroundColor: 'var(--card)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderTop: `4px solid ${s.color || 'var(--primary)'}`,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: s.color || 'var(--primary)',
                          backgroundColor: '#f8fafc',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border)'
                        }}>
                          {s.code}
                        </span>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: s.passPct >= 80 ? '#166534' : s.passPct >= 50 ? '#854d0e' : '#991b1b',
                          backgroundColor: s.passPct >= 80 ? '#dcfce7' : s.passPct >= 50 ? '#fef08a' : '#fee2e2',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px'
                        }}>
                          {s.passPct}% ผ่าน
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.5rem 0', lineHeight: 1.4, color: 'var(--foreground)' }}>
                        {s.name}
                      </h4>

                      <div style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)', marginBottom: '0.5rem' }}>
                        ตัวชี้วัดทั้งหมด: <strong>{s.total}</strong> ตัว (บรรลุเป้าหมาย {s.success} ตัว)
                      </div>
                    </div>

                    <div>
                      {/* Stacked Multi-color Progress Bar */}
                      <div style={{ height: '10px', width: '100%', borderRadius: '999px', overflow: 'hidden', display: 'flex', backgroundColor: '#e2e8f0', margin: '0.5rem 0' }}>
                        <div style={{ width: `${s.total ? (s.success / s.total) * 100 : 0}%`, backgroundColor: '#22c55e' }} title={`ผ่าน: ${s.success} ตัว`} />
                        <div style={{ width: `${s.total ? (s.warning / s.total) * 100 : 0}%`, backgroundColor: '#eab308' }} title={`เฝ้าระวัง: ${s.warning} ตัว`} />
                        <div style={{ width: `${s.total ? (s.error / s.total) * 100 : 0}%`, backgroundColor: '#ef4444' }} title={`ไม่ผ่าน: ${s.error} ตัว`} />
                        <div style={{ width: `${s.total ? (s.pending / s.total) * 100 : 0}%`, backgroundColor: '#94a3b8' }} title={`รอดำเนินการ: ${s.pending} ตัว`} />
                      </div>

                      {/* Breakdown Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--secondary-foreground)' }}>
                        <span title="ผ่านเกณฑ์">🟢 {s.success}</span>
                        <span title="เฝ้าระวัง">🟡 {s.warning}</span>
                        <span title="ไม่ผ่านเกณฑ์">🔴 {s.error}</span>
                        <span title="รอประเมิน/ผล">🔄 {s.pending}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1.25rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-foreground)' }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <span>
                  ความก้าวหน้ารายประเด็นยุทธศาสตร์ (S1 - S4) จะแสดงเฉพาะตัวชี้วัดประเภท <strong>ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)</strong> เท่านั้น (ปัจจุบันเลือก: <em>{KPI_TYPE_OPTIONS.find(o => o.id === filterKpiType)?.label || filterKpiType}</em>)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilterKpiType('strategic')}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                สลับดูประเภทยุทธศาสตร์สุขภาพ สระแก้ว
              </button>
            </div>
          )}

          {/* Section 2: Department Performance Scorecard (17 Work Groups) */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏛️</span> ผลการดำเนินงานรายกลุ่มงาน สสจ.สระแก้ว (17 กลุ่มงาน)
                </h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--secondary-foreground)', marginTop: '0.2rem' }}>
                  สรุปความสำเร็จของตัวชี้วัดที่แต่ละกลุ่มงานรับผิดชอบในรอบ {selectedQuarter} (คลิกที่ชื่อกลุ่มงานเพื่อกรองตาราง)
                </div>
              </div>
              {filterGroup && (
                <button
                  type="button"
                  onClick={() => setFilterGroup('')}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid var(--border)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: 'var(--secondary-foreground)'
                  }}
                >
                  ✕ ยกเลิกการกรองกลุ่มงาน ({filterGroup})
                </button>
              )}
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '380px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card)', zIndex: 5, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '50px' }}>ลำดับ</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>กลุ่มงาน</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '90px' }}>ทั้งหมด</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '80px', color: '#166534' }}>🟢 ผ่าน</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '80px', color: '#854d0e' }}>🟡 ระวัง</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '80px', color: '#991b1b' }}>🔴 ไม่ผ่าน</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', width: '80px', color: '#64748b' }}>🔄 รอผล</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '160px' }}>อัตราความสำเร็จ (% ผ่าน)</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentBreakdown.map((dept, index) => {
                    const isSelected = filterGroup === dept.name || filterGroup === `กลุ่มงาน${dept.name}`;
                    return (
                      <tr
                        key={dept.name}
                        onClick={() => setFilterGroup(isSelected ? '' : dept.name)}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: isSelected ? '#eff6ff' : index % 2 === 0 ? 'transparent' : '#fcfcfd',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>{index + 1}</td>
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>
                          <span style={{ color: isSelected ? 'var(--primary)' : 'var(--foreground)' }}>{dept.name}</span>
                          {isSelected && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '0.4rem' }}>(เลือกอยู่)</span>}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{dept.total}</td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', color: '#166534', fontWeight: dept.success > 0 ? 700 : 400, backgroundColor: dept.success > 0 ? '#f0fdf4' : 'transparent' }}>
                          {dept.success}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', color: '#854d0e', fontWeight: dept.warning > 0 ? 700 : 400, backgroundColor: dept.warning > 0 ? '#fefce8' : 'transparent' }}>
                          {dept.warning}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', color: '#991b1b', fontWeight: dept.error > 0 ? 700 : 400, backgroundColor: dept.error > 0 ? '#fef2f2' : 'transparent' }}>
                          {dept.error}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', color: '#64748b' }}>
                          {dept.pending}
                        </td>
                        <td style={{ padding: '0.65rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${dept.passPct}%`,
                                  height: '100%',
                                  backgroundColor: dept.passPct >= 80 ? '#22c55e' : dept.passPct >= 50 ? '#eab308' : dept.total === 0 ? '#94a3b8' : '#ef4444',
                                  borderRadius: '4px'
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, width: '38px', textAlign: 'right', color: dept.passPct >= 80 ? '#166534' : dept.passPct >= 50 ? '#854d0e' : 'inherit' }}>
                              {dept.total > 0 ? `${dept.passPct}%` : '-'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Heatmap Table (9 Districts / 9 Hospitals) */}
          <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>ตารางสถานะตัวชี้วัดแยกตามพื้นที่ (Heatmap)</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)', marginTop: '0.25rem' }}>
                  แสดงผล: {filteredKpis.length} ตัวชี้วัด | โหมดพื้นที่: {heatmapAreaMode === 'district' ? '9 อำเภอ (2701 - 2709)' : '9 โรงพยาบาลใน จ.สระแก้ว'} | รอบ {selectedQuarter}
                </div>
              </div>

            {/* Toggle Area Mode: District vs Hospital */}
            <div style={{ display: 'inline-flex', backgroundColor: 'var(--secondary)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setHeatmapAreaMode('district')}
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: heatmapAreaMode === 'district' ? 600 : 400,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: heatmapAreaMode === 'district' ? 'var(--card)' : 'transparent',
                  color: heatmapAreaMode === 'district' ? 'var(--primary)' : 'var(--foreground)',
                  boxShadow: heatmapAreaMode === 'district' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>🏘️</span> ระดับอำเภอ (9 อำเภอ)
              </button>
              <button
                type="button"
                onClick={() => setHeatmapAreaMode('hospital')}
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: heatmapAreaMode === 'hospital' ? 600 : 400,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: heatmapAreaMode === 'hospital' ? 'var(--card)' : 'transparent',
                  color: heatmapAreaMode === 'hospital' ? 'var(--primary)' : 'var(--foreground)',
                  boxShadow: heatmapAreaMode === 'hospital' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>🏥</span> ระดับโรงพยาบาล (9 รพ.)
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', width: '300px', borderRight: '1px solid var(--border)' }}>ชื่อตัวชี้วัด</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderRight: '2px solid var(--border)', backgroundColor: '#f8fafc', width: '80px' }}>รวมจังหวัด</th>
                  {heatmapAreaMode === 'district' ? (
                    DISTRICTS.map(d => (
                      <th key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '120px' }}>
                        {d}
                      </th>
                    ))
                  ) : (
                    SA_KAEO_HOSPITALS.map(h => (
                      <th key={h.code5} title={`${h.fullName} (อ.${h.districtName})`} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '140px', fontSize: '0.8rem' }}>
                        {h.name}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredKpis.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>ไม่พบตัวชี้วัดในหมวดหมู่ หรือกลุ่มงานที่เลือก</td>
                  </tr>
                )}
                {filteredKpis.map(kpi => {
                  let provStatus = kpi.status;
                  if (kpi.calculation_type !== 'process_status' && typeof kpi.provincial_result === 'number') {
                     provStatus = evaluateStatus(kpi.provincial_result, kpi);
                  }

                  const getBgColor = (status: string) => status === 'success' ? '#dcfce7' : status === 'warning' ? '#fef08a' : status === 'pending' ? '#e2e8f0' : '#fee2e2';
                  const getTextColor = (status: string) => status === 'success' ? '#166534' : status === 'warning' ? '#854d0e' : status === 'pending' ? '#475569' : '#991b1b';
                  
                  return (
                    <tr key={kpi.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', borderRight: '1px solid var(--border)', fontWeight: 500 }}>
                        <div style={{ marginBottom: '0.25rem' }}><span style={{color:'var(--primary)'}}>[{kpi.auto_id}]</span> {kpi.name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', backgroundColor: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{kpi.responsible_group}</span>
                          {kpi.tags.map((tag: string) => (
                            <span key={tag} style={{ fontSize: '0.65rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderRight: '2px solid var(--border)', backgroundColor: getBgColor(provStatus), color: getTextColor(provStatus), fontWeight: 700 }}>
                        {kpi.calculation_type === 'process_status' ? (kpi.status === 'success' ? 'ผ่าน' : kpi.status === 'pending' ? 'รอดำเนินการ' : 'ไม่ผ่าน') : kpi.provincial_result}
                      </td>
                      {heatmapAreaMode === 'district' ? (
                        DISTRICTS.map(d => {
                          if (kpi.measurement_level === 'province' || kpi.measurement_level === 'hospital') {
                             return <td key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>-</td>;
                          }
                          const dist = (kpi.district_results || []).find((res: any) => res.name === d);
                          if (!dist) return <td key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>-</td>;
                          
                          const dStatus = evaluateStatus(dist.result, kpi);
                          return (
                            <td key={d} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: getBgColor(dStatus), color: getTextColor(dStatus), fontWeight: 600 }}>
                              {dist.result}
                            </td>
                          );
                        })
                      ) : (
                        SA_KAEO_HOSPITALS.map(h => {
                          if (kpi.measurement_level === 'province') {
                             return <td key={h.code5} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>-</td>;
                          }
                          const hosp = (kpi.hospital_results || []).find((res: any) => res.name === h.name || res.code5 === h.code5);
                          if (!hosp || hosp.result === undefined || hosp.result === null) {
                            return <td key={h.code5} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>-</td>;
                          }
                          
                          const hStatus = evaluateStatus(hosp.result, kpi);
                          return (
                            <td key={h.code5} title={`${h.name}: ${hosp.result}`} style={{ padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', backgroundColor: getBgColor(hStatus), color: getTextColor(hStatus), fontWeight: 600 }}>
                              {hosp.result}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      
      {activeTab === 'subdistrict' && (() => {
        // Filter strictly to ONLY 'โรงพยาบาลส่งเสริมสุขภาพตำบล' (exactly 108 facilities)
        const allRpost = (healthFacilitiesData as any[]).filter(f => f.type === 'โรงพยาบาลส่งเสริมสุขภาพตำบล');

        // Filter by selected district and search keyword
        const displayFacilities = allRpost.filter(f => {
          const matchDistrict = subdistrictDistrict === 'ALL' || f.district === subdistrictDistrict;
          const matchSearch = !subdistrictSearch || 
            f.name.toLowerCase().includes(subdistrictSearch.toLowerCase()) || 
            (f.code5 && f.code5.includes(subdistrictSearch));
          return matchDistrict && matchSearch;
        });

        // Calculate count per district for the dropdown and grouping
        const countByDistrict: Record<string, number> = {};
        DISTRICTS.forEach(d => { countByDistrict[d] = 0; });
        allRpost.forEach(f => {
          if (f.district && countByDistrict[f.district] !== undefined) {
            countByDistrict[f.district]++;
          }
        });

        const formatFacilityDisplayName = (fac: any) => {
          if (!fac) return '';
          const rawName = fac.name || '';
          
          // 1. กรณีพิเศษ: สอน.วังสมบูรณ์ (สถานีอนามัยเฉลิมพระเกียรติ 60 พรรษา นวมินทราชินี)
          if (fac.code5 === '02531' || rawName.includes('เฉลิมพระเกียรติ 60 พรรษา') || rawName.includes('สถานีอนามัยเฉลิมพระเกียรติ')) {
            return 'สอน.';
          }

          // 2. ตัดคำนำหน้า: "โรงพยาบาลส่งเสริมสุขภาพตำบล", "โรงพยาบาลส่งเสริมสุขภาพบ้าน", "สถานีอนามัย"
          let clean = rawName
            .replace(/^โรงพยาบาลส่งเสริมสุขภาพตำบล/, '')
            .replace(/^โรงพยาบาลส่งเสริมสุขภาพบ้าน/, '')
            .replace(/^สถานีอนามัย/, '')
            .trim();

          // 3. ตัดคำต่อท้ายชื่อตำบล: "ตำบล..." หรือ "ต...." เพื่อให้กระชับสบายตา
          clean = clean.split(/\s+ตำบล/)[0];
          clean = clean.split(/\s+ต\./)[0];
          clean = clean.trim();

          return `รพ.สต.${clean}`;
        };

        const getCellBg = (status: string) => {
          if (status === 'success') return '#22c55e'; // Green
          if (status === 'warning') return '#eab308'; // Yellow
          if (status === 'error') return '#ef4444';   // Red
          return '#e2e8f0';                           // Gray
        };

        const getCellTextColor = (status: string) => {
          if (status === 'pending') return '#475569';
          return '#ffffff';
        };

        // Group facilities by district for when 'ALL' is selected
        const groupedByDistrict: { district: string; facilities: any[] }[] = [];
        if (subdistrictDistrict === 'ALL') {
          DISTRICTS.forEach(d => {
            const facs = displayFacilities.filter(f => f.district === d);
            if (facs.length > 0) {
              groupedByDistrict.push({ district: d, facilities: facs });
            }
          });
        } else {
          groupedByDistrict.push({ district: subdistrictDistrict, facilities: displayFacilities });
        }

        // Filter HDC KPIs by selected categories
        const filteredHdcKpis = hdcKpis.filter(kpi => {
          if (hdcFilterMainCategory !== 'ALL' && (kpi.mainCategory || 'ส่งเสริมป้องกัน') !== hdcFilterMainCategory) {
            return false;
          }
          if (hdcFilterSubCategory !== 'ALL' && (kpi.subCategory || 'อนามัยแม่และเด็ก') !== hdcFilterSubCategory) {
            return false;
          }
          return true;
        });

        return (
          <div 
            className={isSubdistrictFullscreen ? '' : 'card'} 
            style={isSubdistrictFullscreen ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0
            } : {
              flex: 1,
              overflow: 'hidden',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 165px)',
              minHeight: '620px'
            }}
          >
            {/* Filter and Control Bar */}
            <div style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isSubdistrictFullscreen ? '#f8fafc' : 'var(--card)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    การติดตามตัวชี้วัดระดับ รพ.สต. (HDC Open Data)
                  </h2>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>
                    {allRpost.length} รพ.สต. ในสระแก้ว
                  </span>
                  {isSubdistrictFullscreen && (
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                      ⛶ โหมดเต็มจอ
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)', marginTop: '0.15rem' }}>
                  แถว: รายชื่อ รพ.สต. แยกตามอำเภอ • คอลัมน์: ตัวชี้วัด HDC • สีเต็มช่องตามระดับผลงาน
                </div>
              </div>

              {/* Action Buttons & Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#22c55e', display: 'inline-block' }}></span> ผ่านเกณฑ์
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#eab308', display: 'inline-block' }}></span> เฝ้าระวัง
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#ef4444', display: 'inline-block' }}></span> ไม่ผ่านเกณฑ์
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '11px', height: '11px', borderRadius: '2px', backgroundColor: '#e2e8f0', display: 'inline-block' }}></span> รอผล
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Auto-sync status & button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#f1f5f9',
                    padding: '0.25rem 0.55rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.75rem',
                    color: '#334155',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span>{autoSyncStatus || '🕒 ซิงค์ 08:00 น.'}</span>
                    <button
                      onClick={handleSyncAllHdc}
                      disabled={isAutoSyncing || fetchingHdcId !== null}
                      title="กดเพื่อดึงผลงานสดจาก HDC Open Data ครบทุกตัวชี้วัดพร้อมกันทันที"
                      style={{
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.7rem',
                        borderRadius: '4px',
                        border: '1px solid #0284c7',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        cursor: isAutoSyncing ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}
                    >
                      {isAutoSyncing ? '⏳ ซิงค์...' : '⚡ ดึงสดทุกตัว'}
                    </button>
                  </div>

                  <button
                    onClick={() => setIsAddHdcModalOpen(true)}
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span>+</span> เพิ่มตัวชี้วัด HDC
                  </button>

                  {/* Toggle Fullscreen Button */}
                  <button
                    onClick={() => setIsSubdistrictFullscreen(!isSubdistrictFullscreen)}
                    title={isSubdistrictFullscreen ? 'ออกจากโหมดเต็มจอ (Esc)' : 'ขยายตารางเต็มจอเพื่อดูผลงานได้อย่างชัดเจน'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSubdistrictFullscreen ? '1px solid #ef4444' : '1px solid #0284c7',
                      backgroundColor: isSubdistrictFullscreen ? '#dc2626' : '#f0f9ff',
                      color: isSubdistrictFullscreen ? '#fff' : '#0284c7',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <span>{isSubdistrictFullscreen ? '✖ ย่อกลับ (Esc)' : '⛶ ขยายเต็มจอ'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Row */}
            <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>เลือกอำเภอ:</label>
                <select 
                  className="input-field" 
                  style={{ width: '200px', padding: '0.35rem 0.55rem', fontSize: '0.82rem' }}
                  value={subdistrictDistrict} 
                  onChange={(e) => setSubdistrictDistrict(e.target.value)}
                >
                  <option value="ALL">📍 แสดงทุกอำเภอ (108 รพ.สต.)</option>
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      อำเภอ{d} ({countByDistrict[d] || 0} แห่ง)
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter: Main Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>หมวดหมู่หลัก:</label>
                <select 
                  className="input-field" 
                  style={{ width: '180px', padding: '0.35rem 0.55rem', fontSize: '0.82rem' }}
                  value={hdcFilterMainCategory} 
                  onChange={(e) => {
                    setHdcFilterMainCategory(e.target.value);
                    setHdcFilterSubCategory('ALL');
                  }}
                >
                  <option value="ALL">📁 ทุกหมวดหมู่หลัก</option>
                  {Object.keys(HDC_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter: Subcategory */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>หมวดหมู่ย่อย:</label>
                <select 
                  className="input-field" 
                  style={{ width: '190px', padding: '0.35rem 0.55rem', fontSize: '0.82rem' }}
                  value={hdcFilterSubCategory} 
                  onChange={(e) => setHdcFilterSubCategory(e.target.value)}
                >
                  <option value="ALL">📂 ทุกหมวดหมู่ย่อย</option>
                  {(hdcFilterMainCategory !== 'ALL'
                    ? HDC_CATEGORIES[hdcFilterMainCategory] || []
                    : Array.from(new Set(Object.values(HDC_CATEGORIES).flat()))
                  ).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                {(hdcFilterMainCategory !== 'ALL' || hdcFilterSubCategory !== 'ALL') && (
                  <button
                    onClick={() => {
                      setHdcFilterMainCategory('ALL');
                      setHdcFilterSubCategory('ALL');
                    }}
                    title="ล้างตัวกรองหมวดหมู่"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}
                  >
                    ✕ ล้าง
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ width: '200px', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
                  placeholder="ค้นหาชื่อ รพ.สต. หรือ รหัส 5 หลัก..."
                  value={subdistrictSearch}
                  onChange={(e) => setSubdistrictSearch(e.target.value)}
                />
                {subdistrictSearch && (
                  <button 
                    onClick={() => setSubdistrictSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--secondary-foreground)' }}
                  >
                    ✕ ล้าง
                  </button>
                )}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button 
                  onClick={() => setSubdistrictViewMode('matrix')}
                  style={{ 
                    padding: '0.3rem 0.65rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: subdistrictViewMode === 'matrix' ? 'var(--primary)' : '#fff',
                    color: subdistrictViewMode === 'matrix' ? '#fff' : 'var(--foreground)'
                  }}
                >
                  ตาราง Heatmap ({displayFacilities.length} แห่ง)
                </button>
                <button 
                  onClick={() => setSubdistrictViewMode('list')}
                  style={{ 
                    padding: '0.3rem 0.65rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem', 
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: subdistrictViewMode === 'list' ? 'var(--primary)' : '#fff',
                    color: subdistrictViewMode === 'list' ? '#fff' : 'var(--foreground)'
                  }}
                >
                  รายชื่อ รพ.สต.
                </button>
                <button 
                  onClick={() => setIsSubdistrictFullscreen(!isSubdistrictFullscreen)}
                  title={isSubdistrictFullscreen ? 'ออกจากโหมดเต็มจอ (Esc)' : 'ขยายเต็มจอเพื่อดูผลงานเต็มตา'}
                  style={{ 
                    padding: '0.3rem 0.65rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: isSubdistrictFullscreen ? '1px solid #ef4444' : '1px solid #0284c7',
                    fontSize: '0.78rem', 
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: isSubdistrictFullscreen ? '#dc2626' : '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {isSubdistrictFullscreen ? '✖ ย่อ' : '⛶ เต็มจอ'}
                </button>
              </div>
            </div>

            {/* Content Area */}
            {subdistrictViewMode === 'matrix' ? (
              <div style={{ flex: 1, overflow: 'auto' }}>
                {filteredHdcKpis.length === 0 && (
                  <div style={{
                    margin: '1.25rem',
                    padding: '1.5rem',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📂</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      ไม่พบตัวชี้วัดที่ตรงกับหมวดหมู่ที่เลือก
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                      หมวดหมู่หลัก: <strong style={{ color: '#0f172a' }}>{hdcFilterMainCategory === 'ALL' ? 'ทุกหมวด' : hdcFilterMainCategory}</strong> 
                      {hdcFilterSubCategory !== 'ALL' && <> | หมวดหมู่ย่อย: <strong style={{ color: '#0f172a' }}>{hdcFilterSubCategory}</strong></>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          setHdcFilterMainCategory('ALL');
                          setHdcFilterSubCategory('ALL');
                        }}
                        style={{
                          padding: '0.45rem 1rem',
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        🔄 แสดงตัวชี้วัดทั้งหมด
                      </button>
                      <button
                        onClick={() => {
                          const mainCat = hdcFilterMainCategory !== 'ALL' ? hdcFilterMainCategory : 'การเข้าถึงบริการ';
                          const subCat = hdcFilterSubCategory !== 'ALL' ? hdcFilterSubCategory : (HDC_CATEGORIES[mainCat]?.[0] || 'แพทย์แผนไทย');
                          setNewHdcForm(prev => ({
                            ...prev,
                            mainCategory: mainCat,
                            subCategory: subCat
                          }));
                          setIsAddHdcModalOpen(true);
                        }}
                        style={{
                          padding: '0.45rem 1rem',
                          backgroundColor: '#fff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}
                      >
                        ➕ เพิ่มตัวชี้วัดใหม่ในหมวดนี้
                      </button>
                    </div>
                  </div>
                )}
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', width: '85px', minWidth: '85px', backgroundColor: '#f8fafc', position: 'sticky', left: 0, zIndex: 25 }}>
                        รหัส 5 หลัก
                      </th>
                      <th style={{ padding: '0.75rem 0.85rem', textAlign: 'left', borderBottom: '2px solid var(--border)', borderRight: '2px solid var(--border)', width: '250px', minWidth: '250px', backgroundColor: '#f8fafc', position: 'sticky', left: '85px', zIndex: 25 }}>
                        ชื่อ รพ.สต.
                      </th>
                      {filteredHdcKpis.map((kpi) => (
                        <th 
                          key={kpi.id}
                          style={{ 
                            padding: '0.75rem 0.5rem', 
                            textAlign: 'center', 
                            borderBottom: '2px solid var(--border)', 
                            borderRight: '1px solid var(--border)',
                            minWidth: '190px',
                            backgroundColor: '#f8fafc'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                {kpi.code}
                              </span>
                              {/* Tag ปีงบประมาณ */}
                              <span 
                                title={`ข้อมูลปีงบประมาณ ${kpi.year || '2569'}`}
                                style={{ 
                                  fontSize: '0.68rem', 
                                  fontWeight: 700, 
                                  color: '#92400e', 
                                  backgroundColor: '#fef3c7', 
                                  border: '1px solid #fde68a',
                                  padding: '0.08rem 0.4rem', 
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.15rem'
                                }}
                              >
                                📅 ปี {kpi.year || '2569'}
                              </span>
                              {/* Tag หมวดหมู่ */}
                              <span 
                                title={`หมวดหมู่: ${kpi.mainCategory || 'ส่งเสริมป้องกัน'} > ${kpi.subCategory || 'อนามัยแม่และเด็ก'}`}
                                style={{ 
                                  fontSize: '0.66rem', 
                                  fontWeight: 600, 
                                  color: '#6b21a8', 
                                  backgroundColor: '#f3e8ff', 
                                  border: '1px solid #e9d5ff',
                                  padding: '0.08rem 0.4rem', 
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.15rem',
                                  maxWidth: '170px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                🏷️ {kpi.subCategory || kpi.mainCategory || 'ทั่วไป'}
                              </span>
                              <span style={{ fontSize: '0.73rem', color: 'var(--secondary-foreground)' }} title={`ตาราง: ${kpi.tableName}, คอลัมน์ผลงาน: ${kpi.resultColumn || 'อัตโนมัติ'}, คอลัมน์เป้าหมาย: ${kpi.targetColumn || 'target'}`}>
                                ({kpi.tableName}{kpi.resultColumn ? `:${kpi.resultColumn}` : ''})
                              </span>
                              {/* ปุ่มแก้ไขตัวชี้วัด */}
                              <button
                                onClick={() => handleOpenEditHdcModal(kpi)}
                                title="แก้ไขตัวชี้วัด (เปลี่ยนชื่อ, ตาราง, ปีงบประมาณ หรือเป้าหมาย)"
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#0284c7', 
                                  cursor: 'pointer', 
                                  fontSize: '0.82rem', 
                                  padding: '0 0.15rem',
                                  lineHeight: 1
                                }}
                              >
                                ✏️
                              </button>
                              {/* ปุ่มลบ */}
                              {kpi.id !== 'hdc-anc5' && kpi.id !== 'hdc-anc12' && (
                                <button
                                  onClick={() => handleDeleteHdcKpi(kpi.id)}
                                  title="ลบตัวชี้วัดนี้"
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', padding: '0 0.15rem' }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>
                              {kpi.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                                เป้าหมาย: <strong>{kpi.targetOperator} {kpi.targetValue}%</strong>
                              </span>
                              <button
                                onClick={() => handleFetchHdcData(kpi.id)}
                                disabled={fetchingHdcId === kpi.id}
                                title="กดเพื่อดึงผลงานสดจาก HDC Open Data Web Service"
                                style={{
                                  padding: '0.15rem 0.4rem',
                                  fontSize: '0.7rem',
                                  borderRadius: '4px',
                                  border: '1px solid #0284c7',
                                  backgroundColor: '#f0f9ff',
                                  color: '#0284c7',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                {fetchingHdcId === kpi.id ? '⏳ กำลังดึง...' : '🔄 ดึง HDC'}
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', borderBottom: '2px solid var(--border)', width: '60px', backgroundColor: '#f8fafc' }}>
                        <button
                          onClick={() => setIsAddHdcModalOpen(true)}
                          title="เพิ่มตัวชี้วัด HDC ใหม่"
                          style={{
                            background: 'none',
                            border: '1px dashed var(--primary)',
                            borderRadius: '4px',
                            color: 'var(--primary)',
                            padding: '0.3rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          + เพิ่ม
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByDistrict.map(({ district: distName, facilities: distFacilities }) => (
                      <React.Fragment key={distName}>
                        {/* District Divider Row */}
                        <tr style={{ backgroundColor: '#e2e8f0' }}>
                          <td 
                            colSpan={2 + filteredHdcKpis.length + 1} 
                            style={{ 
                              padding: '0.45rem 1rem', 
                              fontWeight: 700, 
                              color: '#0f172a', 
                              fontSize: '0.85rem',
                              borderTop: '2px solid #cbd5e1',
                              borderBottom: '2px solid #cbd5e1',
                              position: 'sticky',
                              left: 0,
                              zIndex: 3
                            }}
                          >
                            📍 อำเภอ{distName} ({distFacilities.length} แห่ง)
                          </td>
                        </tr>

                        {/* Facilities rows in this district */}
                        {distFacilities.map((fac) => (
                          <tr key={fac.code5 || fac.name} style={{ borderBottom: '1px solid var(--border)' }}>
                            {/* Column 1: รหัส 5 หลัก */}
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid var(--border)', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', backgroundColor: '#fff', position: 'sticky', left: 0, zIndex: 2 }}>
                              {fac.code5 || '-'}
                            </td>

                            {/* Column 2: ชื่อ รพ.สต. */}
                            <td style={{ padding: '0.5rem 1rem', borderRight: '2px solid var(--border)', backgroundColor: '#fff', position: 'sticky', left: '85px', zIndex: 2 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                {formatFacilityDisplayName(fac)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                                อ.{fac.district}
                              </div>
                            </td>

                            {/* HDC KPI Result Cells (Full-cell background color with percentage) */}
                            {filteredHdcKpis.map((kpi) => {
                              const res = kpi.results[fac.code5];
                              const status = res?.status || 'pending';
                              const valDisplay = res?.value || 'รอผล';
                              const bgColor = getCellBg(status);
                              const textColor = getCellTextColor(status);

                              return (
                                <td 
                                  key={kpi.id}
                                  title={`[${fac.name}]\nตัวชี้วัด: ${kpi.name}\nผลงาน: ${valDisplay}${res?.detail ? ` (${res.detail})` : ''} (เป้าหมาย: ${kpi.targetOperator} ${kpi.targetValue}%)`}
                                  style={{ 
                                    padding: '0', 
                                    textAlign: 'center', 
                                    borderRight: '1px solid #e2e8f0',
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    height: '46px'
                                  }}
                                >
                                  <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontWeight: 700, 
                                    fontSize: '0.875rem',
                                    letterSpacing: '0.02em',
                                    textShadow: status !== 'pending' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                                  }}>
                                    {valDisplay}
                                  </div>
                                </td>
                              );
                            })}

                            <td style={{ borderRight: '1px solid var(--border)', backgroundColor: '#fafafa' }}></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}

                    {displayFacilities.length === 0 && (
                      <tr>
                        <td colSpan={2 + hdcKpis.length + 1} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
                          ไม่พบข้อมูล รพ.สต. ตามเงื่อนไขที่เลือก
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* List View Mode */
              <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>รหัส 5 หลัก</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>รหัส 9 หลัก</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ชื่อ รพ.สต.</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>อำเภอ</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ประเภท</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>สถานะการเชื่อมต่อ HDC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFacilities.map((fac) => (
                      <tr key={fac.code5 || fac.name} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {fac.code5 || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', color: 'var(--secondary-foreground)', fontSize: '0.8rem' }}>
                          {fac.code9_new || fac.code9 || '-'}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                          {formatFacilityDisplayName(fac)}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                            {fac.district}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--secondary-foreground)', fontSize: '0.8rem' }}>
                          {fac.type}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            พร้อมเชื่อม HDC API
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal: เพิ่มตัวชี้วัด HDC (บนสุดของจอ) */}
            {isAddHdcModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1.25rem 1rem',
                overflowY: 'auto'
              }}>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: '560px',
                  maxHeight: 'calc(100vh - 2.5rem)',
                  overflowY: 'auto',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                  padding: '1.25rem 1.5rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ➕ เพิ่มตัวชี้วัด HDC Open Data (ระดับ รพ.สต.)
                    </h3>
                    <button 
                      onClick={() => setIsAddHdcModalOpen(false)}
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          รหัสตัวชี้วัด
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.code}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, code: e.target.value })}
                          placeholder="เช่น HDC-04"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ชื่อตัวชี้วัด *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.name}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, name: e.target.value })}
                          placeholder="เช่น ร้อยละหญิงตั้งครรภ์ฝากครรภ์ครั้งแรกก่อน 12 สัปดาห์"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ชื่อตาราง HDC (tableName) *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.tableName}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, tableName: e.target.value })}
                          placeholder="เช่น s_ttm27, s_ncd_dm"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ปีงบประมาณ (year)
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={newHdcForm.year}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, year: e.target.value })}
                          placeholder="2569"
                        />
                      </div>
                    </div>

                    {/* หมวดหมู่หลัก และ หมวดหมู่ย่อย */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          หมวดหมู่หลัก *
                        </label>
                        <select
                          className="input-field"
                          value={newHdcForm.mainCategory}
                          onChange={(e) => {
                            const selectedCat = e.target.value;
                            const firstSub = HDC_CATEGORIES[selectedCat]?.[0] || '';
                            setNewHdcForm({
                              ...newHdcForm,
                              mainCategory: selectedCat,
                              subCategory: firstSub
                            });
                          }}
                        >
                          {Object.keys(HDC_CATEGORIES).map((cat) => (
                            <option key={cat} value={cat}>📁 {cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          หมวดหมู่ย่อย *
                        </label>
                        <select
                          className="input-field"
                          value={newHdcForm.subCategory}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, subCategory: e.target.value })}
                        >
                          {(HDC_CATEGORIES[newHdcForm.mainCategory] || []).map((sub) => (
                            <option key={sub} value={sub}>📂 {sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          เครื่องหมาย
                        </label>
                        <select
                          className="input-field"
                          value={newHdcForm.targetOperator}
                          onChange={(e) => {
                            const op = e.target.value;
                            const curTarget = Number(newHdcForm.targetValue) || 0;
                            const newWarn = op === '<='
                              ? (Math.round(curTarget * 1.3) || (curTarget + 4))
                              : Math.round(curTarget * 0.8);
                            setNewHdcForm({ ...newHdcForm, targetOperator: op, warningValue: newWarn });
                          }}
                        >
                          <option value=">=">&gt;= (มากกว่า ยิ่งมากยิ่งดี)</option>
                          <option value="<=">&lt;= (น้อยกว่า ยิ่งน้อยยิ่งดี)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#16a34a' }}>
                          {newHdcForm.targetOperator === '<=' ? 'ผ่านเกณฑ์ (<= %) *' : 'ผ่านเกณฑ์ (>= %) *'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="input-field"
                          value={newHdcForm.targetValue}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const newWarn = newHdcForm.targetOperator === '<='
                              ? (Math.round(val * 1.3) || (val + 4))
                              : Math.round(val * 0.8);
                            setNewHdcForm({ ...newHdcForm, targetValue: val, warningValue: newWarn });
                          }}
                          placeholder={newHdcForm.targetOperator === '<=' ? "เช่น 11" : "เช่น 75"}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#ca8a04' }}>
                          {newHdcForm.targetOperator === '<=' ? 'เฝ้าระวัง (<= %)' : 'เฝ้าระวัง (>= %)'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="input-field"
                          value={newHdcForm.warningValue !== undefined ? newHdcForm.warningValue : (newHdcForm.targetOperator === '<=' ? Math.round(newHdcForm.targetValue * 1.3) : Math.round(newHdcForm.targetValue * 0.8))}
                          onChange={(e) => setNewHdcForm({ ...newHdcForm, warningValue: Number(e.target.value) })}
                          placeholder={newHdcForm.targetOperator === '<=' ? "เช่น 15" : "เช่น 60"}
                        />
                      </div>
                    </div>

                    {/* Color guide explanation badge */}
                    <div style={{
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.65rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #e2e8f0',
                      marginTop: '-0.25rem',
                      lineHeight: 1.4
                    }}>
                      {newHdcForm.targetOperator === '<=' ? (
                        <div>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≤ {newHdcForm.targetValue}% (ยิ่งน้อยยิ่งดี)</span>
                          {' · '}
                          <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: &gt; {newHdcForm.targetValue}% ถึง ≤ {newHdcForm.warningValue}%</span>
                          {' · '}
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &gt; {newHdcForm.warningValue}% (เกินเกณฑ์คือแย่)</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≥ {newHdcForm.targetValue}%</span>
                          {' · '}
                          <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: ≥ {newHdcForm.warningValue}% ถึง &lt; {newHdcForm.targetValue}%</span>
                          {' · '}
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &lt; {newHdcForm.warningValue}%</span>
                        </div>
                      )}
                    </div>

                    {/* Column Mapping Section */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                          ⚙️ ตั้งค่าคอลัมน์ HDC สำหรับคำนวณ (สูตร: ตัวตั้ง ÷ ตัวหาร × 100)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleInspectHdcTable(newHdcForm.tableName, newHdcForm.year)}
                          disabled={inspectingHdc}
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #0284c7',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {inspectingHdc ? '⏳ กำลังตรวจ...' : '🔍 ตรวจสอบคอลัมน์จาก HDC'}
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                            คอลัมน์ผลงาน (ตัวตั้ง / Numerator)
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={newHdcForm.resultColumn}
                            onChange={e => setNewHdcForm({ ...newHdcForm, resultColumn: e.target.value })}
                            placeholder="auto (เช่น result, result1, result2)"
                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                            คอลัมน์เป้าหมาย (ตัวหาร / Denominator)
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={newHdcForm.targetColumn}
                            onChange={e => setNewHdcForm({ ...newHdcForm, targetColumn: e.target.value })}
                            placeholder="target"
                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                          />
                        </div>
                      </div>

                      {/* Inspected schema pills preview */}
                      {inspectedSchema && inspectedSchema.tableName === newHdcForm.tableName && (
                        <div style={{ marginTop: '0.6rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '0.6rem' }}>
                          <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                            📊 คอลัมน์ที่พบในตาราง HDC (ตัวอย่าง รพ.สต. {inspectedSchema.sampleRow.hospcode}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                            {inspectedSchema.availableCols.map(col => {
                              const val = inspectedSchema.sampleRow[col];
                              const isRes = newHdcForm.resultColumn === col;
                              const isTar = newHdcForm.targetColumn === col;
                              return (
                                <div key={col} style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  border: isRes ? '1.5px solid #2563eb' : isTar ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  backgroundColor: isRes ? '#eff6ff' : isTar ? '#f0fdf4' : '#fff',
                                  padding: '0.1rem 0.35rem',
                                  fontSize: '0.72rem'
                                }}>
                                  <span style={{ fontWeight: 600 }}>{col}: <strong>{val ?? '-'}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => setNewHdcForm({ ...newHdcForm, resultColumn: col })}
                                    style={{
                                      marginLeft: '0.3rem',
                                      padding: '0.05rem 0.2rem',
                                      borderRadius: '2px',
                                      border: 'none',
                                      backgroundColor: isRes ? '#2563eb' : '#e2e8f0',
                                      color: isRes ? '#fff' : '#334155',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    ตั้ง
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setNewHdcForm({ ...newHdcForm, targetColumn: col })}
                                    style={{
                                      marginLeft: '0.15rem',
                                      padding: '0.05rem 0.2rem',
                                      borderRadius: '2px',
                                      border: 'none',
                                      backgroundColor: isTar ? '#16a34a' : '#e2e8f0',
                                      color: isTar ? '#fff' : '#334155',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    หาร
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          {(() => {
                            const nCol = newHdcForm.resultColumn || 'result';
                            const dCol = newHdcForm.targetColumn || 'target';
                            const nVal = Number(inspectedSchema.sampleRow[nCol]) || 0;
                            const dVal = Number(inspectedSchema.sampleRow[dCol]) || 0;
                            const sPct = dVal > 0 ? Math.round((nVal / dVal) * 1000) / 10 : 0;
                            return (
                              <div style={{ backgroundColor: '#fff', padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.73rem' }}>
                                💡 <b>ตัวอย่างผลคำนวณ:</b> ({nCol}: {nVal} ÷ {dCol}: {dVal}) × 100 = <b>{sPct}%</b>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* API Code Preview (Collapsible) */}
                    <details style={{ backgroundColor: '#0f172a', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', color: '#f8fafc', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                      <summary style={{ color: '#94a3b8', cursor: 'pointer', outline: 'none' }}>
                        // โครงสร้าง Web Service: <span style={{ color: '#38bdf8' }}>{newHdcForm.tableName || 's_ttm27'} ({newHdcForm.year || '2569'})</span>
                      </summary>
                      <pre style={{ margin: '0.4rem 0 0 0', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: '0.72rem' }}>
{`{
  "tableName": "${newHdcForm.tableName || 's_ttm27'}",
  "year": "${newHdcForm.year || '2569'}",
  "province": "27",
  "type": "json"
}`}
                      </pre>
                    </details>

                    {/* Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsAddHdcModalOpen(false)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateHdcKpi}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        บันทึกตัวชี้วัด
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: แก้ไขตัวชี้วัด HDC (บนสุดของจอ) */}
            {isEditHdcModalOpen && editingHdcKpi && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1.25rem 1rem',
                overflowY: 'auto'
              }}>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: '560px',
                  maxHeight: 'calc(100vh - 2.5rem)',
                  overflowY: 'auto',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                  padding: '1.25rem 1.5rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ✏️ แก้ไขตัวชี้วัด HDC Open Data ({editingHdcKpi.code})
                    </h3>
                    <button 
                      onClick={() => setIsEditHdcModalOpen(false)}
                      style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          รหัสตัวชี้วัด
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={editingHdcKpi.code}
                          onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, code: e.target.value })}
                          placeholder="เช่น HDC-01"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ชื่อตัวชี้วัด *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={editingHdcKpi.name}
                          onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, name: e.target.value })}
                          placeholder="ชื่อตัวชี้วัด"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ชื่อตาราง HDC (tableName) *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={editingHdcKpi.tableName}
                          onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, tableName: e.target.value })}
                          placeholder="เช่น s_kpi_anc12"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          ปีงบประมาณ (year) *
                        </label>
                        <select
                          className="input-field"
                          value={editingHdcKpi.year}
                          onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, year: e.target.value })}
                        >
                          <option value="2570">ปีงบประมาณ 2570</option>
                          <option value="2569">ปีงบประมาณ 2569</option>
                          <option value="2568">ปีงบประมาณ 2568</option>
                          <option value="2567">ปีงบประมาณ 2567</option>
                        </select>
                      </div>
                    </div>

                    {/* หมวดหมู่หลัก และ หมวดหมู่ย่อย */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          หมวดหมู่หลัก *
                        </label>
                        <select
                          className="input-field"
                          value={editingHdcKpi.mainCategory || 'ส่งเสริมป้องกัน'}
                          onChange={(e) => {
                            const selectedCat = e.target.value;
                            const firstSub = HDC_CATEGORIES[selectedCat]?.[0] || '';
                            setEditingHdcKpi({
                              ...editingHdcKpi,
                              mainCategory: selectedCat,
                              subCategory: firstSub
                            });
                          }}
                        >
                          {Object.keys(HDC_CATEGORIES).map((cat) => (
                            <option key={cat} value={cat}>📁 {cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          หมวดหมู่ย่อย *
                        </label>
                        <select
                          className="input-field"
                          value={editingHdcKpi.subCategory || (HDC_CATEGORIES[editingHdcKpi.mainCategory || 'ส่งเสริมป้องกัน']?.[0] || '')}
                          onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, subCategory: e.target.value })}
                        >
                          {(HDC_CATEGORIES[editingHdcKpi.mainCategory || 'ส่งเสริมป้องกัน'] || []).map((sub) => (
                            <option key={sub} value={sub}>📂 {sub}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                          เครื่องหมาย
                        </label>
                        <select
                          className="input-field"
                          value={editingHdcKpi.targetOperator}
                          onChange={(e) => {
                            const op = e.target.value;
                            const curTarget = Number(editingHdcKpi.targetValue) || 0;
                            const newWarn = op === '<='
                              ? (Math.round(curTarget * 1.3) || (curTarget + 4))
                              : Math.round(curTarget * 0.8);
                            setEditingHdcKpi({ ...editingHdcKpi, targetOperator: op, warningValue: newWarn });
                          }}
                        >
                          <option value=">=">&gt;= (มากกว่า ยิ่งมากยิ่งดี)</option>
                          <option value="<=">&lt;= (น้อยกว่า ยิ่งน้อยยิ่งดี)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#16a34a' }}>
                          {editingHdcKpi.targetOperator === '<=' ? 'ผ่านเกณฑ์ (<= %) *' : 'ผ่านเกณฑ์ (>= %) *'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="input-field"
                          value={editingHdcKpi.targetValue}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const newWarn = editingHdcKpi.targetOperator === '<='
                              ? (Math.round(val * 1.3) || (val + 4))
                              : Math.round(val * 0.8);
                            setEditingHdcKpi({ ...editingHdcKpi, targetValue: val, warningValue: newWarn });
                          }}
                          placeholder={editingHdcKpi.targetOperator === '<=' ? "เช่น 11" : "เช่น 75"}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: '#ca8a04' }}>
                          {editingHdcKpi.targetOperator === '<=' ? 'เฝ้าระวัง (<= %)' : 'เฝ้าระวัง (>= %)'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="input-field"
                          value={editingHdcKpi.warningValue !== undefined ? editingHdcKpi.warningValue : (editingHdcKpi.targetOperator === '<=' ? Math.round(editingHdcKpi.targetValue * 1.3) : Math.round(editingHdcKpi.targetValue * 0.8))}
                          onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, warningValue: Number(e.target.value) })}
                          placeholder={editingHdcKpi.targetOperator === '<=' ? "เช่น 15" : "เช่น 60"}
                        />
                      </div>
                    </div>

                    {/* Color guide explanation badge */}
                    <div style={{
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.65rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #e2e8f0',
                      marginTop: '-0.25rem',
                      lineHeight: 1.4
                    }}>
                      {editingHdcKpi.targetOperator === '<=' ? (
                        <div>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≤ {editingHdcKpi.targetValue}% (ยิ่งน้อยยิ่งดี)</span>
                          {' · '}
                          <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: &gt; {editingHdcKpi.targetValue}% ถึง ≤ {editingHdcKpi.warningValue}%</span>
                          {' · '}
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &gt; {editingHdcKpi.warningValue}% (เกินเกณฑ์คือแย่)</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>🟢 ผ่านเกณฑ์: ≥ {editingHdcKpi.targetValue}%</span>
                          {' · '}
                          <span style={{ color: '#ca8a04', fontWeight: 700 }}>🟡 เฝ้าระวัง: ≥ {editingHdcKpi.warningValue}% ถึง &lt; {editingHdcKpi.targetValue}%</span>
                          {' · '}
                          <span style={{ color: '#dc2626', fontWeight: 700 }}>🔴 ไม่ผ่านเกณฑ์: &lt; {editingHdcKpi.warningValue}%</span>
                        </div>
                      )}
                    </div>

                    {/* Column Mapping Section */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                          ⚙️ ตั้งค่าคอลัมน์ HDC สำหรับคำนวณ (สูตร: ตัวตั้ง ÷ ตัวหาร × 100)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleInspectHdcTable(editingHdcKpi.tableName, editingHdcKpi.year)}
                          disabled={inspectingHdc}
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #0284c7',
                            backgroundColor: '#f0f9ff',
                            color: '#0284c7',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {inspectingHdc ? '⏳ กำลังตรวจ...' : '🔍 ตรวจสอบคอลัมน์จาก HDC'}
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                            คอลัมน์ผลงาน (ตัวตั้ง / Numerator)
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={editingHdcKpi.resultColumn || ''}
                            onChange={e => setEditingHdcKpi({ ...editingHdcKpi, resultColumn: e.target.value })}
                            placeholder="auto (เช่น result, result1, result2)"
                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                            คอลัมน์เป้าหมาย (ตัวหาร / Denominator)
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={editingHdcKpi.targetColumn || 'target'}
                            onChange={e => setEditingHdcKpi({ ...editingHdcKpi, targetColumn: e.target.value })}
                            placeholder="target"
                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                          />
                        </div>
                      </div>

                      {/* Inspected schema pills preview */}
                      {inspectedSchema && inspectedSchema.tableName === editingHdcKpi.tableName && (
                        <div style={{ marginTop: '0.6rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '0.6rem' }}>
                          <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                            📊 คอลัมน์ที่พบในตาราง HDC (ตัวอย่าง รพ.สต. {inspectedSchema.sampleRow.hospcode}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
                            {inspectedSchema.availableCols.map(col => {
                              const val = inspectedSchema.sampleRow[col];
                              const isRes = editingHdcKpi.resultColumn === col;
                              const isTar = (editingHdcKpi.targetColumn || 'target') === col;
                              return (
                                <div key={col} style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  border: isRes ? '1.5px solid #2563eb' : isTar ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  backgroundColor: isRes ? '#eff6ff' : isTar ? '#f0fdf4' : '#fff',
                                  padding: '0.1rem 0.35rem',
                                  fontSize: '0.72rem'
                                }}>
                                  <span style={{ fontWeight: 600 }}>{col}: <strong>{val ?? '-'}</strong></span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingHdcKpi({ ...editingHdcKpi, resultColumn: col })}
                                    style={{
                                      marginLeft: '0.3rem',
                                      padding: '0.05rem 0.2rem',
                                      borderRadius: '2px',
                                      border: 'none',
                                      backgroundColor: isRes ? '#2563eb' : '#e2e8f0',
                                      color: isRes ? '#fff' : '#334155',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    ตั้ง
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingHdcKpi({ ...editingHdcKpi, targetColumn: col })}
                                    style={{
                                      marginLeft: '0.15rem',
                                      padding: '0.05rem 0.2rem',
                                      borderRadius: '2px',
                                      border: 'none',
                                      backgroundColor: isTar ? '#16a34a' : '#e2e8f0',
                                      color: isTar ? '#fff' : '#334155',
                                      cursor: 'pointer',
                                      fontSize: '0.65rem',
                                      fontWeight: 600
                                    }}
                                  >
                                    หาร
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          {(() => {
                            const nCol = editingHdcKpi.resultColumn || 'result';
                            const dCol = editingHdcKpi.targetColumn || 'target';
                            const nVal = Number(inspectedSchema.sampleRow[nCol]) || 0;
                            const dVal = Number(inspectedSchema.sampleRow[dCol]) || 0;
                            const sPct = dVal > 0 ? Math.round((nVal / dVal) * 1000) / 10 : 0;
                            return (
                              <div style={{ backgroundColor: '#fff', padding: '0.3rem 0.5rem', borderRadius: '3px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.73rem' }}>
                                💡 <b>ตัวอย่างผลคำนวณ:</b> ({nCol}: {nVal} ÷ {dCol}: {dVal}) × 100 = <b>{sPct}%</b>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Option Checkbox */}
                    <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#0369a1', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={editingHdcKpi.refetchOnSave}
                          onChange={(e) => setEditingHdcKpi({ ...editingHdcKpi, refetchOnSave: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>🔄 ดึงข้อมูลผลงานสดจาก HDC ใหม่ทันทีหลังกดบันทึก (แนะนำเมื่อเปลี่ยนชื่อตารางหรือปีงบประมาณ)</span>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsEditHdcModalOpen(false)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditHdcKpi}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        บันทึกการแก้ไข
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'vital' && (
        <PopulationVitalDashboard />
      )}

      {activeTab === 'detail' && (
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
          <div className="card" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="ค้นหาตัวชี้วัด..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: '0.75rem' }}
            />
            {statusQuickFilter !== 'all' && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: statusQuickFilter === 'success' ? '#f0fdf4' : statusQuickFilter === 'warning' ? '#fefce8' : statusQuickFilter === 'error' ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${statusQuickFilter === 'success' ? '#86efac' : statusQuickFilter === 'warning' ? '#fde047' : statusQuickFilter === 'error' ? '#fca5a5' : '#cbd5e1'}`,
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <span>กรอง: <strong>{statusQuickFilter === 'success' ? '🟢 ผ่าน' : statusQuickFilter === 'warning' ? '🟡 เฝ้าระวัง' : statusQuickFilter === 'error' ? '🔴 ไม่ผ่าน' : '🔄 รอผล'}</strong> ({filteredKpis.length})</span>
                <button type="button" onClick={() => setStatusQuickFilter('all')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem' }}>✕ ล้าง</button>
              </div>
            )}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {filteredKpis.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--secondary-foreground)', marginTop: '2rem' }}>ไม่พบตัวชี้วัด</div>
              )}
              {filteredKpis.map(kpi => (
                <div 
                  key={kpi.id} 
                  onClick={() => setSelectedKpiId(kpi.id)}
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid',
                    borderColor: selectedKpiId === kpi.id ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: selectedKpiId === kpi.id ? '#f0f9ff' : 'var(--card)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.4rem',
                      backgroundColor: kpi.status === 'success' ? '#dcfce7' : kpi.status === 'warning' ? '#fef08a' : kpi.status === 'pending' ? '#e2e8f0' : '#fee2e2',
                      color: kpi.status === 'success' ? '#166534' : kpi.status === 'warning' ? '#854d0e' : kpi.status === 'pending' ? '#475569' : '#991b1b',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {kpi.status === 'success' ? 'ผ่าน' : kpi.status === 'warning' ? 'เฝ้าระวัง' : kpi.status === 'pending' ? 'รอดำเนินการ' : 'ไม่ผ่าน'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary-foreground)' }}>{kpi.responsible_group}</span>
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, lineHeight: 1.4 }}><span style={{color:'var(--primary)'}}>[{kpi.auto_id}]</span> {kpi.name}</h4>
                </div>
              ))}
            </div>
          </div>

          {selectedKpi && (
            <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px' }}>
                  {selectedKpi.measurement_level.toUpperCase()}
                </span>
                {selectedKpi.tags.map((t: string) => (
                  <span key={t} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#fef08a', color: '#854d0e', borderRadius: '4px', fontWeight: 500 }}>
                    🏷️ {t}
                  </span>
                ))}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}><span style={{color:'var(--primary)'}}>[{selectedKpi.auto_id}]</span> {selectedKpi.name}</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>เป้าหมาย (เขียว)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534' }}>
                    {selectedKpi.target || (selectedKpi.target_val !== null ? `${selectedKpi.target_operator} ${selectedKpi.target_val}` : '-')}
                  </div>
                  {selectedKpi.target_warning_val !== null && (
                     <div style={{ fontSize: '0.8rem', color: '#854d0e', marginTop: '0.25rem' }}>
                       (เฝ้าระวัง: {selectedKpi.target_operator} {selectedKpi.target_warning_val})
                     </div>
                  )}
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', backgroundColor: selectedKpi.calculation_type === 'process_status' ? '#f8fafc' : 'transparent' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>ผลงานภาพรวมจังหวัด</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: selectedKpi.calculation_type === 'process_status' ? getStatusColor(selectedKpi.status) : getStatusColor(evaluateStatus(Number(selectedKpi.provincial_result), selectedKpi)) }}>
                    {selectedKpi.calculation_type === 'process_status' ? (selectedKpi.status === 'success' ? 'ผ่าน' : selectedKpi.status === 'pending' ? 'รอดำเนินการ' : 'ไม่ผ่าน') : selectedKpi.provincial_result}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', backgroundColor: 'var(--secondary)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--secondary-foreground)' }}>รอบการประเมิน</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedKpi.frequency}</div>
                </div>
              </div>

              {/* Action Plan Sub-KRs Section (แผนปฏิบัติการ 1 ปี) */}
              {selectedKpi.sub_krs && selectedKpi.sub_krs.length > 0 && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>📋</span> แผนปฏิบัติการ 1 ปี: ตัวชี้วัดย่อย / กิจกรรมสำคัญ (Sub-Key Results)
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--secondary-foreground)', marginTop: '0.2rem' }}>
                        เป้าหมายและผลการดำเนินงานรอบ {selectedQuarter} (มี {selectedKpi.currentSubKrs?.length || 0} รายการในรอบนี้ จากทั้งหมด {selectedKpi.sub_krs.length} รายการในแผน 1 ปี)
                      </div>
                    </div>
                  </div>

                  {(!selectedKpi.currentSubKrs || selectedKpi.currentSubKrs.length === 0) ? (
                    <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '6px', color: 'var(--secondary-foreground)', fontSize: '0.85rem' }}>
                      ไม่มีแผนตัวชี้วัดย่อยที่ต้องรายงานในรอบ {selectedQuarter} (สามารถเลือกไตรมาสอื่นที่เมนูด้านบนเพื่อตรวจสอบ)
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', width: '110px' }}>รหัสย่อย</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>ชื่อตัวชี้วัดย่อย / กิจกรรมสำคัญ</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '120px' }}>เป้าหมาย</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '140px' }}>ผลการรายงาน</th>
                            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', width: '120px' }}>สถานะ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedKpi.currentSubKrs.map((sub: any, sIdx: number) => {
                            const isPass = sub.status === 'success' || sub.status === 'ผ่าน';
                            const isProgress = sub.status === 'in_progress' || sub.status === 'กำลังดำเนินการ';
                            const isFailed = sub.status === 'failed' || sub.status === 'ไม่ผ่าน';
                            const statusBg = isPass ? '#dcfce7' : isProgress ? '#fef08a' : isFailed ? '#fee2e2' : '#f1f5f9';
                            const statusColor = isPass ? '#166534' : isProgress ? '#854d0e' : isFailed ? '#991b1b' : '#64748b';
                            const statusLabel = isPass ? '🟢 ผ่าน' : isProgress ? '🟡 กำลังดำเนินการ' : isFailed ? '🔴 ไม่ผ่าน' : '⚪ รอดำเนินการ';

                            return (
                              <tr key={sub.id || sIdx} style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fff' }}>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                  {sub.auto_id || `KR.${sIdx + 1}`}
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>
                                  {sub.kpi_name}
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#166534', fontWeight: 600 }}>
                                  {sub.target_value || '-'}
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', fontWeight: 600 }}>
                                  {sub.result_value !== null && sub.result_value !== undefined && sub.result_value !== '' ? sub.result_value : '-'}
                                </td>
                                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                    backgroundColor: statusBg,
                                    color: statusColor
                                  }}>
                                    {statusLabel}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {selectedKpi.calculation_type === 'process_status' ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>รายละเอียดความคืบหน้า (เชิงกระบวนการ)</h4>
                  <p style={{ fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                    {selectedKpi.provincial_result}
                  </p>
                </div>
              ) : (
                <>
                  {(() => {
                    const isHospitalLevel = selectedKpi.measurement_level === 'hospital';
                    const activeAreaResults = isHospitalLevel 
                      ? (selectedKpi.hospital_results || []) 
                      : (selectedKpi.district_results || []);
                    const areaLabel = isHospitalLevel ? 'โรงพยาบาล (9 แห่ง)' : 'อำเภอ (9 แห่ง)';

                    return (
                      <>
                        {/* HDC Connection Banner if api_enabled and no measurements saved yet */}
                        {selectedKpi.api_enabled && activeAreaResults.every((d: any) => !d.hasData) && !selectedKpi.hasProvData && (
                          <div style={{
                            padding: '1rem 1.25rem',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>⚡ ตัวชี้วัดนี้ผูกสูตร HDC OpenData แล้ว (ตาราง: <code>{selectedKpi.api_config?.tableName || '-'}</code>)</span>
                              </div>
                              <div style={{ fontSize: '0.84rem', color: '#15803d', marginTop: '0.25rem' }}>
                                ยังไม่มีการบันทึกผลงานสะสมรอบ {selectedQuarter} ลงฐานข้อมูล · ท่านสามารถกดดึงข้อมูลสดจาก HDC และบันทึกผลได้ที่เมนู &quot;บันทึกผล KPI&quot;
                              </div>
                            </div>
                            <Link
                              href="/editor/kpi-report"
                              style={{
                                backgroundColor: '#16a34a',
                                color: '#fff',
                                padding: '0.45rem 0.95rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                              }}
                            >
                              <span>📝 ไปบันทึกผล KPI (ดึง HDC)</span>
                            </Link>
                          </div>
                        )}

                        {activeAreaResults.length > 0 && (
                          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', height: isHospitalLevel ? '380px' : '350px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
                                แผนภูมิผลงานราย{areaLabel}{selectedKpi.target_val !== null ? 'เทียบกับเป้าหมาย' : ''}
                              </h4>
                              {selectedKpi.api_enabled && (
                                <span style={{ fontSize: '0.78rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                  ⚡ HDC: {selectedKpi.api_config?.tableName || 'OpenData'}
                                </span>
                              )}
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={activeAreaResults} margin={{ top: 20, right: 30, left: 0, bottom: isHospitalLevel ? 40 : 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                  dataKey="name" 
                                  tick={{ fontSize: isHospitalLevel ? 10 : 12 }} 
                                  interval={0} 
                                  angle={isHospitalLevel ? -25 : 0} 
                                  textAnchor={isHospitalLevel ? 'end' : 'middle'} 
                                  height={isHospitalLevel ? 70 : 30} 
                                />
                                <YAxis />
                                <Tooltip />
                                {selectedKpi.target_val !== null && (
                                  <ReferenceLine y={selectedKpi.target_val} label={{ position: 'top', value: `เป้าหมาย: ${selectedKpi.target_operator} ${selectedKpi.target_val}`, fill: '#166534', fontSize: 12, fontWeight: 'bold' }} stroke="#166534" strokeWidth={2} strokeDasharray="5 5" />
                                )}
                                {selectedKpi.target_warning_val !== null && (
                                   <ReferenceLine y={selectedKpi.target_warning_val} label={{ position: 'top', value: `เฝ้าระวัง: ${selectedKpi.target_operator} ${selectedKpi.target_warning_val}`, fill: '#854d0e', fontSize: 11 }} stroke="#eab308" strokeWidth={1} strokeDasharray="3 3" />
                                )}
                                <Bar dataKey="result" radius={[4, 4, 0, 0]}>
                                  {activeAreaResults.map((entry: any, index: number) => {
                                    const dStatus = evaluateStatus(entry.result, selectedKpi);
                                    return <Cell key={`cell-${index}`} fill={getStatusColor(dStatus)} />
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        {activeAreaResults.length > 0 && (
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>
                              ผลงานราย{areaLabel}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                              {activeAreaResults.map((d: any) => {
                                const dStatus = evaluateStatus(d.result, selectedKpi);
                                return (
                                <div key={d.name} style={{ border: '1px solid', borderColor: dStatus === 'success' ? '#bbf7d0' : dStatus === 'warning' ? '#fde047' : '#fecaca', backgroundColor: dStatus === 'success' ? '#f0fdf4' : dStatus === 'warning' ? '#fefce8' : '#fef2f2', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: isHospitalLevel ? '0.82rem' : '0.9rem', fontWeight: 500 }}>{d.name}</span>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: getStatusColor(dStatus) }}>{d.result}</span>
                                </div>
                              )})}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {selectedKpi.data_items?.length > 0 && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>สูตรและการคำนวณ</h4>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>รูปแบบ: <strong>{selectedKpi.formula}</strong></p>
                      {selectedKpi.calculation_formula && <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--primary)' }}>สูตรคำนวณ: <strong style={{fontFamily: 'monospace', backgroundColor: '#e0f2fe', padding: '0.2rem 0.4rem', borderRadius: '4px'}}>{selectedKpi.calculation_formula}</strong></p>}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--secondary)' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>ตัวแปรรวม</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>รายละเอียดข้อมูล</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedKpi.data_items.map((item: any) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem', fontWeight: 600 }}>{item.id}</td>
                              <td style={{ padding: '0.5rem' }}>{item.label}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
