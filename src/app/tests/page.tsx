"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FileSignature, 
  Plus, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  Loader2, 
  Download, 
  CheckCircle2, 
  BookmarkPlus, 
  X, 
  Check, 
  Calendar, 
  Layers, 
  ArrowRight, 
  Printer,
  Users,
  FileBarChart,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import toast from "react-hot-toast";
import Link from "next/link";
import TestPrintModal from "@/components/TestPrintModal";
import LimitExceededModal from "@/components/LimitExceededModal";

interface TestQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface ClassItem {
  id: string;
  name: string;
}

function TestsPageContent() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get('subject') || "";
  const initialTopic = searchParams.get('topic') || "";
  const initialTab = (initialSubject || initialTopic) ? "ai" : "list";

  const [activeTab, setActiveTab] = useState<"list" | "ai" | "manual">(initialTab);
  
  const [tests, setTests] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Test Form State
  const [manualClassId, setManualClassId] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualQuestionCount, setManualQuestionCount] = useState("20");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAnswerKey, setManualAnswerKey] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // AI Generator Form State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{questions: TestQuestion[]} | null>(null);
  const [aiFormData, setAiFormData] = useState({
    grade: "8-sinf",
    subject: initialSubject || "O'zbekiston tarixi",
    topic: initialTopic || "",
    questionsCount: "10",
    difficulty: "O'rta"
  });

  // AI Save to Database Modal
  const [isAiSaveModalOpen, setIsAiSaveModalOpen] = useState(false);
  const [aiSelectedClassId, setAiSelectedClassId] = useState("");
  const [aiCustomTitle, setAiCustomTitle] = useState("");
  const [isAiSaving, setIsAiSaving] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState("");

  // A4 Print & DTM Sheet Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{
    title: string;
    subject: string;
    grade?: string;
    questions: TestQuestion[];
  } | null>(null);

  useEffect(() => {
    if (initialSubject || initialTopic) {
      setAiFormData(prev => ({
        ...prev,
        subject: initialSubject || prev.subject,
        topic: initialTopic || prev.topic
      }));
      setActiveTab("ai");
    }
  }, [initialSubject, initialTopic]);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) {
          setManualClassId(data[0].id);
          setAiSelectedClassId(data[0].id);
        }
      }
    } catch {
      console.error("Classes error");
    }
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tests");
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch {
      toast.error("Testlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTests();
  }, []);

  // Handle Manual Test Creation
  const handleCreateManualTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      toast.error("Test nomini kiriting");
      return;
    }
    if (!manualClassId) {
      toast.error("Iltimos, sinfni tanlang");
      return;
    }

    setIsSubmittingManual(true);
    try {
      const questionsCountNum = parseInt(manualQuestionCount) || 20;
      const cleanKey = manualAnswerKey.trim().toUpperCase().replace(/\s+/g, '');
      
      const payload = {
        title: manualTitle,
        subject: manualSubject || "Umumiy",
        classId: manualClassId,
        questionCount: questionsCountNum,
        date: manualDate,
        answerKey: cleanKey
      };

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Testni saqlashda xatolik");
      }

      toast.success("Test muvaffaqiyatli yaratildi!");
      setManualTitle("");
      setManualAnswerKey("");
      await fetchTests();
      setActiveTab("list");
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Handle AI Test Generation
  const handleGenerateAiTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiFormData.topic.trim()) {
      toast.error("Iltimos, dars mavzusini kiriting");
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/test-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: aiFormData.grade,
          subject: aiFormData.subject,
          topic: aiFormData.topic,
          questionsCount: parseInt(aiFormData.questionsCount) || 10,
          difficulty: aiFormData.difficulty
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 || data.limitExceeded || data.error?.toLowerCase().includes('limit') || data.error?.toLowerCase().includes('kredit')) {
          setIsLimitModalOpen(true);
          setLimitErrorMessage(data.error || "AI funksiyasidan foydalanish uchun limitingiz yetarli emas.");
          return;
        }
        throw new Error(data.error || "AI test yaratishda xatolik yuz berdi");
      }

      setAiResult(data);
      setAiCustomTitle(`${aiFormData.subject}: ${aiFormData.topic}`);
      toast.success("AI Test savollari tayyorlandi!");
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setAiLoading(false);
    }
  };

  // Save AI Test to Database
  const handleSaveAiTest = async () => {
    if (!aiResult || !aiResult.questions) return;
    if (!aiSelectedClassId) {
      toast.error("Iltimos, sinfni tanlang");
      return;
    }

    setIsAiSaving(true);
    try {
      const answerKeyString = aiResult.questions
        .map((q, i) => `${i + 1}${q.correct_answer}`)
        .join(" ");

      const payload = {
        title: aiCustomTitle || `${aiFormData.subject} (${aiFormData.topic})`,
        subject: aiFormData.subject,
        classId: aiSelectedClassId,
        questionCount: aiResult.questions.length,
        date: new Date().toISOString().split('T')[0],
        answerKey: answerKeyString
      };

      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Testni saqlashda xatolik");
      }

      toast.success("Test bazaga muvaffaqiyatli saqlandi!");
      setIsAiSaveModalOpen(false);
      await fetchTests();
      setActiveTab("list");
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setIsAiSaving(false);
    }
  };

  // Delete Test
  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Haqiqatan ham ushbu testni o'chirmoqchimisiz?")) return;

    try {
      const res = await fetch(`/api/tests?id=${testId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Test o'chirildi");
        setTests(prev => prev.filter(t => t.id !== testId));
      } else {
        toast.error("O'chirishda xatolik");
      }
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
      
      {/* Header */}
      <SectionHeader
        title="Testlar Boshqaruvi"
        subtitle="AI yordamida avtomatik test tuzish, DTM javob varaqalarini chop etish va kalitlarni saqlash."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Mening testlarim ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Test Tuzish</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ✍️ Qo'lda Kalit Kiritish
            </button>
          </div>
        }
      />

      {/* Tab 1: Mening Testlarim */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : tests.length === 0 ? (
            <EmptyState
              icon={FileSignature}
              title="Sizda hali yaratilgan testlar mavjud emas"
              description="Daftar yoki testlarni tekshirishdan oldin AI yordamida test tuzing yoki tayyor test kalitini kiriting."
              actionText="🤖 AI orqali test yaratish"
              onAction={() => setActiveTab('ai')}
              secondaryText="✍️ Qo'lda kalit kiritish"
              onSecondaryAction={() => setActiveTab('manual')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                        {test.class?.name || "Barcha sinflar"} • {test.subject}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {test.date ? new Date(test.date).toLocaleDateString('uz-UZ') : ''}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {test.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span>Savollar soni: <b>{test.questionCount} ta</b></span>
                      <span>Tekshirildi: <b>{test._count?.attempts || 0} nafar</b></span>
                    </div>

                    {test.answerKey && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate">
                        Kalit: <b>{test.answerKey}</b>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/report?testId=${test.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <FileBarChart className="w-3.5 h-3.5" />
                        <span>Natijalar</span>
                      </Link>

                      <button
                        onClick={() => {
                          setPrintData({
                            title: test.title,
                            subject: test.subject,
                            grade: test.class?.name,
                            questions: Array.from({ length: test.questionCount }).map((_, idx) => ({
                              question: `${idx + 1}-savol`,
                              options: ['A', 'B', 'C', 'D'],
                              correct_answer: test.answerKey?.[idx] || 'A'
                            }))
                          });
                          setIsPrintModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>DTM Varaqasi</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: AI orqali Test Tuzish */}
      {activeTab === 'ai' && (
        <div className="space-y-8">
          
          <form onSubmit={handleGenerateAiTest} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>AI orqali test savollarini avtomatik tuzish</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Dars mavzusi bo'yicha to'g'ri va xato variantlari bilan tayyor testlar shakllanadi</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Sinf *</label>
                <select
                  value={aiFormData.grade}
                  onChange={(e) => setAiFormData({ ...aiFormData, grade: e.target.value })}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {["5-sinf", "6-sinf", "7-sinf", "8-sinf", "9-sinf", "10-sinf", "11-sinf"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Fan *</label>
                <input
                  type="text"
                  value={aiFormData.subject}
                  onChange={(e) => setAiFormData({ ...aiFormData, subject: e.target.value })}
                  placeholder="Masalan: Fizika, Biologiya"
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Savollar soni</label>
                <select
                  value={aiFormData.questionsCount}
                  onChange={(e) => setAiFormData({ ...aiFormData, questionsCount: e.target.value })}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="5">5 ta savol</option>
                  <option value="10">10 ta savol</option>
                  <option value="15">15 ta savol</option>
                  <option value="20">20 ta savol</option>
                  <option value="30">30 ta savol</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Qiyinlik darajasi</label>
                <select
                  value={aiFormData.difficulty}
                  onChange={(e) => setAiFormData({ ...aiFormData, difficulty: e.target.value })}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Oson">Oson (Boshlang'ich)</option>
                  <option value="O'rta">O'rta (Standart maktab)</option>
                  <option value="Qiyin">Qiyin (Olimpiada / DTM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Dars mavzusini yozing *</label>
              <input
                type="text"
                placeholder="Masalan: Amir Temurning harbiy yurishlari va davlat boshqaruvi"
                value={aiFormData.topic}
                onChange={(e) => setAiFormData({ ...aiFormData, topic: e.target.value })}
                className="w-full p-4 text-xs sm:text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={aiLoading}
              className="w-full py-4 text-base font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>AI Test savollarini tuzmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>AI orqali Test Savollarini Yaratish</span>
                </>
              )}
            </Button>
          </form>

          {/* AI Result Preview */}
          {aiResult && aiResult.questions && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    AI tomonidan {aiResult.questions.length} ta savol tayyorlandi!
                  </h3>
                  <p className="text-xs text-slate-500">Testni bazaga saqlashingiz yoki A4 DTM varaqasi qilib chop etishingiz mumkin</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPrintData({
                        title: `${aiFormData.subject}: ${aiFormData.topic}`,
                        subject: aiFormData.subject,
                        grade: aiFormData.grade,
                        questions: aiResult.questions
                      });
                      setIsPrintModalOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>DTM Chop etish</span>
                  </button>

                  <button
                    onClick={() => setIsAiSaveModalOpen(true)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Bazaga Saqlash</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {aiResult.questions.map((q, i) => (
                  <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {i + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pl-2">
                      {q.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border ${
                            opt.startsWith(q.correct_answer) || opt === q.correct_answer
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Tab 3: Qo'lda Kalit Kiritish */}
      {activeTab === 'manual' && (
        <form onSubmit={handleCreateManualTest} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>✍️ Qog'ozdagi test kalitlarini tezkor kiritish</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">O'zingizda mavjud test kalitini kiritasiz va o'quvchilar javobini AI orqali tekshirasiz</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">1. Test nomi *</label>
              <input
                type="text"
                placeholder="Masalan: 1-Chorak yakuniy nazorat ishi"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full p-3.5 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">2. Sinfni tanlang *</label>
                <select
                  value={manualClassId}
                  onChange={(e) => setManualClassId(e.target.value)}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">3. Fan</label>
                <input
                  type="text"
                  placeholder="Masalan: Ona tili"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">4. Savollar soni</label>
              <input
                type="number"
                min="1"
                max="100"
                value={manualQuestionCount}
                onChange={(e) => setManualQuestionCount(e.target.value)}
                className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                5. To'g'ri javoblar kaliti (Harflar ketma-ketligi) *
              </label>
              <input
                type="text"
                placeholder="Masalan: ABCDABCDAB yoki 1A 2B 3C..."
                value={manualAnswerKey}
                onChange={(e) => setManualAnswerKey(e.target.value.toUpperCase())}
                className="w-full p-4 text-xs sm:text-base font-mono uppercase font-black tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Harflarni ketma-ket yozishingiz mumkin (Masalan: ABDCBAACCD)</p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmittingManual}
            className="w-full py-4 text-base font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {isSubmittingManual ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Testni Saqlash</span>}
          </Button>
        </form>
      )}

      {/* Save AI Test Modal */}
      {isAiSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Testni qaysi sinfga biriktiramiz?
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Test nomi</label>
              <input
                type="text"
                value={aiCustomTitle}
                onChange={(e) => setAiCustomTitle(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Sinf</label>
              <select
                value={aiSelectedClassId}
                onChange={(e) => setAiSelectedClassId(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAiSaveModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveAiTest}
                disabled={isAiSaving}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {isAiSaving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DTM / A4 Print Modal */}
      {isPrintModalOpen && printData && (
        <TestPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={printData.title}
          subject={printData.subject}
          grade={printData.grade}
          questions={printData.questions}
        />
      )}

      {/* Limit Exceeded Modal */}
      <LimitExceededModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        message={limitErrorMessage}
      />

    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>}>
      <TestsPageContent />
    </Suspense>
  );
}
