/**
 * Test what role values the constraint accepts - uses valid UUIDs
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testRoleConstraint() {
  console.log('🔬 Testing company_members role constraint with valid UUIDs...\n');

  // First create a test company
  const testOwnerId = randomUUID();
  const { data: company, error: cErr } = await supabase
    .from('companies')
    .insert({ name: 'ROLE_TEST_CO_' + Date.now(), owner_id: testOwnerId })
    .select()
    .single();

  if (cErr) {
    console.log('❌ Cannot create test company:', cErr.message, '(code:', cErr.code, ')');
    console.log('\n💡 This may be due to RLS. Checking existing member roles...');
    
    const { data: existing } = await supabase.from('company_members').select('id, role').limit(10);
    if (existing && existing.length > 0) {
      const uniqueRoles = [...new Set(existing.map(r => r.role))];
      console.log('📋 Existing roles already in DB:', uniqueRoles);
      console.log('   → These are the roles the constraint ACCEPTS');
    } else {
      console.log('   No existing company_members data visible');
    }
    return;
  }

  const companyId = company.id;
  console.log('✅ Created test company:', companyId);

  // Test different role values
  const rolesToTest = ['OWNER', 'owner', 'ADMIN', 'admin', 'MEMBER', 'member'];
  const results = {};
  
  for (const role of rolesToTest) {
    const userId = randomUUID();
    const { error } = await supabase
      .from('company_members')
      .insert({ company_id: companyId, user_id: userId, role });
    
    if (error) {
      if (error.code === '23514') {
        console.log(`❌ role='${role}' → REJECTED by CHECK constraint (23514)`);
        results[role] = 'REJECTED';
      } else {
        console.log(`⚠️  role='${role}' → Other error: ${error.code} ${error.message}`);
        results[role] = `ERROR: ${error.code}`;
      }
    } else {
      console.log(`✅ role='${role}' → ACCEPTED`);
      results[role] = 'ACCEPTED';
    }
  }

  console.log('\n📊 Summary:');
  const accepted = Object.entries(results).filter(([,v]) => v === 'ACCEPTED').map(([k]) => k);
  const rejected = Object.entries(results).filter(([,v]) => v === 'REJECTED').map(([k]) => k);
  console.log('   ACCEPTED:', accepted.join(', ') || 'none');
  console.log('   REJECTED:', rejected.join(', ') || 'none');

  // Cleanup
  await supabase.from('companies').delete().eq('id', companyId);
  console.log('\n🧹 Cleaned up test data');
  
  if (accepted.includes('OWNER')) {
    console.log('\n✅ Backend code using role=\'OWNER\' (uppercase) should work correctly!');
  } else if (accepted.includes('owner')) {
    console.log('\n⚠️  DB only accepts lowercase! Backend needs to use \'owner\' not \'OWNER\'');
  } else {
    console.log('\n⚠️  Could not determine constraint. Check Supabase dashboard directly.');
  }
}

testRoleConstraint().catch(console.error);
