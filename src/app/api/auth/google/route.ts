import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { createSessionToken, COOKIE_NAME } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, avatarUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Google email taqdim etilmadi" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          name: name?.trim() || "Google Foydalanuvchisi",
          email: cleanEmail,
          avatarUrl: avatarUrl || null,
          role: "TEACHER"
        }
      });
    } else if (avatarUrl && !user.avatarUrl) {
      user = await db.user.update({
        where: { id: user.id },
        data: { avatarUrl }
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
    console.error("Google Auth error:", error);
    return NextResponse.json({ error: "Google orqali kirishda xatolik" }, { status: 500 });
  }
}
