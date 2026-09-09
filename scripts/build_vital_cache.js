const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_PATH = '/Users/piyanatvichian/Documents/app_antigravity2.0/Population_dashboard/ประชากร DOPA.xlsx';
const OUTPUT_PATH = path.join(__dirname, '../src/data/vital_stats_summary.json');

console.log('📖 Reading Excel file from:', EXCEL_PATH);
const wb = xlsx.readFile(EXCEL_PATH, { sheets: ['Population', 'Death', 'Birth'] });

const DISTRICT_MAPPING = {
  "เมืองสระแก้ว": ["อำเภอเมืองสระแก้ว", "ท้องถิ่นเทศบาลตำบลศาลาลำดวน", "ท้องถิ่นเทศบาลตำบลท่าเกษม", "ท้องถิ่นเทศบาลเมืองสระแก้ว"],
  "คลองหาด": ["อำเภอคลองหาด"],
  "ตาพระยา": ["อำเภอตาพระยา", "ท้องถิ่นเทศบาลตำบลตาพระยา"],
  "วังน้ำเย็น": ["อำเภอวังน้ำเย็น", "ท้องถิ่นเทศบาลเมืองวังน้ำเย็น"],
  "วัฒนานคร": ["อำเภอวัฒนานคร", "ท้องถิ่นเทศบาลตำบลวัฒนานคร"],
  "อรัญประเทศ": ["อำเภออรัญประเทศ", "ท้องถิ่นเทศบาลเมืองอรัญญประเทศ"],
  "เขาฉกรรจ์": ["อำเภอเขาฉกรรจ์", "ท้องถิ่นเทศบาลตำบลเขาฉกรรจ์"],
  "โคกสูง": ["อำเภอโคกสูง"],
  "วังสมบูรณ์": ["อำเภอวังสมบูรณ์", "ท้องถิ่นเทศบาลตำบลวังสมบูรณ์"]
};

const DISTRICT_NAMES = Object.keys(DISTRICT_MAPPING);
const AMP_CODE_TO_NAME = {
  "01": "เมืองสระแก้ว",
  "02": "คลองหาด",
  "03": "ตาพระยา",
  "04": "วังน้ำเย็น",
  "05": "วัฒนานคร",
  "06": "อรัญประเทศ",
  "07": "เขาฉกรรจ์",
  "08": "โคกสูง",
  "09": "วังสมบูรณ์"
};

const AGE_BUCKETS = [
  { label: "0-4 ปี", min: 0, max: 4 },
  { label: "5-9 ปี", min: 5, max: 9 },
  { label: "10-14 ปี", min: 10, max: 14 },
  { label: "15-19 ปี", min: 15, max: 19 },
  { label: "20-24 ปี", min: 20, max: 24 },
  { label: "25-29 ปี", min: 25, max: 29 },
  { label: "30-34 ปี", min: 30, max: 34 },
  { label: "35-39 ปี", min: 35, max: 39 },
  { label: "40-44 ปี", min: 40, max: 44 },
  { label: "45-49 ปี", min: 45, max: 49 },
  { label: "50-54 ปี", min: 50, max: 54 },
  { label: "55-59 ปี", min: 55, max: 59 },
  { label: "60-64 ปี", min: 60, max: 64 },
  { label: "65-69 ปี", min: 65, max: 69 },
  { label: "70-74 ปี", min: 70, max: 74 },
  { label: "75-79 ปี", min: 75, max: 79 },
  { label: "80 ปีขึ้นไป", min: 80, max: 999 }
];

const LE_AGE_LABELS = [
  "0-4", "5-9", "10-14", "15-19", "20-24", "25-29",
  "30-34", "35-39", "40-44", "45-49", "50-54", "55-59",
  "60-64", "65-69", "70-74", "75-79", "80+"
];

// Helper: map office to district
function getDistrictFromOffice(office) {
  for (const [dist, offices] of Object.entries(DISTRICT_MAPPING)) {
    if (offices.includes(office)) return dist;
  }
  return null;
}

