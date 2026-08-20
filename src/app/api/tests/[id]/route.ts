import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Test ID si topilmadi" }, { status: 400 });
    }
    
    const test = await db.test.findFirst({
      where: { id, userId: user.id },
      include: {
        class: true,
        variants: true
      }
    });
    
    if (!test) {
      return NextResponse.json({ error: "Test topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }
    
    return NextResponse.json(test);
  } catch (error) {
    console.error("GET /api/tests/[id] error:", error);
    return NextResponse.json({ error: "Testni yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Test ID si topilmadi" }, { status: 400 });
    }

    const existing = await db.test.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Test topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }
    
    await db.test.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tests/[id] error:", error);
    return NextResponse.json({ error: "Testni o'chirishda xatolik yuz berdi" }, { status: 500 });
  }
}
