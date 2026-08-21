/**
 * Sliding Window Rate Limiter & Brute-Force Protection
 * In-memory thread-safe rate limiter for serverless & edge-friendly protection
 */

interface RateLimitRecord {
  attempts: number[];
  lockoutUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale records periodically (every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Remove records older than 30 minutes
      const hasRecentAttempts = record.attempts.some(t => now - t < 30 * 60 * 1000);
      const isLocked = record.lockoutUntil && record.lockoutUntil > now;
      if (!hasRecentAttempts && !isLocked) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSec: number;
  lockoutActive: boolean;
}

/**
 * Checks whether the current request is allowed under rate limits
 * @param key Unique identifier (IP address, username, or composite)
 * @param maxAttempts Maximum allowed failed attempts before lockout (default: 5)
 * @param windowMs Time window in milliseconds (default: 10 mins)
 * @param lockoutDurationMs Duration of temporary lockout upon exceeding limit (default: 15 mins)
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 10 * 60 * 1000,
  lockoutDurationMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { attempts: [] };
    rateLimitStore.set(key, record);
  }

  // Check active lockout
  if (record.lockoutUntil && record.lockoutUntil > now) {
    const retryAfterSec = Math.ceil((record.lockoutUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSec,
      lockoutActive: true
    };
  }

  // Filter attempts within the sliding window
  record.attempts = record.attempts.filter(t => now - t < windowMs);

  if (record.attempts.length >= maxAttempts) {
    // Initiate lockout
    record.lockoutUntil = now + lockoutDurationMs;
    const retryAfterSec = Math.ceil(lockoutDurationMs / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSec,
      lockoutActive: true
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - record.attempts.length),
    retryAfterSec: 0,
    lockoutActive: false
  };
}

/**
 * Records a failed attempt for the given key
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts = 5,
  windowMs = 10 * 60 * 1000,
  lockoutDurationMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { attempts: [] };
    rateLimitStore.set(key, record);
  }

  record.attempts.push(now);
  record.attempts = record.attempts.filter(t => now - t < windowMs);

  if (record.attempts.length >= maxAttempts) {
    record.lockoutUntil = now + lockoutDurationMs;
    const retryAfterSec = Math.ceil(lockoutDurationMs / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSec,
      lockoutActive: true
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - record.attempts.length),
    retryAfterSec: 0,
    lockoutActive: false
  };
}

/**
 * Resets rate limit records on successful authentication
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
