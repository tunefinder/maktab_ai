import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) return null;

  const isAdminByTelegram = dbUser.telegramId === (process.env.ADMIN_TELEGRAM_ID || '7833585964');
  if (dbUser.role === 'ADMIN' || isAdminByTelegram || dbUser.email === 'admin@novda.uz') {
    return dbUser;
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin ruxsati talab qilinadi" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const plan = searchParams.get('plan') || '';

    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { telegramId: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (plan && plan !== 'ALL') {
      where.plan = plan;
    }

    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegramId: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        subscriptionStatus: true,
        usedAiCredits: true,
        usedNotebooks: true,
        bonusCredits: true,
        createdAt: true,
        _count: {
          select: { classes: true, tests: true }
        }
      }
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Admin GET users error:", error);
    return NextResponse.json({ error: "Foydalanuvchilarni yuklashda xatolik" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin ruxsati talab qilinadi" }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId, plan, durationDays, creditsToAdd, toggleEmergencyAi } = body;

    // Emergency AI Switch toggle
    if (action === 'toggle_emergency_ai') {
      const config = await db.systemConfig.upsert({
        where: { id: 'global' },
        create: {
          id: 'global',
          isAiDisabledGlobally: Boolean(toggleEmergencyAi),
          updatedAt: new Date()
        },
        update: {
          isAiDisabledGlobally: Boolean(toggleEmergencyAi),
          updatedAt: new Date()
        }
      });
      return NextResponse.json({
        success: true,
        message: config.isAiDisabledGlobally ? "⚠️ AI global ravishda o'chirildi (Favqulodda rejim)!" : "✅ AI global xizmati yoqildi!",
        isAiDisabledGlobally: config.isAiDisabledGlobally
      });
    }

    if (!userId) {
      return NextResponse.json({ error: "Foydalanuvchi tanlanmadi" }, { status: 400 });
    }

    // 1. Grant or change plan
    if (action === 'set_plan') {
      const days = Number(durationDays) || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const updated = await db.user.update({
        where: { id: userId },
        data: {
          plan: plan || 'PRO',
          planExpiresAt: expiresAt,
          subscriptionStatus: 'ACTIVE',
          usedAiCredits: 0,
          usedNotebooks: 0
        }
      });

      return NextResponse.json({
        success: true,
        message: `Foydalanuvchiga "${plan}" tarifi ${days} kunga o'rnatildi!`,
        user: updated
      });
    }

    // 2. Extend subscription
    if (action === 'extend_subscription') {
      const days = Number(durationDays) || 30;
      const targetUser = await db.user.findUnique({ where: { id: userId } });
      const currentExpiry = targetUser?.planExpiresAt && targetUser.planExpiresAt > new Date()
        ? targetUser.planExpiresAt
        : new Date();
      
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + days);

      const updated = await db.user.update({
        where: { id: userId },
        data: {
          planExpiresAt: newExpiry,
          subscriptionStatus: 'ACTIVE'
        }
      });

      return NextResponse.json({
        success: true,
        message: `Obuna muddati +${days} kunga uzaytirildi!`,
        user: updated
      });
    }

    // 3. Add bonus credits
    if (action === 'add_credits') {
      const amount = Number(creditsToAdd) || 100;
      const updated = await db.user.update({
        where: { id: userId },
        data: {
          bonusCredits: { increment: amount }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Foydalanuvchiga +${amount} ta bonus AI tekshirish krediti qo'shildi!`,
        user: updated
      });
    }

    // 4. Cancel/revoke subscription
    if (action === 'cancel_subscription') {
      const updated = await db.user.update({
        where: { id: userId },
        data: {
          plan: 'FREE',
          planExpiresAt: null,
          subscriptionStatus: 'CANCELLED'
        }
      });

      return NextResponse.json({
        success: true,
        message: "Foydalanuvchi obunasi bekor qilindi va Bepul tarifga o'tkazildi.",
        user: updated
      });
    }

    return NextResponse.json({ error: "Noma'lum amal" }, { status: 400 });

  } catch (error: any) {
    console.error("Admin POST users action error:", error);
    return NextResponse.json({ error: error.message || "Amalni bajarishda xatolik" }, { status: 500 });
  }
}
