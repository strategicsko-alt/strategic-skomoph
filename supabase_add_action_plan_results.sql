-- Migration: Add execution reporting columns to action_plan_measurements
ALTER TABLE public.action_plan_measurements 
  ADD COLUMN IF NOT EXISTS result_value TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'กำลังดำเนินการ',
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES public.profiles(id);

-- Add index on key_result_id and quarter for fast reporting queries
CREATE INDEX IF NOT EXISTS idx_apm_kr_quarter ON public.action_plan_measurements(key_result_id, quarter);
