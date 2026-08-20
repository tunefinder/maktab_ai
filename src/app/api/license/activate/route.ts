import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { seedInitialKeys } from '@/utils/licenseSeed';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    // Ensure seed keys exist
    await seedInitialKeys();

    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: "Iltimos, faollashtirish kalitini kiriting" }, { status: 400 });
    }

    const cleanKey = key.trim().toUpperCase();

    const license = await db.licenseKey.findUnique({
      where: { key: cleanKey }
    });

    if (!license) {
      return NextResponse.json(
        { error: "Kiritilgan kalit topilmadi. Iltimos, Telegram botdan to'g'ri kalit olganingizga ishonch hosil qiling." },
        { status: 404 }
      );
    }

    if (license.isUsed) {
      return NextResponse.json(
        { error: "Ushbu kalit allaqachon ishlatilgan! Yangi kalit olish uchun Telegram botga murojaat qiling." },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + license.durationDays);

    // Update user plan & mark license as used in a transaction
    const [updatedUser] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          plan: license.plan,
          planExpiresAt: expiresAt
        }
      }),
      db.licenseKey.update({
        where: { id: license.id },
        data: {
          isUsed: true,
          usedByUserId: user.id,
          usedAt: new Date()
        }
      })
    ]);

    const planTitle = license.plan === 'VIP' ? 'Maktab VIP' : 'Ustoz PRO';

    return NextResponse.json({
      success: true,
      message: `Tabriklaymiz! "${planTitle}" tarifi ${license.durationDays} kunga muvaffaqiyatli faollashtirildi! 🎉`,
      plan: updatedUser.plan,
      planExpiresAt: updatedUser.planExpiresAt
    });

  } catch (error: any) {
    console.error("License activation error:", error);
    return NextResponse.json({ error: "Kalitni faollashtirishda xatolik yuz berdi" }, { status: 500 });
  }
}
