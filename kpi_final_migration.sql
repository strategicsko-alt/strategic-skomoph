-- 1. Create kpi_tags table
CREATE TABLE IF NOT EXISTS public.kpi_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modify kpi_dictionaries table
ALTER TABLE public.kpi_dictionaries
  ADD COLUMN IF NOT EXISTS measurement_level TEXT DEFAULT 'district',
  ADD COLUMN IF NOT EXISTS calculation_type TEXT DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS data_items_json JSONB DEFAULT '[{"id": "A", "label": "ตัวตั้ง", "type": "numerator"}, {"id": "B", "label": "ตัวหาร", "type": "denominator"}]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_operator TEXT DEFAULT '>=',
  ADD COLUMN IF NOT EXISTS evaluation_criteria_json JSONB DEFAULT '{"q1": 0, "q2": 0, "q3": 0, "q4": 0}'::jsonb,
  ADD COLUMN IF NOT EXISTS calculation_formula TEXT DEFAULT '(A/B)*100',
  ADD COLUMN IF NOT EXISTS moph_category TEXT,
  ADD COLUMN IF NOT EXISTS target_population TEXT,
  ADD COLUMN IF NOT EXISTS supporting_docs TEXT;

-- 3. Create key_result_tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.key_result_tags (
    key_result_id UUID REFERENCES public.key_results(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.kpi_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (key_result_id, tag_id)
);

-- 4. Create kpi_measurements table
CREATE TABLE IF NOT EXISTS public.kpi_measurements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_result_id UUID REFERENCES public.key_results(id) ON DELETE CASCADE,
    period TEXT NOT NULL, 
    area_id TEXT NOT NULL, 
    values_json JSONB NOT NULL DEFAULT '{}'::jsonb, 
    result_value NUMERIC, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- 5. Insert initial tags
INSERT INTO public.kpi_tags (name) VALUES 
('ตัวชี้วัดกระทรวงสาธารณสุขปี 2570'),
('ตัวชี้วัดตรวจราชการฯ ปี 2570'),
('ยุทธศาสตร์สุขภาพ สระแก้ว (5 ปี)'),
('ยุทธศาสตร์สุขภาพ สระแก้ว (รายไตรมาส)')
ON CONFLICT (name) DO NOTHING;
-- เพิ่มคอลัมน์ work_group ลงในตาราง profiles สำหรับกรองการมองเห็นระดับกลุ่มงาน
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_group TEXT;
