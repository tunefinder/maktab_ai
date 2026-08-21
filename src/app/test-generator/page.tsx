"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileSignature, Sparkles, Loader2, Download, CheckCircle2, BookmarkPlus, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/Button";
import LimitExceededModal from "@/components/LimitExceededModal";

interface TestQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface ClassItem {
  id: string;
  name: string;
}

function TestGeneratorContent() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get('subject') || "";
  const initialTopic = searchParams.get('topic') || "";

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{questions: TestQuestion[]} | null>(null);

  const [formData, setFormData] = useState({
    grade: "",
    subject: initialSubject,
    topic: initialTopic,
    questionsCount: "5",
    difficulty: "O'rta"
  });

  // Save to database modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState("");

  useEffect(() => {
    if (initialSubject || initialTopic) {
      setFormData(prev => ({
        ...prev,
        subject: initialSubject || prev.subject,
        topic: initialTopic || prev.topic
      }));
    }
  }, [initialSubject, initialTopic]);

  useEffect(() => {
    fetch("/api/classes")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data);
          if (data.length > 0) setSelectedClassId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 || data.limitExceeded || data.error?.toLowerCase().includes('limit') || data.error?.toLowerCase().includes('kredit')) {
          setIsLimitModalOpen(true);
          setLimitErrorMessage(data.error || "AI funksiyasidan foydalanish uchun limitingiz yetarli emas.");
          return;
        }
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setResult(data);
      setCustomTitle(`${formData.subject} - ${formData.topic}`);
      toast.success("Test savollari tayyor!");
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSaveModal = () => {
    if (!result || result.questions.length === 0) return;
    setIsSaveModalOpen(true);
  };

  const handleSaveToDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || result.questions.length === 0) return;
    if (!selectedClassId) {
      toast.error("Iltimos, avval sinfni tanlang yoki yarating");
      return;
    }

    setIsSaving(true);

    try {
      // Build answer key: 1-A, 2-C, etc.
      const answerKeyParts = result.questions.map((q, i) => {
        const correctIdx = q.options.findIndex(opt => opt === q.correct_answer);
        const letter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : "A";
        return `${i + 1}-${letter}`;
      });
      const answerKey = answerKeyParts.join(", ");

      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          subject: formData.subject,
          title: customTitle || `${formData.subject} - ${formData.topic}`,
          questionCount: result.questions.length.toString(),
          date: new Date().toISOString().split("T")[0],
          answerKey
        })
      });

      if (res.ok) {
        toast.success("Test muvaffaqiyatli bazaga saqlandi!");
        setIsSaveModalOpen(false);
      } else {
        toast.error("Saqlashda xatolik yuz berdi");
      }
    } catch {
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("TEST SAVOLLARI", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Fan: ${formData.subject} | Sinf: ${formData.grade}`, 20, 30);
    doc.text(`Mavzu: ${formData.topic}`, 20, 40);
    
    let yPos = 55;
    
    result.questions.forEach((q, i) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      const splitQuestion = doc.splitTextToSize(`${i + 1}. ${q.question}`, 170);
      doc.text(splitQuestion, 20, yPos);
      yPos += (splitQuestion.length * 7) + 2;
      
      doc.setFontSize(11);
      q.options.forEach((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        doc.text(`${letter}) ${opt}`, 25, yPos);
        yPos += 7;
      });
      
      yPos += 5;
    });
    
    doc.save(`testlar-${formData.topic}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
          <FileSignature className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Test Yaratuvchi</h1>
          <p className="text-slate-500">Istalgan mavzuda bir necha soniyada test savollari tayyorlang</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-800/80 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fan</label>
              <input 
                type="text" required
                placeholder="Masalan: Biologiya"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sinf</label>
              <input 
                type="text" required
                placeholder="Masalan: 8"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mavzu</label>
              <input 
                type="text" required
                placeholder="Masalan: Yurak"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Savollar</label>
                <input 
                  type="number" required max="20" min="1"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  value={formData.questionsCount}
                  onChange={(e) => setFormData({...formData, questionsCount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qiyinlik</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-900 dark:text-slate-100"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                >
                  <option value="Oson">Oson</option>
                  <option value="O'rta">O&apos;rta</option>
                  <option value="Qiyin">Qiyin</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? "Yaratilmoqda..." : "Test yaratish"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-12rem)]">
          {result ? (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-800 sticky top-0 z-10 rounded-t-2xl shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Natija: {result.questions.length} ta savol
                </h2>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleOpenSaveModal}
                    className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs"
                    leftIcon={<BookmarkPlus className="w-4 h-4" />}
                  >
                    Bazaga saqlash
                  </Button>
                  <button onClick={downloadPDF} className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF yuklash</span>
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-8 bg-slate-50/50 dark:bg-slate-800/30">
                {result.questions.map((q, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4 pl-2 flex gap-3">
                      <span className="text-indigo-500 font-bold">{i + 1}.</span> 
                      {q.question}
                    </h3>
                    
                    <div className="space-y-3 pl-8">
                      {q.options.map((opt, idx) => {
                        const isCorrect = opt === q.correct_answer;
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              isCorrect 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-300 font-medium' 
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-5 pl-8 text-sm">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
                        <span className="font-semibold">Izoh:</span> <span className="dark:text-blue-300/80">{q.explanation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center h-full">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <FileSignature className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p>Chap tomondagi formani to&apos;ldiring va<br/>test savollarini kuting.</p>
            </div>
          )}
        </div>
      </div>

      {/* Save to Database Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-emerald-600" />
                Testni bazaga saqlash
              </h3>
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveToDatabase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Qaysi sinfga biriktiriladi?
                </label>
                {classes.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Sinflar topilmadi. Avval &quot;Sinflar&quot; bo&apos;limida sinf yarating.
                  </p>
                ) : (
                  <select 
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Test nomi
                </label>
                <input 
                  type="text" 
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Test nomini kiriting"
                  required
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                <p><strong>Savollar soni:</strong> {result?.questions.length} ta</p>
                <p className="mt-1"><strong>Fan:</strong> {formData.subject}</p>
                <p className="mt-1">Javob kaliti avtomatik shakllantirilib, &quot;Tekshirish&quot; moduli bilan to&apos;g&apos;ridan-to&apos;g&apos;ri ulanadi.</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSaveModalOpen(false)}
                >
                  Bekor qilish
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  loading={isSaving}
                  disabled={classes.length === 0}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Saqlash
                </Button>
              </div>
            </form>
          </div>
        </div>
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

export default function TestGenerator() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Yuklanmoqda...</div>}>
      <TestGeneratorContent />
    </Suspense>
  );
}
