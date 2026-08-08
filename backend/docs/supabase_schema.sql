-- ============================================================
-- OPSPILOT AI — Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql
-- ============================================================

-- ─── Enable UUID extension ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── enquiries ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS enquiries (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_content    TEXT         NOT NULL,
  source_type    TEXT         NOT NULL DEFAULT 'TEXT',

  -- AI-extracted fields
  customer_name  TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  requirements   JSONB,
  budget         NUMERIC,
  currency       TEXT         DEFAULT 'INR',
  timeline       TEXT,
  priority       TEXT         NOT NULL DEFAULT 'MEDIUM'
                              CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status         TEXT         NOT NULL DEFAULT 'NEW'
                              CHECK (status IN ('NEW', 'ANALYZING', 'REVIEW', 'APPROVED', 'COMPLETED')),
  missing_questions  JSONB,
  ai_summary         TEXT,
  generated_response TEXT,

  created_at     TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

-- ─── quotations ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quotations (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  enquiry_id    UUID         NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  title         TEXT         NOT NULL,
  description   TEXT,
  items         JSONB        NOT NULL DEFAULT '[]',
  subtotal      NUMERIC      NOT NULL DEFAULT 0,
  tax           NUMERIC      NOT NULL DEFAULT 0,
  total         NUMERIC      NOT NULL DEFAULT 0,
  currency      TEXT         NOT NULL DEFAULT 'INR',
  validity_days INTEGER      NOT NULL DEFAULT 30,
  notes         TEXT,
  status        TEXT         NOT NULL DEFAULT 'PENDING_APPROVAL'
                             CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
  created_at    TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

-- ─── follow_ups ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS follow_ups (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  enquiry_id  UUID         NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  title       TEXT         NOT NULL,
  description TEXT,
  due_date    TIMESTAMPTZ,
  status      TEXT         NOT NULL DEFAULT 'PENDING'
                           CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

-- ─── approvals ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approvals (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  enquiry_id   UUID         NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  quotation_id UUID         REFERENCES quotations(id) ON DELETE SET NULL,
  approved_by  UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type  TEXT         NOT NULL
               CHECK (action_type IN ('SEND_RESPONSE', 'SEND_QUOTATION', 'COMPLETE_WORKFLOW')),
  status       TEXT         NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  comments     TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

-- ─── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_enquiries_user_id    ON enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status     ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_priority   ON enquiries(priority);
CREATE INDEX IF NOT EXISTS idx_enquiries_created    ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_enquiry   ON quotations(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_enquiry   ON follow_ups(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due       ON follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_approvals_enquiry    ON approvals(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status     ON approvals(status);

-- ─── updated_at auto-update trigger ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE TRIGGER update_approvals_updated_at
  BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- IMPORTANT: For the hackathon backend (which uses the anon key but verifies
-- auth server-side), disable RLS on these tables. If you add the service_role
-- key later, you can re-enable RLS with proper policies.

ALTER TABLE enquiries  DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals  DISABLE ROW LEVEL SECURITY;

-- ─── Verify tables created ─────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('enquiries', 'quotations', 'follow_ups', 'approvals')
ORDER BY table_name;
