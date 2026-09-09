import healthFacilitiesData from '@/data/sa_kaeo_health_facilities.json';

// รายชื่อ 9 อำเภอในจังหวัดสระแก้ว พร้อมรหัส areacode มาตรฐาน 4 หลัก
export interface DistrictInfo {
  code: string;       // e.g. '2701'
  name: string;       // e.g. 'เมืองสระแก้ว'
  fullName: string;   // e.g. 'อำเภอเมืองสระแก้ว'
}

export const SA_KAEO_DISTRICTS: DistrictInfo[] = [
  { code: '2701', name: 'เมืองสระแก้ว', fullName: 'อำเภอเมืองสระแก้ว' },
  { code: '2702', name: 'คลองหาด', fullName: 'อำเภอคลองหาด' },
  { code: '2703', name: 'ตาพระยา', fullName: 'อำเภอตาพระยา' },
  { code: '2704', name: 'วังน้ำเย็น', fullName: 'อำเภอวังน้ำเย็น' },
  { code: '2705', name: 'วัฒนานคร', fullName: 'อำเภอวัฒนานคร' },
  { code: '2706', name: 'อรัญประเทศ', fullName: 'อำเภออรัญประเทศ' },
  { code: '2707', name: 'เขาฉกรรจ์', fullName: 'อำเภอเขาฉกรรจ์' },
  { code: '2708', name: 'โคกสูง', fullName: 'อำเภอโคกสูง' },
  { code: '2709', name: 'วังสมบูรณ์', fullName: 'อำเภอวังสมบูรณ์' },
];

// รายชื่อ 9 โรงพยาบาลในจังหวัดสระแก้ว พร้อมรหัส 5 หลัก และ 9 หลัก
export interface HospitalInfo {
  code5: string;
  code9: string;
  code9_new: string;
  name: string;
  fullName: string;
  districtCode: string;
  districtName: string;
}

export const SA_KAEO_HOSPITALS: HospitalInfo[] = [
  {
    code5: '10699',
    code9: '001069900',
    code9_new: 'EA0010699',
    name: 'รพ.สมเด็จพระยุพราชสระแก้ว',
    fullName: 'โรงพยาบาลสมเด็จพระยุพราชสระแก้ว',
    districtCode: '2701',
    districtName: 'เมืองสระแก้ว',
  },
  {
    code5: '28849',
    code9: '002884900',
    code9_new: 'EA0028849',
    name: 'รพ.วังสมบูรณ์',
    fullName: 'โรงพยาบาลวังสมบูรณ์',
    districtCode: '2709',
    districtName: 'วังสมบูรณ์',
  },
  {
    code5: '28850',
    code9: '002885000',
    code9_new: 'EA0028850',
    name: 'รพ.โคกสูง',
    fullName: 'โรงพยาบาลโคกสูง',
    districtCode: '2708',
    districtName: 'โคกสูง',
  },
  {
    code5: '10869',
    code9: '001086900',
    code9_new: 'EA0010869',
    name: 'รพ.วัฒนานคร',
    fullName: 'โรงพยาบาลวัฒนานคร',
    districtCode: '2705',
    districtName: 'วัฒนานคร',
  },
  {
    code5: '10867',
    code9: '001086700',
    code9_new: 'EA0010867',
    name: 'รพ.ตาพระยา',
    fullName: 'โรงพยาบาลตาพระยา',
    districtCode: '2703',
    districtName: 'ตาพระยา',
  },
  {
    code5: '10866',
    code9: '001086600',
    code9_new: 'EA0010866',
    name: 'รพ.คลองหาด',
    fullName: 'โรงพยาบาลคลองหาด',
    districtCode: '2702',
    districtName: 'คลองหาด',
  },
  {
    code5: '13817',
    code9: '001381700',
    code9_new: 'EA0013817',
    name: 'รพ.เขาฉกรรจ์',
    fullName: 'โรงพยาบาลเขาฉกรรจ์',
    districtCode: '2707',
    districtName: 'เขาฉกรรจ์',
  },
  {
    code5: '10868',
    code9: '001086800',
    code9_new: 'EA0010868',
    name: 'รพ.วังน้ำเย็น',
    fullName: 'โรงพยาบาลวังน้ำเย็น',
    districtCode: '2704',
    districtName: 'วังน้ำเย็น',
  },
  {
    code5: '10870',
    code9: '001087000',
    code9_new: 'EA0010870',
    name: 'รพ.อรัญประเทศ',
    fullName: 'โรงพยาบาลอรัญประเทศ',
    districtCode: '2706',
    districtName: 'อรัญประเทศ',
  },
];

