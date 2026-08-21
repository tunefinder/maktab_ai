import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { getPlanDetails } from '@/utils/aiConfig';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    
    // STRICT USER ISOLATION: Only tests belonging to THIS logged-in user
    let whereClause: any = { userId: user.id };
    if (classId) {
      whereClause.classId = classId;
    }
    
    const tests = await db.test.findMany({
      where: whereClause,
      include: {
        class: true,
        _count: {
          select: { attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(tests);
  } catch (error) {
    console.error("GET /api/tests error:", error);
    return NextResponse.json({ error: "Testlarni yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const body = await req.json();
    const { classId, subject, title, questionCount, date, answerKey } = body;
    
    if (!classId || !subject || !title || !questionCount || !answerKey) {
      return NextResponse.json({ error: "Barcha maydonlarni to'ldirish shart" }, { status: 400 });
    }

    const currentTestsCount = await db.test.count({
      where: { userId: user.id }
    });

    const userPlan = user.plan || 'FREE';
    const planDetails = getPlanDetails(userPlan);
    const maxAllowed = planDetails.maxTests;

    if (maxAllowed !== -1 && currentTestsCount >= maxAllowed) {
      return NextResponse.json(
        { 
          error: `Sizning "${planDetails.name}" tarifingizdagi ${maxAllowed} ta test yaratish limiti to'ldi. Ko'proq test qo'shish uchun tarifingizni yangilang.` 
        }, 
        { status: 403 }
      );
    }
    
    const newTest = await db.test.create({
      data: {
        userId: user.id,
        classId,
        subject: subject.trim(),
        title: title.trim(),
        questionCount: parseInt(questionCount),
        date: date ? new Date(date) : new Date(),
        answerKey: answerKey.trim()
      }
    });
    
    return NextResponse.json(newTest, { status: 201 });
  } catch (error) {
    console.error("POST /api/tests error:", error);
    return NextResponse.json({ error: "Test qo'shishda xatolik yuz berdi" }, { status: 500 });
  }
}
