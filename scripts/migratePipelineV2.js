const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🚀 Running Next-Gen Pipeline PostgreSQL Migration...');

  // 1. Extend AiUsageLog with telemetry columns
  await pool.query(`
    ALTER TABLE "AiUsageLog"
      ADD COLUMN IF NOT EXISTS "inputTokens" INTEGER,
      ADD COLUMN IF NOT EXISTS "outputTokens" INTEGER,
      ADD COLUMN IF NOT EXISTS "thinkingTokens" INTEGER,
      ADD COLUMN IF NOT EXISTS "totalTokens" INTEGER,
      ADD COLUMN IF NOT EXISTS "requestCount" INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "fallbackUsed" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "durationMs" INTEGER,
      ADD COLUMN IF NOT EXISTS "imageCount" INTEGER,
      ADD COLUMN IF NOT EXISTS "estimatedCostUsd" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "estimatedCostUzs" DOUBLE PRECISION;
  `);
  console.log('   ✅ AiUsageLog telemetry columns added.');

  // 2. Create AiResponseCache table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AiResponseCache" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "fingerprint" TEXT NOT NULL UNIQUE,
      "response" JSONB NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "AiResponseCache_expiresAt_idx" ON "AiResponseCache"("expiresAt");
    CREATE INDEX IF NOT EXISTS "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");
  `);
  console.log('   ✅ AiResponseCache table created.');

  await pool.end();
  console.log('🎉 Migration completed successfully!');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