// Map lookup helpers
const facilityDistrictMap: Record<string, string> = {};
(healthFacilitiesData as any[]).forEach(f => {
  if (f.code5) facilityDistrictMap[String(f.code5).padStart(5, '0')] = f.district;
  if (f.code9) facilityDistrictMap[String(f.code9)] = f.district;
  if (f.code9_new) facilityDistrictMap[String(f.code9_new)] = f.district;
});

const districtCodeToName: Record<string, string> = {};
const districtNameToCode: Record<string, string> = {};
SA_KAEO_DISTRICTS.forEach(d => {
  districtCodeToName[d.code] = d.name;
  districtNameToCode[d.name] = d.code;
  districtNameToCode[d.fullName] = d.code;
});

// ดึงข้อมูลตรงผ่านเบราว์เซอร์ และ fallback ไปที่เซิร์ฟเวอร์
export async function fetchHdcTableData(tableName: string, year: string = '2569', province: string = '27') {
  const cleanTable = tableName.trim();
  if (!cleanTable) throw new Error('กรุณาระบุชื่อตาราง HDC');

  let result: any = null;
  let fetchSuccess = false;

  // 1. Direct browser fetch (Thai IP)
  try {
    const directRes = await fetch('https://opendata.moph.go.th/api/report_data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: cleanTable,
        year: String(year),
        province: String(province),
        type: 'json',
      }),
    });

    if (directRes.status === 429) {
      throw new Error('HDC_RATE_LIMIT');
    }

    if (directRes.ok) {
      result = await directRes.json();
      fetchSuccess = true;
    }
  } catch (err: any) {
    if (err.message === 'HDC_RATE_LIMIT') {
      throw new Error('ระบบ HDC Open Data มีการจำกัดความถี่ในการเชื่อมต่อ (ไม่เกิน 10 ครั้ง/นาที) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
    }
  }

  // 2. Fallback to server proxy
  if (!fetchSuccess) {
    const res = await fetch('/api/hdc/report-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: cleanTable,
        year: String(year),
        province: String(province),
      }),
    });

    if (res.status === 429) {
      throw new Error('ระบบ HDC Open Data มีการจำกัดความถี่ในการเชื่อมต่อ (ไม่เกิน 10 ครั้ง/นาที) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `เซิร์ฟเวอร์ตอบกลับสถานะ ${res.status}`);
    }
    result = await res.json();
  }

  if (!result || !Array.isArray(result.data)) {
    throw new Error(`ไม่พบข้อมูลในตาราง "${cleanTable}" ของจังหวัดสระแก้ว ประจำปี ${year}`);
  }

  return result.data as any[];
}