// Helper: parse age string to integer
function parseAge(ageLabel) {
  if (!ageLabel) return -1;
  const str = String(ageLabel).trim();
  if (str.includes("น้อยกว่า") || str.includes("<")) return 0;
  if (str.includes("มากกว่า") || str.includes(">") || str.includes("ขึ้นไป")) {
    const m = str.match(/\d+/);
    return m ? Math.max(parseInt(m[0]), 80) : 101;
  }
  const match = str.match(/\d+/);
  return match ? parseInt(match[0]) : -1;
}

// ----------------------------------------------------
// 1. Process POPULATION sheet
// ----------------------------------------------------
console.log('📊 Processing Population Sheet...');
const popRaw = xlsx.utils.sheet_to_json(wb.Sheets['Population'], { header: 1 });
// Header: ['ปี', 'สำนักทะเบียน', 'อายุ', 'ชาย(ไทย)', 'หญิง(ไทย)', 'รวม(ไทย)', 'ชาย(ไม่ใช่ไทย)', 'หญิง(ไม่ใช่ไทย)', 'รวม(ไม่ใช่ไทย)', 'ชาย(รวม)', 'หญิง(รวม)', 'รวม(รวม)']

const popYearsSet = new Set();
const popRows = [];

for (let i = 1; i < popRaw.length; i++) {
  const row = popRaw[i];
  const yearStr = row[0] != null ? String(row[0]).trim() : '';
  if (!yearStr || yearStr === 'รวม' || yearStr === 'ปี') continue;
  
  const year = parseInt(yearStr);
  const office = String(row[1] || '').trim();
  const district = getDistrictFromOffice(office);
  const ageLabel = String(row[2] || '').trim();
  if (ageLabel === 'รวม') continue;

  const ageNum = parseAge(ageLabel);

  const mThai = parseInt(String(row[3] || 0).replace(/,/g, '')) || 0;
  const fThai = parseInt(String(row[4] || 0).replace(/,/g, '')) || 0;
  const tThai = parseInt(String(row[5] || 0).replace(/,/g, '')) || 0;

  const mNonThai = parseInt(String(row[6] || 0).replace(/,/g, '')) || 0;
  const fNonThai = parseInt(String(row[7] || 0).replace(/,/g, '')) || 0;
  const tNonThai = parseInt(String(row[8] || 0).replace(/,/g, '')) || 0;

  const mTotal = parseInt(String(row[9] || 0).replace(/,/g, '')) || 0;
  const fTotal = parseInt(String(row[10] || 0).replace(/,/g, '')) || 0;
  const grandTotal = parseInt(String(row[11] || 0).replace(/,/g, '')) || 0;

  popYearsSet.add(year);
  popRows.push({
    year, office, district, ageLabel, ageNum,
    mThai, fThai, tThai,
    mNonThai, fNonThai, tNonThai,
    mTotal, fTotal, grandTotal
  });
}

const availableYears = Array.from(popYearsSet).sort((a, b) => b - a);
console.log(`✓ Parsed ${popRows.length} population rows across years:`, availableYears);

// ----------------------------------------------------
// 2. Process DEATH sheet
// ----------------------------------------------------
console.log('💀 Processing Death Sheet...');
const deathRaw = xlsx.utils.sheet_to_json(wb.Sheets['Death'], { header: 1 });
// Header: ('SEX', 'gender', 'AGE', 'age_group', 'DDATE', 'DMON', 'DYEAR', 'DRCODE', 'HOS_ID', 'LCCAATTMM', 'id_ampur', 'ampur', 'NCAUSE', 'BDATE', 'BMON', 'BYEAR', 'DPLACE', 'GHOS', 'CODEPRO', 'death103', 'tname')

const deathYearsSet = new Set();
const deathAgeGroupsSet = new Set();
const deathRows = [];

