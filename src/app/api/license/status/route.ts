import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { PLANS, PlanType } from '@/utils/limits';
import { seedInitialKeys } from '@/utils/licenseSeed';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    // Ensure seed keys exist
    await seedInitialKeys();

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

    const currentPlanKey = (dbUser.plan as PlanType) || 'FREE';
    const planDetails = PLANS[currentPlanKey] || PLANS.FREE;

    let daysLeft: number | null = null;
    let isExpired = false;

    if (dbUser.planExpiresAt) {
      const now = new Date();
      const diffTime = dbUser.planExpiresAt.getTime() - now.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      if (daysLeft === 0) {
        isExpired = true;
      }
    }

    return NextResponse.json({
      plan: dbUser.plan,
      planDetails,
      planExpiresAt: dbUser.planExpiresAt,
      daysLeft,
      isExpired,
      usage: {
        classesCount: dbUser._count.classes,
        maxClasses: planDetails.maxClasses,
        testsCount: dbUser._count.tests,
        maxTests: planDetails.maxTests,
        usedNotebooks: dbUser.usedNotebooks || 0,
        maxNotebooks: planDetails.maxNotebooks
      }
    });
  } catch (error) {
    console.error("GET /api/license/status error:", error);
    return NextResponse.json({ error: "Holatni yuklashda xatolik" }, { status: 500 });
  }
}
