const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function addAllOldKeys() {
  const keys = [
    { key: 'PRO-62CC-744C', plan: 'PRO', days: 30 },
    { key: 'VIP-BA5F-FB7B', plan: 'VIP', days: 30 },
    { key: 'VIP-39AC-9122', plan: 'VIP', days: 30 },
    { key: 'VIP-DB83-6000', plan: 'VIP', days: 30 },
    { key: 'PRO-5429-D850', plan: 'PRO', days: 30 },
    { key: 'PRO-F182-DCF2', plan: 'PRO', days: 7 },
    { key: 'PRO-89E9-278D', plan: 'PRO', days: 7 }
  ];

  for (const k of keys) {
    await pool.query(
      'INSERT INTO "LicenseKey" ("id", "key", "plan", "durationDays", "isUsed") VALUES ($1, $2, $3, $4, false) ON CONFLICT ("key") DO NOTHING',
      ['key_' + Math.random().toString(36).slice(2), k.key, k.plan, k.days]
    );
  }
  console.log('✅ ALL BOT KEYS INSERTED INTO SUPABASE POSTGRESQL!');
  await pool.end();
}

addAllOldKeys().catch(console.error);
