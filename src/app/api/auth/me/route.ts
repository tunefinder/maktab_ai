import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/auth';
import { db } from '@/utils/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user: user || null });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json({ user: null });
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const body = await req.json();
    const { name, subject, school, phone, email } = body;

    const updated = await db.user.update({
      where: { id: currentUser.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(subject !== undefined ? { subject: subject?.trim() || null } : {}),
        ...(school !== undefined ? { school: school?.trim() || null } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(email !== undefined ? { email: email?.trim().toLowerCase() || null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegramId: true,
        subject: true,
        school: true,
        avatarUrl: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("PUT /api/auth/me error:", error);
    return NextResponse.json({ error: "Profilni yangilashda xatolik" }, { status: 500 });
  }
}
