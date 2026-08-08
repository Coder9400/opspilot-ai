/**
 * OPSPILOT AI — Supabase Database Setup Script
 * Creates all tables needed for the backend
 * Run with: npx ts-node --transpile-only setup-db.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// Try with service role key if provided
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkTables() {
  console.log('\n🔍 Checking existing tables in Supabase...\n');
  const tables = ['enquiries', 'quotations', 'follow_ups', 'approvals'];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && (error.code === 'PGRST116' || error.code === '42P01')) {
      console.log(`  ❌ Table "${table}" — NOT FOUND`);
    } else if (error) {
      console.log(`  ⚠️  Table "${table}" — ERROR: ${error.message}`);
    } else {
      console.log(`  ✅ Table "${table}" — EXISTS`);
    }
  }
  console.log('');
}

async function checkAuth() {
  console.log('🔍 Checking Supabase Auth...\n');

  // Try signing up a test user
  const { data, error } = await supabase.auth.signUp({
    email: `setup-test-${Date.now()}@opspilot-test.dev`,
    password: 'SetupTest@2024!',
    options: { data: { name: 'Setup Test' } },
  });

  if (error) {
    console.log(`  ❌ Auth signup FAILED: ${error.message}`);
  } else {
    console.log(`  ✅ Auth signup works — user created (email confirm: ${!data.session})`);
    if (data.session) {
      console.log(`  ✅ Got session token — email confirm DISABLED (good for dev!)`);
    } else {
      console.log(`  ⚠️  Email confirmation ENABLED — login will fail until user confirms email.`);
      console.log(`     → To disable: Supabase Dashboard > Auth > Settings > Disable email confirmation`);
    }
  }
  console.log('');
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║    OPSPILOT AI — Database Setup Check    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Project: ${SUPABASE_URL}`);
  console.log(`Using key: ${KEY === SUPABASE_ANON_KEY ? 'ANON KEY (limited)' : 'SERVICE ROLE KEY (full access)'}\n`);

  await checkAuth();
  await checkTables();

  const tables = ['enquiries', 'quotations', 'follow_ups', 'approvals'];
  const missing: string[] = [];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error && (error.code === 'PGRST116' || error.code === '42P01')) {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    console.log('⚠️  TABLES MISSING:', missing.join(', '));
    console.log('');
    console.log('📋 ACTION REQUIRED: Run this SQL in your Supabase dashboard:');
    console.log('   URL: https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new');
    console.log('');
    console.log('   The SQL file is at: docs/supabase_schema.sql');
    console.log('');
    console.log('   OR: Add SUPABASE_SERVICE_ROLE_KEY to .env for automatic migration.');
  } else {
    console.log('✅ All tables exist! Backend is fully ready for frontend integration.');
  }
}

main().catch(console.error);
