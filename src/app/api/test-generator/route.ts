import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { guardAiOperation, cacheAiResult, AiTelemetryData } from '@/utils/aiGuard';
import { AI_MODELS } from '@/utils/aiConfig';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const generatedTestSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).min(2),
      correct_answer: z.string(),
      explanation: z.string().optional()
    })
  ).min(1)
});

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { grade, subject, topic, questionsCount, difficulty } = body;

    if (!grade || !subject || !topic || !questionsCount) {
      return NextResponse.json({ error: "Barcha maydonlarni to'ldiring" }, { status: 400 });
    }

    // 1. Backend Guardrails: Auth, Subscription, Rate Limit, Credits
    const guardResult = await guardAiOperation({
      operationType: 'test_generation',
      modelName: AI_MODELS.testGenerator,
      fingerprintPayload: {
        grade,
        subject,
        topic: topic.trim().toLowerCase(),
        questionsCount,
        difficulty,
        pipelineVersion: 'v2'
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
      await new Promise(resolve => setTimeout(resolve, 800));
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

Har bir savol 4 ta variantli (A, B, C, D) bo'lsin va to'g'ri javoblari hamda qisqacha izohi ko'rsatilsin.

MUHIM: Dastur ishlashi uchun javobing faqat va faqat quyidagi JSON formatida bo'lishi shart:
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
    `.trim();

    let parsedJson: any = null;
    let fallbackUsed = false;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let usedModel = AI_MODELS.testGenerator;

    // Stage 1: Try Primary Cheap Model (gemini-2.5-flash-lite with thinkingBudget: 0)
    try {
      const response = await genAI.models.generateContent({
        model: AI_MODELS.testGenerator,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      });

      const text = response.text || "";
      const rawObj = JSON.parse(text);
      parsedJson = generatedTestSchema.parse(rawObj);

      const usage = response.usageMetadata || {};
      totalInputTokens = usage.promptTokenCount || 200;
      totalOutputTokens = usage.candidatesTokenCount || (Number(questionsCount) * 40);
    } catch (primaryErr) {
      console.warn("Primary test generator error, running single strong fallback:", primaryErr);
      fallbackUsed = true;
      usedModel = AI_MODELS.testGeneratorFallback;

      // Stage 2: Strong Fallback Model (gemini-3.6-flash)
      const fallbackResponse = await genAI.models.generateContent({
        model: AI_MODELS.testGeneratorFallback,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const text = fallbackResponse.text || "";
      const rawObj = JSON.parse(text);
      parsedJson = generatedTestSchema.parse(rawObj);

      const usage = fallbackResponse.usageMetadata || {};
      totalInputTokens += (usage.promptTokenCount || 250);
      totalOutputTokens += (usage.candidatesTokenCount || (Number(questionsCount) * 50));
    }

    const durationMs = Date.now() - startTime;
    const telemetry: AiTelemetryData = {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      durationMs,
      fallbackUsed,
      modelName: usedModel
    };

    // 3. Atomically commit credit deduction on success
    await guardResult.context.commitCredits(telemetry);

    // 4. Save to idempotency cache (60s)
    await cacheAiResult(guardResult.context.fingerprint, parsedJson, 60);

    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Test Generator error:", error);
    return NextResponse.json({ error: "Test yaratishda xatolik yuz berdi.", details: error.message }, { status: 500 });
  }
}
