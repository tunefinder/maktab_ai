import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { guardAiOperation, cacheAiResult } from '@/utils/aiGuard';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grade, subject, topic, questionsCount, difficulty } = body;

    if (!grade || !subject || !topic || !questionsCount) {
      return NextResponse.json({ error: "Barcha maydonlarni to'ldiring" }, { status: 400 });
    }

    // 1. Backend Guardrails: Auth, Subscription, Rate Limit, Credits
    const guardResult = await guardAiOperation({
      operationType: 'test_generation',
      modelName: 'gemini-3.6-flash',
      fingerprintPayload: {
        grade,
        subject,
        topic: topic.trim().toLowerCase(),
        questionsCount,
        difficulty
      }
    });

    if (!guardResult.success) {
      return guardResult.response;
    }

    // 2. Return cached result if duplicate request within 60s
    if (guardResult.cachedResult) {
      return NextResponse.json(guardResult.cachedResult);
    }

    if (!process.env.GEMINI_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockResult = {
        questions: [
          {
            question: "Yurakning asosiy vazifasi nima?",
            options: ["Qonni haydash", "Ovqat hazm qilish", "Nafas olish", "Gormon ishlab chiqarish"],
            correct_answer: "Qonni haydash",
            explanation: "Yurak qon aylanish tizimining asosiy nasos organidir."
          }
        ]
      };
      await guardResult.context.commitCredits();
      return NextResponse.json(mockResult);
    }

    const prompt = `
      Sen O'zbekiston ta'lim standartlariga mos test tuzuvchi sun'iy intellekt, ya'ni AI Agentisan. Quyidagi shartlar asosida test savollarini tuzib ber:

      Fan: ${subject}
      Sinf: ${grade}
      Mavzu: ${topic}
      Savollar soni: ${questionsCount} ta
      Qiyinlik darajasi: ${difficulty || "O'rta"}

      Har bir savol 4 ta variantli (A, B, C, D) bo'lsin va oxirida to'g'ri javoblari hamda qisqacha izohi ko'rsatilsin.
      
      MUHIM: Dastur ishlashi uchun javobing faqat va faqat quyidagi JSON formatida bo'lishi shart. Strukturasi:
      {
        "questions": [
          {
            "question": "Savol matni",
            "options": ["A variant", "B variant", "C variant", "D variant"],
            "correct_answer": "To'g'ri variant matni",
            "explanation": "Qisqa izoh"
          }
        ]
      }
    `;

    // Max 1 automatic retry
    let response;
    try {
      response = await genAI.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
    } catch (e) {
      console.warn("Retrying with gemini-flash-latest:", e);
      response = await genAI.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
    }

    const content = response.text;
    if (!content) throw new Error("AI javob bermadi");

    const parsedJson = JSON.parse(content);

    // 3. Atomically commit credit deduction on success
    await guardResult.context.commitCredits();

    // 4. Save to idempotency cache (60s)
    cacheAiResult(guardResult.context.fingerprint, parsedJson, 60);

    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Test Generator error:", error);
    return NextResponse.json({ error: "Test yaratishda xatolik yuz berdi.", details: error.message }, { status: 500 });
  }
}
