import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamObject } from 'ai';
import { z } from 'zod';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { guardAiOperation } from '@/utils/aiGuard';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export const maxDuration = 60;

const testSchema = z.object({
  taskType: z.literal('TEST').default('TEST'),
  results: z.array(
    z.object({
      student_name: z.string(),
      variant: z.string().optional(),
      score: z.number().describe("To'g'ri topilgan savollar soni"),
      maxScore: z.number().default(100),
      percentage: z.number().describe("Foiz ko'rinishida, masalan 85"),
      feedback: z.string().optional(),
      confidence: z.number().describe("Ishonch darajasi 0.0 dan 1.0 gacha"),
      needsReview: z.boolean().default(false),
      answers: z.array(
        z.object({
          question: z.number().describe("Savol raqami"),
          studentAnswer: z.string().describe("O'quvchi belgilagan javob (A, B, C, D) yoki '-'"),
          correctAnswer: z.string().describe("Kalitdagi to'g'ri javob"),
          isCorrect: z.boolean(),
          confidence: z.number().describe("Ishonch darajasi 0.0 dan 1.0 gacha")
        })
      )
    })
  )
});

const dictationSchema = z.object({
  taskType: z.literal('DICTATION').default('DICTATION'),
  results: z.array(
    z.object({
      student_name: z.string(),
      score: z.number().describe("O'quvchining yakuniy bali"),
      maxScore: z.number().describe("Maksimal ball"),
      percentage: z.number().describe("Foiz ko'rinishida"),
      spellingErrorsCount: z.number().describe("Imlo xatolari soni"),
      punctuationErrorsCount: z.number().describe("Tinish belgisi xatolari soni"),
      missingWordsCount: z.number().describe("Tushib qolgan so'zlar soni"),
      extraWordsCount: z.number().describe("Ortiqcha qo'shilgan so'zlar soni"),
      errorsList: z.array(
        z.object({
          type: z.string().describe("Xatolik turi: IMLO, TINISH, TUSHIB_QOLGAN, ORTIQCHA"),
          original: z.string().describe("Original matndagi to'g'ri so'z yoki belgi"),
          written: z.string().describe("O'quvchi yozgan matn yoki belgi"),
          explanation: z.string().describe("Xatolik sababi va qoidasi")
        })
      ),
      feedback: z.string().describe("O'quvchi uchun tushunarli pedagogik izoh"),
      confidence: z.number().describe("AI ishonch darajasi 0.0 - 1.0"),
      needsReview: z.boolean().describe("Agar yozuv xira yoki shubhali bo'lsa true")
    })
  )
});

