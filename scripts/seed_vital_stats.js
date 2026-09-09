/**
 * Seed Vital Statistics script for Supabase
 * นำเข้าข้อมูลประชากร การตาย และการเกิดจาก Excel ประชากร DOPA.xlsx เข้าสู่ Supabase
 * 
 * วิธีการใช้งาน:
 * node scripts/seed_vital_stats.js
 * หรือระบุเฉพาะตาราง:
 * node scripts/seed_vital_stats.js --table=pop
 * node scripts/seed_vital_stats.js --table=death
 * node scripts/seed_vital_stats.js --table=birth
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const EXCEL_PATH = '/Users/piyanatvichian/Documents/app_antigravity2.0/Population_dashboard/ประชากร DOPA.xlsx';

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

const AMP_CODE_TO_NAME = {
  "01": "เมืองสระแก้ว", "02": "คลองหาด", "03": "ตาพระยา",
  "04": "วังน้ำเย็น", "05": "วัฒนานคร", "06": "อรัญประเทศ",
  "07": "เขาฉกรรจ์", "08": "โคกสูง", "09": "วังสมบูรณ์"
};

function getDistrictFromOffice(office) {
  for (const [dist, offices] of Object.entries(DISTRICT_MAPPING)) {
    if (offices.includes(office)) return dist;
  }
  return 'อื่นๆ';
}

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

async function batchInsert(tableName, items, batchSize = 500) {
  console.log(`📤 Inserting ${items.length} records into ${tableName}...`);
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).insert(chunk);
    if (error) {
      console.error(`❌ Batch error in ${tableName} [${i} - ${i + chunk.length}]:`, error.message);
    } else {
      process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, items.length)} / ${items.length} rows (${Math.round((Math.min(i + batchSize, items.length) / items.length) * 100)}%)`);
    }
  }
  console.log(`\n✅ Completed insertion for ${tableName}`);
}

async function seed() {
  console.log('🚀 Starting Vital Statistics Seed Process...');
  console.log('Target Supabase:', supabaseUrl);
  
  const args = process.argv.slice(2);
  const targetTable = args.find(a => a.startsWith('--table='))?.split('=')[1] || 'all';

  console.log('📖 Reading Excel:', EXCEL_PATH);
  const wb = xlsx.readFile(EXCEL_PATH);

  // 1. Seed Population
  if (targetTable === 'all' || targetTable === 'pop') {
    console.log('\n--- Seeding dopa_populations ---');
    const popRaw = xlsx.utils.sheet_to_json(wb.Sheets['Population'], { header: 1 });
    const popRows = [];
    for (let i = 1; i < popRaw.length; i++) {
      const row = popRaw[i];
      const yearStr = row[0] != null ? String(row[0]).trim() : '';
      if (!yearStr || yearStr === 'รวม' || yearStr === 'ปี') continue;
      const office = String(row[1] || '').trim();
      const ageLabel = String(row[2] || '').trim();
      if (ageLabel === 'รวม') continue;

      popRows.push({
        year: parseInt(yearStr),
        office_name: office,
        district_name: getDistrictFromOffice(office),
        age_label: ageLabel,
        age_num: parseAge(ageLabel),
        male_thai: parseInt(String(row[3] || 0).replace(/,/g, '')) || 0,
        female_thai: parseInt(String(row[4] || 0).replace(/,/g, '')) || 0,
        total_thai: parseInt(String(row[5] || 0).replace(/,/g, '')) || 0,
        male_foreign: parseInt(String(row[6] || 0).replace(/,/g, '')) || 0,
        female_foreign: parseInt(String(row[7] || 0).replace(/,/g, '')) || 0,
        total_foreign: parseInt(String(row[8] || 0).replace(/,/g, '')) || 0,
        male_total: parseInt(String(row[9] || 0).replace(/,/g, '')) || 0,
        female_total: parseInt(String(row[10] || 0).replace(/,/g, '')) || 0,
        grand_total: parseInt(String(row[11] || 0).replace(/,/g, '')) || 0
      });
    }
    await batchInsert('dopa_populations', popRows);
  }

  // 2. Seed Deaths
  if (targetTable === 'all' || targetTable === 'death') {
    console.log('\n--- Seeding dopa_deaths ---');
    const deathRaw = xlsx.utils.sheet_to_json(wb.Sheets['Death'], { header: 1 });
    const deathRows = [];
    for (let i = 1; i < deathRaw.length; i++) {
      const row = deathRaw[i];
      const yearStr = row[6] != null ? String(row[6]).trim() : '';
      if (!yearStr) continue;

      const ncause = String(row[12] || '').trim().toUpperCase();
      deathRows.push({
        sex: String(row[0] || '').trim(),
        gender: String(row[1] || '').trim(),
        age: parseFloat(row[2]) || 0,
        age_group: String(row[3] || '').trim(),
        death_date: String(row[4] || '').trim(),
        death_month: String(row[5] || '').trim(),
        death_year: parseInt(yearStr),
        hosp_id: String(row[8] || '').trim(),
        district_id: String(row[10] || '').trim(),
        district_name: String(row[11] || '').trim(),
        ncause: ncause,
        is_cancer: ncause.startsWith('C'),
        birth_date: String(row[13] || '').trim(),
        birth_month: String(row[14] || '').trim(),
        birth_year: String(row[15] || '').trim(),
        death_place: String(row[16] || '').trim(),
        death_group_code: String(row[19] || '').trim(),
        cause_name: String(row[20] || 'ไม่ระบุ').trim()
      });
    }
    await batchInsert('dopa_deaths', deathRows);
  }

  // 3. Seed Births
  if (targetTable === 'all' || targetTable === 'birth') {
    console.log('\n--- Seeding dopa_births ---');
    const birthRaw = xlsx.utils.sheet_to_json(wb.Sheets['Birth'], { header: 1 });
    const birthRows = [];
    for (let i = 1; i < birthRaw.length; i++) {
      const row = birthRaw[i];
      const yearVal = row[4];
      if (!yearVal) continue;
      const amp = String(row[1] || '').trim().padStart(2, '0');
      const weight = parseFloat(row[9]) || 0;
      const mAge = parseFloat(row[10]) || 0;
      let motherAgeGroup = '20-34 ปี';
      if (mAge > 0 && mAge < 20) motherAgeGroup = '< 20 ปี';
      else if (mAge >= 35) motherAgeGroup = '35 ปีขึ้นไป';

      birthRows.push({
        prov_code: String(row[0] || '27').trim(),
        district_code: amp,
        district_name: AMP_CODE_TO_NAME[amp] || 'ไม่ระบุ',
        subdistrict_code: String(row[2] || '').trim(),
        sex: String(row[3] || '').trim(),
        gender: String(row[3]) === '1' ? 'ชาย' : (String(row[3]) === '2' ? 'หญิง' : 'ไม่ระบุ'),
        birth_year: parseInt(yearVal),
        birth_month: parseInt(row[5]) || null,
        birth_date: parseInt(row[6]) || null,
        nationality: String(row[7] || '').trim(),
        birth_order: parseInt(row[8]) || 1,
        birth_weight: weight,
        is_low_weight: weight > 0 && weight < 2500,
        mother_age: mAge,
        mother_age_group: motherAgeGroup,
        maddr: String(row[15] || '').trim()
      });
    }
    await batchInsert('dopa_births', birthRows);
  }

  console.log('\n🎉 All operations completed!');
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
