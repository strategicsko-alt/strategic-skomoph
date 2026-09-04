-- เพิ่มคอลัมน์ work_group ลงในตาราง profiles สำหรับกรองการมองเห็นระดับกลุ่มงาน
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_group TEXT;