for (let i = 1; i < deathRaw.length; i++) {
  const row = deathRaw[i];
  const yearStr = row[6] != null ? String(row[6]).trim() : '';
  if (!yearStr) continue;
  const year = parseInt(yearStr);
  deathYearsSet.add(year);

  const sex = String(row[0] || '').trim();
  const gender = String(row[1] || '').trim();
  const age = parseFloat(row[2]) || 0;
  const ageGroup = String(row[3] || '').trim();
  if (ageGroup) deathAgeGroupsSet.add(ageGroup);

  const dDate = String(row[4] || '').trim();
  const dMon = String(row[5] || '').trim();
  const hospId = String(row[8] || '').trim();
  const idAmpur = String(row[10] || '').trim();
  const ampur = String(row[11] || '').trim();
  const ncause = String(row[12] || '').trim().toUpperCase();
  const bDate = String(row[13] || '').trim();
  const bMon = String(row[14] || '').trim();
  const bYear = String(row[15] || '').trim();
  const dPlace = String(row[16] || '').trim();
  const death103 = String(row[19] || '').trim();
  let tname = String(row[20] || '').trim();
  if (!tname) tname = "ไม่ระบุ";

  const isCancer = ncause.startsWith('C');

  deathRows.push({
    sex, gender, age, ageGroup, dDate, dMon, year,
    hospId, idAmpur, ampur, ncause, isCancer,
    bDate, bMon, bYear, dPlace, death103, tname
  });
}

const deathYears = Array.from(deathYearsSet).sort((a, b) => a - b);
const deathAgeGroups = Array.from(deathAgeGroupsSet).sort((a, b) => {
  if (a.includes('น้อยกว่า') || a.includes('<')) return -1;
  if (b.includes('น้อยกว่า') || b.includes('<')) return 1;
  return a.localeCompare(b);
});
console.log(`✓ Parsed ${deathRows.length} death rows across years:`, deathYears);

// ----------------------------------------------------
// 3. Process BIRTH sheet
// ----------------------------------------------------
console.log('👶 Processing Birth Sheet...');
const birthRaw = xlsx.utils.sheet_to_json(wb.Sheets['Birth'], { header: 1 });
// Header: ('prov', 'amp', 'tb', 'sex', 'bYear', 'bMon', 'bDate', 'nat', 'no', 'weight', 'mAge', 'ket', 'yPTell', 'mPTell', 'dPTell', 'maddr')

const birthYearsSet = new Set();
const birthRows = [];

for (let i = 1; i < birthRaw.length; i++) {
  const row = birthRaw[i];
  const yearVal = row[4];
  if (!yearVal) continue;
  const year = parseInt(yearVal);
  birthYearsSet.add(year);

  const prov = String(row[0] || '').trim();
  const amp = String(row[1] || '').trim().padStart(2, '0');
  const districtName = AMP_CODE_TO_NAME[amp] || 'ไม่ระบุ';
  const tb = String(row[2] || '').trim();
  const sex = String(row[3] || '').trim();
  const gender = sex === '1' ? 'ชาย' : (sex === '2' ? 'หญิง' : 'ไม่ระบุ');
  const bMon = parseInt(row[5]) || 0;
  const bDate = parseInt(row[6]) || 0;
  const nat = String(row[7] || '').trim();
  const birthOrder = parseInt(row[8]) || 1;
  const weight = parseFloat(row[9]) || 0;
  const isLowWeight = weight > 0 && weight < 2500;
  const mAge = parseFloat(row[10]) || 0;
  let motherAgeGroup = '20-34 ปี';
  if (mAge > 0 && mAge < 20) motherAgeGroup = '< 20 ปี (วัยรุ่น)';
  else if (mAge >= 35) motherAgeGroup = '35 ปีขึ้นไป (สูงวัย)';

  const maddr = String(row[15] || '').trim();

  birthRows.push({
    prov, amp, districtName, tb, sex, gender, year,
    bMon, bDate, nat, birthOrder, weight, isLowWeight,
    mAge, motherAgeGroup, maddr
  });
}

const birthYears = Array.from(birthYearsSet).sort((a, b) => a - b);
console.log(`✓ Parsed ${birthRows.length} birth rows across years:`, birthYears);

// ----------------------------------------------------
// 4. Precompute Population aggregates for fast UI
// ----------------------------------------------------
console.log('⚡ Generating Population Fast-cache...');
// Key: `${year}_${district || 'ALL'}_${type || 'ALL'}`
// Also trend by district & type
const popCache = {};

