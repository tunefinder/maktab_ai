import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  initializedPragmas?: boolean;
};

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:dev.db',
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Apply high-performance SQLite PRAGMA tuning once on initialization
if (!globalForPrisma.initializedPragmas) {
  globalForPrisma.initializedPragmas = true;
  Promise.all([
    db.$executeRawUnsafe(`PRAGMA journal_mode = WAL;`),
    db.$executeRawUnsafe(`PRAGMA synchronous = NORMAL;`),
    db.$executeRawUnsafe(`PRAGMA cache_size = 10000;`),
    db.$executeRawUnsafe(`PRAGMA temp_store = MEMORY;`)
  ]).catch((err) => {
    // Non-blocking fallback
    console.warn("SQLite Pragma tuning note:", err?.message || err);
  });
}
