import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Sinf ID si topilmadi" }, { status: 400 });
    }

    // Verify ownership before delete
    const existingClass = await db.class.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Sinf topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }

    await db.class.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/classes/[id] error:", error);
    return NextResponse.json({ error: "Sinfni o'chirishda xatolik yuz berdi" }, { status: 500 });
  }
}