// We support options: year, district, type ('สัญชาติไทย', 'ไม่ใช่สัญชาติไทย', 'รวมทั้งหมด'), format ('กลุ่มอายุ', 'รายปี')
const typeOptions = ['รวมทั้งหมด', 'สัญชาติไทย', 'ไม่ใช่สัญชาติไทย'];
const distOptions = ['รวมทั้งหมด', ...DISTRICT_NAMES];

// Precompute Trend lines across years for every district & type
const popTrends = {};
for (const dist of distOptions) {
  popTrends[dist] = {};
  for (const typ of typeOptions) {
    const trendYears = availableYears.slice().sort((a, b) => a - b);
    const mSeries = [];
    const fSeries = [];
    const tSeries = [];

    for (const yr of trendYears) {
      let mSum = 0, fSum = 0;
      for (const r of popRows) {
        if (r.year !== yr) continue;
        if (dist !== 'รวมทั้งหมด' && r.district !== dist) continue;

        if (typ === 'สัญชาติไทย') {
          mSum += r.mThai; fSum += r.fThai;
        } else if (typ === 'ไม่ใช่สัญชาติไทย') {
          mSum += r.mNonThai; fSum += r.fNonThai;
        } else {
          mSum += r.mTotal; fSum += r.fTotal;
        }
      }
      mSeries.push(mSum);
      fSeries.push(fSum);
      tSeries.push(mSum + fSum);
    }
    popTrends[dist][typ] = {
      years: trendYears,
      male: mSeries,
      female: fSeries,
      total: tSeries
    };
  }
}

// Precompute Pyramid data for each year x district x type
const popPyramids = {};
for (const yr of availableYears) {
  popPyramids[yr] = {};
  for (const dist of distOptions) {
    popPyramids[yr][dist] = {};
    for (const typ of typeOptions) {
      const groupedBuckets = AGE_BUCKETS.map(b => ({ label: b.label, male: 0, female: 0 }));
      const singleYearMap = {};

      let totalMale = 0;
      let totalFemale = 0;

      for (const r of popRows) {
        if (r.year !== yr) continue;
        if (dist !== 'รวมทั้งหมด' && r.district !== dist) continue;

        let m = 0, f = 0;
        if (typ === 'สัญชาติไทย') { m = r.mThai; f = r.fThai; }
        else if (typ === 'ไม่ใช่สัญชาติไทย') { m = r.mNonThai; f = r.fNonThai; }
        else { m = r.mTotal; f = r.fTotal; }

        totalMale += m;
        totalFemale += f;

        // Grouped bucket mapping
        if (r.ageNum >= 0) {
          for (let b = 0; b < AGE_BUCKETS.length; b++) {
            if (r.ageNum >= AGE_BUCKETS[b].min && r.ageNum <= AGE_BUCKETS[b].max) {
              groupedBuckets[b].male += m;
              groupedBuckets[b].female += f;
              break;
            }
          }
        }

        // Single year mapping
        if (!singleYearMap[r.ageLabel]) singleYearMap[r.ageLabel] = { male: 0, female: 0, ageNum: r.ageNum };
        singleYearMap[r.ageLabel].male += m;
        singleYearMap[r.ageLabel].female += f;
      }

      // Grouped percentage formatting for pyramid
      const grandTotal = totalMale + totalFemale;
      const groupedLabels = [];
      const groupedMale = [];
      const groupedFemale = [];

      for (const b of groupedBuckets) {
        groupedLabels.push(b.label);
        const mPct = grandTotal > 0 ? (b.male / grandTotal) * 100 : 0;
        const fPct = grandTotal > 0 ? (b.female / grandTotal) * 100 : 0;
        groupedMale.push(parseFloat(mPct.toFixed(2)));
        groupedFemale.push(parseFloat(fPct.toFixed(2)));
      }

      // Single year formatting
      const singleYearKeys = Object.keys(singleYearMap).sort((a, b) => {
        return (singleYearMap[a].ageNum || 0) - (singleYearMap[b].ageNum || 0);
      });
      const singleLabels = [];
      const singleMale = [];
      const singleFemale = [];

      for (const k of singleYearKeys) {
        singleLabels.push(k);
        singleMale.push(singleYearMap[k].male);
        singleFemale.push(singleYearMap[k].female);
      }

      popPyramids[yr][dist][typ] = {
        summary: {
          male: totalMale,
          female: totalFemale,
          total: totalMale + totalFemale
        },
        grouped: {
          labels: groupedLabels,
          male: groupedMale, // positive %
          female: groupedFemale,
          maleCounts: groupedBuckets.map(b => b.male),
          femaleCounts: groupedBuckets.map(b => b.female)
        },
        single: {
          labels: singleLabels,
          male: singleMale,
          female: singleFemale
        }
      };
    }
  }
}

