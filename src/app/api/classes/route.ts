import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { getPlanDetails } from '@/utils/aiConfig';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    // STRICT USER ISOLATION: Only fetch classes created by THIS logged-in user
    const classes = await db.class.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json({ error: "Sinflarni yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const body = await req.json();
    const { name, academicYear, description } = body;
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Sinf nomi kiritilishi shart" }, { status: 400 });
    }

    const currentClassesCount = await db.class.count({
      where: { userId: user.id }
    });

    const userPlan = user.plan || 'FREE';
    const planDetails = getPlanDetails(userPlan);
    const maxAllowed = planDetails.maxClasses;

    if (maxAllowed !== -1 && currentClassesCount >= maxAllowed) {
      return NextResponse.json(
        { 
          error: `Sizning "${planDetails.name}" tarifingizdagi ${maxAllowed} ta sinf yaratish limiti to'ldi. Ko'proq sinf qo'shish uchun tarifingizni yangilang.` 
        }, 
        { status: 403 }
      );
    }
    
    const newClass = await db.class.create({
      data: {
        userId: user.id,
        name: name.trim(),
        academicYear: academicYear || null,
        description: description || null
      }
    });
    
    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error("POST /api/classes error:", error);
    return NextResponse.json({ error: "Sinf qo'shishda xatolik yuz berdi" }, { status: 500 });
  }
}
