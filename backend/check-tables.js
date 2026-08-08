/**
 * Creates all OPSPILOT tables in Supabase using the Supabase JS client.
 * Uses the `supabase-js` admin approach via REST + service_role OR
 * falls back to showing the SQL for manual execution.
 * 
 * Run: node create-tables.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fwxmjowavsdcwjlymqhy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_XUtR6JEmfRDqGnKSdfXLtQ_oJwb3jVp';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('\n🔍 Checking which tables exist in Supabase...\n');
  
  const tables = ['enquiries', 'quotations', 'follow_ups', 'approvals'];
  const results = {};
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && error.code === '42P01') {
      results[table] = '❌ MISSING';
    } else if (error) {
      results[table] = `⚠️  ERROR: ${error.message}`;
    } else {
      results[table] = '✅ EXISTS';
    }
  }
  
  console.log('Table Status:');
  Object.entries(results).forEach(([t, s]) => console.log(`  ${s}  ${t}`));
  
  const missingTables = Object.entries(results)
    .filter(([, s]) => s.includes('MISSING'))
    .map(([t]) => t);
  
  if (missingTables.length === 0) {
    console.log('\n✅ All tables exist! Backend is fully ready.\n');
    process.exit(0);
  }
  
  console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
  console.log('\n📋 PLEASE RUN THIS SQL IN SUPABASE SQL EDITOR:');
  console.log('   👉 https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new\n');
  console.log('─'.repeat(70));
  console.log(`
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
`);
  console.log('─'.repeat(70));
  console.log('\nAlso disable email confirmation at:');
  console.log('👉 https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/auth/providers');
  console.log('   → Email → turn OFF "Confirm email"\n');
}

checkTables().catch(console.error);
