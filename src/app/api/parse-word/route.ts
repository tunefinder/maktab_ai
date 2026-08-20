import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fayl topilmadi" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mammoth.extractRawText({ buffer });
    const rawText = result.value || "";

    return NextResponse.json({ success: true, text: rawText });
  } catch (error: any) {
    console.error("POST /api/parse-word error:", error);
    return NextResponse.json({ error: "Word faylini o'qishda xatolik yuz berdi" }, { status: 500 });
  }
}
