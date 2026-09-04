-- ============================================================
-- KPI Dictionaries Enhancement Migration
-- เพิ่มคอลัมน์ที่ขาดหายใน kpi_dictionaries
-- ============================================================

-- เพิ่มคอลัมน์ work_group สำหรับกลุ่มงาน, api config, และ standalone KPI
ALTER TABLE public.kpi_dictionaries
  ADD COLUMN IF NOT EXISTS work_group TEXT,
  ADD COLUMN IF NOT EXISTS api_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS api_config_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS kpi_name TEXT,
  ADD COLUMN IF NOT EXISTS kpi_type TEXT DEFAULT 'strategic';

-- เพิ่ม reported_at ใน kpi_measurements
ALTER TABLE public.kpi_measurements
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kpi_dict_key_result ON public.kpi_dictionaries(key_result_id);
CREATE INDEX IF NOT EXISTS idx_kpi_dict_work_group ON public.kpi_dictionaries(work_group);
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_kr_period ON public.kpi_measurements(key_result_id, period);