const openQuestionSchema = z.object({
  taskType: z.literal('OPEN_QUESTION').default('OPEN_QUESTION'),
  results: z.array(
    z.object({
      student_name: z.string(),
      score: z.number().describe("Olingan ball"),
      maxScore: z.number().describe("Maksimal ball"),
      percentage: z.number().describe("Foiz ko'rinishida"),
      extractedAnswerText: z.string().describe("O'quvchining daftardagi javob matni"),
      criteriaBreakdown: z.array(
        z.object({
          criterion: z.string().describe("Mezon nomi"),
          awardedPoints: z.number().describe("Berilgan ball"),
          maxPoints: z.number().describe("Mezon maksimal bali"),
          feedback: z.string().describe("Mezon bo'yicha tahlil")
        })
      ),
      feedback: z.string().describe("Umumiy pedagogik xulosa"),
      confidence: z.number().describe("0.0 dan 1.0 gacha"),
      needsReview: z.boolean().describe("O'qituvchi alohida ko'rib chiqishi shartmi")
    })
  )
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      taskType = 'TEST', 
      testId, 
      answerKey, 
      questionCount, 
      originalText,
      sourceImage,
      questionText,
      rubricRules,
      maxScore = 20,
      spellingPenalty = 1,
      punctuationPenalty = 0.5,
      images 
    } = body;

    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: "Kamida 1 ta rasm yuklanishi kerak" }), { status: 400 });
    }

    const opType = (taskType === 'DIKTANT' || taskType === 'DICTATION' || taskType === 'OPEN_QUESTION' || taskType === 'ESSAY')
      ? 'text_analysis'
      : 'answer_check';

    const guardResult = await guardAiOperation({
      operationType: opType,
      unitsMultiplier: images.length,
      modelName: 'gemini-3.6-flash',
      fingerprintPayload: {
        taskType,
        testId,
        imgCount: images.length,
        textKey: (answerKey || originalText || questionText || '').slice(0, 100)
      }
    });

    if (!guardResult.success) {
      return guardResult.response;
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "API kalit o'rnatilmagan" }), { status: 500 });
    }

    let promptText = "";
    let targetSchema: any = testSchema;
    const messageContent: any[] = [];

    if (taskType === 'DIKTANT' || taskType === 'DICTATION') {
      targetSchema = dictationSchema;
      promptText = `
Sen o'zbek tili va adabiyoti fanining tajribali, adolatli va talabchan o'qituvchisisan.
Senga o'quvchilar tomonidan daftarda qo'lda yozilgan DIKTANT rasmlari va ORIGINAL DIKTANT MATNI taqdim etilgan.

${sourceImage ? `DIQQAT: Birinchi biriktirilgan rasm — bu O'QITUVCHI DAFTARI YOKI DARSLIKDAGI ASL DIKTANT MATNI.
Qolgan barcha keyingi rasmlar esa O'QUVCHILARNING DAFTARLARI. Birinchi rasmdagi asl matnni aniq o'qib olib, qolgan har bir o'quvchi daftari bilan so'zma-so'z, harfma-harf solishtirib tekshir.` : `ORIGINAL MATN:
"""
${originalText || "Original matn berilmagan. O'quvchi yozgan matndagi imlo va tinish qoidalarini mustaqil tahlil qil."}
"""`}

TEKSHIRISH MEZONLARI:
- Maksimal ball: ${maxScore} ball
- Har bir imlo (orfoografik) xatosi uchun: -${spellingPenalty} ball
- Har bir tinish belgisi (punktuatsiya) xatosi uchun: -${punctuationPenalty} ball
- Tushib qolgan yoki ortiqcha so'zlar: imlo xatosi sifatida hisoblansin.
- Husnixat (chiroyli/xunuk yozuv) uchun ball AYIRILMASIN. Faqat matn to'g'riligi baholanadi.

VAZIFANG:
1. Har bir o'quvchi daftaridan uning ism-sharifini aniqlash. Agar aniqlanmasa "No'malum o'quvchi" deb yoz.
2. O'quvchi yozgan yozuvni o'qib, original matn bilan so'zma-so'z, harfma-harf solishtir.
3. Barcha xatoliklarni ro'yxatga ol (type: 'IMLO' yoki 'TINISH' yoki 'TUSHIB_QOLGAN' yoki 'ORTIQCHA').
4. Yakuniy ballni hisobla: ball = Math.max(0, ${maxScore} - (imloXatolar * ${spellingPenalty}) - (tinishXatolar * ${punctuationPenalty})).
5. Agar o'quvchining yozuvi juda xira, yirtilgan yoki tushunarsiz bo'lsa confidence darajasini 0.5 dan past qilib, needsReview: true deb belgilang.
6. O'quvchi uchun qisqa va aniq o'zbek tilida pedagogik izoh (feedback) yoz.
      `;
    } else if (taskType === 'OPEN_QUESTION' || taskType === 'ESSAY') {
      targetSchema = openQuestionSchema;
      promptText = `
Sen maktab o'qituvchisisan. Senga o'quvchilar tomonidan qo'lda yozilgan OCHIQ SAVOL / YOZMA ISH rasmlari berilgan.

${sourceImage ? `DIQQAT: Birinchi biriktirilgan rasm — bu DARSLIK YOKI O'QITUVCHI TOPSHIRIQ VARAQASI (Savol matni va topshiriq).
Qolgan barcha keyingi rasmlar esa O'QUVCHILARNING YOZMA JAVOBLARI. Birinchi rasmdagi savol va topshiriq asosida o'quvchilarning javoblarini bahola.` : `SAVOL / TOPSHIRIQ:
"""
${questionText || "Savol matni"}
"""`}

BAHOLASH MEZONLARI:
"""
${rubricRules || `Asosiy faktlar va tushunchalar: 5 ball
Mantiqiy tushuntirish va dalillar: 3 ball
Xulosa va fikrni ifodalash: 2 ball
Maksimal ball: ${maxScore}`}
"""

VAZIFANG:
1. O'quvchining ism-sharifini aniqlash.
2. Daftardagi qo'lyozma javobni to'liq o'qib chiqish va extractedAnswerText ga yozish.
3. Javobni berilgan mezonlar (rubric) bo'yicha bosqichma-bosqich baholash (criteriaBreakdown).
4. Har bir mezon bo'yicha nega shu ball berilganini asoslab berish.
5. Umumiy ball va foizni hisoblab, o'quvchiga yo'naltiruvchi feedback yozish.
6. Agar yozuv o'qib bo'lmaydigan bo'lsa confidence pasaytirilsin va needsReview: true qilinsin.
      `;
    } else {
      // DEFAULT: TEST (ABCD)
      targetSchema = testSchema;
      promptText = `
Sen tajribali va juda aniq ishlaydigan maktab o'qituvchisisan.
Senga o'quvchilar tomonidan ishlangan test javob varaqalari (rasmlar) va testning TO'G'RI JAVOB KALITI berilgan.

TO'G'RI JAVOB KALITI:
${answerKey}

VAZIFANG:
1. Har bir rasmdan o'quvchining ism-sharifini aniqlash.
2. O'quvchi qaysi variantni ishlaganini aniqlash (masalan, A, B).
3. Har bir savol (${questionCount || 20} ta savol) bo'yicha o'quvchi belgilagan javobni aniqla.
4. Javobni kalit bilan solishtirib isCorrect belgilash.
5. Agar javob noaniq bo'lsa confidence pasaytirilib, needsReview: true berilsin.
6. To'g'ri javoblar soni (score) va foizini hisobla.
      `;
    }

    messageContent.push({ type: 'text', text: promptText });
    
    // If sourceImage is provided, prepend it first
    if (sourceImage) {
      messageContent.push({
        type: 'image',
        image: sourceImage.data,
      });
    }

    for (const img of images) {
      messageContent.push({
        type: 'image',
        image: img.data, 
      });
    }

    const result = await streamObject({
      model: google('gemini-3.6-flash'), 
      schema: targetSchema,
      messages: [{ role: 'user', content: messageContent }],
    });

    // Commit credit deduction atomically
    await guardResult.context.commitCredits();

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("Grader API error:", error);
    return new Response(JSON.stringify({ error: "Tekshirishda xatolik yuz berdi.", details: error.message }), { status: 500 });
  }
}
