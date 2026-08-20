import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';

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
    const maxAllowed = userPlan === 'VIP' ? 999999 : userPlan === 'PRO' ? 6 : 1;

    if (currentClassesCount >= maxAllowed) {
      return NextResponse.json(
        { 
          error: userPlan === 'FREE' 
            ? "Bepul tarifda faqat 1 ta sinf yaratish mumkin. 6 ta sinf yaratish uchun Ustoz PRO tarifini faollashtiring." 
            : "Ustoz PRO tarifidagi 6 ta sinf limiti to'ldi. Cheksiz sinflar uchun Maktab VIP tarifini faollashtiring." 
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