// ตรวจสอบคอลัมน์ทั้งหมดจากตาราง HDC
export async function inspectHdcColumns(tableName: string, year: string = '2569') {
  const rows = await fetchHdcTableData(tableName, year);
  if (!rows || rows.length === 0) {
    throw new Error(`ตาราง "${tableName}" ไม่มีข้อมูลประจำปี ${year}`);
  }

  const sample = rows.find(r => r && typeof r === 'object') || rows[0];
  const ignoreKeys = ['id', 'areacode', 'flag_sent', 'date_com', 'b_year', 'ip'];
  const availableCols = Object.keys(sample).filter(k => !ignoreKeys.includes(k) && k !== 'hospcode');

  // แนะนำตัวตั้ง (result / numerator) และตัวหาร (target / denominator) อัตโนมัติ
  let suggestedResult = '';
  let suggestedTarget = '';

  if (sample.result !== undefined && sample.result !== null) suggestedResult = 'result';
  else if (sample.result1 !== undefined && sample.result1 !== null) suggestedResult = 'result1';
  else if (sample.result2 !== undefined && sample.result2 !== null) suggestedResult = 'result2';
  else if (sample.result4 !== undefined) suggestedResult = 'result4';

  if (sample.target !== undefined && sample.target !== null) suggestedTarget = 'target';
  else if (sample.b_target !== undefined && sample.b_target !== null) suggestedTarget = 'b_target';
  else if (sample.target4 !== undefined) suggestedTarget = 'target4';

  return {
    tableName,
    year,
    sampleRow: sample,
    availableCols,
    suggestedResult: suggestedResult || availableCols[0] || '',
    suggestedTarget: suggestedTarget || availableCols[1] || availableCols[0] || '',
    totalRows: rows.length,
  };
}

export interface AggregationItemResult {
  id: string;              // 'province', district name 'เมืองสระแก้ว', or hospital code '10699' / 'รพ.สมเด็จพระยุพราชสระแก้ว'
  name: string;            // Display name
  secondaryLabel?: string; // e.g. '2701' or 'รหัส 10699'
  variables: Record<string, number>; // { A: 120, B: 150 }
  computedValue: number | string;    // e.g. 80.00
  targetMet?: boolean;
}

