/**
 * OPSPILOT — Create Supabase tables via Management API
 * 
 * Uses Supabase's PostgreSQL REST endpoint to execute DDL.
 * Run: npx ts-node -r dotenv/config create-tables.ts
 */

import * as https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const SQL = `
create extension if not exists "uuid-ossp";

create table if not exists public.enquiries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  raw_content text not null,
  source_type text not null default 'TEXT',
  customer_name text,
  customer_email text,
  customer_phone text,
  status text not null default 'NEW',
  priority text not null default 'MEDIUM',
  requirements jsonb,
  budget text,
  currency text default 'INR',
  timeline text,
  missing_questions jsonb,
  ai_summary text,
  intent text,
  recommendation text,
  generated_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid not null,
  title text,
  description text,
  items jsonb not null default '[]',
  subtotal numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  currency text default 'INR',
  validity_days integer default 30,
  notes text,
  status text not null default 'PENDING_APPROVAL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid not null,
  title text not null,
  description text,
  due_date timestamptz,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid not null,
  quotation_id uuid,
  action_type text not null default 'SEND_QUOTATION',
  status text not null default 'PENDING',
  approved_by uuid,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.enquiries disable row level security;
alter table public.quotations disable row level security;
alter table public.follow_ups disable row level security;
alter table public.approvals disable row level security;
`;

async function createTables() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
  
  const body = JSON.stringify({ sql: SQL });
  
  const options = {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

createTables().catch(console.error);
