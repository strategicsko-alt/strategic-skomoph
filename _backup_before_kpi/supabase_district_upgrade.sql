
-- action_plan_measurements
ALTER TABLE public.action_plan_measurements ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES public.districts(id);
UPDATE public.action_plan_measurements SET district_id = province_id WHERE district_id IS NULL;
