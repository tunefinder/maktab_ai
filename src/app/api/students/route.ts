import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    
    if (!classId) {
      return NextResponse.json({ error: "classId talab qilinadi" }, { status: 400 });
    }

    // Verify class belongs to this user
    const userClass = await db.class.findFirst({
      where: { id: classId, userId: user.id }
    });

    if (!userClass) {
      return NextResponse.json({ error: "Sinf topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }
    
    const students = await db.student.findMany({
      where: { classId },
      orderBy: { firstName: 'asc' }
    });
    
    return NextResponse.json(students);
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "O'quvchilarni yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const body = await req.json();
    
    // Bulk creation support
    if (body.students && Array.isArray(body.students) && body.classId) {
      const userClass = await db.class.findFirst({
        where: { id: body.classId, userId: user.id }
      });

      if (!userClass) {
        return NextResponse.json({ error: "Sinf topilmadi yoki sizga tegishli emas" }, { status: 404 });
      }

      const validStudents = body.students
        .filter((s: any) => s.firstName && s.firstName.trim())
        .map((s: any) => ({
          firstName: s.firstName.trim(),
          lastName: (s.lastName || "").trim() || "-",
          classId: body.classId
        }));
        
      if (validStudents.length === 0) {
        return NextResponse.json({ error: "Hech qanday o'quvchi ma'lumoti topilmadi" }, { status: 400 });
      }

      await db.student.createMany({
        data: validStudents
      });

      const updatedStudents = await db.student.findMany({
        where: { classId: body.classId },
        orderBy: { firstName: 'asc' }
      });

      return NextResponse.json({ success: true, count: validStudents.length, students: updatedStudents }, { status: 201 });
    }

    const { firstName, lastName, classId } = body;
    
    if (!firstName || !classId) {
      return NextResponse.json({ error: "Ism va sinf kiritilishi shart" }, { status: 400 });
    }

    const userClass = await db.class.findFirst({
      where: { id: classId, userId: user.id }
    });

    if (!userClass) {
      return NextResponse.json({ error: "Sinf topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }
    
    const newStudent = await db.student.create({
      data: {
        firstName: firstName.trim(),
        lastName: (lastName || "").trim() || "-",
        classId
      }
    });
    
    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: "O'quvchi qo'shishda xatolik yuz berdi" }, { status: 500 });
  }
}
