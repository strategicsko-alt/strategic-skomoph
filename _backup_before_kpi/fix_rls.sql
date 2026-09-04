-- Drop the recursive policies
DROP POLICY IF EXISTS "Provincial Super Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "District Super Admin can view profiles in their district" ON public.profiles;

-- Create a helper function that bypasses RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_district_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT district_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create the new non-recursive policies using the helper functions
CREATE POLICY "Provincial Super Admin can view all profiles" 
    ON public.profiles FOR SELECT 
    USING ( 
        public.get_my_role() = 'province_super_admin'
    );

CREATE POLICY "District Super Admin can view profiles in their district" 
    ON public.profiles FOR SELECT 
    USING ( 
        public.get_my_role() = 'district_super_admin' AND 
        public.get_my_district_id() = district_id
    );
