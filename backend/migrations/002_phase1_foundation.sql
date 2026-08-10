-- ============================================================
-- OPSPILOT AI — Phase 1 Foundation Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new
-- ============================================================

-- ── 1. Extend companies table ──────────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'CUSTOMER'
    CHECK (type IN ('CUSTOMER', 'SUPPLIER')),
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_companies_type ON public.companies(type);

-- ── 2. customer_projects ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_projects (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  description      text,
  location         text,
  status           text        NOT NULL DEFAULT 'DRAFT'
                               CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
  start_date       date,
  expected_end_date date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_projects_company_id ON public.customer_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_projects_status    ON public.customer_projects(status);

-- ── 3. supplier_profiles ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid        NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  description          text,
  business_category    text,
  service_areas        text[],
  minimum_order_value  numeric(14,2),
  certifications       text[],
  capacity             text,
  delivery_information text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_profiles_company_id ON public.supplier_profiles(company_id);

-- ── 4. supplier_products ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.supplier_products (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name             text          NOT NULL,
  category         text          NOT NULL,
  description      text,
  unit             text          NOT NULL,
  minimum_quantity numeric(14,2) NOT NULL DEFAULT 1,
  specifications   jsonb,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_company_id ON public.supplier_products(company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_category   ON public.supplier_products(category);

-- ── 5. Enable RLS on new tables ────────────────────────────────────────────────

ALTER TABLE public.customer_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products  ENABLE ROW LEVEL SECURITY;

-- ── 6. RLS policies — customer_projects ────────────────────────────────────────

DROP POLICY IF EXISTS "members_select_projects"  ON public.customer_projects;
DROP POLICY IF EXISTS "members_insert_projects"  ON public.customer_projects;
DROP POLICY IF EXISTS "members_update_projects"  ON public.customer_projects;
DROP POLICY IF EXISTS "members_delete_projects"  ON public.customer_projects;

CREATE POLICY "members_select_projects" ON public.customer_projects
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_projects" ON public.customer_projects
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_update_projects" ON public.customer_projects
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_delete_projects" ON public.customer_projects
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

-- ── 7. RLS policies — supplier_profiles ────────────────────────────────────────

DROP POLICY IF EXISTS "members_select_supplier_profile" ON public.supplier_profiles;
DROP POLICY IF EXISTS "members_insert_supplier_profile" ON public.supplier_profiles;
DROP POLICY IF EXISTS "members_update_supplier_profile" ON public.supplier_profiles;

CREATE POLICY "members_select_supplier_profile" ON public.supplier_profiles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_supplier_profile" ON public.supplier_profiles
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_update_supplier_profile" ON public.supplier_profiles
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

-- ── 8. RLS policies — supplier_products ────────────────────────────────────────

DROP POLICY IF EXISTS "members_select_products" ON public.supplier_products;
DROP POLICY IF EXISTS "members_insert_products" ON public.supplier_products;
DROP POLICY IF EXISTS "members_update_products" ON public.supplier_products;
DROP POLICY IF EXISTS "members_delete_products" ON public.supplier_products;

CREATE POLICY "members_select_products" ON public.supplier_products
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_insert_products" ON public.supplier_products
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_update_products" ON public.supplier_products
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_delete_products" ON public.supplier_products
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

-- ── 9. RLS policies — companies (allow insert during registration) ─────────────

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_insert_company"  ON public.companies;
DROP POLICY IF EXISTS "members_can_select_company"        ON public.companies;
DROP POLICY IF EXISTS "owners_can_update_company"         ON public.companies;

-- Any authenticated user can create a company (server validates uniqueness)
CREATE POLICY "authenticated_can_insert_company" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can read companies they belong to
CREATE POLICY "members_can_select_company" ON public.companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

-- Owners/admins can update their company
CREATE POLICY "owners_can_update_company" ON public.companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'OWNER', 'admin', 'ADMIN')
    )
  );

-- ── 10. RLS policies — company_members ────────────────────────────────────────

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_insert_own_membership"   ON public.company_members;
DROP POLICY IF EXISTS "members_can_select_memberships"    ON public.company_members;

-- User can only insert themselves as a member
CREATE POLICY "users_can_insert_own_membership" ON public.company_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Members can see all members of their own company
CREATE POLICY "members_can_select_memberships" ON public.company_members
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.company_members WHERE user_id = auth.uid()
    )
  );

-- ── 11. Verification ──────────────────────────────────────────────────────────

SELECT 'Phase 1 migration complete!' AS status;

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('companies', 'customer_projects', 'supplier_profiles', 'supplier_products')
ORDER BY table_name, ordinal_position;
