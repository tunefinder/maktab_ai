const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function initTrialTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "TrialClaim" (
      "telegramId" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ TrialClaim TABLE CREATED IN SUPABASE!');
  await pool.end();
}

initTrialTable().catch(console.error);
