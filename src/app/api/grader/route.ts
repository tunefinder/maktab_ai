import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';
import { 
  guardAiOperation, 
  cacheAiResult, 
  AiTelemetryData 
} from '@/utils/aiGuard';
import { 
  AI_MODELS, 
  AI_BATCH_CONFIG, 
  IS_AI_PIPELINE_V2,
  calculateTokenCost 
} from '@/utils/aiConfig';

export const maxDuration = 60;

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Helper to parse various answer key formats into a clean array of upper-case letters:
 * e.g. "ABCDABCDAB" -> ["A","B","C","D","A","B","C","D","A","B"]
 * e.g. "1A 2B 3C 4D" -> ["A","B","C","D"]
 * e.g. '{"1":"A","2":"B"}' -> ["A","B"]
 */
function parseAnswerKeyToArray(rawKey: string | null | undefined, expectedCount = 20): string[] {
  if (!rawKey) {
    return Array.from({ length: expectedCount }, () => 'A');
  }

  const trimmed = rawKey.trim();

  // 1. JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const res: string[] = [];
      for (let i = 1; i <= expectedCount; i++) {
        res.push((parsed[String(i)] || parsed[i] || 'A').toUpperCase());
      }
      return res;
    } catch {}
  }

  // 2. Numbered format: "1A 2B 3C" or "1.A 2.B"
  const numberedMatches = trimmed.match(/\b\d+[\.\-\:]?\s*([A-Za-z])/g);
  if (numberedMatches && numberedMatches.length >= 2) {
    const res: string[] = [];
    for (const match of numberedMatches) {
      const letterMatch = match.match(/[A-Za-z]$/);
      if (letterMatch) res.push(letterMatch[0].toUpperCase());
    }
    return res.length > 0 ? res : Array.from({ length: expectedCount }, () => 'A');
  }

  // 3. Continuous letters format: "ABCDABCDAB..."
  const cleanLetters = trimmed.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (cleanLetters.length > 0) {
    return cleanLetters.split('');
  }

  return Array.from({ length: expectedCount }, () => 'A');
}

/**
 * Executes zero-thinking Flash-Lite extraction on a single batch of student answer sheets.
 */
async function extractStudentAnswersWithFlashLite(
  images: Array<{ data: string; mimeType?: string }>,
  questionCount: number
): Promise<{
  results: Array<{
    student_name: string;
    variant: string;
    answers: string[];
    uncertainQuestions: number[];
    confidence: number;
    needsReview: boolean;
  }>;
  inputTokens: number;
  outputTokens: number;
}> {
  const prompt = `
Senga o'quvchilar tomonidan qo'lda to'ldirilgan ${images.length} ta test javob varaqasi rasmlari taqdim etilgan.

VAZIFANG:
Har bir rasmdan FAQAT quyidagilarni aniq o'qib, JSON formatida chiqar:
1. student_name: O'quvchining ism-sharifi (agar daftarda ko'rinmasa "Noma'lum o'quvchi").
2. variant: Belgilangan variant (masalan "A", "B", "1", "2"). Agar yo'q bo'lsa "A".
3. answers: 1-savoldan ${questionCount}-savolgacha belgilangan harflar massivi (FAQAT "A", "B", "C", "D" yoki belgilanmagan/o'chirilgan bo'lsa "-").
4. uncertainQuestions: Noaniq, xira yoki ikkita variant belgilangan savol raqamlari massivi (masalan [7, 14]).
5. confidence: O'qishning umumiy aniqligi (0.0 dan 1.0 gacha).
6. needsReview: Agar yozuv juda xira, yirtilgan yoki shubhali bo'lsa true, aks holda false.

QAT'IY QOIDA:
Hech qanday ball hisoblama, foiz hisoblama, to'g'ri javobni solishtirma. Faqat rasmdagi harflarni o'qi.

Struktura:
{
  "results": [
    {
      "student_name": "Ali Valiyev",
      "variant": "A",
      "answers": ["A", "B", "C", "D"],
      "uncertainQuestions": [],
      "confidence": 0.96,
      "needsReview": false
    }
  ]
}
  `.trim();

  const contents: any[] = [{ text: prompt }];

  for (const img of images) {
    contents.push({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType || 'image/jpeg'
      }
    });
  }

  // Call gemini-2.5-flash-lite with thinkingBudget: 0 for zero reasoning latency
  const response = await genAI.models.generateContent({
    model: AI_MODELS.testPrimary,
    contents,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  });

  const text = response.text || "";
  const parsed = JSON.parse(text);

  const usage = response.usageMetadata || {};
  const inputTokens = usage.promptTokenCount || (images.length * 350);
  const outputTokens = usage.candidatesTokenCount || (images.length * 40);

  return {
    results: Array.isArray(parsed.results) ? parsed.results : [],
    inputTokens,
    outputTokens
  };
}

