/**
 * Migration: Add share_token column to quotations table
 * Run: node -r dotenv/config migrate-share-token.js
 */
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Try to add column via a direct insert with share_token field to detect if column exists
async function checkAndAddColumn() {
  // Check if share_token column exists by querying it
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/rest/v1/quotations?limit=1&select=id,share_token`;
    const options = {
      method: 'GET',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    };
    
    const req = https.request(url, options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ share_token column already exists!');
        resolve(true);
      } else {
        console.log('❌ share_token column does not exist yet');
        console.log('\n📋 RUN THIS SQL IN SUPABASE SQL EDITOR:');
        console.log('👉 https://supabase.com/dashboard/project/fwxmjowavsdcwjlymqhy/sql/new');
        console.log('\nalter table public.quotations add column if not exists share_token text unique;');
        console.log('\nThis adds a unique share token for cross-company quotation sharing.\n');
        resolve(false);
      }
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

checkAndAddColumn();
