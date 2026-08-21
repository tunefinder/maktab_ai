import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { getPlanDetails, AI_PACKS, AiPackType } from '@/utils/aiConfig';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

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

    // 1. AI Pack Activation (PACK_1000, PACK_3000, PACK_7000, PACK_500)
    if (license.plan.startsWith('PACK_') || license.creditsBonus > 0) {
      const packCredits = license.creditsBonus || (
        license.plan === 'PACK_7000' ? 7000 :
        license.plan === 'PACK_3000' ? 3000 :
        license.plan === 'PACK_1000' ? 1000 : 500
      );
      const packName = AI_PACKS[license.plan as AiPackType]?.name || `+${packCredits.toLocaleString()} AI limiti`;

      const [updatedUser] = await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: {
            bonusCredits: { increment: packCredits }
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

      return NextResponse.json({
        success: true,
        message: `Tabriklaymiz! "${packName}" hisobingizga muvaffaqiyatli qo'shildi! ⚡`,
        bonusCredits: updatedUser.bonusCredits
      });
    }

    // 2. Main Subscription Plan Activation (START, PRO, MAX, MAKTAB_PRO, MAKTAB_VIP)
    const normalizedPlan = license.plan === 'VIP' ? 'MAKTAB_VIP' : license.plan;
    const planDetails = getPlanDetails(normalizedPlan);

    // Calculate expiration date (from now or extending current if same plan)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (license.durationDays || 30));

    // Reset monthly usage counters on new subscription cycle
    const [updatedUser] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          plan: normalizedPlan,
          planExpiresAt: expiresAt,
          subscriptionStatus: 'ACTIVE',
          usedAiCredits: 0,
          usedNotebooks: 0,
          usedLessons: 0,
          usedTests: 0
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

    return NextResponse.json({
      success: true,
      message: `Tabriklaymiz! "${planDetails.name}" tarifi ${license.durationDays} kunga muvaffaqiyatli faollashtirildi! 🎉`,
      plan: updatedUser.plan,
      planExpiresAt: updatedUser.planExpiresAt
    });

  } catch (error: any) {
    console.error("License activation error:", error);
    return NextResponse.json({ error: "Kalitni faollashtirishda xatolik yuz berdi" }, { status: 500 });
  }
}
