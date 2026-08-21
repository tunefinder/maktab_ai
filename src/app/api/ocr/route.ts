import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { guardAiOperation } from '@/utils/aiGuard';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body; // { data: string, mimeType: string }

    if (!image || !image.data) {
      return NextResponse.json({ error: "Rasm ma'lumoti topilmadi" }, { status: 400 });
    }

    const guardResult = await guardAiOperation({
      operationType: 'text_analysis',
      unitsMultiplier: 1,
      fingerprintPayload: { imageHash: image.data.slice(0, 100) }
    });

    if (!guardResult.success) {
      return guardResult.response;
    }

    if (guardResult.cachedResult) {
      return NextResponse.json(guardResult.cachedResult);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY topilmadi" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Ushbu rasmda kitob, qo'llanma yoki qog'ozda yozilgan matn (diktant matni) keltirilgan.
Vazifang: Rasmdagi matnni imlo va tinish belgilarini 100% aniq saqlagan holda o'qib, sof matn sifatida chiqar.
Hech qanday qo'shimcha izoh, sarlavha yoki formatlash (markdown backticks) qo'shma, faqat rasmdagi matnni o'zini chiqar.`;

    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: image.data,
            mimeType: image.mimeType || 'image/jpeg'
          }
        }
      ]
    });

    const durationMs = Date.now() - startTime;
    const text = response.text?.trim() || "";

    if (guardResult.context) {
      await guardResult.context.commitCredits({
        durationMs,
        modelName: 'gemini-2.5-flash',
        imageCount: 1
      });
    }

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error("POST /api/ocr error:", error);
    return NextResponse.json(
      { error: error.message || "Rasmdan matnni ajratib olishda xatolik" },
      { status: 500 }
    );
  }
}
