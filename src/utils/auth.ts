import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const AUTH_SECRET = process.env.AUTH_SECRET || 'novda_super_secret_auth_key_2026_education_ai';
const COOKIE_NAME = 'novda_session_token';

// 1. Password Hashing using PBKDF2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
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
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
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
          usedNotebooks: true,
          usedTests: true,
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
      usedNotebooks: 0,
      usedTests: 0,
      createdAt: new Date()
    };
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

export { COOKIE_NAME };
