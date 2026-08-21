"use client";

import { useState, useRef } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  Clock, 
  Target, 
  CheckCircle, 
  Upload, 
  X, 
  Printer, 
  FileText, 
  GraduationCap, 
  HelpCircle, 
  ArrowRight,
  Layers,
  Zap,
  RefreshCw
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useHistory } from "@/hooks/useHistory";
import LimitExceededModal from "@/components/LimitExceededModal";

interface LessonPhase {
  phase_name: string;
  duration: number;
  teacher_action: string;
  student_action: string;
}

interface AdvancedLessonPlan {
  title: string;
  image_prompt?: string;
  objectives: string[];
  resources: string[];
  phases: LessonPhase[];
  assessment: string;
  homework: string;
  quiz?: { question: string; options: string[]; correct_answer: string }[];
  date?: string;
  grade?: string;
  subject?: string;
}

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

export default function LessonPlanner() {
  const [selectedResult, setSelectedResult] = useState<AdvancedLessonPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  
  const reportRef = useRef<HTMLDivElement>(null);
  const { history, addHistory } = useHistory<AdvancedLessonPlan>("lesson_history");

  const [formData, setFormData] = useState({
    grade: "7-sinf",
    subject: "Biologiya",
    topic: "",
    duration: "45",
  });
  const [file, setFile] = useState<File | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState("");

  const { object: streamedResult, submit, isLoading, error } = useObject({
    api: '/api/lesson-planner',
    schema: schema,
    onFinish: ({ object }) => {
       if (object) {
         const newPlan = { 
           ...object, 
           date: new Date().toLocaleString("uz-UZ"), 
           grade: formData.grade, 
           subject: formData.subject 
         } as AdvancedLessonPlan;
         setSelectedResult(newPlan);
         addHistory(newPlan);
         toast.success("Dars rejasi muvaffaqiyatli tayyorlandi!");
       }
    },
    onError: (err) => {
       if (err.message?.toLowerCase().includes('limit') || err.message?.toLowerCase().includes('kredit')) {
         setIsLimitModalOpen(true);
         setLimitErrorMessage(err.message || "AI funksiyasidan foydalanish uchun limitingiz yetarli emas.");
         return;
       }
       toast.error(err.message || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      toast.error("Iltimos, dars mavzusini kiriting");
      return;
    }

    setSelectedResult(null);
    
    let base64File = null;
    let mimeType = null;
    let fileName = null;
    
    if (file) {
      toast.loading("Fayl yuklanmoqda...", { id: "fileLoad" });
      base64File = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });
      mimeType = file.type;
      fileName = file.name;
      toast.dismiss("fileLoad");
    }

    submit({
      grade: formData.grade,
      subject: formData.subject,
      topic: formData.topic,
      duration: formData.duration,
      fileData: base64File ? { data: base64File, mimeType, name: fileName } : null
    });
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setExportingPdf(true);
    toast.loading("PDF shakllantirilmoqda...", { id: "pdfToast" });

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Dars_Rejasi_${formData.topic.replace(/\s+/g, '_') || 'MaktabAI'}.pdf`);
      toast.success("PDF muvaffaqiyatli yuklab olindi!", { id: "pdfToast" });
    } catch {
      toast.error("PDF yuklashda xatolik yuz berdi", { id: "pdfToast" });
    } finally {
      setExportingPdf(false);
    }
  };

  const currentPlan = selectedResult || (isLoading ? streamedResult : null);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
      
      {/* Header */}
      <SectionHeader
        title="Dars Rejasi Yaratuvchi"
        subtitle="AI metodist yordamida 45 daqiqalik to'liq dars ishlanmasi, o'yinlar va testlar tuzing."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              + Yangi Dars Tuzish
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Tarix ({history.length})
            </button>
          </div>
        }
      />

      {activeTab === 'history' ? (
        // History View
        <div className="space-y-4">
          {history.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Saqlangan dars rejalari yo'q"
              description="Siz hali dars rejasi yaratmadingiz. Birinchi dars rejangizni hoziroq tuzing!"
              actionText="Dars tuzishni boshlash"
              onAction={() => setActiveTab('create')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((h, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedResult(h); setActiveTab('create'); }}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{h.grade} • {h.subject}</span>
                    <span>{h.date || 'Saqlangan'}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{h.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{h.objectives?.[0] || 'Dars rejasi'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Main Creation View
        <div className="space-y-8">
          
          {/* Step-by-Step Creation Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Dars parametrlarini kiriting</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Har bir maydon AI uchun aniq ko'rsatma beradi</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Sinf */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  1. Sinfni tanlang *
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {["1-sinf", "2-sinf", "3-sinf", "4-sinf", "5-sinf", "6-sinf", "7-sinf", "8-sinf", "9-sinf", "10-sinf", "11-sinf"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Fan */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  2. Fanni tanlang *
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Biologiya, Tarix, Matematika..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Davomiylik */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  3. Dars davomiyligi
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="45">45 daqiqa (Standart maktab darsi)</option>
                  <option value="80">80 daqiqa (Juftlik / Para)</option>
                  <option value="30">30 daqiqa (Qisqa dars)</option>
                </select>
              </div>

            </div>

            {/* Mavzu */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                4. Dars mavzusini yozing *
              </label>
              <input
                type="text"
                placeholder="Masalan: Yurakning tuzilishi va qon aylanish doiralari"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full p-4 text-xs sm:text-base font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:font-normal placeholder:text-slate-400"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Mavzuni qanchalik aniq yozsangiz, AI shunchalik mukammal reja tuzadi.</p>
            </div>

            {/* Optional Material Upload */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                5. Qo'shimcha darslik yoki konspekt (Ixtiyoriy)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {file ? file.name : "Word (.docx), PDF yoki darslik rasmini yuklang"}
                  </span>
                  <input
                    type="file"
                    accept=".docx,.pdf,image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"
                    title="Faylni o'chirish"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 text-base font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>AI Dars rejasini tuzmoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Dars Rejasini Yaratish</span>
                  </>
                )}
              </Button>
            </div>

          </form>

          {/* Generated Result Container */}
          {currentPlan && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Tayyor dars ishlanmasi
                  </h3>
                  <p className="text-xs text-slate-500">A4 formatda yuklab olish yoki chop etish mumkin</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={exportingPdf}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Yuklab olish</span>
                  </button>
                </div>
              </div>

              {/* Printable Lesson Plan Card */}
              <div
                ref={reportRef}
                className="p-8 sm:p-12 bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-lg space-y-8"
              >
                {/* Header */}
                <div className="border-b-2 border-indigo-600 pb-6 text-center space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    O'zbekiston Respublikasi Maktab Ta'limi
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950">
                    {currentPlan.title || formData.topic}
                  </h1>
                  <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600 pt-1">
                    <span>Sinf: {formData.grade}</span>
                    <span>•</span>
                    <span>Fan: {formData.subject}</span>
                    <span>•</span>
                    <span>Vaqt: {formData.duration} daqiqa</span>
                  </div>
                </div>

                {/* Objectives */}
                {currentPlan.objectives && currentPlan.objectives.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase text-indigo-700 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>1. Darsning Maqsadi va Kutiladigan Natijalar:</span>
                    </h3>
                    <ul className="space-y-1.5 pl-6 list-disc text-xs sm:text-sm text-slate-700">
                      {currentPlan.objectives.map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Resources */}
                {currentPlan.resources && currentPlan.resources.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase text-indigo-700 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>2. Kerakli Jihozlar va Resurslar:</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 pl-6">
                      {currentPlan.resources.join(", ")}
                    </p>
                  </div>
                )}

                {/* Phases Breakdown Table */}
                {currentPlan.phases && currentPlan.phases.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase text-indigo-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>3. Dars Bosqichlari va Vaqt Taqsimoti:</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 w-1/4">Bosqich</th>
                            <th className="py-2.5 px-3 w-16 text-center">Vaqt</th>
                            <th className="py-2.5 px-3">O'qituvchi faoliyati</th>
                            <th className="py-2.5 px-3">O'quvchi faoliyati</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentPlan.phases.map((ph, i) => (
                            <tr key={i} className="hover:bg-slate-50/60">
                              <td className="py-3 px-3 font-bold text-slate-900 align-top">{ph?.phase_name || ''}</td>
                              <td className="py-3 px-3 font-bold text-indigo-600 text-center align-top">{ph?.duration || 0} daq</td>
                              <td className="py-3 px-3 text-slate-700 align-top">{ph?.teacher_action || ''}</td>
                              <td className="py-3 px-3 text-slate-700 align-top">{ph?.student_action || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Homework & Assessment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="text-xs font-black uppercase text-indigo-700">Baholash mezonlari:</h4>
                    <p className="text-xs text-slate-700">{currentPlan.assessment || 'Faol ishtirok va test natijalari asosida'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <h4 className="text-xs font-black uppercase text-indigo-700">Uyga vazifa:</h4>
                    <p className="text-xs text-slate-700">{currentPlan.homework || 'Mavzuni takrorlash va mashqlarni bajarish'}</p>
                  </div>
                </div>

                {/* 10 Test Questions */}
                {currentPlan.quiz && currentPlan.quiz.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <h3 className="text-sm font-black uppercase text-indigo-700 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>4. Mustahkamlash Uchun Test Savollari (10 ta):</span>
                    </h3>
                    <div className="space-y-3">
                      {currentPlan.quiz.map((q, i) => (
                        <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                          <p className="font-bold text-slate-900">{i + 1}. {q?.question || ''}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 pl-2">
                            {q?.options?.map((opt, idx) => (
                              <span key={idx} className={opt === q?.correct_answer ? "font-bold text-emerald-600" : ""}>
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

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