// ----------------------------------------------------
// 5. Precompute Life Expectancy (e0 - Chiang's Method)
// ----------------------------------------------------
console.log('⏳ Precomputing Life Expectancy (e0)...');
// Helper to compute Chiang's Life Table
function computeLifeTable(years, dist) {
  const e0Results = { 'รวม': [], 'ชาย': [], 'หญิง': [] };
  const lifeTableDetail = {}; // by year and gender

  for (const yr of years) {
    // 1. Get Population by age group 0-4, 5-9 ... 80+
    const popAgeMap = {};
    for (const r of popRows) {
      if (r.year !== yr) continue;
      if (dist !== 'รวมทั้งหมด' && r.district !== dist) continue;

      let idx = 0;
      if (r.ageNum >= 0) {
        idx = Math.min(Math.floor(r.ageNum / 5), 16);
      }
      const label = LE_AGE_LABELS[idx];
      if (!popAgeMap[label]) popAgeMap[label] = { 'รวม': 0, 'ชาย': 0, 'หญิง': 0 };
      popAgeMap[label]['ชาย'] += r.mTotal;
      popAgeMap[label]['หญิง'] += r.fTotal;
      popAgeMap[label]['รวม'] += r.grandTotal;
    }

    // 2. Get Deaths by age group
    const deathAgeMap = {};
    for (const d of deathRows) {
      if (d.year !== yr) continue;
      if (dist !== 'รวมทั้งหมด' && d.ampur !== dist) continue;

      let idx = 0;
      if (d.age >= 0) {
        idx = Math.min(Math.floor(d.age / 5), 16);
      }
      const label = LE_AGE_LABELS[idx];
      if (!deathAgeMap[label]) deathAgeMap[label] = { 'รวม': 0, 'ชาย': 0, 'หญิง': 0 };

      if (d.gender === 'ชาย') deathAgeMap[label]['ชาย']++;
      else if (d.gender === 'หญิง') deathAgeMap[label]['หญิง']++;
      deathAgeMap[label]['รวม']++;
    }

    const genders = ['รวม', 'ชาย', 'หญิง'];
    lifeTableDetail[yr] = {};

    for (const g of genders) {
      let l_x = 100000;
      const rows = [];

      for (let i = 0; i < LE_AGE_LABELS.length; i++) {
        const label = LE_AGE_LABELS[i];
        const P = (popAgeMap[label] && popAgeMap[label][g]) ? popAgeMap[label][g] : 0;
        const D = (deathAgeMap[label] && deathAgeMap[label][g]) ? deathAgeMap[label][g] : 0;

        const n = (i === 16) ? 100 : 5;
        const M = P > 0 ? (D / P) : 0;
        const a = (i === 0) ? 1.3 : 2.5;

        let q = 0;
        if (i === 16) {
          q = 1.0;
        } else {
          q = (n * M) / (1 + (n - a) * M);
          if (q > 1) q = 1;
        }

        rows.push({ label, P, D, M, q, n, a });
      }

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        r.l = l_x;
        let d = l_x * r.q;
        if (i === 16) d = l_x;
        r.d = d;

        if (i === 16) {
          r.L = r.M > 0 ? (l_x / r.M) : l_x * 5;
        } else {
          r.L = r.n * (l_x - d) + r.a * d;
        }
        l_x = l_x - d;
      }

      let currentT = 0;
      for (let i = rows.length - 1; i >= 0; i--) {
        currentT += rows[i].L;
        rows[i].T = currentT;
        rows[i].e = rows[i].l > 0 ? (currentT / rows[i].l) : 0;
      }

      const e0Val = rows[0].e;
      e0Results[g].push(parseFloat(e0Val.toFixed(2)));
      lifeTableDetail[yr][g] = rows.map(r => ({
        ageGroup: r.label,
        P: r.P,
        D: r.D,
        M: parseFloat(r.M.toFixed(5)),
        q: parseFloat(r.q.toFixed(4)),
        l: Math.round(r.l),
        d: Math.round(r.d),
        L: Math.round(r.L),
        T: Math.round(r.T),
        e: parseFloat(r.e.toFixed(2))
      }));
    }
  }

  return {
    years,
    trends: e0Results,
    tableDetail: lifeTableDetail
  };
}

