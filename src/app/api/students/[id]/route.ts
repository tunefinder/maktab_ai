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
      return NextResponse.json({ error: "O'quvchi ID si topilmadi" }, { status: 400 });
    }
    
    const student = await db.student.findFirst({
      where: { 
        id,
        class: { userId: user.id }
      },
      include: {
        class: true,
        attempts: {
          include: {
            test: true,
            answers: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!student) {
      return NextResponse.json({ error: "O'quvchi topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ error: "O'quvchi ma'lumotlarini yuklashda xatolik" }, { status: 500 });
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
      return NextResponse.json({ error: "O'quvchi ID si topilmadi" }, { status: 400 });
    }
    
    const student = await db.student.findFirst({
      where: { 
        id,
        class: { userId: user.id }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "O'quvchi topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }

    await db.student.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ error: "O'quvchini o'chirishda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { firstName, lastName } = body;
    
    if (!id || !firstName || !lastName) {
      return NextResponse.json({ error: "Ma'lumotlar to'liq emas" }, { status: 400 });
    }

    const student = await db.student.findFirst({
      where: { 
        id,
        class: { userId: user.id }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "O'quvchi topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }
    
    const updatedStudent = await db.student.update({
      where: { id },
      data: { firstName: firstName.trim(), lastName: lastName.trim() }
    });
    
    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("PUT /api/students/[id] error:", error);
    return NextResponse.json({ error: "O'quvchini tahrirlashda xatolik yuz berdi" }, { status: 500 });
  }
}
