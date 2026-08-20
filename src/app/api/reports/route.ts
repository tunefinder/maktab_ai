import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json({ error: "testId talab qilinadi" }, { status: 400 });
    }
    
    const test = await db.test.findUnique({
      where: { id: testId },
      include: {
        class: true,
        reports: true,
        attempts: {
          include: {
            student: true,
            answers: true
          }
        }
      }
    });
    
    if (!test) {
      return NextResponse.json({ error: "Test topilmadi" }, { status: 404 });
    }
    
    return NextResponse.json(test);
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Hisobotni yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}
