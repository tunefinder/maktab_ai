const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function migrateSaaS() {
  console.log('⚡ Applying SaaS database schema migration to Supabase...');

  const sql = `
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usedLessons" INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "usedAiCredits" INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bonusCredits" INTEGER NOT NULL DEFAULT 0;

    ALTER TABLE "LicenseKey" ADD COLUMN IF NOT EXISTS "creditsBonus" INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS "AiUsageLog" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "operationType" TEXT NOT NULL,
      "creditsCost" INTEGER NOT NULL,
      "model" TEXT,
      "fingerprint" TEXT,
      "status" TEXT NOT NULL DEFAULT 'SUCCESS',
      "errorMessage" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "AiUsageLog_userId_createdAt_idx" ON "AiUsageLog" ("userId", "createdAt");
    CREATE INDEX IF NOT EXISTS "AiUsageLog_fingerprint_idx" ON "AiUsageLog" ("fingerprint");

    CREATE TABLE IF NOT EXISTS "SystemConfig" (
      "id" TEXT PRIMARY KEY DEFAULT 'global',
      "isAiDisabledGlobally" BOOLEAN NOT NULL DEFAULT false,
      "aiCostPerCreditUzs" DOUBLE PRECISION NOT NULL DEFAULT 24,
      "paymentCard" TEXT NOT NULL DEFAULT '9860 1666 5511 7843',
      "paymentCardHolder" TEXT NOT NULL DEFAULT 'Samar Dasturchi',
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO "SystemConfig" ("id", "isAiDisabledGlobally", "aiCostPerCreditUzs", "paymentCard", "paymentCardHolder", "updatedAt")
    VALUES ('global', false, 24, '9860 1666 5511 7843', 'Samar Dasturchi', NOW())
    ON CONFLICT ("id") DO NOTHING;
  `;

  await pool.query(sql);
  console.log('✅ SaaS Migration successfully applied to Supabase PostgreSQL!');
  await pool.end();
}

migrateSaaS().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
