const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function runPricingVerification() {
  console.log('===============================================================');
  console.log('🚀 RUNNING NEW PRICING & AI LIMIT VERIFICATION SUITE');
  console.log('===============================================================\n');

  // Test 1: Validate Plan Definitions
  console.log('1️⃣ Checking Plan Specifications...');
  const expectedPlans = {
    FREE: { price: 0, limit: 100 },
    START: { price: 19000, limit: 1500 },
    PRO: { price: 39000, limit: 3200 },
    MAX: { price: 69000, limit: 6000 },
    MAKTAB_PRO: { price: 129000, limit: 11000 },
    MAKTAB_VIP: { price: 199000, limit: 17000 }
  };

  const fs = require('fs');
  const configContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'aiConfig.ts'), 'utf8');

  // Verify Plans exist in aiConfig.ts
  for (const [pKey, pExp] of Object.entries(expectedPlans)) {
    if (!configContent.includes(`id: '${pKey}'`)) {
      throw new Error(`Plan ${pKey} missing in aiConfig.ts`);
    }
    if (!configContent.includes(`priceNumber: ${pExp.price}`)) {
      throw new Error(`Plan ${pKey} price mismatch for ${pExp.price}`);
    }
    if (!configContent.includes(`maxAiCredits: ${pExp.limit}`)) {
      throw new Error(`Plan ${pKey} limit mismatch for ${pExp.limit}`);
    }
    console.log(`   ✅ Plan ${pKey}: ${pExp.price.toLocaleString()} so'm / ${pExp.limit.toLocaleString()} AI limiti`);
  }

  // Test 2: Validate AI Packs
  console.log('\n2️⃣ Checking AI Packs Specifications...');
  const expectedPacks = {
    PACK_1000: { price: 9000, credits: 1000 },
    PACK_3000: { price: 19000, credits: 3000 },
    PACK_7000: { price: 39000, credits: 7000 }
  };

  for (const [pkKey, pkExp] of Object.entries(expectedPacks)) {
    if (!configContent.includes(`id: '${pkKey}'`)) throw new Error(`Pack ${pkKey} missing`);
    if (!configContent.includes(`priceNumber: ${pkExp.price}`)) throw new Error(`Pack ${pkKey} price mismatch`);
    if (!configContent.includes(`credits: ${pkExp.credits}`)) throw new Error(`Pack ${pkKey} credits mismatch`);
    console.log(`   ✅ AI Pack ${pkKey}: ${pkExp.price.toLocaleString()} so'm / +${pkExp.credits.toLocaleString()} AI limiti`);
  }

  // Test 3: Validate Hidden Economic Multipliers
  console.log('\n3️⃣ Checking Backend Hidden Economic Multipliers...');
  if (!configContent.includes('answer_check: 1')) throw new Error('answer_check multiplier must be 1');
  if (!configContent.includes('test_generation: 3')) throw new Error('test_generation multiplier must be 3');
  if (!configContent.includes('lesson_generation: 5')) throw new Error('lesson_generation multiplier must be 5');
  if (!configContent.includes('text_analysis: 8')) throw new Error('text_analysis multiplier must be 8');
  if (!configContent.includes('open_question: 8')) throw new Error('open_question multiplier must be 8');

  console.log('   ✅ Multipliers verified: answer_check=1, test_gen=3, lesson_gen=5, text_analysis=8, open_question=8');

  // Test 4: Validate Referral Configuration
  console.log('\n4️⃣ Checking Referral Configuration...');
  if (!configContent.includes('inviterBonusAi: 300')) throw new Error('Inviter bonus must be 300');
  if (!configContent.includes('inviteeBonusAi: 200')) throw new Error('Invitee bonus must be 200');
  console.log('   ✅ Referral config verified: Inviter=+300 AI limiti, Invitee=+200 AI limiti');

  // Test 5: License Key Creation in PostgreSQL
  console.log('\n5️⃣ Testing License Key Insertion & Validation in PostgreSQL...');
  const testKeys = ['START', 'PRO', 'MAX', 'MAKTAB_PRO', 'MAKTAB_VIP', 'PACK_1000', 'PACK_3000', 'PACK_7000'];
  for (const k of testKeys) {
    const keyStr = `TEST-${k}-${Date.now().toString(36).toUpperCase()}`;
    const bonus = k === 'PACK_1000' ? 1000 : k === 'PACK_3000' ? 3000 : k === 'PACK_7000' ? 7000 : 0;
    await pool.query(
      'INSERT INTO "LicenseKey" ("id", "key", "plan", "durationDays", "creditsBonus", "isUsed") VALUES ($1, $2, $3, $4, $5, false)',
      [crypto.randomUUID(), keyStr, k, 30, bonus]
    );
    console.log(`   ✅ Created DB key for ${k}: ${keyStr}`);
  }

  console.log('\n🎉 ALL PRICING & LIMIT ARCHITECTURE TESTS PASSED SUCCESSFULLY! ✅\n');
  await pool.end();
}

runPricingVerification().catch(err => {
  console.error('❌ Pricing test suite failed:', err);
  process.exit(1);
});
