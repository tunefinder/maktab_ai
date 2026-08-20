import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  initializedPragmas?: boolean;
};

let dbUrl = process.env.DATABASE_URL || 'file:dev.db';

// On Vercel serverless environment, local SQLite must live in the writable /tmp directory
if (process.env.VERCEL && dbUrl.startsWith('file:')) {
  const tmpDbPath = '/tmp/dev.db';
  if (!fs.existsSync(tmpDbPath)) {
    const localDbPath = path.join(process.cwd(), 'dev.db');
    if (fs.existsSync(localDbPath)) {
      try {
        fs.copyFileSync(localDbPath, tmpDbPath);
      } catch (e) {
        console.warn("Could not copy dev.db to /tmp:", e);
      }
    }
  }
  dbUrl = `file:${tmpDbPath}`;
}

const adapter = new PrismaLibSql({
  url: dbUrl,
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Auto-create all tables and apply PRAGMA optimizations if database is fresh
if (!globalForPrisma.initializedPragmas) {
  globalForPrisma.initializedPragmas = true;

  const initDb = async () => {
    try {
      // 1. Ensure SQLite Pragmas
      await db.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`);
      await db.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`);
      await db.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);

      // 2. Ensure all tables exist (Self-healing schema for Vercel Serverless)
      await db.$executeRawUnsafe(`
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
          "planExpiresAt" DATETIME,
          "usedNotebooks" INTEGER NOT NULL DEFAULT 0,
          "usedTests" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "LicenseKey" (
          "id" TEXT PRIMARY KEY,
          "key" TEXT NOT NULL UNIQUE,
          "plan" TEXT NOT NULL,
          "durationDays" INTEGER NOT NULL DEFAULT 30,
          "isUsed" BOOLEAN NOT NULL DEFAULT 0,
          "usedByUserId" TEXT,
          "usedAt" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Class" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT,
          "name" TEXT NOT NULL,
          "academicYear" TEXT,
          "description" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Student" (
          "id" TEXT PRIMARY KEY,
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          "classId" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Test" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT,
          "classId" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "questionCount" INTEGER NOT NULL,
          "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "answerKey" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
          FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TestVariant" (
          "id" TEXT PRIMARY KEY,
          "testId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "answerKey" TEXT NOT NULL,
          FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TestAttempt" (
          "id" TEXT PRIMARY KEY,
          "testId" TEXT NOT NULL,
          "studentId" TEXT NOT NULL,
          "variant" TEXT,
          "score" REAL NOT NULL,
          "percentage" REAL NOT NULL,
          "correctCount" INTEGER NOT NULL,
          "incorrectCount" INTEGER NOT NULL,
          "unansweredCount" INTEGER NOT NULL,
          "imageUrl" TEXT,
          "needsReview" BOOLEAN NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE,
          FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "StudentAnswer" (
          "id" TEXT PRIMARY KEY,
          "attemptId" TEXT NOT NULL,
          "questionNumber" INTEGER NOT NULL,
          "studentAnswer" TEXT,
          "correctAnswer" TEXT,
          "isCorrect" BOOLEAN NOT NULL,
          "confidence" REAL NOT NULL,
          "isUncertain" BOOLEAN NOT NULL DEFAULT 0,
          FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE
        );
      `);

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Report" (
          "id" TEXT PRIMARY KEY,
          "testId" TEXT NOT NULL,
          "classId" TEXT NOT NULL,
          "averageScore" REAL NOT NULL,
          "highestScore" REAL NOT NULL,
          "lowestScore" REAL NOT NULL,
          "aiSummary" TEXT,
          "aiRecommendation" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE,
          FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE
        );
      `);
    } catch (err: any) {
      console.warn("DB Initialization note:", err?.message || err);
    }
  };

  initDb();
}
