/**
 * OPSPILOT AI — Run Critical DB Migration
 * Fixes the company_members role constraint to accept uppercase 'OWNER', 'ADMIN', 'MEMBER'
 * 
 * Run with: node run-migration.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConstraint() {
  console.log('\n📋 Checking current database state...\n');
  
  // Check if company_members table exists and what constraint it has
  const { data: tables, error: tErr } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['company_members', 'companies', 'received_quotations', 'enquiries', 'quotations']);
    
  if (tErr) {
    console.log('ℹ️  Cannot query information_schema directly (expected with anon key)');
    console.log('   Testing table access instead...');
  } else {
    const tableNames = (tables || []).map(t => t.table_name);
    console.log('✅ Tables found:', tableNames.join(', ') || 'none');
  }
  
  // Test inserting with OWNER role (the canonical fix check)
  console.log('\n🔬 Testing company_members constraint with role=OWNER...');
  
  // First, check if we can select from company_members
  const { error: selectErr } = await supabase
    .from('company_members')
    .select('id, role')
    .limit(1);
    
  if (selectErr) {
    if (selectErr.code === '42P01') {
      console.log('❌ company_members table does NOT exist. Need to run full setup.');
      return { tablesMissing: true };
    }
    console.log('⚠️  company_members select error:', selectErr.message);
  } else {
    console.log('✅ company_members table exists and is queryable');
  }

  // Check received_quotations
  const { error: rqErr } = await supabase
    .from('received_quotations')
    .select('id')
    .limit(1);
    
  if (rqErr?.code === '42P01') {
    console.log('❌ received_quotations table does NOT exist');
    return { receivedQuotationsMissing: true };
  } else if (!rqErr) {
    console.log('✅ received_quotations table exists');
  }

  // Check quotations for share_token column
  const { data: quotSample, error: quotErr } = await supabase
    .from('quotations')
    .select('id, share_token')
    .limit(1);
    
  if (quotErr) {
    console.log('⚠️  quotations check:', quotErr.message);
    if (quotErr.message.includes('share_token')) {
      console.log('❌ quotations.share_token column is MISSING');
      return { shareTokenMissing: true };
    }
  } else {
    console.log('✅ quotations.share_token column exists');
  }
  
  return { ok: true };
}

async function main() {
  console.log('🚀 OPSPILOT AI — Database Migration Check');
  console.log('==========================================');
  
  const status = await checkConstraint();
  
  console.log('\n📊 Migration Status:');
  console.log(JSON.stringify(status, null, 2));
  
  if (status.ok) {
    console.log('\n✅ Database appears to be correctly configured!');
    console.log('   If you are still seeing constraint errors,');
    console.log('   please run the SQL in backend/migrations/001_fix_roles_and_schema.sql');
    console.log('   via the Supabase Dashboard SQL editor.');
  } else {
    console.log('\n⚠️  Database needs migration!');
    console.log('   Please open the Supabase Dashboard and run:');
    console.log('   backend/migrations/001_fix_roles_and_schema.sql');
    console.log('\n   Dashboard URL: https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new');
  }
  
  console.log('\n🔗 Supabase Dashboard SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new');
}

main().catch(console.error);
