"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileBarChart, 
  ArrowLeft, 
  BrainCircuit, 
  Target, 
  AlertCircle, 
  Sparkles,
  Users,
  FileSignature,
  CheckCircle2,
  BarChart2,
  Calendar,
  Clock,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import toast from "react-hot-toast";
import { fastFetch } from "@/utils/fastFetch";

interface StudentAnswer {
  id: string;
  questionNumber: number;
  studentAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  confidence: number;
}

interface Attempt {
  id: string;
  score: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  needsReview: boolean;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  answers: StudentAnswer[];
}

interface TestData {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  date: string;
  class?: { name: string };
  reports?: Array<{
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    aiSummary?: string;
  }>;
  attempts: Attempt[];
  error?: string;
}

interface StatsData {
  studentCount?: number;
  testCount?: number;
  attemptCount?: number;
  avgPercentage?: number;
  recentTests?: Array<{
    id: string;
    title: string;
    date: string;
    subject?: string;
    class?: { name: string };
    _count?: { attempts: number };
  }>;
}

function ReportContent() {
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  
  const [data, setData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);

  // Overall Stats & Tests State (when no single testId is selected)
  const [overallStats, setOverallStats] = useState<StatsData | null>(null);
  const [allTests, setAllTests] = useState<any[]>([]);

  useEffect(() => {
    if (testId) {
      fastFetch<TestData>(`/api/reports?testId=${testId}`)
        .then(res => {
          setData(res);
          setLoading(false);
        })
        .catch(() => {
          toast.error("Xatolik yuz berdi");
          setLoading(false);
        });
    } else {
      // Fetch overall stats & all tests for the main Report overview
      Promise.all([
        fastFetch<StatsData>("/api/stats"),
        fastFetch<any[]>("/api/tests")
      ])
        .then(([statsRes, testsRes]) => {
          setOverallStats(statsRes);
          if (Array.isArray(testsRes)) {
            setAllTests(testsRes);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [testId]);

  // Real Question-by-Question Heatmap Statistics
  const questionStats = useMemo(() => {
    if (!data || !data.attempts || data.attempts.length === 0) return [];
    
    const count = data.questionCount || 20;
    const stats = [];

    for (let q = 1; q <= count; q++) {
      let totalAnswered = 0;
      let correctCount = 0;

      data.attempts.forEach(attempt => {
        const ans = attempt.answers?.find(a => a.questionNumber === q);
        if (ans) {
          totalAnswered++;
          if (ans.isCorrect) correctCount++;
        }
      });

      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      stats.push({
        questionNumber: q,
        accuracy,
        correctCount,
        totalAnswered
      });
    }

    return stats;
  }, [data]);

  // Weakest questions (accuracy < 50%)
  const weakQuestions = useMemo(() => {
    return questionStats.filter(s => s.accuracy < 50).map(s => s.questionNumber);
  }, [questionStats]);

  // 1. OVERALL REPORTS & TESTS OVERVIEW (When no testId selected)
  if (!testId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hisobot va Tahlillar</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Umumiy ko&apos;rsatkichlar va sinovlar tahlili</p>
          </div>
        </div>

        {/* 4 Key Overall Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Jami o&apos;quvchilar</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {loading ? "..." : overallStats?.studentCount || 0}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FileSignature className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Jami testlar</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {loading ? "..." : overallStats?.testCount || 0}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tekshirilgan ishlar</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {loading ? "..." : overallStats?.attemptCount || 0}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">O&apos;rtacha o&apos;zlashtirish</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {loading ? "..." : overallStats?.avgPercentage || 0}%
            </p>
          </div>
        </div>

        {/* So'nggi testlar va natijalar ro'yxati */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Barcha testlar va natijalar tahlili
          </h2>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Yuklanmoqda...</div>
          ) : allTests.length === 0 ? (
            <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-dashed">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">Hali hech qanday test hisoboti mavjud emas</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Avval test yarating va o&apos;quvchilar ishlarini tekshiring.</p>
              <Link href="/tests">
                <Button className="h-9 text-xs">Testlar sahifasiga o&apos;tish</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {allTests.map((test) => (
                <div 
                  key={test.id} 
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-blue-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileBarChart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{test.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{test.subject} • {test.class?.name || "Sinf"}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(test.date).toLocaleDateString()}
                        </span>
                        <span>📝 {test.questionCount} ta savol</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          ✅ {test._count?.attempts || 0} ta topshirilgan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/report?testId=${test.id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 h-9 text-xs" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                        Tahlilni ko&apos;rish
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. SPECIFIC TEST DEEP DIVE REPORT (When testId is provided)
  if (loading) {
    return <div className="text-center p-12 text-slate-500">Hisobot yuklanmoqda...</div>;
  }

  if (!data || data.error) {
    return <div className="text-center p-12 text-red-500">Hisobot topilmadi</div>;
  }

  const attempts = data.attempts || [];
  const avgScore = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length).toFixed(1)
    : 0;
  const avgPercent = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0;
  const highestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
  const lowestScore = attempts.length > 0 ? Math.min(...attempts.map(a => a.score)) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/report" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="Barcha hisobotlarga qaytish">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{data.title} - Tahlil</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{data.class?.name} • {data.subject} • {attempts.length} o&apos;quvchi topshirgan</p>
          </div>
        </div>
      </div>

      {attempts.length === 0 ? (
        <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-dashed">
          <p className="text-slate-500">Hali bu test uchun natijalar kiritilmagan. Avval &quot;Tekshirish&quot; sahifasi orqali javoblarni tekshiring.</p>
          <Link href="/grader" className="mt-4 inline-block">
            <Button className="bg-emerald-600">Tekshirishga o&apos;tish</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-400 mb-1">O&apos;rtacha natija</p>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">{avgScore} ball ({avgPercent}%)</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-400 mb-1">Eng baland ball</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{highestScore}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-400 mb-1">Eng past ball</p>
              <p className="text-2xl sm:text-3xl font-black text-red-500">{lowestScore}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-center">
              <p className="text-xs font-semibold text-slate-400 mb-1">Tekshirilgan</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">{attempts.length} ta</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6">
              <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">O&apos;quvchilar natijalari ({attempts.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-5 py-3">O&apos;quvchi</th>
                        <th className="px-5 py-3">To&apos;g&apos;ri</th>
                        <th className="px-5 py-3">Xato</th>
                        <th className="px-5 py-3">Natija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {attempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                            {attempt.student.firstName} {attempt.student.lastName}
                            {attempt.needsReview && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" /> Ko&apos;rib chiqish kerak
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{attempt.correctCount}</td>
                          <td className="px-5 py-3 text-red-500">{attempt.incorrectCount}</td>
                          <td className="px-5 py-3">
                            <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200">
                              {attempt.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Real Question by Question Heatmap */}
              <Card className="p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Savollar bo&apos;yicha tahlil (Heatmap)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Har bir savol uchun o&apos;quvchilar to&apos;g&apos;ri topganlik darajasi</p>
                  </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {questionStats.map((stat) => {
                    let colorClass = "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300";
                    if (stat.accuracy < 50) {
                      colorClass = "bg-red-100 border-red-300 text-red-800 dark:bg-red-950/60 dark:border-red-700 dark:text-red-300";
                    } else if (stat.accuracy < 75) {
                      colorClass = "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300";
                    }
                    
                    return (
                      <div 
                        key={stat.questionNumber} 
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all hover:scale-105 ${colorClass}`}
                        title={`Savol ${stat.questionNumber}: ${stat.correctCount}/${stat.totalAnswered} to'g'ri (${stat.accuracy}%)`}
                      >
                        <span className="text-[10px] opacity-70 font-semibold mb-0.5">{stat.questionNumber}</span>
                        <span className="text-xs font-black">{stat.accuracy}%</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-400 rounded-full"/> Qiyin (&lt; 50% to&apos;g&apos;ri)</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-400 rounded-full"/> O&apos;rta (50% - 74%)</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-400 rounded-full"/> Oson (&ge; 75% to&apos;g&apos;ri)</div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-6 h-6 text-indigo-200" />
                  <h3 className="font-bold text-lg">AI Pedagogik Tahlil</h3>
                </div>
                <div className="space-y-4 text-sm text-indigo-50 leading-relaxed">
                  <p>
                    Ushbu test natijalariga ko&apos;ra, <strong>{data.class?.name || "sinf"}</strong> ning {data.subject} fanidan o&apos;rtacha o&apos;zlashtirishi <strong>{avgPercent}%</strong> ni tashkil qildi.
                    {weakQuestions.length > 0 ? (
                      <> O&apos;quvchilar asosan <strong>{weakQuestions.join(", ")}-savollarda</strong> ko&apos;p xatoliklarga yo&apos;l qo&apos;yishgan.</>
                    ) : (
                      <> Barcha savollar bo&apos;yicha o&apos;quvchilar 50% dan yuqori natija ko&apos;rsatishdi.</>
                    )}
                  </p>
                  
                  <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-sm">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" /> O&apos;qituvchi uchun tavsiyalar
                    </h4>
                    <ul className="space-y-2 text-indigo-100 list-disc pl-4 text-xs">
                      {weakQuestions.length > 0 && (
                        <li>{weakQuestions.slice(0, 3).join(", ")}-savollarga oid mavzuni keyingi darsda 10-15 daqiqa takrorlash tavsiya etiladi.</li>
                      )}
                      <li>O&apos;zlashtirishi 60% dan past bo&apos;lgan o&apos;quvchilar bilan individual ishlash tavsiya etiladi.</li>
                      <li>Yuqori ball to&apos;plagan o&apos;quvchilar uchun murakkabroq amaliy masalalar tayyorlash foydali bo&apos;ladi.</li>
                    </ul>
                  </div>

                  {/* Closed Loop Action: Create practice exercises for weak areas */}
                  <div className="pt-2">
                    <Link
                      href={`/tests?subject=${encodeURIComponent(data.subject)}&topic=${encodeURIComponent(`${data.title} bo'yicha mustahkamlash va takrorlash mashqlari`)}`}
                      className="w-full"
                    >
                      <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Shu mavzu bo&apos;yicha mashq yaratish
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Yuklanmoqda...</div>}>
      <ReportContent />
    </Suspense>
  );
}
