import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { PLANS, AI_COST_PER_CREDIT_UZS, PlanType } from '@/utils/aiConfig';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    // Role check: Only ADMIN can access
    const dbUser = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      // Also allow if telegramId matches ADMIN_ID
      const isAdminByTelegram = dbUser?.telegramId === (process.env.ADMIN_TELEGRAM_ID || '7833585964');
      if (!isAdminByTelegram && dbUser?.email !== 'admin@novda.uz') {
        return NextResponse.json({ error: "Admin ruxsati talab qilinadi" }, { status: 403 });
      }
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. User & Plan Counts
    const totalUsers = await db.user.count();

    const planGroups = await db.user.groupBy({
      by: ['plan'],
      _count: { id: true },
      where: {
        OR: [
          { plan: 'FREE' },
          { planExpiresAt: { gte: now } }
        ]
      }
    });

    const planBreakdown: Record<string, number> = {
      START: 0,
      PRO: 0,
      MAX: 0,
      MAKTAB_PRO: 0,
      MAKTAB_VIP: 0,
      FREE: 0
    };

    let activeSubscriptions = 0;
    let estimatedMRR = 0;

    for (const pg of planGroups) {
      const p = pg.plan as PlanType;
      const count = pg._count.id;
      if (p in planBreakdown) {
        planBreakdown[p] = count;
      }
      if (p !== 'FREE') {
        activeSubscriptions += count;
        const planPrice = PLANS[p]?.priceNumber || 0;
        estimatedMRR += count * planPrice;
      }
    }

    // 2. AI Requests & Credit Aggregations
    const todayLogsCount = await db.aiUsageLog.count({
      where: {
        createdAt: { gte: startOfToday },
        status: 'SUCCESS'
      }
    });

    const monthLogsCount = await db.aiUsageLog.count({
      where: {
        createdAt: { gte: startOfMonth },
        status: 'SUCCESS'
      }
    });

    const monthCreditsAgg = await db.aiUsageLog.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        status: 'SUCCESS'
      },
      _sum: {
        creditsCost: true
      }
    });

    const monthCreditsUsed = monthCreditsAgg._sum.creditsCost || 0;

    // Fetch system config
    const systemConfig = await db.systemConfig.findUnique({
      where: { id: 'global' }
    });

    const costPerCredit = systemConfig?.aiCostPerCreditUzs || AI_COST_PER_CREDIT_UZS;
    const estimatedAiCostMonth = Math.round(monthCreditsUsed * costPerCredit);
    const estimatedGrossProfit = Math.max(0, estimatedMRR - estimatedAiCostMonth);
    const aiCostToRevenuePct = estimatedMRR > 0 ? Math.min(100, Math.round((estimatedAiCostMonth / estimatedMRR) * 100)) : 0;
    const arpu = activeSubscriptions > 0 ? Math.round(estimatedMRR / activeSubscriptions) : 0;

    // 3. Top AI Users
    const topUsersRaw = await db.user.findMany({
      orderBy: [
        { usedAiCredits: 'desc' },
        { usedNotebooks: 'desc' }
      ],
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        plan: true,
        usedAiCredits: true,
        usedNotebooks: true,
        bonusCredits: true,
        planExpiresAt: true,
        createdAt: true
      }
    });

    const topUsers = topUsersRaw.map(u => {
      const credits = u.usedAiCredits || u.usedNotebooks || 0;
      return {
        ...u,
        usedAiCredits: credits,
        estimatedCostUzs: Math.round(credits * costPerCredit)
      };
    });

    // 4. Recent AI logs
    const recentLogs = await db.aiUsageLog.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true, plan: true }
        }
      }
    });

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeSubscriptions,
        estimatedMRR,
        arpu,
        todayAiRequests: todayLogsCount,
        monthAiRequests: monthLogsCount,
        monthCreditsUsed,
        estimatedAiCostMonth,
        costPerCredit,
        estimatedGrossProfit,
        aiCostToRevenuePct,
        isAiDisabledGlobally: systemConfig?.isAiDisabledGlobally || false
      },
      planBreakdown,
      topUsers,
      recentLogs
    });

  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Admin statistikasini yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}
