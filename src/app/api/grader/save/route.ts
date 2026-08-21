import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { getCurrentUser } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const body = await req.json();
    let { testId, classId, results, taskType = 'TEST', title } = body;

    if (!classId || !results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Saqlash uchun ma'lumotlar yetarli emas" }, { status: 400 });
    }

    // Verify class ownership
    const userClass = await db.class.findFirst({
      where: { id: classId, userId: user.id }
    });

    if (!userClass) {
      return NextResponse.json({ error: "Sinf topilmadi yoki sizga tegishli emas" }, { status: 404 });
    }

    // If testId is not provided or not found, create a test/task record dynamically
    let targetTest = null;
    if (testId) {
      targetTest = await db.test.findFirst({
        where: { id: testId, userId: user.id }
      });
    }

    if (!targetTest) {
      const defaultTitle = title || (
        taskType === 'DIKTANT' ? `Diktant (${new Date().toLocaleDateString('uz-UZ')})` :
        taskType === 'OPEN_QUESTION' ? `Yozma ish (${new Date().toLocaleDateString('uz-UZ')})` :
        `Test tekshiruvi (${new Date().toLocaleDateString('uz-UZ')})`
      );

      const questionCount = results[0]?.answers?.length || 10;

      targetTest = await db.test.create({
        data: {
          userId: user.id,
          classId,
          subject: taskType === 'DIKTANT' ? "Ona tili" : (user.subject || "Umumiy fan"),
          title: defaultTitle,
          questionCount,
          answerKey: "N/A"
        }
      });
      testId = targetTest.id;
    }

    // Fetch existing students in this class for matching
    const existingStudents = await db.student.findMany({
      where: { classId }
    });

    const savedAttempts = [];

    for (const res of results) {
      const rawName = (res.student_name || "Noma'lum").trim();
      const nameParts = rawName.split(" ");
      const firstName = nameParts[0] || "O'quvchi";
      const lastName = nameParts.slice(1).join(" ") || "(Familiyasiz)";

      // Match student by firstName or full string
      let student = existingStudents.find(s =>
        rawName.toLowerCase().includes(s.firstName.toLowerCase()) ||
        s.firstName.toLowerCase().includes(firstName.toLowerCase()) ||
        (s.lastName && rawName.toLowerCase().includes(s.lastName.toLowerCase()))
      );

      // Auto-create student if not exists
      if (!student) {
        student = await db.student.create({
          data: {
            firstName,
            lastName,
            classId
          }
        });
        existingStudents.push(student);
      }

      const score = typeof res.score === 'number' ? res.score : 0;
      const percentage = typeof res.percentage === 'number' ? res.percentage : Math.round((score / (res.maxScore || 10)) * 100);
      
      const correctCount = Array.isArray(res.answers) 
        ? res.answers.filter((a: any) => a.isCorrect).length 
        : score;
      const unansweredCount = Array.isArray(res.answers) 
        ? res.answers.filter((a: any) => a.studentAnswer === "-").length 
        : 0;
      const incorrectCount = Array.isArray(res.answers) 
        ? res.answers.length - correctCount - unansweredCount 
        : (res.spellingErrorsCount || 0) + (res.punctuationErrorsCount || 0);

      // Check existing attempt
      const existingAttempt = await db.testAttempt.findFirst({
        where: { testId: targetTest.id, studentId: student.id }
      });

      let attempt;
      if (existingAttempt) {
        // Delete old answers
        await db.studentAnswer.deleteMany({
          where: { attemptId: existingAttempt.id }
        });

        attempt = await db.testAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            variant: res.variant || null,
            score,
            percentage,
            correctCount,
            incorrectCount,
            unansweredCount,
            needsReview: !!res.needsReview,
            answers: Array.isArray(res.answers) && res.answers.length > 0 ? {
              create: res.answers.map((ans: any) => ({
                questionNumber: typeof ans.question === 'number' ? ans.question : 1,
                studentAnswer: ans.studentAnswer || "-",
                correctAnswer: ans.correctAnswer || "-",
                isCorrect: !!ans.isCorrect,
                confidence: ans.confidence ?? 1,
                isUncertain: (ans.confidence ?? 1) < 0.8
              }))
            } : undefined
          }
        });
      } else {
        attempt = await db.testAttempt.create({
          data: {
            testId: targetTest.id,
            studentId: student.id,
            variant: res.variant || null,
            score,
            percentage,
            correctCount,
            incorrectCount,
            unansweredCount,
            needsReview: !!res.needsReview,
            answers: Array.isArray(res.answers) && res.answers.length > 0 ? {
              create: res.answers.map((ans: any) => ({
                questionNumber: typeof ans.question === 'number' ? ans.question : 1,
                studentAnswer: ans.studentAnswer || "-",
                correctAnswer: ans.correctAnswer || "-",
                isCorrect: !!ans.isCorrect,
                confidence: ans.confidence ?? 1,
                isUncertain: (ans.confidence ?? 1) < 0.8
              }))
            } : undefined
          }
        });
      }

      savedAttempts.push(attempt);
    }

    // Upsert / Update Report
    const allAttempts = await db.testAttempt.findMany({
      where: { testId: targetTest.id }
    });

    if (allAttempts.length > 0) {
      const avgScore = allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length;
      const scores = allAttempts.map(a => a.score);
      const high = Math.max(...scores);
      const low = Math.min(...scores);

      const existingReport = await db.report.findFirst({ where: { testId: targetTest.id } });
      if (existingReport) {
        await db.report.update({
          where: { id: existingReport.id },
          data: {
            averageScore: avgScore,
            highestScore: high,
            lowestScore: low
          }
        });
      } else {
        await db.report.create({
          data: {
            testId: targetTest.id,
            classId,
            averageScore: avgScore,
            highestScore: high,
            lowestScore: low,
            aiSummary: "AI tahlili saqlandi"
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: savedAttempts.length, 
      testId: targetTest.id 
    });
  } catch (error: any) {
    console.error("POST /api/grader/save error:", error);
    return NextResponse.json(
      { error: error.message || "Natijalarni saqlashda xatolik yuz berdi" }, 
      { status: 500 }
    );
  }
}
