import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from './db';
import { getCurrentUser } from './auth';
import { AI_CREDIT_COSTS, getPlanDetails } from './aiConfig';

// In-memory sliding window rate limiter: userId -> Array of timestamps
const rateLimitMap = new Map<string, number[]>();

// In-memory idempotency cache: fingerprint -> { result: any, expiresAt: number }
const idempotencyCache = new Map<string, { result: any; expiresAt: number }>();

// Cleanup stale cache periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of idempotencyCache.entries()) {
      if (val.expiresAt < now) {
        idempotencyCache.delete(key);
      }
    }
  }, 300000);
}

export interface AiGuardOptions {
  operationType: 'answer_check' | 'test_generation' | 'lesson_generation' | 'text_analysis' | 'report_generation';
  unitsMultiplier?: number; // e.g. number of images / answer sheets for answer_check
  fingerprintPayload?: any; // object/string used to compute SHA-256 idempotency hash
  modelName?: string;
}

export interface AiGuardContext {
  userId: string;
  userPlan: string;
  creditsCost: number;
  remainingCredits: number;
  fingerprint?: string;
  commitCredits: () => Promise<void>;
  logFailure: (errorMsg: string) => Promise<void>;
}

export function generateFingerprint(userId: string, operationType: string, payload: any): string {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
  return crypto.createHash('sha256').update(`${userId}:${operationType}:${serialized}`).digest('hex');
}

/**
 * Check rate limit for a user.
 * Limit: 12 requests / 60 seconds (burst allowance)
 */
export function checkRateLimit(userId: string, limit = 12, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(userId, validTimestamps);
  return true;
}

/**
 * Check if global emergency kill-switch is active.
 */
export async function isAiGloballyDisabled(): Promise<boolean> {
  if (process.env.DISABLE_AI_GLOBALLY === 'true') {
    return true;
  }
  try {
    const config = await db.systemConfig.findUnique({
      where: { id: 'global' }
    });
    return config?.isAiDisabledGlobally || false;
  } catch {
    return false;
  }
}

/**
 * Pre-flight guard for AI operations: verifies auth, subscription, global switch, rate limit, and atomic credits.
 */
export async function guardAiOperation(options: AiGuardOptions): Promise<
  | { success: true; context: AiGuardContext; cachedResult?: any }
  | { success: false; response: Response }
> {
  // 1. Authentication
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Avtorizatsiyadan o'tilmagan. Iltimos, tizimga kiring." }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  // 2. Global AI Emergency Switch
  if (await isAiGloballyDisabled()) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: "Sun'iy intellekt xizmatida vaqtinchalik texnik profilaktika ketmoqda. Iltimos, bir ozdan so'ng qayta urinib ko'ring."
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  // 3. Rate Limiting
  if (!checkRateLimit(user.id)) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: "Juda ko'p so'rov yuborildi. Iltimos, 1 daqiqa kutib qayta urinib ko'ring (Rate Limit)."
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  // 4. Idempotency Check (Duplicate request prevention)
  let fingerprint: string | undefined;
  if (options.fingerprintPayload) {
    fingerprint = generateFingerprint(user.id, options.operationType, options.fingerprintPayload);
    const cached = idempotencyCache.get(fingerprint);
    if (cached && cached.expiresAt > Date.now()) {
      // Return cached result without re-charging credits
      return {
        success: true,
        cachedResult: cached.result,
        context: {
          userId: user.id,
          userPlan: user.plan || 'FREE',
          creditsCost: 0,
          remainingCredits: 0,
          fingerprint,
          commitCredits: async () => {},
          logFailure: async () => {}
        }
      };
    }
  }

  // 5. Database lookup & Subscription Status Check
  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: "Foydalanuvchi ma'lumotlari topilmadi." }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  const userPlan = dbUser.plan || 'FREE';
  const planDetails = getPlanDetails(userPlan);

  // Check subscription expiration
  if (dbUser.planExpiresAt && userPlan !== 'FREE') {
    const isExpired = new Date() > dbUser.planExpiresAt;
    if (isExpired) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: `Sizning "${planDetails.name}" obuna muddatingiz tugagan. Xizmatdan foydalanishni davom ettirish uchun obunani yangilang.`,
            isExpired: true
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      };
    }
  }

  // 6. Calculate required credits
  const baseCost = AI_CREDIT_COSTS[options.operationType] || 1;
  const multiplier = Math.max(1, options.unitsMultiplier || 1);
  const totalCost = baseCost * multiplier;

  const maxPlanCredits = planDetails.maxAiCredits;
  const bonusCredits = dbUser.bonusCredits || 0;
  const usedAiCredits = dbUser.usedAiCredits || dbUser.usedNotebooks || 0;
  const totalAvailableCredits = maxPlanCredits + bonusCredits;
  const remainingCredits = Math.max(0, totalAvailableCredits - usedAiCredits);

  if (remainingCredits < totalCost) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: `Sizda yetarli AI tekshirish krediti mavjud emas! (Kerak: ${totalCost} ta, Qoldiq: ${remainingCredits} ta). Qo'shimcha AI Pack sotib oling yoki tarifingizni oshiring.`,
          requiredCredits: totalCost,
          remainingCredits,
          plan: userPlan
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  // 7. Context object with atomic commit and failure logging
  const context: AiGuardContext = {
    userId: dbUser.id,
    userPlan,
    creditsCost: totalCost,
    remainingCredits: remainingCredits - totalCost,
    fingerprint,
    commitCredits: async () => {
      // Atomic increment in DB
      await db.user.update({
        where: { id: dbUser.id },
        data: {
          usedAiCredits: { increment: totalCost },
          usedNotebooks: { increment: totalCost } // sync legacy counter
        }
      });

      // Log success in AiUsageLog
      await db.aiUsageLog.create({
        data: {
          userId: dbUser.id,
          operationType: options.operationType,
          creditsCost: totalCost,
          model: options.modelName || 'gemini-3.6-flash',
          fingerprint: fingerprint || null,
          status: 'SUCCESS'
        }
      });
    },
    logFailure: async (errorMsg: string) => {
      await db.aiUsageLog.create({
        data: {
          userId: dbUser.id,
          operationType: options.operationType,
          creditsCost: 0,
          model: options.modelName || 'gemini-3.6-flash',
          fingerprint: fingerprint || null,
          status: 'FAILED',
          errorMessage: errorMsg.slice(0, 500)
        }
      });
    }
  };

  return { success: true, context };
}

/**
 * Saves a completed result to the idempotency cache for 60 seconds.
 */
export function cacheAiResult(fingerprint: string | undefined, result: any, ttlSeconds = 60): void {
  if (!fingerprint) return;
  idempotencyCache.set(fingerprint, {
    result,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}
