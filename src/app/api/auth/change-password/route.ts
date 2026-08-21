import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser, verifyPassword, hashPassword, createSessionToken, setAuthCookie } from '@/utils/auth';
import { checkRateLimit, recordFailedAttempt, clearRateLimit, getClientIp } from '@/utils/rateLimit';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const clientIp = getClientIp(req);
    const rateKey = `change_pwd:${user.id}:${clientIp}`;
    const rateCheck = checkRateLimit(rateKey, 5, 15 * 60 * 1000, 30 * 60 * 1000);

    if (!rateCheck.allowed) {
      const mins = Math.ceil(rateCheck.retryAfterSec / 60);
      return NextResponse.json(
        { error: `Ko'p noto'g'ri urinishlar tufayli bu amal ${mins} daqiqaga to'xtatildi.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Hozirgi parol va yangi parol kiritilishi shart" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      );
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { error: "Yangi parol va tasdiqlash paroli bir xil emas" },
        { status: 400 }
      );
    }

    // Retrieve user's actual passwordHash from DB
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, name: true, role: true, plan: true, passwordHash: true }
    });

    if (!dbUser || !dbUser.passwordHash) {
      return NextResponse.json(
        { error: "Ushbu hisobda parol o'rnatilmagan yoki Google/Telegram orqali kirilgan." },
        { status: 400 }
      );
    }

    const isCurrentValid = verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentValid) {
      recordFailedAttempt(rateKey);
      return NextResponse.json(
        { error: "Hozirgi parolingiz noto'g'ri kiritildi" },
        { status: 400 }
      );
    }

    // Hash new password with 100,000 iterations
    const newHash = hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    clearRateLimit(rateKey);

    // Issue refreshed session token
    const token = createSessionToken({
      userId: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      role: dbUser.role,
      plan: dbUser.plan
    });

    const response = NextResponse.json({
      success: true,
      message: "Parolingiz muvaffaqiyatli yangilandi! 🔒"
    });

    response.headers.set('Set-Cookie', setAuthCookie(token));
    return response;

  } catch (error) {
    console.error("Change Password API error:", error);
    return NextResponse.json({ error: "Parolni o'zgartirishda xatolik yuz berdi" }, { status: 500 });
  }
}
