import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { guardAiOperation, cacheAiResult } from '@/utils/aiGuard';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  try {
    const { grade, subject, topic, info } = await request.json();

    if (!grade || !subject || !topic || !info) {
      return NextResponse.json({ error: "Barcha maydonlarni to'ldiring" }, { status: 400 });
    }

    // 1. Guard check for report generation (1 credit)
    const guardResult = await guardAiOperation({
      operationType: 'report_generation',
      modelName: 'gemini-2.5-flash',
      fingerprintPayload: { grade, subject, topic, info }
    });

    if (!guardResult.success) {
      return guardResult.response;
    }

    if (guardResult.cachedResult) {
      return NextResponse.json(guardResult.cachedResult);
    }

    if (!process.env.GEMINI_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockReport = {
        attendance: "26 o'quvchidan 24 nafari qatnashdi.",
        performance: "18 nafar o'quvchi mavzuni yaxshi o'zlashtirdi.",
        issues: "6 nafar o'quvchiga qo'shimcha tushuntirish kerak.",
        recommendations: "Keyingi darsda qo'shimcha mashqlar o'tkazish tavsiya etiladi.",
        conclusion: "Dars maqsadi asosan bajarildi."
      };
      await guardResult.context.commitCredits();
      return NextResponse.json(mockReport);
    }

    const prompt = `
      Sen maktab o'qituvchilari uchun avtomatlashtirilgan hisobot tuzuvchi AI agentisan. Taqdim etilgan qisqa ma'lumotlar asosida rasmiy va mukammal dars/sinf hisobotini tuzib ber:

      Sinf va Fan: ${grade} - ${subject}
      Mavzu / Davr: ${topic}
      Qisqa ma'lumot (davomat, yutuq va muammolar): ${info}

      Hisobot rasmiy uslubda, o'qituvchi va maktab rahbariyatiga taqdim etishga tayyor holatda, o'zbek tilida shakllantirilsin.

      MUHIM: Dastur interfeysi ishlashi uchun javobni aynan quyidagi JSON formatida qaytarishing shart:
      {
        "attendance": "Davomat xulosasi",
        "performance": "O'zlashtirish xulosasi",
        "issues": "Muammolar",
        "recommendations": "Keyingi dars uchun tavsiyalar",
        "conclusion": "Umumiy xulosa"
      }
    `;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const content = response.text;
    if (!content) throw new Error("No content");

    const parsed = JSON.parse(content);

    // Commit credits
    await guardResult.context.commitCredits();
    cacheAiResult(guardResult.context.fingerprint, parsed, 60);

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "Hisobot yaratishda xatolik yuz berdi.", details: error.message }, { status: 500 });
  }
}
