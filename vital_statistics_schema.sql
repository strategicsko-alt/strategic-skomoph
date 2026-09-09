-- ==========================================================
-- Migration: Vital Statistics (Population, Death, Birth) Schema
-- สำหรับระบบ Strategic SKO สำนักงานสาธารณสุขจังหวัดสระแก้ว
-- ==========================================================

-- 1. ตารางข้อมูลประชากร (DOPA Population)
CREATE TABLE IF NOT EXISTS public.dopa_populations (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    office_name TEXT NOT NULL,
    district_name TEXT NOT NULL,
    district_id TEXT,
    age_label TEXT NOT NULL,
    age_num INTEGER,
    male_thai INTEGER DEFAULT 0,
    female_thai INTEGER DEFAULT 0,
    total_thai INTEGER DEFAULT 0,
    male_foreign INTEGER DEFAULT 0,
    female_foreign INTEGER DEFAULT 0,
    total_foreign INTEGER DEFAULT 0,
    male_total INTEGER DEFAULT 0,
    female_total INTEGER DEFAULT 0,
    grand_total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index สำหรับค้นหาประชากรอย่างรวดเร็ว
CREATE INDEX IF NOT EXISTS idx_dopa_pop_year ON public.dopa_populations(year);
CREATE INDEX IF NOT EXISTS idx_dopa_pop_district ON public.dopa_populations(district_name);
CREATE INDEX IF NOT EXISTS idx_dopa_pop_year_dist ON public.dopa_populations(year, district_name);
CREATE INDEX IF NOT EXISTS idx_dopa_pop_age ON public.dopa_populations(age_num);

-- 2. ตารางข้อมูลสาเหตุการตาย (DOPA & MOPH Death Records)
CREATE TABLE IF NOT EXISTS public.dopa_deaths (
    id BIGSERIAL PRIMARY KEY,
    gender TEXT,
    sex TEXT,
    age NUMERIC,
    age_group TEXT,
    death_date TEXT,
    death_month TEXT,
    death_year INTEGER NOT NULL,
    hosp_id TEXT,
    district_id TEXT,
    district_name TEXT NOT NULL,
    ncause TEXT,
    is_cancer BOOLEAN DEFAULT FALSE,
    birth_date TEXT,
    birth_month TEXT,
    birth_year TEXT,
    death_place TEXT,
    death_group_code TEXT,
    cause_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index สำหรับค้นหาข้อมูลการตาย
CREATE INDEX IF NOT EXISTS idx_dopa_deaths_year ON public.dopa_deaths(death_year);
CREATE INDEX IF NOT EXISTS idx_dopa_deaths_district ON public.dopa_deaths(district_name);
CREATE INDEX IF NOT EXISTS idx_dopa_deaths_year_dist ON public.dopa_deaths(death_year, district_name);
CREATE INDEX IF NOT EXISTS idx_dopa_deaths_cancer ON public.dopa_deaths(is_cancer);
CREATE INDEX IF NOT EXISTS idx_dopa_deaths_cause ON public.dopa_deaths(cause_name);
CREATE INDEX IF NOT EXISTS idx_dopa_deaths_age_group ON public.dopa_deaths(age_group);

-- 3. ตารางข้อมูลการเกิด (DOPA Birth Records)
CREATE TABLE IF NOT EXISTS public.dopa_births (
    id BIGSERIAL PRIMARY KEY,
    prov_code TEXT DEFAULT '27',
    district_code TEXT NOT NULL,
    district_name TEXT NOT NULL,
    subdistrict_code TEXT,
    gender TEXT,
    sex TEXT,
    birth_year INTEGER NOT NULL,
    birth_month INTEGER,
    birth_date INTEGER,
    nationality TEXT,
    birth_order INTEGER,
    birth_weight NUMERIC,
    is_low_weight BOOLEAN DEFAULT FALSE,
    mother_age NUMERIC,
    mother_age_group TEXT,
    maddr TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index สำหรับค้นหาข้อมูลการเกิด
CREATE INDEX IF NOT EXISTS idx_dopa_births_year ON public.dopa_births(birth_year);
CREATE INDEX IF NOT EXISTS idx_dopa_births_dist ON public.dopa_births(district_name);
CREATE INDEX IF NOT EXISTS idx_dopa_births_year_dist ON public.dopa_births(birth_year, district_name);
CREATE INDEX IF NOT EXISTS idx_dopa_births_low_weight ON public.dopa_births(is_low_weight);
CREATE INDEX IF NOT EXISTS idx_dopa_births_mother_age ON public.dopa_births(mother_age_group);

-- ==========================================================
-- 4. ตั้งค่าสิทธิ์ Row-Level Security (RLS)
-- ==========================================================

ALTER TABLE public.dopa_populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dopa_deaths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dopa_births ENABLE ROW LEVEL SECURITY;

-- 4.1 สิทธิ์การอ่าน (SELECT): เปิดให้อ่านสาธารณะ (Dashboard สาธารณะเข้าถึงได้)
CREATE POLICY "Allow public read access on dopa_populations"
    ON public.dopa_populations FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on dopa_deaths"
    ON public.dopa_deaths FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on dopa_births"
    ON public.dopa_births FOR SELECT
    USING (true);

-- 4.2 สิทธิ์การเขียน (INSERT, UPDATE, DELETE): จำกัดเฉพาะ Service Role และ Admin
CREATE POLICY "Allow admin write access on dopa_populations"
    ON public.dopa_populations FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('province_super_admin', 'district_super_admin')
        )
    );

CREATE POLICY "Allow admin write access on dopa_deaths"
    ON public.dopa_deaths FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('province_super_admin', 'district_super_admin')
        )
    );

CREATE POLICY "Allow admin write access on dopa_births"
    ON public.dopa_births FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('province_super_admin', 'district_super_admin')
        )
    );
