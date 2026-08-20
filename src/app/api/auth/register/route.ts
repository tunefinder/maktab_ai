import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { hashPassword, createSessionToken, setAuthCookie } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, identifier, password, confirmPassword, name, subject, school } = body;

    const cleanUsername = (username || identifier || '').trim().toLowerCase();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Foydalanuvchi nomi (username) kiritilishi shart" },
        { status: 400 }
      );
    }

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: "Parol kamida 4 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Kiritilgan ikki xil parol bir-biriga mos kelmadi. Qaytadan tekshirib kiriting." },
        { status: 400 }
      );
    }

    // Check if user with this username already exists
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { phone: cleanUsername },
          { email: cleanUsername }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ushbu nom bilan foydalanuvchi allaqachon mavjud. Iltimos, boshqa nom tanlang yoki tizimga kiring." },
        { status: 409 }
      );
    }

    // Create new user
    const passwordHash = hashPassword(password);
    const displayName = name?.trim() || cleanUsername;

    const newUser = await db.user.create({
      data: {
        username: cleanUsername,
        name: displayName,
        passwordHash,
        subject: subject?.trim() || "Biologiya",
        school: school?.trim() || null,
        plan: "FREE",
        role: "TEACHER"
      }
    });

    // Create session token and set cookie
    const token = createSessionToken({
      userId: newUser.id,
      role: newUser.role
    });

    const response = NextResponse.json({
      success: true,
      message: "Hisobingiz muvaffaqiyatli yaratildi va tizimga kirildi! 🎉",
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        subject: newUser.subject,
        school: newUser.school,
        role: newUser.role,
        plan: newUser.plan
      }
    });

    response.headers.set('Set-Cookie', setAuthCookie(token));
    return response;

  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "Ro'yxatdan o'tishda xatolik yuz berdi" }, { status: 500 });
  }
}
