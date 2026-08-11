-- ============================================================
-- OPSPILOT AI — Phase 2 Procurement Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new
-- ============================================================

-- 1. procurement_requests
CREATE TABLE IF NOT EXISTS public.procurement_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id        uuid        REFERENCES public.customer_projects(id) ON DELETE SET NULL,
  created_by        uuid        NOT NULL,
  title             text        NOT NULL,
  raw_requirement   text        NOT NULL,
  status            text        NOT NULL DEFAULT 'DRAFT'
                                CHECK (status IN ('DRAFT','ANALYZING','NEEDS_CLARIFICATION','READY_FOR_RFQ','RFQ_GENERATED','APPROVED','CANCELLED')),
  ai_summary        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_company_id ON public.procurement_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_status     ON public.procurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_project_id ON public.procurement_requests(project_id);

-- 2. procurement_requirements
CREATE TABLE IF NOT EXISTS public.procurement_requirements (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_request_id   uuid        NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  category                 text        NOT NULL,
  product_name             text        NOT NULL,
  description              text,
  quantity                 numeric(14,4),
  unit                     text,
  specifications           jsonb       DEFAULT '[]'::jsonb,
  delivery_location        text,
  required_by              text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_procurement_requirements_request_id ON public.procurement_requirements(procurement_request_id);

-- 3. requirement_questions
CREATE TABLE IF NOT EXISTS public.requirement_questions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_request_id   uuid        NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  question                 text        NOT NULL,
  reason                   text,
  answer                   text,
  status                   text        NOT NULL DEFAULT 'OPEN'
                                       CHECK (status IN ('OPEN','ANSWERED','SKIPPED')),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_requirement_questions_request_id ON public.requirement_questions(procurement_request_id);

-- 4. rfqs
CREATE TABLE IF NOT EXISTS public.rfqs (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_request_id   uuid        NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
  company_id               uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title                    text        NOT NULL,
  description              text,
  status                   text        NOT NULL DEFAULT 'DRAFT'
                                       CHECK (status IN ('DRAFT','READY_FOR_REVIEW','APPROVED','SENT','CLOSED','CANCELLED')),
  delivery_location        text,
  response_deadline        date,
  terms                    text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rfqs_procurement_request_id ON public.rfqs(procurement_request_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_company_id             ON public.rfqs(company_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status                 ON public.rfqs(status);

-- 5. rfq_items
CREATE TABLE IF NOT EXISTS public.rfq_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          uuid        NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  category        text        NOT NULL,
  product_name    text        NOT NULL,
  description     text,
  quantity        numeric(14,4),
  unit            text,
  specifications  jsonb       DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON public.rfq_items(rfq_id);

-- 6. Enable RLS
ALTER TABLE public.procurement_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items               ENABLE ROW LEVEL SECURITY;

-- 7. RLS — procurement_requests
DROP POLICY IF EXISTS "members_select_procurement_requests" ON public.procurement_requests;
DROP POLICY IF EXISTS "members_insert_procurement_requests" ON public.procurement_requests;
DROP POLICY IF EXISTS "members_update_procurement_requests" ON public.procurement_requests;
DROP POLICY IF EXISTS "members_delete_procurement_requests" ON public.procurement_requests;

CREATE POLICY "members_select_procurement_requests" ON public.procurement_requests
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));
CREATE POLICY "members_insert_procurement_requests" ON public.procurement_requests
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));
CREATE POLICY "members_update_procurement_requests" ON public.procurement_requests
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));
CREATE POLICY "members_delete_procurement_requests" ON public.procurement_requests
  FOR DELETE USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

-- 8. RLS — procurement_requirements
DROP POLICY IF EXISTS "members_select_procurement_requirements" ON public.procurement_requirements;
DROP POLICY IF EXISTS "members_insert_procurement_requirements" ON public.procurement_requirements;
DROP POLICY IF EXISTS "members_update_procurement_requirements" ON public.procurement_requirements;
DROP POLICY IF EXISTS "members_delete_procurement_requirements" ON public.procurement_requirements;

CREATE POLICY "members_select_procurement_requirements" ON public.procurement_requirements
  FOR SELECT USING (procurement_request_id IN (SELECT id FROM public.procurement_requests WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_insert_procurement_requirements" ON public.procurement_requirements
  FOR INSERT WITH CHECK (procurement_request_id IN (SELECT id FROM public.procurement_requests WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_update_procurement_requirements" ON public.procurement_requirements
  FOR UPDATE USING (procurement_request_id IN (SELECT id FROM public.procurement_requests WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_delete_procurement_requirements" ON public.procurement_requirements
  FOR DELETE USING (procurement_request_id IN (SELECT id FROM public.procurement_requests WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));

-- 9. RLS — requirement_questions
DROP POLICY IF EXISTS "members_select_requirement_questions" ON public.requirement_questions;
DROP POLICY IF EXISTS "members_insert_requirement_questions" ON public.requirement_questions;
DROP POLICY IF EXISTS "members_update_requirement_questions" ON public.requirement_questions;

CREATE POLICY "members_select_requirement_questions" ON public.requirement_questions
  FOR SELECT USING (procurement_request_id IN (SELECT id FROM public.procurement_requests WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_insert_requirement_questions" ON public.requirement_questions
  FOR INSERT WITH CHECK (procurement_request_id IN (SELECT id FROM public.procurement_requests WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_update_requirement_questions" ON public.requirement_questions
  FOR UPDATE USING (procurement_request_id IN (SELECT id FROM public.procurement_requests WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));

-- 10. RLS — rfqs
DROP POLICY IF EXISTS "members_select_rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "members_insert_rfqs" ON public.rfqs;
DROP POLICY IF EXISTS "members_update_rfqs" ON public.rfqs;

CREATE POLICY "members_select_rfqs" ON public.rfqs
  FOR SELECT USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));
CREATE POLICY "members_insert_rfqs" ON public.rfqs
  FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));
CREATE POLICY "members_update_rfqs" ON public.rfqs
  FOR UPDATE USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

-- 11. RLS — rfq_items
DROP POLICY IF EXISTS "members_select_rfq_items" ON public.rfq_items;
DROP POLICY IF EXISTS "members_insert_rfq_items" ON public.rfq_items;
DROP POLICY IF EXISTS "members_update_rfq_items" ON public.rfq_items;
DROP POLICY IF EXISTS "members_delete_rfq_items" ON public.rfq_items;

CREATE POLICY "members_select_rfq_items" ON public.rfq_items
  FOR SELECT USING (rfq_id IN (SELECT id FROM public.rfqs WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_insert_rfq_items" ON public.rfq_items
  FOR INSERT WITH CHECK (rfq_id IN (SELECT id FROM public.rfqs WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_update_rfq_items" ON public.rfq_items
  FOR UPDATE USING (rfq_id IN (SELECT id FROM public.rfqs WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));
CREATE POLICY "members_delete_rfq_items" ON public.rfq_items
  FOR DELETE USING (rfq_id IN (SELECT id FROM public.rfqs WHERE company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid())));

-- 12. Verification
SELECT 'Phase 2 migration complete!' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('procurement_requests','procurement_requirements','requirement_questions','rfqs','rfq_items')
ORDER BY table_name;
