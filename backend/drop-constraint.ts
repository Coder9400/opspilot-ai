/**
 * Drop the restrictive constraint on company_members
 */
import * as https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const SQL = `
ALTER TABLE public.company_members DROP CONSTRAINT IF EXISTS company_members_role_check;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_name_check;
`;

async function runSQL() {
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

runSQL().catch(console.error);