/**
 * Strong Fallback: Runs on a single problematic sheet using strong model (gemini-3.6-flash).
 */
async function fallbackSingleStudentExtraction(
  img: { data: string; mimeType?: string },
  questionCount: number
): Promise<{
  result: {
    student_name: string;
    variant: string;
    answers: string[];
    uncertainQuestions: number[];
    confidence: number;
    needsReview: boolean;
  };
  inputTokens: number;
  outputTokens: number;
}> {
  const prompt = `
DIQQAT: Ushbu test javob varaqasi rasmi juda sinchkovlik bilan qayta tekshirilmoqda.
Rasmdan o'quvchi ism-sharifi, varianti va 1 dan ${questionCount}-savolgacha belgilangan barcha javoblarini (A, B, C, D yoki -) aniq o'qi.

Format:
{
  "student_name": "Ism Familiya",
  "variant": "A",
  "answers": ["A", "B", ...],
  "uncertainQuestions": [],
  "confidence": 0.95,
  "needsReview": false
}
  `.trim();

  const response = await genAI.models.generateContent({
    model: AI_MODELS.testFallback,
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: img.data,
          mimeType: img.mimeType || 'image/jpeg'
        }
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text || "{}";
  const parsed = JSON.parse(text);
  const usage = response.usageMetadata || {};

  return {
    result: {
      student_name: parsed.student_name || "Noma'lum o'quvchi",
      variant: parsed.variant || "A",
      answers: Array.isArray(parsed.answers) ? parsed.answers : Array.from({ length: questionCount }, () => '-'),
      uncertainQuestions: Array.isArray(parsed.uncertainQuestions) ? parsed.uncertainQuestions : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
      needsReview: Boolean(parsed.needsReview)
    },
    inputTokens: usage.promptTokenCount || 400,
    outputTokens: usage.candidatesTokenCount || 50
  };
}

/**
 * Pure TypeScript Scoring Engine: Instant, 100% deterministic, zero token cost.
 */
function scoreStudentSheet(
  extracted: {
    student_name: string;
    variant: string;
    answers: string[];
    uncertainQuestions?: number[];
    confidence?: number;
    needsReview?: boolean;
  },
  answerKeys: string[],
  questionCount: number
) {
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const answersList: Array<{
    question: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < questionCount; i++) {
    const rawStudent = extracted.answers[i] ? extracted.answers[i].toUpperCase().trim() : '-';
    const studentAns = ['A', 'B', 'C', 'D'].includes(rawStudent) ? rawStudent : '-';
    const correctAns = answerKeys[i] || 'A';

    const isUncertain = extracted.uncertainQuestions?.includes(i + 1);
    const confidence = isUncertain ? 0.6 : (extracted.confidence || 0.95);

    if (studentAns === '-') {
      unansweredCount++;
      answersList.push({
        question: i + 1,
        studentAnswer: '-',
        correctAnswer: correctAns,
        isCorrect: false,
        confidence: 0.95
      });
    } else if (studentAns === correctAns) {
      correctCount++;
      answersList.push({
        question: i + 1,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect: true,
        confidence
      });
    } else {
      incorrectCount++;
      answersList.push({
        question: i + 1,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect: false,
        confidence
      });
    }
  }

  const score = correctCount;
  const maxScore = questionCount;
  const percentage = Math.round((correctCount / questionCount) * 100);

  return {
    student_name: extracted.student_name || "Noma'lum o'quvchi",
    variant: extracted.variant || "A",
    score,
    maxScore,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    feedback: `${questionCount} ta savoldan ${correctCount} ta to'g'ri topildi (${percentage}%).`,
    confidence: extracted.confidence || 0.95,
    needsReview: extracted.needsReview || extracted.confidence! < 0.85 || false,
    answers: answersList
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { 
      taskType = 'TEST', 
      testId, 
      classId,
      images, 
      dictation, 
      openQuestion,
      // Backward compatibility fields
      answerKey: clientAnswerKey,
      originalText: clientOriginalText,
      questionText: clientQuestionText,
      maxScore: clientMaxScore
    } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "Kamida 1 ta rasm yuklanishi kerak" }, { status: 400 });
    }

    const opType = (taskType === 'DIKTANT' || taskType === 'DICTATION' || taskType === 'OPEN_QUESTION' || taskType === 'ESSAY')
      ? 'text_analysis'
      : 'answer_check';

    // 1. Security & Pre-flight Guardrails (Authentication, Limit, Rate limiting, SHA-256 Idempotency)
    const guardResult = await guardAiOperation({
      operationType: opType,
      unitsMultiplier: images.length,
      images,
      fingerprintPayload: {
        taskType,
        testId,
        classId,
        imgCount: images.length,
        pipelineVersion: 'v2'
      }
    });

    if (!guardResult.success) {
      return guardResult.response;
    }

    // Return instant persistent cache if exact same request
    if (guardResult.cachedResult) {
      return NextResponse.json(guardResult.cachedResult);
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY o'rnatilmagan" }, { status: 500 });
    }

    // =========================================================================
    // BRANCH A: HIGH-SPEED, ULTRA-CHEAP ABCD TEST PIPELINE (5x–10x Cost Reduction)
    // =========================================================================
    if (taskType === 'TEST') {
      let answerKeys: string[] = [];
      let questionCount = 20;

      // Authenticate test from DB
      if (testId) {
        const dbTest = await db.test.findUnique({
          where: { id: testId }
        });

        if (!dbTest) {
          return NextResponse.json({ error: "Ko'rsatilgan test topilmadi" }, { status: 404 });
        }

        // Verify ownership if test has userId
        if (dbTest.userId && dbTest.userId !== guardResult.context.userId) {
          return NextResponse.json({ error: "Ushbu testdan foydalanishga ruxsat yo'q" }, { status: 403 });
        }

        questionCount = dbTest.questionCount || 20;
        answerKeys = parseAnswerKeyToArray(dbTest.answerKey, questionCount);
      } else {
        answerKeys = parseAnswerKeyToArray(clientAnswerKey, questionCount);
      }

      // Chunk images into batches of AI_BATCH_CONFIG.batchSize (default 5)
      const batchSize = AI_BATCH_CONFIG.batchSize;
      const chunks: Array<Array<{ data: string; mimeType?: string }>> = [];
      for (let i = 0; i < images.length; i += batchSize) {
        chunks.push(images.slice(i, i + batchSize));
      }

      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let fallbackCount = 0;
      const scoredResults: any[] = [];

      // Process batches with bounded concurrency
      const concurrency = AI_BATCH_CONFIG.concurrency;
      for (let i = 0; i < chunks.length; i += concurrency) {
        const batchSlice = chunks.slice(i, i + concurrency);

        const batchPromises = batchSlice.map(async (batchImages, chunkIdx) => {
          try {
            // Stage 1: Flash-Lite Zero-Thinking Extraction
            const extraction = await extractStudentAnswersWithFlashLite(batchImages, questionCount);
            totalInputTokens += extraction.inputTokens;
            totalOutputTokens += extraction.outputTokens;

            const batchResults: any[] = [];

            for (let j = 0; j < batchImages.length; j++) {
              const item = extraction.results[j];
              const img = batchImages[j];

              // Quality Gate: Check if extraction was accurate and complete
              const isValid = item &&
                Array.isArray(item.answers) &&
                item.answers.length === questionCount &&
                (item.confidence || 0.9) >= 0.85 &&
                !item.needsReview;

              if (isValid) {
                // Quality passed -> instant TypeScript scoring
                batchResults.push(scoreStudentSheet(item, answerKeys, questionCount));
              } else {
                // Quality failed -> Strong Model Fallback for ONLY this sheet
                fallbackCount++;
                try {
                  const fallbackData = await fallbackSingleStudentExtraction(img, questionCount);
                  totalInputTokens += fallbackData.inputTokens;
                  totalOutputTokens += fallbackData.outputTokens;
                  batchResults.push(scoreStudentSheet(fallbackData.result, answerKeys, questionCount));
                } catch {
                  // Fallback fallback: preserve item with review flag
                  batchResults.push(scoreStudentSheet(item || {
                    student_name: "Noma'lum o'quvchi",
                    variant: "A",
                    answers: Array.from({ length: questionCount }, () => '-'),
                    confidence: 0.5,
                    needsReview: true
                  }, answerKeys, questionCount));
                }
              }
            }

            return batchResults;
          } catch (batchErr) {
            console.warn("Primary batch extraction error, running strong fallback on batch:", batchErr);
            // Fallback entire batch sequentially
            const fallbackBatchResults: any[] = [];
            for (const img of batchImages) {
              fallbackCount++;
              try {
                const fallbackData = await fallbackSingleStudentExtraction(img, questionCount);
                totalInputTokens += fallbackData.inputTokens;
                totalOutputTokens += fallbackData.outputTokens;
                fallbackBatchResults.push(scoreStudentSheet(fallbackData.result, answerKeys, questionCount));
              } catch {
                fallbackBatchResults.push(scoreStudentSheet({
                  student_name: "Noma'lum o'quvchi",
                  variant: "A",
                  answers: Array.from({ length: questionCount }, () => '-'),
                  confidence: 0.5,
                  needsReview: true
                }, answerKeys, questionCount));
              }
            }
            return fallbackBatchResults;
          }
        });

        const settled = await Promise.allSettled(batchPromises);
        for (const res of settled) {
          if (res.status === 'fulfilled') {
            scoredResults.push(...res.value);
          }
        }
      }

      const durationMs = Date.now() - startTime;
      const finalPayload = {
        taskType: 'TEST',
        results: scoredResults
      };

      // Telemetry & Atomic Credit Commit
      const telemetry: AiTelemetryData = {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        durationMs,
        fallbackUsed: fallbackCount > 0,
        imageCount: images.length,
        modelName: fallbackCount > 0 ? `${AI_MODELS.testPrimary} + ${AI_MODELS.testFallback}` : AI_MODELS.testPrimary
      };

      await guardResult.context.commitCredits(telemetry);
      await cacheAiResult(guardResult.context.fingerprint, finalPayload, 120);

      return NextResponse.json(finalPayload);
    }

    // =========================================================================
    // BRANCH B: DICTATION / ESSAY / OPEN QUESTION PIPELINE (Strong Vision Model)
    // =========================================================================
    const isDictation = taskType === 'DIKTANT' || taskType === 'DICTATION';
    const dictObj = dictation || {};
    const openObj = openQuestion || {};

    const rawOrigText = dictObj.originalText || clientOriginalText || "";
    const rawQuestionText = openObj.questionText || clientQuestionText || "";
    const targetMaxScore = openObj.maxScore || clientMaxScore || 20;

    let promptText = "";
    if (isDictation) {
      promptText = `
Sen o'zbek tili va adabiyoti fanining tajribali, talabchan o'qituvchisisan.
Senga o'quvchilar tomonidan daftarda yozilgan DIKTANT rasmlari va ORIGINAL MATN berilgan.

ORIGINAL MATN:
"""
${rawOrigText || "Original matn berilmagan. O'quvchi yozgan matndagi imlo va tinish qoidalarini mustaqil tahlil qil."}
"""

VAZIFANG:
1. Har bir o'quvchining ism-sharifini aniqla.
2. Original matn bilan so'zma-so'z, harfma-harf solishtir.
3. Imlo (IMLO) va tinish belgisi (TINISH) xatolarini ro'yxatga ol.
4. Maksimal ball: ${targetMaxScore}. Har bir imlo xatosiga -1 ball, tinish xatosiga -0.5 ball.
5. Qisqa pedagogik feedback va confidence ber.

JSON formatida chiqar:
{
  "taskType": "DIKTANT",
  "results": [
    {
      "student_name": "Ism Familiya",
      "score": 18,
      "maxScore": ${targetMaxScore},
      "percentage": 90,
      "spellingErrorsCount": 1,
      "punctuationErrorsCount": 2,
      "errorsList": [
        { "type": "IMLO", "original": "kitob", "written": "ketob", "explanation": "unli harf xatosi" }
      ],
      "feedback": "Yaxshi yozilgan",
      "confidence": 0.95,
      "needsReview": false
    }
  ]
}
      `.trim();
    } else {
      // Open Question / Essay
      promptText = `
Sen maktab o'qituvchisisan. Senga o'quvchilarning OCHIQ SAVOL / YOZMA ISH daftari rasmlari berilgan.

SAVOL:
"""
${rawQuestionText || "Savol matni"}
"""

Maksimal ball: ${targetMaxScore}

VAZIFANG:
1. O'quvchi ism-sharifini aniqla.
2. Daftardagi javobni to'liq o'qib, extractedAnswerText ga yoz.
3. Javobni mazmuni, mantiqi va to'liqligi bo'yicha baholab criteriaBreakdown tuz.
4. Score, percentage, feedback va confidence chiqar.

JSON formatida chiqar:
{
  "taskType": "OPEN_QUESTION",
  "results": [
    {
      "student_name": "Ism Familiya",
      "score": 16,
      "maxScore": ${targetMaxScore},
      "percentage": 80,
      "extractedAnswerText": "Daftardagi matn",
      "criteriaBreakdown": [
        { "criterion": "Faktlar", "awardedPoints": 5, "maxPoints": 5, "feedback": "To'g'ri" }
      ],
      "feedback": "Fikrlar yaxshi ifodalangan",
      "confidence": 0.92,
      "needsReview": false
    }
  ]
}
      `.trim();
    }

    const contents: any[] = [{ text: promptText }];
    for (const img of images) {
      contents.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType || 'image/jpeg'
        }
      });
    }

    const response = await genAI.models.generateContent({
      model: AI_MODELS.dictation,
      contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    const usage = response.usageMetadata || {};

    const durationMs = Date.now() - startTime;
    const telemetry: AiTelemetryData = {
      inputTokens: usage.promptTokenCount || (images.length * 500),
      outputTokens: usage.candidatesTokenCount || (images.length * 150),
      durationMs,
      fallbackUsed: false,
      imageCount: images.length,
      modelName: AI_MODELS.dictation
    };

    await guardResult.context.commitCredits(telemetry);
    await cacheAiResult(guardResult.context.fingerprint, parsedJson, 120);

    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("Grader API error:", error);
    return NextResponse.json({ error: "Tekshirishda xatolik yuz berdi.", details: error.message }, { status: 500 });
  }
}