const leCache = {};
for (const dist of distOptions) {
  leCache[dist] = computeLifeTable(deathYears, dist);
}

// ----------------------------------------------------
// 6. Precompute Death Statistics
// ----------------------------------------------------
console.log('💀 Precomputing Death Statistics & Mortality Rates...');
// For each District x Gender x AgeGroup
// We calculate cause counts and rates per 100,000 population across deathYears (2564-2568)
const deathCache = {};

// Helper to get matching population count
function getMatchingPop(year, dist, gender, ageGroup) {
  let sum = 0;
  for (const r of popRows) {
    if (r.year !== year) continue;
    if (dist !== 'รวมทั้งหมด' && r.district !== dist) continue;

    // Age group check
    if (ageGroup && ageGroup !== 'รวมทั้งหมด') {
      let mapped = '';
      for (let b = 0; b < AGE_BUCKETS.length; b++) {
        if (r.ageNum >= AGE_BUCKETS[b].min && r.ageNum <= AGE_BUCKETS[b].max) {
          mapped = AGE_BUCKETS[b].label;
          break;
        }
      }
      if (mapped !== ageGroup) continue;
    }

    if (gender === 'ชาย') sum += r.mTotal;
    else if (gender === 'หญิง') sum += r.fTotal;
    else sum += r.grandTotal;
  }
  return sum;
}

