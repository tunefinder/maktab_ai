import { db } from './db';

// Seed initial default license keys if not in database (Server-only)
export async function seedInitialKeys() {
  try {
    const keys = [
      { key: 'PRO-USTOZ-2026', plan: 'PRO', durationDays: 30 },
      { key: 'PRO-8899-7711', plan: 'PRO', durationDays: 30 },
      { key: 'VIP-MAKTAB-2026', plan: 'VIP', durationDays: 365 },
      { key: 'NOVDAPRO-DEMO', plan: 'PRO', durationDays: 30 }
    ];

    for (const k of keys) {
      const existing = await db.licenseKey.findUnique({ where: { key: k.key } });
      if (!existing) {
        await db.licenseKey.create({
          data: {
            key: k.key,
            plan: k.plan,
            durationDays: k.durationDays,
            isUsed: false
          }
        });
      }
    }
  } catch (err) {
    console.error("seedInitialKeys error:", err);
  }
}
