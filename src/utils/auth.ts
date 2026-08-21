import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const AUTH_SECRET = process.env.AUTH_SECRET || 'novda_super_secret_auth_key_2026_education_ai';
const COOKIE_NAME = 'novda_session_token';
const DEFAULT_PBKDF2_ITERATIONS = 100000; // OWASP recommended high-security iteration standard

// 1. Password Hashing using PBKDF2 with 100,000 iterations and SHA-512
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, DEFAULT_PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return `v2:${DEFAULT_PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

export interface PasswordVerificationResult {
  isValid: boolean;
  needsRehash: boolean;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  return verifyPasswordWithRehash(password, storedHash).isValid;
}

export function verifyPasswordWithRehash(password: string, storedHash: string): PasswordVerificationResult {
  try {
    if (!storedHash || !password) return { isValid: false, needsRehash: false };

    // Format v2: "v2:iterations:salt:hash"
    if (storedHash.startsWith('v2:')) {
      const parts = storedHash.split(':');
      if (parts.length !== 4) return { isValid: false, needsRehash: false };

      const iterations = parseInt(parts[1], 10) || DEFAULT_PBKDF2_ITERATIONS;
      const salt = parts[2];
      const originalHash = parts[3];

      const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      const isValid = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
      const needsRehash = iterations < DEFAULT_PBKDF2_ITERATIONS;

      return { isValid, needsRehash };
    }

    // Format legacy: "salt:hash" (1,000 iterations)
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return { isValid: false, needsRehash: false };

    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));

    return {
      isValid,
      needsRehash: isValid // Legacy 1k hashes should be auto-rehashed to 100k
    };
  } catch {
    return { isValid: false, needsRehash: false };
  }
}

// 2. Tamper-Proof Session Token (HMAC SHA-256)
export interface SessionPayload {
  userId: string;
  username?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  plan?: string;
  planExpiresAt?: string | null;
  exp: number; // Expiration timestamp in ms
}

export function createSessionToken(payload: Omit<SessionPayload, 'exp'>, expiresInDays = 30): string {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const fullPayload: SessionPayload = { ...payload, exp };
  
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null; // Token expired

    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string, maxAgeDays = 30): string {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const secureFlag = isProd ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secureFlag}`;
}

export function clearAuthCookie(): string {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const secureFlag = isProd ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`;
}

// 3. Get Current Authenticated User from Request / Cookies
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session || !session.userId) return null;

    try {
      // Upsert user into DB so foreign keys in serverless lambdas never fail
      const user = await db.user.upsert({
        where: { id: session.userId },
        update: {},
        create: {
          id: session.userId,
          username: session.username || "ustoz",
          name: session.name || session.username || "Ustoz",
          email: session.email || null,
          phone: session.phone || null,
          role: session.role || "TEACHER",
          plan: session.plan || "FREE",
          planExpiresAt: session.planExpiresAt ? new Date(session.planExpiresAt) : null,
          subject: "Biologiya"
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          telegramId: true,
          subject: true,
          school: true,
          avatarUrl: true,
          role: true,
          plan: true,
          planExpiresAt: true,
          subscriptionStatus: true,
          usedNotebooks: true,
          usedTests: true,
          usedLessons: true,
          usedAiCredits: true,
          bonusCredits: true,
          createdAt: true
        }
      });

      if (user) return user;
    } catch (dbErr) {
      console.warn("DB upsert in getCurrentUser fallback to session payload:", dbErr);
    }

    // Fallback to cryptographic session payload
    return {
      id: session.userId,
      username: session.username || "ustoz",
      name: session.name || session.username || "Ustoz",
      email: session.email || null,
      phone: session.phone || null,
      telegramId: null,
      subject: "Biologiya",
      school: null,
      avatarUrl: null,
      role: session.role || "TEACHER",
      plan: session.plan || "FREE",
      planExpiresAt: session.planExpiresAt ? new Date(session.planExpiresAt) : null,
      subscriptionStatus: "ACTIVE",
      usedNotebooks: 0,
      usedTests: 0,
      usedLessons: 0,
      usedAiCredits: 0,
      bonusCredits: 0,
      createdAt: new Date()
    };
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

export { COOKIE_NAME };