for (const dist of distOptions) {
  deathCache[dist] = {};
  for (const g of ['รวมทั้งหมด', 'ชาย', 'หญิง']) {
    deathCache[dist][g] = {};
    for (const ag of ['รวมทั้งหมด', ...deathAgeGroups]) {
      // Find all matching deaths
      const generalCauses = {}; // { causeName: { 2564: count, ... } }
      const cancerCauses = {};  // { cancerType: { 2564: count, ... } }

      for (const d of deathRows) {
        if (dist !== 'รวมทั้งหมด' && d.ampur !== dist) continue;
        if (g !== 'รวมทั้งหมด' && d.gender !== g) continue;
        if (ag !== 'รวมทั้งหมด' && d.ageGroup !== ag) continue;

        const yr = d.year;
        if (d.isCancer) {
          // Add to general under "โรคมะเร็งรวม"
          if (!generalCauses['โรคมะเร็งรวม']) generalCauses['โรคมะเร็งรวม'] = {};
          generalCauses['โรคมะเร็งรวม'][yr] = (generalCauses['โรคมะเร็งรวม'][yr] || 0) + 1;

          // Add to cancer detail
          if (!cancerCauses[d.tname]) cancerCauses[d.tname] = {};
          cancerCauses[d.tname][yr] = (cancerCauses[d.tname][yr] || 0) + 1;
        } else {
          if (!generalCauses[d.tname]) generalCauses[d.tname] = {};
          generalCauses[d.tname][yr] = (generalCauses[d.tname][yr] || 0) + 1;
        }
      }

      // Convert to rates per 100,000
      const popByYear = {};
      for (const yr of deathYears) {
        popByYear[yr] = getMatchingPop(yr, dist, g, ag);
      }

      // Format General Causes Table & Datasets
      const generalTable = [];
      const generalDatasets = [];
      for (const [cName, counts] of Object.entries(generalCauses)) {
        const row = { name: cName, counts: {}, rates: {} };
        const dataPoints = [];
        let maxCount = 0;
        for (const yr of deathYears) {
          const cnt = counts[yr] || 0;
          const pop = popByYear[yr] || 0;
          const rate = pop > 0 ? parseFloat(((cnt / pop) * 100000).toFixed(2)) : 0;
          row.counts[yr] = cnt;
          row.rates[yr] = rate;
          dataPoints.push(rate);
          if (cnt > maxCount) maxCount = cnt;
        }
        row.maxCount = maxCount;
        generalTable.push(row);
        generalDatasets.push({ label: cName, data: dataPoints, maxCount });
      }

      // Sort by highest count in recent year
      generalTable.sort((a, b) => b.maxCount - a.maxCount);
      generalDatasets.sort((a, b) => b.maxCount - a.maxCount);

      // Format Cancer Causes Table & Datasets
      const cancerTable = [];
      const cancerDatasets = [];
      for (const [cName, counts] of Object.entries(cancerCauses)) {
        const row = { name: cName, counts: {}, rates: {} };
        const dataPoints = [];
        let maxCount = 0;
        for (const yr of deathYears) {
          const cnt = counts[yr] || 0;
          const pop = popByYear[yr] || 0;
          const rate = pop > 0 ? parseFloat(((cnt / pop) * 100000).toFixed(2)) : 0;
          row.counts[yr] = cnt;
          row.rates[yr] = rate;
          dataPoints.push(rate);
          if (cnt > maxCount) maxCount = cnt;
        }
        row.maxCount = maxCount;
        cancerTable.push(row);
        cancerDatasets.push({ label: cName, data: dataPoints, maxCount });
      }

      cancerTable.sort((a, b) => b.maxCount - a.maxCount);
      cancerDatasets.sort((a, b) => b.maxCount - a.maxCount);

      deathCache[dist][g][ag] = {
        popByYear,
        generalTable,
        generalDatasets: generalDatasets.slice(0, 10), // Top 10 for clean chart
        cancerTable,
        cancerDatasets: cancerDatasets.slice(0, 10)
      };
    }
  }
}

// ----------------------------------------------------
// 7. Precompute Birth Statistics
// ----------------------------------------------------
console.log('👶 Precomputing Birth Statistics...');
// We compute for each Year x District x Gender
const birthCache = {};

