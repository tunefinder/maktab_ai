import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';
import mammoth from 'mammoth';
import { guardAiOperation } from '@/utils/aiGuard';
import { AI_MODELS } from '@/utils/aiConfig';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grade, subject, topic, duration, fileData } = body;

    if (!grade || !subject || !topic || !duration) {
      return new Response(JSON.stringify({ error: "Barcha asosiy maydonlarni to'ldiring" }), { status: 400 });
    }

    // 1. Guard check for lesson generation (3 credits)
    const guardResult = await guardAiOperation({
      operationType: 'lesson_generation',
      modelName: 'gemini-3.6-flash',
      fingerprintPayload: {
        grade,
        subject,
        topic: topic.trim().toLowerCase(),
        duration
      }
    });

    if (!guardResult.success) {
      return guardResult.response;
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "API kalit o'rnatilmagan" }), { status: 500 });
    }

    let parsedFileData: { data: string; mimeType: string } | null = null;
    let extractedText = "";

    if (fileData) {
      const { data, mimeType, name } = fileData;
      const buffer = Buffer.from(data, 'base64');

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || (name && name.endsWith('.docx'))) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
        parsedFileData = {
          data: data,
          mimeType: mimeType
        };
      }
    }

    const promptText = `
Sen tajribali metodist va O'zbekiston maktablari uchun sun'iy intellekt ta'lim yordamchisan. Berilgan ma'lumotlar va taqdim etilgan qo'shimcha resurs (agar mavjud bo'lsa) asosida ${duration} daqiqalik mukammal va interaktiv dars rejasini tuzib ber.

Sinf: ${grade}
Fan: ${subject}
Mavzu: ${topic}
${extractedText ? `Qo'shimcha material matni: ${extractedText.substring(0, 15000)}...` : ""}

Dars rejasi quyidagi qismlardan iborat bo'lsin:
- Darsning maqsadi va kutiladigan natijalar.
- O'quvchilarni qiziqtirish uchun qiziqarli savol yoki kichik interaktiv o'yin (Gamification).
- Yangi mavzuni tushuntirish bosqichlari (vaqti taqsimlangan holda).
- Mustahkamlash uchun savollar va topshiriqlar.
- Uyga vazifa.

Javobni aniq, o'qishga qulay va o'zbek tilida taqdim et.
    `;

    const schema = z.object({
      title: z.string().describe("Mavzu nomi"),
      image_prompt: z.string().optional().describe("A detailed descriptive prompt in ENGLISH for generating an image related to this specific topic."),
      objectives: z.array(z.string()).describe("Dars maqsadlari ro'yxati"),
      resources: z.array(z.string()).describe("Kerakli jihozlar va resurslar"),
      phases: z.array(z.object({
        phase_name: z.string(),
        duration: z.number(),
        teacher_action: z.string(),
        student_action: z.string()
      })).describe("Dars bosqichlari"),
      assessment: z.string().describe("Baholash usuli"),
      homework: z.string().describe("Uyga vazifa"),
      quiz: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        correct_answer: z.string()
      })).describe("Kamida 10 ta test savoli")
    });

    const messages: any[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          ...(parsedFileData ? [{ 
            type: parsedFileData.mimeType.startsWith('image/') ? 'image' : 'file', 
            ...(parsedFileData.mimeType.startsWith('image/') ? { image: parsedFileData.data } : { data: parsedFileData.data, mimeType: parsedFileData.mimeType })
          }] : [])
        ]
      }
    ];

    const result = await streamObject({
      model: google(AI_MODELS.lesson as any),
      schema: schema,
      messages: messages,
    });

    // Commit credits with estimated telemetry
    await guardResult.context.commitCredits({
      inputTokens: 600,
      outputTokens: 1200,
      totalTokens: 1800,
      modelName: AI_MODELS.lesson
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("Lesson Planner API error:", error);
    return new Response(JSON.stringify({ error: "Dars rejasini yaratishda xatolik yuz berdi.", details: error.message }), { status: 500 });
  }
}
