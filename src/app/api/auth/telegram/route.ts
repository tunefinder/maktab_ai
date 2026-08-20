import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { createSessionToken, COOKIE_NAME } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, username, photo_url } = body;

    if (!id) {
      return NextResponse.json({ error: "Telegram ma'lumotlari to'liq emas" }, { status: 400 });
    }

    const telegramId = id.toString();
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || username || "Telegram O'qituvchi";

    let user = await db.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          name: fullName,
          telegramId,
          avatarUrl: photo_url || null,
          role: "TEACHER"
        }
      });
    } else if (photo_url && !user.avatarUrl) {
      user = await db.user.update({
        where: { id: user.id },
        data: { avatarUrl: photo_url }
      });
    }

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        telegramId: user.telegramId,
        subject: user.subject,
        school: user.school,
        avatarUrl: user.avatarUrl,
        role: user.role
      }
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error("Telegram Auth error:", error);
    return NextResponse.json({ error: "Telegram orqali kirishda xatolik" }, { status: 500 });
  }
}