for (const yr of ['รวมทั้งหมด', ...birthYears]) {
  birthCache[yr] = {};
  for (const dist of distOptions) {
    birthCache[yr][dist] = {};
    for (const g of ['รวมทั้งหมด', 'ชาย', 'หญิง']) {
      // Filter births
      let totalBirths = 0;
      let lowWeightCount = 0;
      let teenMotherCount = 0;
      let olderMotherCount = 0;
      let normalMotherCount = 0;

      const distCountMap = {};
      for (const d of DISTRICT_NAMES) distCountMap[d] = 0;

      const weightBuckets = {
        "< 2,500 กรัม (น้ำหนักน้อย)": 0,
        "2,500 - 4,000 กรัม (ปกติ)": 0,
        "> 4,000 กรัม (น้ำหนักมาก)": 0
      };

      const motherAgeBuckets = {
        "< 20 ปี (วัยรุ่น)": 0,
        "20 - 34 ปี (วัยเจริญพันธุ์)": 0,
        "35 ปีขึ้นไป (สูงวัย)": 0
      };

      for (const b of birthRows) {
        if (yr !== 'รวมทั้งหมด' && b.year !== yr) continue;
        if (dist !== 'รวมทั้งหมด' && b.districtName !== dist) continue;
        if (g !== 'รวมทั้งหมด' && b.gender !== g) continue;

        totalBirths++;
        if (b.isLowWeight) lowWeightCount++;
        if (b.mAge > 0 && b.mAge < 20) teenMotherCount++;
        else if (b.mAge >= 35) olderMotherCount++;
        else normalMotherCount++;

        if (b.districtName && distCountMap[b.districtName] !== undefined) {
          distCountMap[b.districtName]++;
        }

        if (b.weight > 0 && b.weight < 2500) weightBuckets["< 2,500 กรัม (น้ำหนักน้อย)"]++;
        else if (b.weight >= 2500 && b.weight <= 4000) weightBuckets["2,500 - 4,000 กรัม (ปกติ)"]++;
        else if (b.weight > 4000) weightBuckets["> 4,000 กรัม (น้ำหนักมาก)"]++;

        if (b.mAge > 0 && b.mAge < 20) motherAgeBuckets["< 20 ปี (วัยรุ่น)"]++;
        else if (b.mAge >= 20 && b.mAge < 35) motherAgeBuckets["20 - 34 ปี (วัยเจริญพันธุ์)"]++;
        else if (b.mAge >= 35) motherAgeBuckets["35 ปีขึ้นไป (สูงวัย)"]++;
      }

      // Crude Birth Rate (CBR) per 1,000 pop
      const targetYear = yr === 'รวมทั้งหมด' ? 2568 : yr;
      const popCount = getMatchingPop(targetYear, dist, g, 'รวมทั้งหมด');
      const cbr = popCount > 0 ? parseFloat(((totalBirths / popCount) * 1000).toFixed(2)) : 0;

      // Yearly trend across birthYears
      const yearlyTrend = [];
      for (const y of birthYears) {
        let yCount = 0;
        for (const b of birthRows) {
          if (b.year !== y) continue;
          if (dist !== 'รวมทั้งหมด' && b.districtName !== dist) continue;
          if (g !== 'รวมทั้งหมด' && b.gender !== g) continue;
          yCount++;
        }
        yearlyTrend.push({ year: y, count: yCount });
      }

      birthCache[yr][dist][g] = {
        totalBirths,
        crudeBirthRate: cbr,
        lowWeightCount,
        lowWeightPct: totalBirths > 0 ? parseFloat(((lowWeightCount / totalBirths) * 100).toFixed(2)) : 0,
        teenMotherCount,
        teenMotherPct: totalBirths > 0 ? parseFloat(((teenMotherCount / totalBirths) * 100).toFixed(2)) : 0,
        olderMotherCount,
        olderMotherPct: totalBirths > 0 ? parseFloat(((olderMotherCount / totalBirths) * 100).toFixed(2)) : 0,
        districtComparison: Object.entries(distCountMap).map(([name, count]) => ({ district: name, count })),
        weightDistribution: Object.entries(weightBuckets).map(([label, count]) => ({ label, count })),
        motherAgeDistribution: Object.entries(motherAgeBuckets).map(([label, count]) => ({ label, count })),
        yearlyTrend
      };
    }
  }
}

// ----------------------------------------------------
// 8. Package all summary data into vital_stats_summary.json
// ----------------------------------------------------
const summaryData = {
  meta: {
    generatedAt: new Date().toISOString(),
    districts: DISTRICT_NAMES,
    availableYears: availableYears,
    deathYears: deathYears,
    birthYears: birthYears,
    deathAgeGroups: deathAgeGroups,
    citations: {
      population: "ทะเบียนราษฎร์ สำนักบริหารการทะเบียน กรมการปกครอง กระทรวงมหาดไทย (DOPA)",
      birth: "ทะเบียนราษฎร์ สำนักบริหารการทะเบียน กรมการปกครอง กระทรวงมหาดไทย (DOPA)",
      death: "กองยุทธศาสตร์และแผนงาน สำนักงานปลัดกระทรวงสาธารณสุข (กยผ. สป.สธ.)"
    }
  },
  popTrends,
  popPyramids,
  leCache,
  deathCache,
  birthCache
};

console.log('💾 Writing summary JSON to:', OUTPUT_PATH);
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summaryData));
const stats = fs.statSync(OUTPUT_PATH);
console.log(`✅ Finished successfully! Generated file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
