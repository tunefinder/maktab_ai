import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    // STRICT USER ISOLATION: Only stats belonging to THIS user
    const userClasses = await db.class.findMany({
      where: { userId: user.id },
      select: { id: true }
    });
    const userClassIds = userClasses.map(c => c.id);

    const classCount = userClassIds.length;

    const testCount = await db.test.count({
      where: { userId: user.id }
    });

    const studentCount = await db.student.count({
      where: { classId: { in: userClassIds } }
    });

    const attempts = await db.testAttempt.findMany({
      where: {
        test: { userId: user.id }
      },
      select: { score: true, percentage: true }
    });
    
    const attemptCount = attempts.length;
    
    let avgPercentage = 0;
    if (attempts.length > 0) {
      avgPercentage = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length);
    }

    // Recent tests belonging to this user
    const recentTests = await db.test.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        class: true,
        _count: {
          select: { attempts: true }
        }
      }
    });

    return NextResponse.json({
      classCount,
      testCount,
      studentCount,
      attemptCount,
      avgPercentage,
      recentTests
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "Statistikani yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}
