const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function runCleanup() {
  console.log('🧹 7 kundan eski vaqtinchalik ma\'lumotlarni tozalash...');
  const res = await pool.query(`
    DELETE FROM "AiUsageLog"
    WHERE "createdAt" < NOW() - INTERVAL '7 days'
      AND "status" IN ('FAILED', 'CACHED');
  `);
  console.log(`✅ Tozalandi: ${res.rowCount} ta vaqtinchalik yozuv.`);
  await pool.end();
}

runCleanup().catch(console.error);
