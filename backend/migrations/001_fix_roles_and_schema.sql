-- ============================================================
-- OPSPILOT AI — Critical Database Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new
-- ============================================================

-- 1. Fix company_members role constraint (accept uppercase OWNER, ADMIN, MEMBER)
ALTER TABLE public.company_members
  DROP CONSTRAINT IF EXISTS company_members_role_check;

ALTER TABLE public.company_members
  ADD CONSTRAINT company_members_role_check
  CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'owner', 'admin', 'member'));

-- 2. Add share_token column to quotations if it doesn't exist
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS share_token text;

-- 3. Create unique index on share_token
CREATE UNIQUE INDEX IF NOT EXISTS quotations_share_token_idx
  ON public.quotations (share_token)
  WHERE share_token IS NOT NULL;

-- 4. Ensure received_quotations table exists
CREATE TABLE IF NOT EXISTS public.received_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  attachment_name text,
  sender_name text,
  sender_email text,
  sender_company text,
  email_subject text,
  extraction_status text NOT NULL DEFAULT 'PROCESSING',
  review_status text NOT NULL DEFAULT 'PENDING',
  source text NOT NULL DEFAULT 'UPLOAD',
  quotation_number text,
  quotation_title text,
  currency text DEFAULT 'INR',
  subtotal numeric(14,2),
  tax numeric(14,2),
  grand_total numeric(14,2),
  quotation_date date,
  valid_until date,
  items jsonb,
  terms text,
  has_discrepancy boolean DEFAULT false,
  discrepancy_notes text,
  ai_insights jsonb,
  extracted_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_received_quotations_company_id ON public.received_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_received_quotations_created_at ON public.received_quotations(created_at);

-- Verification
SELECT 'Migration complete!' as status;
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'public.company_members'::regclass
  AND contype = 'c';
