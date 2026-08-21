const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function addKey() {
  const res = await pool.query(
    'INSERT INTO "LicenseKey" ("id", "key", "plan", "durationDays", "isUsed") VALUES ($1, $2, $3, $4, false) ON CONFLICT ("key") DO NOTHING RETURNING *',
    ['key_' + Date.now(), 'PRO-62CC-744C', 'PRO', 30]
  );
  console.log('✅ KEY PRO-62CC-744C SUCCESSFULLY ADDED TO SUPABASE:', res.rows);
  await pool.end();
}

addKey().catch(console.error);
