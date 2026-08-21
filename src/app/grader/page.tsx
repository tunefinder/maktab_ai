"use client";

import { useState, useEffect } from "react";
import { 
  CheckSquare, 
  Upload, 
  X, 
  AlertCircle, 
  Save, 
  FileText, 
  BookOpen, 
  CheckCircle, 
  Sparkles, 
  HelpCircle, 
  Edit3,
  Bookmark,
  Layers,
  ChevronRight,
  ImageIcon,
  Camera,
  Type,
  Check,
  FileSpreadsheet,
  Users,
  GraduationCap,
  Zap,
  RefreshCw,
  Plus
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { fastFetch } from "@/utils/fastFetch";
import { compressImagesBatch, compressImage } from "@/utils/imageCompressor";
import EmaktabExportModal from "@/components/EmaktabExportModal";
import LimitExceededModal from "@/components/LimitExceededModal";
import Link from "next/link";

type TaskType = 'TEST' | 'DIKTANT' | 'OPEN_QUESTION';

export default function Grader() {
  const [classes, setClasses] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitErrorMessage, setLimitErrorMessage] = useState("");
  
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  
  // Task Type
  const [taskType, setTaskType] = useState<TaskType>('TEST');
  
  // Dictation parameters
  const [dictationTab, setDictationTab] = useState<'text' | 'image'>('text');
  const [originalText, setOriginalText] = useState("");
  const [referenceImage, setReferenceImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [isDraggingDictationImage, setIsDraggingDictationImage] = useState(false);
  const [maxErrorsSpelling, setMaxErrorsSpelling] = useState(5);
  const [maxErrorsPunctuation, setMaxErrorsPunctuation] = useState(5);

  // Open Question parameters
  const [openQuestionText, setOpenQuestionText] = useState("");
  const [openSampleAnswer, setOpenSampleAnswer] = useState("");
  const [openMaxScore, setOpenMaxScore] = useState(10);

  // Images state
  const [selectedImages, setSelectedImages] = useState<Array<{ data: string; mimeType: string }>>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Saved Results State
  const [editableResults, setEditableResults] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Fetch initial classes and tests
  useEffect(() => {
    fastFetch<any[]>("/api/classes").then(data => {
      if (Array.isArray(data)) {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      }
    }).catch(() => {});

    fastFetch<any[]>("/api/tests").then(data => {
      if (Array.isArray(data)) {
        setTests(data);
        if (data.length > 0) setSelectedTestId(data[0].id);
      }
    }).catch(() => {});
  }, []);

  // Handle Multi Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    toast.loading(`${files.length} ta rasm optimallashtirilmoqda...`, { id: "compressToast" });

    try {
      const compressedList = await compressImagesBatch(Array.from(files));
      setSelectedImages(prev => [...prev, ...compressedList]);
      toast.success(`${files.length} ta rasm qo'shildi!`, { id: "compressToast" });
    } catch {
      toast.error("Rasmlarni yuklashda xatolik", { id: "compressToast" });
    } finally {
      setIsCompressing(false);
    }
  };

  // Drag and drop for student notebook photos
  const handleDropImages = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (droppedFiles.length === 0) {
      toast.error("Iltimos, faqat rasm fayllarini tashlang");
      return;
    }

    setIsCompressing(true);
    toast.loading(`${droppedFiles.length} ta rasm optimallashtirilmoqda...`, { id: "compressToast" });

    try {
      const compressedList = await compressImagesBatch(droppedFiles);
      setSelectedImages(prev => [...prev, ...compressedList]);
      toast.success(`${droppedFiles.length} ta rasm qo'shildi! 🎉`, { id: "compressToast" });
    } catch {
      toast.error("Rasmlarni yuklashda xatolik", { id: "compressToast" });
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle Dictation Reference Image Upload
  const handleDictationImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Iltimos, faqat rasm faylini tanlang (JPG, PNG)");
      return;
    }

    setIsCompressing(true);
    const toastId = toast.loading("Asl diktant rasmi yuklanmoqda...");

    try {
      const compressed = await compressImage(file);
      setReferenceImage({ data: compressed.data, mimeType: compressed.mimeType });
      toast.success("Asl diktant rasmi yuklandi! 📸", { id: toastId });
    } catch {
      toast.error("Rasmni yuklashda xatolik", { id: toastId });
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle OCR extraction from Dictation Photo
  const handleExtractOcr = async () => {
    if (!referenceImage) {
      toast.error("Iltimos, avval diktant rasmini yuklang");
      return;
    }

    setIsExtractingOcr(true);
    const toastId = toast.loading("AI rasmdagi matnni o'qimoqda...");

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: referenceImage })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 || data.limitExceeded) {
          setIsLimitModalOpen(true);
          setLimitErrorMessage(data.error || "AI limitingiz yetarli emas");
          toast.dismiss(toastId);
          return;
        }
        throw new Error(data.error || "Matnni ajratib olishda xatolik");
      }

      setOriginalText(data.text);
      setDictationTab('text');
      toast.success("Matn muvaffaqiyatli o'qib olindi! ✍️", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "OCR xatolik", { id: toastId });
    } finally {
      setIsExtractingOcr(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== index));
  };

  // Start AI Grader Process with Next-Gen High-Speed Pipeline
  const handleStartGrading = async () => {
    if (!selectedClassId) {
      toast.error("Iltimos, avval sinfni tanlang");
      return;
    }
    if (selectedImages.length === 0) {
      toast.error("Iltimos, kamida 1 ta daftar rasmini yuklang");
      return;
    }

    if (taskType === 'TEST' && !selectedTestId) {
      toast.error("Iltimos, test kalitini tanlang yoki yangi test yarating");
      return;
    }

    if (taskType === 'DIKTANT' && !originalText.trim() && !referenceImage) {
      toast.error("Iltimos, asl diktant matnini yozing yoki uning kitob/namuna rasmini yuklang");
      return;
    }

    if (taskType === 'OPEN_QUESTION' && !openQuestionText.trim()) {
      toast.error("Iltimos, ochiq savol matnini kiriting");
      return;
    }

    const payload: any = {
      taskType,
      classId: selectedClassId,
      images: selectedImages
    };

    if (taskType === 'TEST') {
      payload.testId = selectedTestId;
    } else if (taskType === 'DIKTANT') {
      payload.dictation = {
        originalText,
        referenceImage,
        maxErrorsSpelling,
        maxErrorsPunctuation
      };
    } else if (taskType === 'OPEN_QUESTION') {
      payload.openQuestion = {
        questionText: openQuestionText,
        sampleAnswer: openSampleAnswer,
        maxScore: openMaxScore
      };
    }

    setIsSaved(false);
    setEditableResults([]);
    setIsLoading(true);
    setError(null);
    const toastId = toast.loading(`AI ${selectedImages.length} ta daftarni tekshirmoqda...`);

    try {
      const res = await fetch('/api/grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 || data.limitExceeded || data.error?.toLowerCase().includes('limit') || data.error?.toLowerCase().includes('kredit')) {
          setIsLimitModalOpen(true);
          setLimitErrorMessage(data.error || "AI funksiyasidan foydalanish uchun limitingiz yetarli emas.");
          toast.dismiss(toastId);
          return;
        }
        throw new Error(data.error || "Tekshirishda xatolik yuz berdi");
      }

      if (data.results && Array.isArray(data.results)) {
        setEditableResults(data.results);
        toast.success(`AI ${data.results.length} nafar o'quvchi daftarini tekshirdi!`, { id: toastId });
      } else {
        throw new Error("Natija formati noto'g'ri qaytdi");
      }
    } catch (err: any) {
      setError(err);
      toast.error(err.message || "Tekshirishda xatolik", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Save Results to Database
  const handleSaveToDatabase = async () => {
    if (editableResults.length === 0) return;

    try {
      const res = await fetch("/api/grader/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          testId: taskType === 'TEST' ? selectedTestId : undefined,
          taskType,
          results: editableResults
        })
      });

      if (res.ok) {
        setIsSaved(true);
        toast.success("Natijalar bazaga va hisobotga muvaffaqiyatli saqlandi!");
      } else {
        toast.error("Saqlashda xatolik yuz berdi");
      }
    } catch {
      toast.error("Tarmoq xatosi");
    }
  };

  const activeResults = editableResults;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
      
      {/* Header */}
      <SectionHeader
        title="AI Tekshirish Markazi"
        subtitle="Daftar, test javoblari yoki diktant rasmlarini yuklang — AI bir necha soniyada xatolarni aniqlab, baholaydi."
      />

      {/* 3-Step Guided Workflow Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
        
        {/* Step 1: Select Class */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>Sinfni tanlang</span>
            </h3>
            <Link href="/classes" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Yangi sinf qo'shish</span>
            </Link>
          </div>

          {classes.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
              <span>Sizda hali sinflar ro'yxati mavjud emas.</span>
              <Link href="/classes" className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl">
                Sinf yaratish
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedClassId === cls.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold dark:bg-indigo-950/60 dark:border-indigo-500 dark:text-indigo-200 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold truncate" title={cls.name}>{cls.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{cls._count?.students || 0} nafar o'quvchi</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Task Type & Reference Key */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
              2
            </span>
            <span>Topshiriq turini va kalitini tanlang</span>
          </h3>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setTaskType('TEST')}
              className={`p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all ${
                taskType === 'TEST'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="text-xs sm:text-sm font-bold truncate">🟢 Test</div>
              <div className="text-[10px] opacity-80 mt-0.5 truncate">Javob varaqasi</div>
            </button>

            <button
              type="button"
              onClick={() => setTaskType('DIKTANT')}
              className={`p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all ${
                taskType === 'DIKTANT'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="text-xs sm:text-sm font-bold truncate">🔵 Diktant</div>
              <div className="text-[10px] opacity-80 mt-0.5 truncate">Imlo xatolari</div>
            </button>

            <button
              type="button"
              onClick={() => setTaskType('OPEN_QUESTION')}
              className={`p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all ${
                taskType === 'OPEN_QUESTION'
                  ? 'bg-indigo-600 text-white font-bold shadow-md'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="text-xs sm:text-sm font-bold truncate">🟣 Ochiq savol</div>
              <div className="text-[10px] opacity-80 mt-0.5 truncate">Matnli tahlil</div>
            </button>
          </div>

          {/* Type Specific Fields */}
          {taskType === 'TEST' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Qaysi test kaliti bo'yicha tekshiriladi? *
                </label>
                <Link href="/tests" className="text-xs font-bold text-indigo-600 hover:underline">
                  + Yangi test yaratish
                </Link>
              </div>

              {tests.length === 0 ? (
                <div className="text-xs text-amber-600">
                  Sizda testlar kaliti mavjud emas. Iltimos, <Link href="/tests" className="underline font-bold">Testlar bo'limida</Link> test kalitini kiriting.
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    className="w-full p-3.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 truncate"
                  >
                    {tests.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.subject}) — {t.questionCount} ta savol
                      </option>
                    ))}
                  </select>

                  {tests.find(t => t.id === selectedTestId) && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-xs">
                      <span className="font-bold text-indigo-950 dark:text-indigo-200">
                        {tests.find(t => t.id === selectedTestId)?.title}
                      </span>
                      <span className="text-indigo-400">•</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {tests.find(t => t.id === selectedTestId)?.questionCount} ta savol
                      </span>
                      {tests.find(t => t.id === selectedTestId)?.answerKey && (
                        <>
                          <span className="text-indigo-400">•</span>
                          <span className="font-mono text-indigo-700 dark:text-indigo-300 truncate max-w-[200px]" title={tests.find(t => t.id === selectedTestId)?.answerKey}>
                            Kalit: {tests.find(t => t.id === selectedTestId)?.answerKey}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {taskType === 'DIKTANT' && (
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4">
              
              {/* Mode Switch Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700 pb-3">
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Asl diktant manbasi *
                  </label>
                  <span className="text-[11px] text-slate-500 block">
                    Matnni qo'lda yozing yoki kitob/namuna rasmini yuklang
                  </span>
                </div>

                <div className="flex bg-slate-200/70 dark:bg-slate-900/60 p-1 rounded-xl gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDictationTab('text')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      dictationTab === 'text'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Matn yozish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDictationTab('image')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      dictationTab === 'image'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Kitob / Matn rasmi</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Text Area */}
              {dictationTab === 'text' ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    placeholder="Diktantning to'g'ri matnini shu yerga yozing yoki nusxalab qo'ying..."
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    className="w-full p-3.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                  {referenceImage && (
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Asl kitob rasmi biriktirilgan
                      </span>
                      <button
                        type="button"
                        onClick={() => setReferenceImage(null)}
                        className="text-rose-600 hover:underline font-bold text-[11px]"
                      >
                        Rasmni olib tashlash
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Image Upload with Drag-and-Drop + Instant OCR */
                <div className="space-y-3">
                  {!referenceImage ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingDictationImage(true); }}
                      onDragLeave={() => setIsDraggingDictationImage(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingDictationImage(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleDictationImageUpload(file);
                      }}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isDraggingDictationImage
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <label className="w-full flex flex-col items-center justify-center cursor-pointer gap-2">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-inner">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {isDraggingDictationImage ? "Rasmni shu yerga tashlang!" : "Kitob yoki qog'ozdagi diktant rasmini tanlang yoki sudrab tashlang"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (Kamera yoki Galereyadan 1 ta rasm)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDictationImageUpload(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative">
                          <img
                            src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`}
                            alt="Asl diktant matni"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Asl diktant rasmi biriktirildi
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            AI daftarlarni ushbu rasm bilan to'g'ridan-to'g'ri solishtiradi.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={handleExtractOcr}
                          disabled={isExtractingOcr}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isExtractingOcr ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>O'qilmoqda...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>Matnni ajratib olish (OCR)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setReferenceImage(null)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 rounded-xl transition-colors"
                          title="Rasmni o'chirish"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {taskType === 'OPEN_QUESTION' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Ochiq savol matni *
              </label>
              <input
                type="text"
                placeholder="Masalan: Fotosintez jarayonining ahamiyatini tushuntiring."
                value={openQuestionText}
                onChange={(e) => setOpenQuestionText(e.target.value)}
                className="w-full p-3.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Step 3: Upload Student Notebooks with HTML5 Drag-and-Drop */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                3
              </span>
              <span>O'quvchi daftarlari rasmlarini yuklang</span>
            </h3>
            <span className="text-xs font-bold text-indigo-600">
              {selectedImages.length} ta rasm tanlandi
            </span>
          </div>

          {/* Upload Dropzone with Drag and Drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDropImages}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
              isDraggingOver
                ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-4 ring-indigo-500/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50'
            }`}
          >
            <label className="w-full flex flex-col items-center justify-center cursor-pointer gap-3">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  {isDraggingOver ? "Rasmlarni shu yerga tashlang! 📥" : "Daftar yoki test varaqasi rasmlarini tanlang yoki sudrab tashlang"}
                </span>
                <span className="text-xs text-slate-500 block">
                  Bir vaqtning o'zida bir nechta rasm yuklashingiz mumkin (Kameradan, Galereyadan yoki Kompyuterdan)
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square shadow-xs">
                  <img 
                    src={`data:${img.mimeType};base64,${img.data}`} 
                    alt={`Daftar ${idx + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                    title="O'chirish"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-md">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Live AI Limit Notice & Submit CTA */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>AI limitingizdan foydalaniladi:</span>
              </span>
              <b className="text-indigo-600 dark:text-indigo-400 font-bold">
                {selectedImages.length > 0 ? `Taxminan ${selectedImages.length} ta` : "0 ta"}
              </b>
            </div>

            <Button
              type="button"
              onClick={handleStartGrading}
              disabled={isLoading || isCompressing || selectedImages.length === 0}
              className="w-full py-4 text-base font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>AI Daftarlarni tekshirmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>{selectedImages.length} ta ishni AI orqali tekshirish</span>
                </>
              )}
            </Button>
          </div>

        </div>

      </div>

      {/* Results Dashboard */}
      {activeResults.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Tekshirish Natijalari ({activeResults.length} nafar o'quvchi)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Baholarni tekshirib, eMaktab yoki hisobotga saqlashingiz mumkin</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>eMaktab Eksport</span>
              </button>

              <button
                onClick={handleSaveToDatabase}
                disabled={isSaved}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaved ? "Saqlangan ✅" : "Bazaga Saqlash"}</span>
              </button>
            </div>
          </div>

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeResults.map((res, i) => (
              <div
                key={i}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {res.student_name}
                    </h4>
                    <span className="text-[11px] text-slate-400">Variant: {res.variant || 'A'}</span>
                  </div>

                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm font-black rounded-full ${
                      res.percentage >= 86 ? 'bg-emerald-100 text-emerald-800' :
                      res.percentage >= 70 ? 'bg-blue-100 text-blue-800' :
                      res.percentage >= 55 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {res.score} ball ({res.percentage}%)
                    </span>
                  </div>
                </div>

                {res.feedback && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                    {res.feedback}
                  </p>
                )}

                {/* Question Answers Details if Test */}
                {res.answers && (
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
                    {res.answers.map((ans: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-1 rounded-lg text-center text-[10px] font-bold ${
                          ans.isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                        title={`${ans.question}-savol: ${ans.studentAnswer} (To'g'ri: ${ans.correctAnswer})`}
                      >
                        {ans.question}:{ans.studentAnswer}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* eMaktab Modal */}
      {isExportModalOpen && (
        <EmaktabExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          results={activeResults.map(r => ({
            name: r.student_name,
            score: r.score,
            percentage: r.percentage
          }))}
          title={tests.find(t => t.id === selectedTestId)?.title || "Daftar tekshiruvi"}
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
