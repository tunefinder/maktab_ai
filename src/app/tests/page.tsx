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
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import Link from "next/link";
import TestPrintModal from "@/components/TestPrintModal";

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

  // AI Generator Form State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{questions: TestQuestion[]} | null>(null);
  const [aiFormData, setAiFormData] = useState({
    grade: "",
    subject: initialSubject,
    topic: initialTopic,
    questionsCount: "5",
    difficulty: "O'rta"
  });

  // AI Save to Database Modal
  const [isAiSaveModalOpen, setIsAiSaveModalOpen] = useState(false);
  const [aiSelectedClassId, setAiSelectedClassId] = useState("");
  const [aiCustomTitle, setAiCustomTitle] = useState("");
  const [isAiSaving, setIsAiSaving] = useState(false);

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
      const data = await res.json();
      if (Array.isArray(data)) {
        setClasses(data);
        if (data.length > 0) {
          setManualClassId(data[0].id);
          setAiSelectedClassId(data[0].id);
        }
      }
    } catch {
      toast.error("Sinflarni yuklashda xatolik");
    }
  };

  const fetchTests = async () => {
    try {
      const res = await fetch("/api/tests");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTests(data);
      }
      setLoading(false);
    } catch {
      toast.error("Testlarni yuklashda xatolik");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTests();
  }, []);

  // Handle Manual Test Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClassId || !manualSubject || !manualTitle || !manualAnswerKey) {
      return toast.error("Barcha maydonlarni to'ldiring");
    }
    
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: manualClassId,
          subject: manualSubject,
          title: manualTitle,
          questionCount: manualQuestionCount,
          date: manualDate,
          answerKey: manualAnswerKey
        })
      });
      
      if (res.ok) {
        toast.success("Test muvaffaqiyatli yaratildi");
        setManualSubject("");
        setManualTitle("");
        setManualAnswerKey("");
        setActiveTab("list");
        fetchTests();
      } else {
        toast.error("Xatolik yuz berdi");
      }
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  // Handle AI Test Generate
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiResult(null);

    try {
      const response = await fetch("/api/test-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiFormData),
      });

      if (!response.ok) throw new Error("Xatolik yuz berdi");

      const data = await response.json();
      setAiResult(data);
      setAiCustomTitle(`${aiFormData.subject} - ${aiFormData.topic}`);
      toast.success("AI Test savollari tayyor!");
    } catch {
      toast.error("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setAiLoading(false);
    }
  };

  // Handle AI Test Save to DB
  const handleAiSaveToDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResult || aiResult.questions.length === 0) return;
    if (!aiSelectedClassId) {
      toast.error("Iltimos, avval sinfni tanlang");
      return;
    }

    setIsAiSaving(true);

    try {
      const answerKeyParts = aiResult.questions.map((q, i) => {
        const correctIdx = q.options.findIndex(opt => opt === q.correct_answer);
        const letter = correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : "A";
        return `${i + 1}-${letter}`;
      });
      const answerKey = answerKeyParts.join(", ");

      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: aiSelectedClassId,
          subject: aiFormData.subject,
          title: aiCustomTitle || `${aiFormData.subject} - ${aiFormData.topic}`,
          questionCount: aiResult.questions.length.toString(),
          date: new Date().toISOString().split("T")[0],
          answerKey
        })
      });

      if (res.ok) {
        toast.success("Test muvaffaqiyatli saqlandi!");
        setIsAiSaveModalOpen(false);
        setActiveTab("list");
        fetchTests();
      } else {
        toast.error("Saqlashda xatolik yuz berdi");
      }
    } catch {
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsAiSaving(false);
    }
  };

  const downloadPDF = () => {
    if (!aiResult) return;
    
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("TEST SAVOLLARI", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Fan: ${aiFormData.subject} | Sinf: ${aiFormData.grade}`, 20, 30);
    doc.text(`Mavzu: ${aiFormData.topic}`, 20, 40);
    
    let yPos = 55;
    
    aiResult.questions.forEach((q, i) => {
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
    
    doc.save(`testlar-${aiFormData.topic}.pdf`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Test va uning barcha natijalari o'chiriladi. Rozimisiz?")) return;
    try {
      const res = await fetch(`/api/tests/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Test o'chirildi");
        fetchTests();
      }
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header with Title & Action Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Testlar Markazi</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Testlar bazasi va AI yordamida tezkor tuzish</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "list"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Mening Testlarim ({tests.length})
          </button>
          
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "ai"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-primary hover:bg-primary/10"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Test Yaratish
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "manual"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Plus className="w-4 h-4" />
            Qo&apos;lda kalit kiritish
          </button>
        </div>
      </div>

      {/* TAB 1: LIST OF TESTS */}
      {activeTab === "list" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {loading ? (
            <div className="text-center p-12 text-slate-400">Yuklanmoqda...</div>
          ) : tests.length === 0 ? (
            <div className="text-center p-16 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-dashed rounded-3xl space-y-4">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Hali hech qanday test yaratilmagan</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI yordamida bir necha soniyada test yaratishingiz yoki qo&apos;lda kalit kiritishingiz mumkin.</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button onClick={() => setActiveTab("ai")} className="bg-primary hover:opacity-95" leftIcon={<Sparkles className="w-4 h-4" />}>
                  AI Bilan Test Yaratish
                </Button>
                <Button onClick={() => setActiveTab("manual")} variant="outline" leftIcon={<Plus className="w-4 h-4" />}>
                  Qo&apos;lda Kiritish
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tests.map(test => (
                <Card key={test.id} className="flex flex-col h-full border hover:border-primary/40 hover:shadow-md transition-all group bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full">
                        {test.class?.name || 'Sinf'}
                      </span>
                      <button 
                        onClick={() => handleDelete(test.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">{test.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{test.subject}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(test.date).toLocaleDateString()}
                      </div>
                      <div>📝 {test.questionCount} ta savol</div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        ✅ {test._count?.attempts || 0} ta topshirilgan
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-xl flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[180px]">
                      Kalit: {test.answerKey}
                    </span>
                    <Link href={`/report?testId=${test.id}`}>
                      <span className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        Tahlil <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI TEST GENERATOR */}
      {activeTab === "ai" && (
        <div className="animate-in fade-in duration-300">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
              <form onSubmit={handleAiSubmit} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700 text-primary font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Test Parametrlari</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fan</label>
                  <input 
                    type="text" required
                    placeholder="Masalan: Biologiya"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={aiFormData.subject}
                    onChange={(e) => setAiFormData({...aiFormData, subject: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sinf</label>
                  <input 
                    type="text" required
                    placeholder="Masalan: 8"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={aiFormData.grade}
                    onChange={(e) => setAiFormData({...aiFormData, grade: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mavzu</label>
                  <input 
                    type="text" required
                    placeholder="Masalan: Fotosintez jarayoni"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={aiFormData.topic}
                    onChange={(e) => setAiFormData({...aiFormData, topic: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Savollar soni</label>
                    <input 
                      type="number" required max="20" min="1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={aiFormData.questionsCount}
                      onChange={(e) => setAiFormData({...aiFormData, questionsCount: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Qiyinlik darajasi</label>
                    <select 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={aiFormData.difficulty}
                      onChange={(e) => setAiFormData({...aiFormData, difficulty: e.target.value})}
                    >
                      <option value="Oson">Oson</option>
                      <option value="O'rta">O&apos;rta</option>
                      <option value="Qiyin">Qiyin</option>
                    </select>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={aiLoading}
                  className="w-full mt-2"
                  leftIcon={aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                >
                  {aiLoading ? "Test yaratilmoqda..." : "Testni Yaratish"}
                </Button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col min-h-[450px]">
              {aiResult ? (
                <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3 bg-white/90 dark:bg-slate-800/90 rounded-t-2xl shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Natija: {aiResult.questions.length} ta savol
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setPrintData({
                            title: aiFormData.topic || "Mavzulashtirilgan test",
                            subject: aiFormData.subject || "Fan",
                            grade: aiFormData.grade || "",
                            questions: aiResult.questions
                          });
                          setIsPrintModalOpen(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs shadow-sm"
                        leftIcon={<Printer className="w-4 h-4" />}
                      >
                        A4 Chop etish & DTM
                      </Button>
                      <Button 
                        onClick={() => setIsAiSaveModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs"
                        leftIcon={<BookmarkPlus className="w-4 h-4" />}
                      >
                        Bazaga saqlash
                      </Button>
                      <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF yuklash</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6 max-h-[600px] custom-scrollbar">
                    {aiResult.questions.map((q, i) => (
                      <div key={i} className="bg-slate-50/70 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm relative">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3 flex gap-2">
                          <span className="text-primary font-black">{i + 1}.</span> 
                          {q.question}
                        </h3>
                        
                        <div className="space-y-2">
                          {q.options.map((opt, idx) => {
                            const isCorrect = opt === q.correct_answer;
                            return (
                              <div 
                                key={idx} 
                                className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs sm:text-sm ${
                                  isCorrect 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 font-semibold' 
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <span>{opt}</span>
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 p-2 rounded-lg">
                          <span className="font-bold">Izoh:</span> {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[400px]">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Chapdagi maydonlarni to&apos;ldiring va &quot;Testni Yaratish&quot; tugmasini bosing.</p>
                  <p className="text-xs text-slate-400 mt-1">Sun&apos;iy intellekt darslik standarti bo&apos;yicha savollar va javob kalitini tayyorlaydi.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL TEST FORM */}
      {activeTab === "manual" && (
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-300 max-w-2xl mx-auto">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
              <Plus className="w-4 h-4" />
              <span>Qo&apos;lda Test va Kalit Kiritish</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sinf</label>
                <select 
                  value={manualClassId} 
                  onChange={e => setManualClassId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-slate-900 text-sm"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fan</label>
                <input 
                  type="text" value={manualSubject} onChange={e => setManualSubject(e.target.value)}
                  placeholder="Masalan: Matematika"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Test nomi</label>
                <input 
                  type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)}
                  placeholder="Algebra - 3-test"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sana</label>
                <input 
                  type="date" value={manualDate} onChange={e => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:bg-slate-900"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Savollar soni</label>
                <input 
                  type="number" min="1" max="100" value={manualQuestionCount} onChange={e => setManualQuestionCount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Javob kaliti (ABCD)</label>
              <textarea 
                rows={4}
                value={manualAnswerKey}
                onChange={e => setManualAnswerKey(e.target.value)}
                placeholder="1-A, 2-B, 3-C, 4-D..."
                className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none font-mono text-sm dark:bg-slate-900"
              />
              <p className="text-xs text-slate-400 mt-1">Har bir savol raqami va uning javobini vergul bilan ajratib kiriting.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Button type="button" variant="outline" onClick={() => setActiveTab("list")}>Bekor qilish</Button>
              <Button type="submit">Testni saqlash</Button>
            </div>
          </form>
        </Card>
      )}

      {/* AI Save to Database Modal */}
      {isAiSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookmarkPlus className="w-5 h-5 text-emerald-600" />
                Testni bazaga saqlash
              </h3>
              <button 
                onClick={() => setIsAiSaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAiSaveToDatabase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Qaysi sinfga biriktiriladi?
                </label>
                {classes.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Sinflar topilmadi. Avval &quot;Sinflar&quot; bo&apos;limida sinf yarating.
                  </p>
                ) : (
                  <select 
                    value={aiSelectedClassId}
                    onChange={(e) => setAiSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
                  value={aiCustomTitle}
                  onChange={(e) => setAiCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="Test nomini kiriting"
                  required
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                <p><strong>Savollar soni:</strong> {aiResult?.questions.length} ta</p>
                <p className="mt-1"><strong>Fan:</strong> {aiFormData.subject}</p>
                <p className="mt-1">Javob kaliti avtomatik ravishda shakllantirilib, &quot;Tekshirish&quot; moduli bilan bog&apos;lanadi.</p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAiSaveModalOpen(false)}
                >
                  Bekor qilish
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  loading={isAiSaving}
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

      {/* A4 Print & DTM Sheet Modal */}
      {printData && (
        <TestPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title={printData.title}
          subject={printData.subject}
          grade={printData.grade}
          questions={printData.questions}
        />
      )}
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Yuklanmoqda...</div>}>
      <TestsPageContent />
    </Suspense>
  );
}
