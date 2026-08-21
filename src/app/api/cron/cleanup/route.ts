import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const secret = process.env.CRON_SECRET || 'novda_storage_cleanup_cron_secret_2026';

    if (key !== secret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Ruxsat etilmagan" }, { status: 401 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Prune AI logs older than 7 days with status 'CACHED' or failed errors
    const deletedOldFailedLogs = await db.aiUsageLog.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
        status: { in: ['FAILED', 'CACHED'] }
      }
    });

    return NextResponse.json({
      success: true,
      message: "7 kundan eski vaqtinchalik ma'lumotlar tozalandi",
      purgedLogs: deletedOldFailedLogs.count,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Cleanup cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