// รวมผลงานตามระดับพื้นที่ประเมิน (ภาพรวมจังหวัด, 9 อำเภอ 2701-2709, 9 โรงพยาบาล)
export function aggregateHdcByLevel(
  rawData: any[],
  level: 'province' | 'district' | 'hospital',
  varColumnMapping: Record<string, string>, // e.g. { A: 'result', B: 'target' }
  calcFormula: string = '(A/B)*100'
): AggregationItemResult[] {
  const getColValue = (row: any, colName?: string): number => {
    if (!colName || row == null) return 0;
    // Direct match
    if (row[colName] !== undefined && row[colName] !== null) {
      return Number(row[colName]) || 0;
    }
    // Sum quarterly if needed (e.g. op_service_pt_q1..q4)
    if (colName === 'target' && row.op_service_pt_q1 !== undefined) {
      const qSum = (Number(row.op_service_pt_q1) || 0) + (Number(row.op_service_pt_q2) || 0) + (Number(row.op_service_pt_q3) || 0) + (Number(row.op_service_pt_q4) || 0);
      return qSum > 0 ? qSum : (Number(row.op_service_pt_q1) || 0);
    }
    if (colName === 'result' && row.tm_service_pt_q1 !== undefined) {
      const qSum = (Number(row.tm_service_pt_q1) || 0) + (Number(row.tm_service_pt_q2) || 0) + (Number(row.tm_service_pt_q3) || 0) + (Number(row.tm_service_pt_q4) || 0);
      return qSum > 0 ? qSum : (Number(row.tm_service_pt_q1) || 0);
    }
    return 0;
  };

  const evaluateFormula = (vals: Record<string, number>): string => {
    if (!calcFormula) return '0.00';
    try {
      let eq = calcFormula.toUpperCase();
      const isRatio = eq.includes('1:') || eq.includes('1 :');
      if (isRatio) eq = eq.replace(/1\s*:/, '').trim();

      // Check denominator (variable B) is not zero
      if (vals['B'] !== undefined && vals['B'] === 0) return '0.00';

      eq = eq.replace(/\b([A-Z])\b/g, m => String(vals[m] || 0));
      const res = new Function('return (' + eq + ')')();
      if (!isFinite(res) || isNaN(res)) return '0.00';
      if (isRatio) return `1 : ${res.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
      return (Math.round(res * 100) / 100).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  // 1. ภาพรวมจังหวัด (Province Level)
  if (level === 'province') {
    const provVals: Record<string, number> = {};
    Object.keys(varColumnMapping).forEach(vKey => { provVals[vKey] = 0; });

    rawData.forEach(row => {
      Object.entries(varColumnMapping).forEach(([vKey, colName]) => {
        provVals[vKey] += getColValue(row, colName);
      });
    });

    return [
      {
        id: 'province',
        name: 'ภาพรวมจังหวัดสระแก้ว',
        secondaryLabel: 'จังหวัด 27',
        variables: provVals,
        computedValue: evaluateFormula(provVals),
      },
    ];
  }

  // 2. ระดับอำเภอ (District Level - 9 Districts: 2701 - 2709)
  if (level === 'district') {
    const districtSums: Record<string, Record<string, number>> = {};
    SA_KAEO_DISTRICTS.forEach(d => {
      districtSums[d.code] = {};
      Object.keys(varColumnMapping).forEach(vKey => {
        districtSums[d.code][vKey] = 0;
      });
    });

    rawData.forEach(row => {
      let matchedDistrictCode: string | null = null;

      // Method A: Check areacode prefix (e.g. 2701, 270101)
      const rawArea = String(row.areacode || '').trim();
      if (rawArea) {
        const p4 = rawArea.substring(0, 4);
        if (districtCodeToName[p4]) {
          matchedDistrictCode = p4;
        }
      }

      // Method B: Check hospcode from health facilities master data
      if (!matchedDistrictCode && row.hospcode) {
        const hc5 = String(row.hospcode).padStart(5, '0');
        const dName = facilityDistrictMap[hc5] || facilityDistrictMap[String(row.hospcode)];
        if (dName && districtNameToCode[dName]) {
          matchedDistrictCode = districtNameToCode[dName];
        }
      }

      // Fallback: Check if areacode itself is district name
      if (!matchedDistrictCode && rawArea && districtNameToCode[rawArea]) {
        matchedDistrictCode = districtNameToCode[rawArea];
      }

      if (matchedDistrictCode && districtSums[matchedDistrictCode]) {
        Object.entries(varColumnMapping).forEach(([vKey, colName]) => {
          districtSums[matchedDistrictCode!][vKey] += getColValue(row, colName);
        });
      }
    });

    return SA_KAEO_DISTRICTS.map(d => {
      const vals = districtSums[d.code];
      return {
        id: d.name, // Matches standard area_id in kpi_measurements
        name: d.name,
        secondaryLabel: `รหัส ${d.code}`,
        variables: vals,
        computedValue: evaluateFormula(vals),
      };
    });
  }

  // 3. ระดับโรงพยาบาล (Hospital Level - 9 Hospitals)
  if (level === 'hospital') {
    const hospSums: Record<string, Record<string, number>> = {};
    SA_KAEO_HOSPITALS.forEach(h => {
      hospSums[h.code5] = {};
      Object.keys(varColumnMapping).forEach(vKey => {
        hospSums[h.code5][vKey] = 0;
      });
    });

    // Create set of matched codes for fast lookup
    const hospitalMapByCode: Record<string, HospitalInfo> = {};
    SA_KAEO_HOSPITALS.forEach(h => {
      hospitalMapByCode[h.code5] = h;
      hospitalMapByCode[h.code5.padStart(5, '0')] = h;
      if (h.code9) hospitalMapByCode[h.code9] = h;
      if (h.code9_new) hospitalMapByCode[h.code9_new] = h;
    });

    rawData.forEach(row => {
      const rawHosp = String(row.hospcode || '').trim();
      if (!rawHosp) return;

      const matchedHospital = hospitalMapByCode[rawHosp] || hospitalMapByCode[rawHosp.padStart(5, '0')];
      if (matchedHospital && hospSums[matchedHospital.code5]) {
        Object.entries(varColumnMapping).forEach(([vKey, colName]) => {
          hospSums[matchedHospital.code5][vKey] += getColValue(row, colName);
        });
      }
    });

    return SA_KAEO_HOSPITALS.map(h => {
      const vals = hospSums[h.code5];
      return {
        id: h.name, // Matches standard area_id in kpi_measurements
        name: h.name,
        secondaryLabel: `รหัส ${h.code5} (${h.districtName})`,
        variables: vals,
        computedValue: evaluateFormula(vals),
      };
    });
  }

  return [];
}
