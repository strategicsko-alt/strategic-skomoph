import { getSupabaseAdmin } from '@/utils/supabase/admin';
import { aggregateHdcByLevel } from '@/lib/hdc';

export interface SyncHdcResult {
  success: boolean;
  kpiCount: number;
  updatedKpis: Array<{
    id: string;
    name: string;
    table: string;
    areaCount: number;
    provinceResult: string;
  }>;
  errors: string[];
  timestamp: string;
}

/**
 * ดึงข้อมูลจาก HDC Open Data สำหรับทุกตัวชี้วัดที่เปิด api_enabled = true
 * และบันทึกลงฐานข้อมูล kpi_measurements (ระดับรายอำเภอ/รพ. และภาพรวมจังหวัด)
 */
export async function syncAllHdcKpis(targetPeriod: string = 'Q4'): Promise<SyncHdcResult> {
  const supabase = getSupabaseAdmin();
  const errors: string[] = [];
  const updatedKpis: Array<{
    id: string;
    name: string;
    table: string;
    areaCount: number;
    provinceResult: string;
  }> = [];

  // 1. ดึง KPI ทั้งหมดที่เปิด api_enabled ไว้
  const { data: dicts, error: dictErr } = await supabase
    .from('kpi_dictionaries')
    .select('id, key_result_id, kpi_name, calculation_type, calculation_formula, measurement_level, api_enabled, api_config_json')
    .eq('api_enabled', true)
    .not('key_result_id', 'is', null);

  if (dictErr) {
    throw new Error(`Database error fetching dictionaries: ${dictErr.message}`);
  }

  if (!dicts || dicts.length === 0) {
    return {
      success: true,
      kpiCount: 0,
      updatedKpis: [],
      errors: ['ไม่พบตัวชี้วัดที่เปิดใช้งาน HDC API (api_enabled = true)'],
      timestamp: new Date().toISOString(),
    };
  }

  // ดึงชื่อ Key Result เพื่อใช้ในผลลัพธ์
  const krIds = dicts.map(d => d.key_result_id);
  const { data: krs } = await supabase
    .from('key_results')
    .select('id, auto_id, name')
    .in('id', krIds);

  const krMap: Record<string, any> = {};
  (krs || []).forEach(kr => { krMap[kr.id] = kr; });

  for (const dict of dicts) {
    const kr = krMap[dict.key_result_id];
    const kpiName = kr?.name || dict.kpi_name || dict.id;

    try {
      const cfg = typeof dict.api_config_json === 'string'
        ? JSON.parse(dict.api_config_json)
        : (dict.api_config_json || {});

      const tableName = (cfg.tableName || cfg.A?.tableName || '').trim();
      const year = String(cfg.year || '2569').trim();
      const level = (dict.measurement_level || 'district') as 'province' | 'district' | 'hospital';
      const formula = dict.calculation_formula || '(A/B)*100';
      const varMapping: Record<string, string> = cfg.variables || {
        A: cfg.A?.field || 'result',
        B: cfg.B?.field || 'target',
      };

      if (!tableName) {
        errors.push(`KPI "${kpiName}": ไม่ได้ระบุชื่อตาราง HDC`);
        continue;
      }

      // 2. Fetch raw data from HDC Open Data API
      const hdcRes = await fetch('https://opendata.moph.go.th/api/report_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StrategicSKO/1.0',
        },
        body: JSON.stringify({
          tableName,
          year,
          province: '27',
          type: 'json',
        }),
      });

      if (!hdcRes.ok) {
        throw new Error(`HDC API returned status ${hdcRes.status}`);
      }

      const hdcJson = await hdcRes.json();
      const rawRows = hdcJson.data;

      if (!Array.isArray(rawRows) || rawRows.length === 0) {
        errors.push(`KPI "${kpiName}": ตาราง "${tableName}" ไม่มีข้อมูลปี ${year}`);
        continue;
      }

      // 3. Aggregate by level (9 districts / 9 hospitals / province)
      const aggResults = aggregateHdcByLevel(rawRows, level, varMapping, formula);

      // 4. Save into kpi_measurements
      for (const item of aggResults) {
        const areaId = item.id;
        const valsStr: Record<string, string> = {};
        Object.entries(item.variables).forEach(([k, v]) => {
          valsStr[k] = String(v);
        });

        const payload = {
          key_result_id: dict.key_result_id,
          period: targetPeriod,
          area_id: areaId,
          result_value: String(item.computedValue),
          values_json: valsStr,
          reported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from('kpi_measurements')
          .select('id')
          .eq('key_result_id', dict.key_result_id)
          .eq('period', targetPeriod)
          .eq('area_id', areaId)
          .maybeSingle();

        if (existing) {
          await supabase.from('kpi_measurements').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('kpi_measurements').insert(payload);
        }
      }

      // 5. Calculate and save provincial total (area_id = 'province') if level is district or hospital
      let provResultStr = '0.00';
      if (level !== 'province' && aggResults.length > 0) {
        const provTotals: Record<string, number> = {};
        aggResults.forEach(item => {
          Object.entries(item.variables).forEach(([k, v]) => {
            provTotals[k] = (provTotals[k] || 0) + (Number(v) || 0);
          });
        });

        const provValsStr: Record<string, string> = {};
        Object.entries(provTotals).forEach(([k, v]) => {
          provValsStr[k] = String(v);
        });

        // Compute using formula for whole province
        const provAgg = aggregateHdcByLevel(rawRows, 'province', varMapping, formula);
        provResultStr = String(provAgg[0]?.computedValue ?? '0.00');

        const provPayload = {
          key_result_id: dict.key_result_id,
          period: targetPeriod,
          area_id: 'province',
          result_value: provResultStr,
          values_json: provValsStr,
          reported_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: existingProv } = await supabase
          .from('kpi_measurements')
          .select('id')
          .eq('key_result_id', dict.key_result_id)
          .eq('period', targetPeriod)
          .eq('area_id', 'province')
          .maybeSingle();

        if (existingProv) {
          await supabase.from('kpi_measurements').update(provPayload).eq('id', existingProv.id);
        } else {
          await supabase.from('kpi_measurements').insert(provPayload);
        }
      } else if (level === 'province' && aggResults.length > 0) {
        provResultStr = String(aggResults[0]?.computedValue ?? '0.00');
      }

      updatedKpis.push({
        id: dict.key_result_id,
        name: kpiName,
        table: tableName,
        areaCount: aggResults.length,
        provinceResult: provResultStr,
      });
    } catch (err: any) {
      errors.push(`KPI "${kpiName}": ${err.message || String(err)}`);
    }
  }

  return {
    success: errors.length === 0,
    kpiCount: updatedKpis.length,
    updatedKpis,
    errors,
    timestamp: new Date().toISOString(),
  };
}
