import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from './db';
import { getCurrentUser } from './auth';
import { AI_CREDIT_COSTS, getPlanDetails, calculateTokenCost } from './aiConfig';

// In-memory sliding window rate limiter: userId -> Array of timestamps
const rateLimitMap = new Map<string, number[]>();

// In-memory hot cache for instant sub-millisecond deduplication: fingerprint -> { result: any, expiresAt: number }
const memoryIdempotencyCache = new Map<string, { result: any; expiresAt: number }>();

// Cleanup stale memory cache periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of memoryIdempotencyCache.entries()) {
      if (val.expiresAt < now) {
        memoryIdempotencyCache.delete(key);
      }
    }
  }, 300000);
}

export interface AiTelemetryData {
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  totalTokens?: number;
  durationMs?: number;
  fallbackUsed?: boolean;
  imageCount?: number;
  modelName?: string;
}

export interface AiGuardOptions {
  operationType: 'answer_check' | 'test_generation' | 'lesson_generation' | 'text_analysis' | 'report_generation';
  unitsMultiplier?: number; // e.g. number of images / answer sheets for answer_check
  fingerprintPayload?: any; // object/string or image list used to compute SHA-256 hash
  images?: Array<{ data: string; mimeType?: string }>;
  modelName?: string;
}

export interface AiGuardContext {
  userId: string;
  userPlan: string;
  creditsCost: number;
  remainingCredits: number;
  fingerprint?: string;
  commitCredits: (telemetry?: AiTelemetryData) => Promise<void>;
  logFailure: (errorMsg: string, telemetry?: AiTelemetryData) => Promise<void>;
}

/**
 * Generate robust SHA-256 fingerprint combining userId, operationType, testId, image content hashes, and pipeline version.
 */
export function generateRobustFingerprint(
  userId: string, 
  operationType: string, 
  payload: any, 
  images?: Array<{ data: string }>
): string {
  const hash = crypto.createHash('sha256');
  hash.update(`v2:${userId}:${operationType}`);

  if (payload) {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    hash.update(`:payload:${serialized}`);
  }

  if (images && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      const imgHash = crypto.createHash('sha256').update(images[i].data).digest('hex');
      hash.update(`:img[${i}]:${imgHash}`);
    }
  }

  return hash.digest('hex');
}

/**
 * Check rate limit for a user.
 * Limit: 20 requests / 60 seconds (burst allowance for batches)
 */
export function checkRateLimit(userId: string, limit = 20, windowMs = 60000): boolean {
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
 * Pre-flight guard for AI operations: verifies auth, subscription, global switch, rate limit, persistent cache, and atomic credits.
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

  // 4. SHA-256 Fingerprinting & Persistent Cache Check
  let fingerprint: string | undefined;
  if (options.fingerprintPayload || (options.images && options.images.length > 0)) {
    fingerprint = generateRobustFingerprint(user.id, options.operationType, options.fingerprintPayload, options.images);
    
    // Check Tier 1: Memory Cache
    const memCached = memoryIdempotencyCache.get(fingerprint);
    if (memCached && memCached.expiresAt > Date.now()) {
      return {
        success: true,
        cachedResult: memCached.result,
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

    // Check Tier 2: Persistent Database Cache
    try {
      const dbCached = await db.aiResponseCache.findUnique({
        where: { fingerprint }
      });
      if (dbCached && new Date(dbCached.expiresAt) > new Date()) {
        memoryIdempotencyCache.set(fingerprint, {
          result: dbCached.response,
          expiresAt: new Date(dbCached.expiresAt).getTime()
        });
        return {
          success: true,
          cachedResult: dbCached.response,
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
    } catch {
      // Non-blocking fallback
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
    commitCredits: async (telemetry?: AiTelemetryData) => {
      // Calculate token cost
      const model = telemetry?.modelName || options.modelName || 'gemini-2.5-flash-lite';
      const cost = calculateTokenCost(model, telemetry?.inputTokens || 0, telemetry?.outputTokens || 0);

      // Atomic increment in DB
      await db.user.update({
        where: { id: dbUser.id },
        data: {
          usedAiCredits: { increment: totalCost },
          usedNotebooks: { increment: totalCost } // sync legacy counter
        }
      });

      // Log success in AiUsageLog with comprehensive telemetry
      await db.aiUsageLog.create({
        data: {
          userId: dbUser.id,
          operationType: options.operationType,
          creditsCost: totalCost,
          model,
          fingerprint: fingerprint || null,
          status: 'SUCCESS',
          inputTokens: telemetry?.inputTokens || null,
          outputTokens: telemetry?.outputTokens || null,
          thinkingTokens: telemetry?.thinkingTokens || null,
          totalTokens: telemetry?.totalTokens || ((telemetry?.inputTokens || 0) + (telemetry?.outputTokens || 0)) || null,
          fallbackUsed: telemetry?.fallbackUsed || false,
          durationMs: telemetry?.durationMs || null,
          imageCount: telemetry?.imageCount || options.unitsMultiplier || 1,
          estimatedCostUsd: cost.costUsd,
          estimatedCostUzs: cost.costUzs
        }
      });
    },
    logFailure: async (errorMsg: string, telemetry?: AiTelemetryData) => {
      const model = telemetry?.modelName || options.modelName || 'gemini-2.5-flash-lite';
      await db.aiUsageLog.create({
        data: {
          userId: dbUser.id,
          operationType: options.operationType,
          creditsCost: 0,
          model,
          fingerprint: fingerprint || null,
          status: 'FAILED',
          errorMessage: errorMsg.slice(0, 500),
          durationMs: telemetry?.durationMs || null,
          imageCount: telemetry?.imageCount || options.unitsMultiplier || 1
        }
      });
    }
  };

  return { success: true, context };
}

/**
 * Saves a completed result to both memory and database cache for persistent multi-instance performance.
 */
export async function cacheAiResult(fingerprint: string | undefined, result: any, ttlSeconds = 120): Promise<void> {
  if (!fingerprint) return;

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // 1. Save in memory
  memoryIdempotencyCache.set(fingerprint, {
    result,
    expiresAt: expiresAt.getTime()
  });

  // 2. Save in database
  try {
    await db.aiResponseCache.upsert({
      where: { fingerprint },
      update: {
        response: result,
        expiresAt
      },
      create: {
        fingerprint,
        response: result,
        expiresAt
      }
    });
  } catch (err) {
    console.warn("Persistent cache upsert warning:", err);
  }
}
