const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.hugppvjleywulgpuzaee:293458%40Samar18@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Connecting to Supabase PostgreSQL...');
  
  const ddl = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "username" TEXT,
      "name" TEXT NOT NULL,
      "email" TEXT UNIQUE,
      "phone" TEXT UNIQUE,
      "telegramId" TEXT UNIQUE,
      "subject" TEXT,
      "school" TEXT,
      "avatarUrl" TEXT,
      "passwordHash" TEXT,
      "role" TEXT NOT NULL DEFAULT 'TEACHER',
      "plan" TEXT NOT NULL DEFAULT 'FREE',
      "planExpiresAt" TIMESTAMP(3),
      "usedNotebooks" INTEGER NOT NULL DEFAULT 0,
      "usedTests" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "LicenseKey" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "plan" TEXT NOT NULL,
      "durationDays" INTEGER NOT NULL DEFAULT 30,
      "isUsed" BOOLEAN NOT NULL DEFAULT false,
      "usedByUserId" TEXT,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Class" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT,
      "name" TEXT NOT NULL,
      "academicYear" TEXT,
      "description" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Class_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Student" (
      "id" TEXT PRIMARY KEY,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "classId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Test" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT,
      "classId" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "questionCount" INTEGER NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "answerKey" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Test_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Test_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "TestVariant" (
      "id" TEXT PRIMARY KEY,
      "testId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "answerKey" TEXT NOT NULL,
      CONSTRAINT "TestVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "TestAttempt" (
      "id" TEXT PRIMARY KEY,
      "testId" TEXT NOT NULL,
      "studentId" TEXT NOT NULL,
      "variant" TEXT,
      "score" DOUBLE PRECISION NOT NULL,
      "percentage" DOUBLE PRECISION NOT NULL,
      "correctCount" INTEGER NOT NULL,
      "incorrectCount" INTEGER NOT NULL,
      "unansweredCount" INTEGER NOT NULL,
      "imageUrl" TEXT,
      "needsReview" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "TestAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "StudentAnswer" (
      "id" TEXT PRIMARY KEY,
      "attemptId" TEXT NOT NULL,
      "questionNumber" INTEGER NOT NULL,
      "studentAnswer" TEXT,
      "correctAnswer" TEXT,
      "isCorrect" BOOLEAN NOT NULL,
      "confidence" DOUBLE PRECISION NOT NULL,
      "isUncertain" BOOLEAN NOT NULL DEFAULT false,
      CONSTRAINT "StudentAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Report" (
      "id" TEXT PRIMARY KEY,
      "testId" TEXT NOT NULL,
      "classId" TEXT NOT NULL,
      "averageScore" DOUBLE PRECISION NOT NULL,
      "highestScore" DOUBLE PRECISION NOT NULL,
      "lowestScore" DOUBLE PRECISION NOT NULL,
      "aiSummary" TEXT,
      "aiRecommendation" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Report_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Report_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  await pool.query(ddl);
  console.log('✅ ALL SUPABASE POSTGRESQL TABLES CREATED SUCCESSFULLY!');

  // Seed default license keys
  const keys = [
    { id: 'key_pro_1', key: 'PRO-USTOZ-2026', plan: 'PRO', durationDays: 30 },
    { id: 'key_pro_2', key: 'PRO-8899-7711', plan: 'PRO', durationDays: 30 },
    { id: 'key_vip_1', key: 'VIP-MAKTAB-2026', plan: 'VIP', durationDays: 365 },
    { id: 'key_demo_1', key: 'NOVDAPRO-DEMO', plan: 'PRO', durationDays: 30 }
  ];

  for (const k of keys) {
    await pool.query(
      `INSERT INTO "LicenseKey" ("id", "key", "plan", "durationDays", "isUsed") 
       VALUES ($1, $2, $3, $4, false) 
       ON CONFLICT ("key") DO NOTHING`,
      [k.id, k.key, k.plan, k.durationDays]
    );
  }
  console.log('✅ SEED LICENSE KEYS CREATED ON SUPABASE!');

  await pool.end();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  pool.end();
});
