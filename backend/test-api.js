/**
 * OPSPILOT AI — End-to-End API Test
 * Tests all major endpoints with the actual running backend
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test_1752495393666@opspilot.test';
const TEST_PASSWORD = 'Test1234!';

let authToken = null;
let testEnquiryId = null;
let testQuotationId = null;

async function apiCall(method, endpoint, body = null, useAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && authToken) headers['Authorization'] = `Bearer ${authToken}`;
  
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();
  return { status: res.status, data };
}

function log(emoji, test, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${emoji} ${test}: ${status}${details ? ` — ${details}` : ''}`);
}

async function runTests() {
  console.log('🚀 OPSPILOT AI — End-to-End API Test\n');
  console.log('='.repeat(60));
  
  // ── 1. Health Check ──────────────────────────────────────────
  console.log('\n📋 1. HEALTH & STARTUP');
  try {
    const { status, data } = await apiCall('GET', '/health', null, false);
    log('❤️', 'Health check', status === 200 ? 'PASS' : 'FAIL', `v${data.version}, ${data.aiProvider}`);
  } catch (e) {
    log('❤️', 'Health check', 'FAIL', e.message);
    console.log('   Backend not reachable — aborting tests');
    return;
  }
  
  // ── 2. Authentication ────────────────────────────────────────
  console.log('\n🔐 2. AUTHENTICATION');
  
  try {
    const { status, data } = await apiCall('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, false);
    
    if (status === 200 && data.token) {
      authToken = data.token;
      log('🔑', 'Login', 'PASS', `user: ${data.user?.email}`);
    } else {
      log('🔑', 'Login', 'FAIL', data.error?.message || JSON.stringify(data));
      return;
    }
  } catch (e) {
    log('🔑', 'Login', 'FAIL', e.message);
    return;
  }
  
  // GET /api/auth/me
  try {
    const { status, data } = await apiCall('GET', '/api/auth/me');
    log('👤', 'Get current user (me)', status === 200 ? 'PASS' : 'FAIL', data.user?.email || data.error?.message);
  } catch (e) {
    log('👤', 'Get current user', 'FAIL', e.message);
  }
  
  // ── 3. No Auth Tests ─────────────────────────────────────────
  console.log('\n🛡️  3. AUTH PROTECTION');
  
  try {
    const { status } = await apiCall('GET', '/api/enquiries', null, false);
    log('🚫', 'No-auth enquiries returns 401', status === 401 ? 'PASS' : 'FAIL', `Got ${status}`);
  } catch (e) {
    log('🚫', 'No-auth protection', 'WARN', e.message);
  }
  
  // ── 4. Company ───────────────────────────────────────────────
  console.log('\n🏢 4. COMPANY');
  
  let companyId = null;
  try {
    const { status, data } = await apiCall('GET', '/api/company');
    if (status === 200) {
      companyId = data.company?.id;
      log('🏢', 'Get company', 'PASS', `id: ${companyId}, name: ${data.company?.name}`);
    } else if (status === 404) {
      log('🏢', 'Get company', 'WARN', 'No company — needs setup (expected for fresh users)');
      // Try to create one
      const { status: cs, data: cd } = await apiCall('POST', '/api/company', {
        name: 'Test Company',
        email: TEST_EMAIL
      });
      if (cs === 200) {
        companyId = cd.company?.id;
        log('🏗️', 'Create company', 'PASS', `Created: ${cd.company?.name}`);
      } else {
        log('🏗️', 'Create company', 'FAIL', cd.error?.message);
      }
    } else {
      log('🏢', 'Get company', 'FAIL', data.error?.message);
    }
  } catch (e) {
    log('🏢', 'Get company', 'FAIL', e.message);
  }
  
  // ── 5. Dashboard ─────────────────────────────────────────────
  console.log('\n📊 5. DASHBOARD');
  
  try {
    const { status, data } = await apiCall('GET', '/api/dashboard/summary');
    if (status === 200) {
      log('📊', 'Dashboard summary', 'PASS', 
        `enquiries: ${data.totalEnquiries}, pending: ${data.pendingApprovals}, followups: ${data.followupsDue}`);
    } else {
      log('📊', 'Dashboard summary', 'FAIL', data.error?.message);
    }
  } catch (e) {
    log('📊', 'Dashboard summary', 'FAIL', e.message);
  }
  
  // ── 6. Enquiries ─────────────────────────────────────────────
  console.log('\n📨 6. ENQUIRIES');
  
  try {
    const { status, data } = await apiCall('GET', '/api/enquiries');
    log('📋', 'List enquiries', status === 200 ? 'PASS' : 'FAIL', 
      status === 200 ? `count: ${data.enquiries?.length || 0}` : data.error?.message);
  } catch (e) {
    log('📋', 'List enquiries', 'FAIL', e.message);
  }
  
  // Create enquiry
  try {
    const { status, data } = await apiCall('POST', '/api/enquiries', {
      content: 'We need 50 laptops with 16GB RAM, i7 processor for our office. Budget around INR 10 lakhs. Need delivery in 2 weeks.',
      sourceType: 'TEXT',
      customer: 'Acme Corp'
    });
    if (status === 201 || status === 200) {
      testEnquiryId = data.enquiry?.id || data.id;
      log('✏️', 'Create enquiry', 'PASS', `id: ${testEnquiryId}`);
    } else {
      log('✏️', 'Create enquiry', 'FAIL', data.error?.message);
    }
  } catch (e) {
    log('✏️', 'Create enquiry', 'FAIL', e.message);
  }
  
  if (testEnquiryId) {
    // Get by ID
    try {
      const { status, data } = await apiCall('GET', `/api/enquiries/${testEnquiryId}`);
      log('🔍', 'Get enquiry by ID', status === 200 ? 'PASS' : 'FAIL', data.error?.message || '');
    } catch (e) {
      log('🔍', 'Get enquiry by ID', 'FAIL', e.message);
    }
    
    // Test wrong ID access (should return 403/404)
    try {
      const { status } = await apiCall('GET', '/api/enquiries/00000000-0000-0000-0000-000000000000');
      log('🔒', 'Invalid ID returns 403/404', (status === 403 || status === 404) ? 'PASS' : 'FAIL', `Got ${status}`);
    } catch (e) {
      log('🔒', 'Invalid ID protection', 'WARN', e.message);
    }
    
    // AI Analyze
    console.log('\n🤖 7. AI ANALYSIS (may take 10-30 seconds)');
    try {
      const { status, data } = await apiCall('POST', `/api/enquiries/${testEnquiryId}/analyze`);
      if (status === 200) {
        log('🧠', 'AI analyze enquiry', 'PASS', 
          `priority: ${data.analysis?.priority || data.enquiry?.priority}`);
      } else {
        log('🧠', 'AI analyze enquiry', 'FAIL', data.error?.message);
      }
    } catch (e) {
      log('🧠', 'AI analyze enquiry', 'FAIL', e.message);
    }
    
    // AI Quotation
    try {
      const { status, data } = await apiCall('POST', `/api/enquiries/${testEnquiryId}/generate-quotation`);
      if (status === 200 || status === 201) {
        testQuotationId = data.id || data.quotation?.id;
        log('📄', 'AI generate quotation', 'PASS', 
          `total: ${data.total || data.quotation?.total}`);
      } else {
        log('📄', 'AI generate quotation', 'FAIL', data.error?.message);
      }
    } catch (e) {
      log('📄', 'AI generate quotation', 'FAIL', e.message);
    }
  }
  
  // ── 8. Quotations ────────────────────────────────────────────
  console.log('\n📄 8. QUOTATIONS');
  
  try {
    const { status, data } = await apiCall('GET', '/api/quotations');
    log('📋', 'List quotations', status === 200 ? 'PASS' : 'FAIL',
      status === 200 ? `count: ${data.quotations?.length || 0}` : data.error?.message);
  } catch (e) {
    log('📋', 'List quotations', 'FAIL', e.message);
  }
  
  // Test invalid shared token
  try {
    const { status } = await apiCall('GET', '/api/quotations/shared/invalid_fake_token_123', null, false);
    log('🔗', 'Invalid share token → 404', status === 404 ? 'PASS' : 'FAIL', `Got ${status}`);
  } catch (e) {
    log('🔗', 'Invalid share token', 'WARN', e.message);
  }
  
  // ── 9. Follow-ups ────────────────────────────────────────────
  console.log('\n📅 9. FOLLOW-UPS');
  
  try {
    const { status, data } = await apiCall('GET', '/api/followups');
    log('📅', 'List follow-ups', status === 200 ? 'PASS' : 'FAIL',
      status === 200 ? `count: ${data.followUps?.length || 0}` : data.error?.message);
  } catch (e) {
    log('📅', 'List follow-ups', 'FAIL', e.message);
  }
  
  // ── 10. Received Quotations ──────────────────────────────────
  console.log('\n📥 10. RECEIVED QUOTATIONS');
  
  try {
    const { status, data } = await apiCall('GET', '/api/received-quotations');
    if (status === 200) {
      log('📥', 'List received quotations', 'PASS', 
        `count: ${data.receivedQuotations?.length || 0}`);
    } else {
      log('📥', 'List received quotations', 'FAIL', data.error?.message);
    }
  } catch (e) {
    log('📥', 'List received quotations', 'FAIL', e.message);
  }
  
  // ── Final Summary ─────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test run complete!');
  console.log('\n💡 Notes:');
  console.log('   • PDF upload test requires multipart/form-data (not tested here)');
  console.log('   • Gmail integration requires OAuth credentials (not tested here)');
  console.log('   • Share token test requires an approved quotation with share_token');
}

runTests().catch(console.error);
