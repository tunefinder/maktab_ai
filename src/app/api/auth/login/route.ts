import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { verifyPassword, createSessionToken, setAuthCookie } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, identifier, password } = body;
    const loginId = (username || identifier || '').trim();

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "Foydalanuvchi nomi (username) va parol kiritilishi shart" },
        { status: 400 }
      );
    }

    // Search by username, phone, or email
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

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Kiritilgan parol noto'g'ri" },
        { status: 400 }
      );
    }

    // Create session token and set cookie
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
