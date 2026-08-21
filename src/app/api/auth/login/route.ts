import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { 
  verifyPasswordWithRehash, 
  hashPassword, 
  createSessionToken, 
  setAuthCookie 
} from '@/utils/auth';
import { 
  checkRateLimit, 
  recordFailedAttempt, 
  clearRateLimit, 
  getClientIp 
} from '@/utils/rateLimit';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const body = await req.json();
    const { username, identifier, password } = body;
    const loginId = (username || identifier || '').trim();

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "Foydalanuvchi nomi (username) va parol kiritilishi shart" },
        { status: 400 }
      );
    }

    // 1. Check Rate Limit (IP-based and Identifier-based)
    const rateLimitKey = `login:${clientIp}:${loginId.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      const minutesLeft = Math.ceil(rateCheck.retryAfterSec / 60);
      return NextResponse.json(
        { 
          error: `Ko'p xato urinishlar aniqlandi! Xavfsizlik yuzasidan tizim ${minutesLeft} daqiqaga vaqtincha bloklandi. Iltimos, keyinroq qayta urinib ko'ring.`,
          retryAfterSec: rateCheck.retryAfterSec,
          locked: true
        },
        { status: 429 }
      );
    }

    // 2. Search by username, phone, or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: loginId.toLowerCase() },
          { username: loginId },
          { phone: loginId },
          { email: loginId.toLowerCase() }
        ]
      }
    });

    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { 
          notFound: true,
          error: "Bunday foydalanuvchi topilmadi. Yangi hisob ochish uchun parolni 2 marta kiriting." 
        },
        { status: 404 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Ushbu hisob Google yoki Telegram orqali ochilgan. Iltimos, o'sha usulda kiring." },
        { status: 400 }
      );
    }

    // 3. Password verification & automatic security hash upgrade
    const verification = verifyPasswordWithRehash(password, user.passwordHash);
    
    if (!verification.isValid) {
      const failedRecord = recordFailedAttempt(rateLimitKey);
      const remainingMsg = failedRecord.remainingAttempts > 0 
        ? ` (${failedRecord.remainingAttempts} ta urinish qoldi)` 
        : "";

      return NextResponse.json(
        { error: `Kiritilgan parol noto'g'ri${remainingMsg}` },
        { status: 400 }
      );
    }

    // 4. Auto-upgrade legacy hash to PBKDF2 100,000 iterations v2
    if (verification.needsRehash) {
      try {
        const upgradedHash = hashPassword(password);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: upgradedHash }
        });
      } catch (rehashErr) {
        console.warn("Failed to auto-upgrade password hash:", rehashErr);
      }
    }

    // 5. Successful login -> Clear rate limits
    clearRateLimit(rateLimitKey);

    // 6. Create session token and set cookie
    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt ? user.planExpiresAt.toISOString() : null
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        subject: user.subject,
        school: user.school,
        role: user.role,
        plan: user.plan
      }
    });

    response.headers.set('Set-Cookie', setAuthCookie(token));
    return response;

  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Kirishda xatolik yuz berdi" }, { status: 500 });
  }
}
