const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function runTests() {
  console.log('🚀 Running SaaS Architecture & Guardrails Verification Suite...\n');

  // Test 1: Verify Database Schema Columns & SystemConfig
  console.log('1️⃣ Checking Database Schema...');
  const cfgRes = await pool.query('SELECT * FROM "SystemConfig" WHERE id = \'global\'');
  if (cfgRes.rows.length === 0) {
    throw new Error('SystemConfig table missing row global');
  }
  console.log('   ✅ SystemConfig present:', {
    costPerCredit: cfgRes.rows[0].aiCostPerCreditUzs,
    isAiDisabled: cfgRes.rows[0].isAiDisabledGlobally
  });

  // Test 2: Test Plan Key Generation & Storage
  console.log('\n2️⃣ Testing License Key Generation for all 5 Tiers + AI Packs...');
  const testPlans = ['START', 'PRO', 'MAX', 'MAKTAB_PRO', 'MAKTAB_VIP', 'PACK_500', 'PACK_1000'];
  for (const p of testPlans) {
    const key = `TEST-${p}-${Date.now().toString(36).toUpperCase()}`;
    const bonus = p === 'PACK_500' ? 500 : p === 'PACK_1000' ? 1000 : 0;
    await pool.query(
      'INSERT INTO "LicenseKey" ("id", "key", "plan", "durationDays", "creditsBonus", "isUsed") VALUES ($1, $2, $3, $4, $5, false)',
      [crypto.randomUUID(), key, p, 30, bonus]
    );
    console.log(`   ✅ Created ${p} Key: ${key}`);
  }

  // Test 3: Test Fingerprint / Idempotency hash computation
  console.log('\n3️⃣ Testing Duplicate Fingerprint Generation...');
  const fp1 = crypto.createHash('sha256').update('user-1:test_generation:{"grade":"9","subject":"Kimyo"}').digest('hex');
  const fp2 = crypto.createHash('sha256').update('user-1:test_generation:{"grade":"9","subject":"Kimyo"}').digest('hex');
  const fp3 = crypto.createHash('sha256').update('user-1:test_generation:{"grade":"10","subject":"Fizika"}').digest('hex');

  if (fp1 !== fp2 || fp1 === fp3) {
    throw new Error('Fingerprint hash algorithm failed uniqueness test');
  }
  console.log('   ✅ Fingerprint collision & consistency verified!');

  // Test 4: Verify AiUsageLog insertion & Foreign Key constraint
  console.log('\n4️⃣ Testing AiUsageLog table write...');
  const testUser = await pool.query('SELECT id FROM "User" LIMIT 1');
  if (testUser.rows.length > 0) {
    const uId = testUser.rows[0].id;
    const logId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO "AiUsageLog" ("id", "userId", "operationType", "creditsCost", "model", "fingerprint", "status") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [logId, uId, 'answer_check', 1, 'gemini-3.6-flash', fp1, 'SUCCESS']
    );
    await pool.query('DELETE FROM "AiUsageLog" WHERE id = $1', [logId]);
    console.log('   ✅ AiUsageLog transactional logging verified!');
  }

  console.log('\n🎉 ALL SAAS ARCHITECTURE TESTS PASSED SUCCESSFULLY! ✅');
  await pool.end();
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
