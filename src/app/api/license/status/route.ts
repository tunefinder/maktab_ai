import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { getPlanDetails, isUnlimited } from '@/utils/aiConfig';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    // Fetch user details and related counts
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            classes: true,
            tests: true
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    }

    const currentPlanKey = dbUser.plan || 'FREE';
    const planDetails = getPlanDetails(currentPlanKey);

    let daysLeft: number | null = null;
    let isExpired = false;

    if (dbUser.planExpiresAt) {
      const now = new Date();
      const diffTime = dbUser.planExpiresAt.getTime() - now.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      if (diffTime <= 0) {
        isExpired = true;
        daysLeft = 0;
      }
    }

    const maxAiCredits = planDetails.maxAiCredits;
    const bonusCredits = dbUser.bonusCredits || 0;
    const totalAiCredits = maxAiCredits + bonusCredits;
    const usedAiCredits = dbUser.usedAiCredits || dbUser.usedNotebooks || 0;
    const remainingAiCredits = Math.max(0, totalAiCredits - usedAiCredits);
    const aiProgressPct = totalAiCredits > 0 ? Math.min(100, Math.round((usedAiCredits / totalAiCredits) * 100)) : 0;

    const classesCount = dbUser._count.classes;
    const maxClasses = planDetails.maxClasses;
    const classesProgressPct = isUnlimited(maxClasses) ? 0 : Math.min(100, Math.round((classesCount / maxClasses) * 100));

    const testsCount = dbUser._count.tests;
    const maxTests = planDetails.maxTests;
    const testsProgressPct = isUnlimited(maxTests) ? 0 : Math.min(100, Math.round((testsCount / maxTests) * 100));

    const lessonsCount = dbUser.usedLessons || 0;
    const maxLessons = planDetails.maxLessons;
    const lessonsProgressPct = isUnlimited(maxLessons) ? 0 : Math.min(100, Math.round((lessonsCount / maxLessons) * 100));

    return NextResponse.json({
      plan: dbUser.plan,
      planDetails,
      planExpiresAt: dbUser.planExpiresAt,
      daysLeft,
      isExpired,
      subscriptionStatus: dbUser.subscriptionStatus || (isExpired ? 'EXPIRED' : 'ACTIVE'),
      usage: {
        // AI Credits
        usedAiCredits,
        maxAiCredits,
        bonusCredits,
        totalAiCredits,
        remainingAiCredits,
        aiProgressPct,

        // Legacy compatibility
        usedNotebooks: usedAiCredits,
        maxNotebooks: totalAiCredits,

        // Classes
        classesCount,
        maxClasses,
        classesProgressPct,

        // Tests
        testsCount,
        maxTests,
        testsProgressPct,

        // Lessons
        lessonsCount,
        maxLessons,
        lessonsProgressPct
      }
    });
  } catch (error) {
    console.error("GET /api/license/status error:", error);
    return NextResponse.json({ error: "Holatni yuklashda xatolik" }, { status: 500 });
  }
}
