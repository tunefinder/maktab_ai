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
  Sliders, 
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
  FileSpreadsheet
} from "lucide-react";
import toast from "react-hot-toast";
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fastFetch } from "@/utils/fastFetch";
import { compressImage, compressImagesBatch } from "@/utils/imageCompressor";
import EmaktabExportModal from "@/components/EmaktabExportModal";

// Dynamic schema supporting Test, Dictation, and Open Question
const dynamicSchema = z.object({
  taskType: z.string().optional(),
  results: z.array(
    z.object({
      student_name: z.string(),
      variant: z.string().optional(),
      score: z.number(),
      maxScore: z.number().optional(),
      percentage: z.number(),
      feedback: z.string().optional(),
      confidence: z.number().optional(),
      needsReview: z.boolean().optional(),
      spellingErrorsCount: z.number().optional(),
      punctuationErrorsCount: z.number().optional(),
      missingWordsCount: z.number().optional(),
      extraWordsCount: z.number().optional(),
      extractedAnswerText: z.string().optional(),
      errorsList: z.array(
        z.object({
          type: z.string(),
          original: z.string(),
          written: z.string(),
          explanation: z.string()
        })
      ).optional(),
      criteriaBreakdown: z.array(
        z.object({
          criterion: z.string(),
          awardedPoints: z.number(),
          maxPoints: z.number(),
          feedback: z.string()
        })
      ).optional(),
      answers: z.array(
        z.object({
          question: z.number(),
          studentAnswer: z.string(),
          correctAnswer: z.string(),
          isCorrect: z.boolean(),
          confidence: z.number()
        })
      ).optional()
    })
  )
});

type TaskType = 'TEST' | 'DIKTANT' | 'OPEN_QUESTION';

export default function Grader() {
  const [classes, setClasses] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  
  // Task Type
  const [taskType, setTaskType] = useState<TaskType>('TEST');
  
  // Input mode: 'text' (manual type) | 'image' (photo of textbook/paper)
  const [diktantInputMode, setDiktantInputMode] = useState<'text' | 'image'>('text');
  const [openInputMode, setOpenInputMode] = useState<'text' | 'image'>('text');

  // Dictation parameters
  const [originalText, setOriginalText] = useState("");
  const [diktantSourceFile, setDiktantSourceFile] = useState<File | null>(null);
  const [diktantSourcePreview, setDiktantSourcePreview] = useState<string | null>(null);

  const [maxScore, setMaxScore] = useState(20);
  const [spellingPenalty, setSpellingPenalty] = useState(1);
  const [punctuationPenalty, setPunctuationPenalty] = useState(0.5);
  
  // Open question parameters
  const [questionText, setQuestionText] = useState("");
  const [openSourceFile, setOpenSourceFile] = useState<File | null>(null);
  const [openSourcePreview, setOpenSourcePreview] = useState<string | null>(null);
  const [rubricRules, setRubricRules] = useState("Asosiy faktlar va tushunchalar: 5 ball\nMantiqiy tushuntirish: 3 ball\nXulosa va fikr ifodasi: 2 ball");

  // Student Notebooks
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Local editable override state for results
  const [editableResults, setEditableResults] = useState<any[]>([]);
  const [showEmaktabModal, setShowEmaktabModal] = useState(false);

  useEffect(() => {
    fastFetch<any[]>("/api/classes").then(data => {
      if (Array.isArray(data)) {
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fastFetch<any[]>(`/api/tests?classId=${selectedClassId}`).then(data => {
        if (Array.isArray(data)) {
          setTests(data);
          if (data.length > 0) setSelectedTestId(data[0].id);
          else setSelectedTestId("");
        }
      }).catch(() => {});
    } else {
      setTests([]);
      setSelectedTestId("");
    }
  }, [selectedClassId]);

  const { object: streamedResult, submit, isLoading } = useObject({
    api: '/api/grader',
    schema: dynamicSchema,
    onFinish: (result) => {
      toast.success("Barcha ishlar AI tomonidan tahlil qilindi!");
      if (result.object?.results) {
        setEditableResults(JSON.parse(JSON.stringify(result.object.results)));
      }
    },
    onError: () => {
      toast.error("Tekshirishda xatolik yuz berdi. Rasmlarni tekshiring.");
    }
  });

  // Sync streamed results to editable state while streaming
  useEffect(() => {
    if (streamedResult?.results && streamedResult.results.length > 0) {
      setEditableResults(streamedResult.results);
    }
  }, [streamedResult]);

  // Handle Diktant Source File (Textbook / Original Sheet Photo)
  const handleDiktantSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDiktantSourceFile(file);
      setDiktantSourcePreview(URL.createObjectURL(file));
      toast.success("Diktantning asl nusxasi surati yuklandi");
      e.target.value = '';
    }
  };

  // Handle Open Question Source File (Textbook / Task Sheet Photo)
  const handleOpenSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOpenSourceFile(file);
      setOpenSourcePreview(URL.createObjectURL(file));
      toast.success("Savol/Topshiriq surati yuklandi");
      e.target.value = '';
    }
  };

  // Student Notebook Files Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
      
      if (validFiles.length !== newFiles.length) {
        toast.error("Faqat rasm formatidagi fayllarni yuklang (JPG, PNG)");
      }
      
      const combined = [...files, ...validFiles].slice(0, 30);
      setFiles(combined);

      // Generate thumbnail previews
      const newPreviews = combined.map(f => URL.createObjectURL(f));
      setPreviews(newPreviews);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return toast.error("Iltimos, sinfni tanlang");
    if (files.length === 0) return toast.error("Iltimos, kamida 1 ta daftar rasmini yuklang");

    if (taskType === 'TEST') {
      const selectedTest = tests.find(t => t.id === selectedTestId);
      if (!selectedTest) return toast.error("Iltimos, to'g'ri javob kaliti uchun testni tanlang");
      
      try {
        toast.loading("Daftarlar tayyorlanmoqda...", { id: "graderLoad" });
        const images = await readImages(files);
        toast.dismiss("graderLoad");
        
        submit({
          taskType: 'TEST',
          classId: selectedClassId,
          testId: selectedTest.id,
          answerKey: selectedTest.answerKey,
          questionCount: selectedTest.questionCount,
          images
        });
      } catch (err) {
        toast.dismiss("graderLoad");
        toast.error("Rasmlarni o'qishda xatolik");
      }
    } else if (taskType === 'DIKTANT') {
      if (diktantInputMode === 'text' && !originalText.trim()) {
        return toast.error("Iltimos, original diktant matnini yozing yoki kitobdan suratini yuklang");
      }
      if (diktantInputMode === 'image' && !diktantSourceFile) {
        return toast.error("Iltimos, original diktant matni suratini yuklang");
      }
      
      try {
        toast.loading("Daftarlar tayyorlanmoqda...", { id: "graderLoad" });
        let sourceImage: { data: string; mimeType: string } | undefined = undefined;
        if (diktantInputMode === 'image' && diktantSourceFile) {
          const [img] = await readImages([diktantSourceFile]);
          sourceImage = img;
        }

        const images = await readImages(files);
        toast.dismiss("graderLoad");

        submit({
          taskType: 'DIKTANT',
          classId: selectedClassId,
          originalText: diktantInputMode === 'text' ? originalText : undefined,
          sourceImage,
          maxScore,
          spellingPenalty,
          punctuationPenalty,
          images
        });
      } catch (err) {
        toast.dismiss("graderLoad");
        toast.error("Rasmlarni o'qishda xatolik");
      }
    } else if (taskType === 'OPEN_QUESTION') {
      if (openInputMode === 'text' && !questionText.trim()) {
        return toast.error("Iltimos, savol matnini yozing yoki darslikdan suratini yuklang");
      }
      if (openInputMode === 'image' && !openSourceFile) {
        return toast.error("Iltimos, savol/topshiriq matni suratini yuklang");
      }

      try {
        toast.loading("Daftarlar tayyorlanmoqda...", { id: "graderLoad" });
        let sourceImage: { data: string; mimeType: string } | undefined = undefined;
        if (openInputMode === 'image' && openSourceFile) {
          const [img] = await readImages([openSourceFile]);
          sourceImage = img;
        }

        const images = await readImages(files);
        toast.dismiss("graderLoad");

        submit({
          taskType: 'OPEN_QUESTION',
          classId: selectedClassId,
          questionText: openInputMode === 'text' ? questionText : undefined,
          sourceImage,
          rubricRules,
          maxScore,
          images
        });
      } catch (err) {
        toast.dismiss("graderLoad");
        toast.error("Rasmlarni o'qishda xatolik");
      }
    }
  };

  const readImages = async (fileList: File[]) => {
    return compressImagesBatch(fileList);
  };

  const handleScoreChange = (index: number, newScore: number) => {
    setEditableResults(prev => {
      const updated = [...prev];
      const target = { ...updated[index] };
      target.score = newScore;
      const mScore = target.maxScore || (taskType === 'DIKTANT' ? maxScore : 20);
      target.percentage = Math.round((newScore / mScore) * 100);
      updated[index] = target;
      return updated;
    });
  };

  const handleFeedbackChange = (index: number, newFeedback: string) => {
    setEditableResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], feedback: newFeedback };
      return updated;
    });
  };

  const handleStudentNameChange = (index: number, newName: string) => {
    setEditableResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], student_name: newName };
      return updated;
    });
  };

  const saveResults = async () => {
    if (!editableResults || editableResults.length === 0) return;
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: selectedTestId || undefined,
          classId: selectedClassId,
          taskType,
          title: taskType === 'DIKTANT' ? 'Diktant ishi' : taskType === 'OPEN_QUESTION' ? 'Yozma ish / Savol' : 'Test sinovi',
          results: editableResults
        })
      });
      
      if (res.ok) {
        toast.success("Tasdiqlangan natijalar bazaga muvaffaqiyatli saqlandi!");
      } else {
        toast.error("Saqlashda xatolik yuz berdi");
      }
    } catch (err) {
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const hasResults = editableResults && editableResults.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & 3-Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-xs shrink-0">
            <CheckSquare className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              AI Tekshirish
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Qog&apos;oz daftarlarni suratga oling — AI tekshiradi, siz tasdiqlaysiz.
            </p>
          </div>
        </div>

        {/* 3 Main Mode Pills */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTaskType('TEST')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              taskType === 'TEST' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Test (ABCD)</span>
          </button>
          <button
            type="button"
            onClick={() => setTaskType('DIKTANT')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              taskType === 'DIKTANT' 
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Diktant</span>
          </button>
          <button
            type="button"
            onClick={() => setTaskType('OPEN_QUESTION')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              taskType === 'OPEN_QUESTION' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Ochiq Savol</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Live Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
        {/* Left Form Card */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* 1. Sinfni tanlash */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                1. Sinfni tanlang
              </label>
              <select 
                value={selectedClassId} 
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-900 dark:text-slate-100"
              >
                {classes.length === 0 && <option value="">Sinflar yo&apos;q (Sinflar bo&apos;limidan qo&apos;shing)</option>}
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Mode 1: TEST FIELDS */}
            {taskType === 'TEST' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  2. Mavjud Test Kalitini Tanlang
                </label>
                <select 
                  value={selectedTestId} 
                  onChange={e => setSelectedTestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-900 dark:text-slate-100"
                  disabled={!selectedClassId || tests.length === 0}
                >
                  {tests.length === 0 && <option value="">Bu sinfda hali testlar mavjud emas</option>}
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.questionCount} ta savol)</option>
                  ))}
                </select>
                {tests.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Avval &quot;Test&quot; bo&apos;limidan javob kalitini kiriting yoki AI orqali yarating.
                  </p>
                )}
              </div>
            )}

            {/* Mode 2: DIKTANT FIELDS (Text or Photo of Book) */}
            {taskType === 'DIKTANT' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    2. Asl Diktant Matni
                  </label>
                  {/* Mode switcher: Matn yozish vs Suratga olish */}
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDiktantInputMode('text')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        diktantInputMode === 'text' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <Type className="w-3 h-3" />
                      <span>Matn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiktantInputMode('image')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        diktantInputMode === 'image' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>Surat (Kitob)</span>
                    </button>
                  </div>
                </div>

                {diktantInputMode === 'text' ? (
                  <textarea
                    rows={4}
                    value={originalText}
                    onChange={e => setOriginalText(e.target.value)}
                    placeholder="Darsda aytilgan to'g'ri diktant matnini bu yerga yozing..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required={diktantInputMode === 'text'}
                  />
                ) : (
                  <div className="space-y-2">
                    {!diktantSourcePreview ? (
                      <div className="relative border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer transition-colors bg-emerald-50/30 dark:bg-emerald-950/20">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleDiktantSourceChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          required={diktantInputMode === 'image'}
                        />
                        <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          Darslik yoki varaqdagi diktant matnini suratga oling
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          AI kitobdagi matnni avtomatik o&apos;qib, o&apos;quvchilar bilan solishtiradi
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 p-2 bg-emerald-50/40 dark:bg-emerald-950/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={diktantSourcePreview} alt="diktant source" className="w-12 h-12 object-cover rounded-lg border" />
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                              {diktantSourceFile?.name || "Original matn surati"}
                            </p>
                            <span className="text-[10px] text-emerald-600 font-semibold">✓ Surat tayyor</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setDiktantSourceFile(null); setDiktantSourcePreview(null); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                          title="O'chirish"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Score & Penalty Settings */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Maks. ball</label>
                    <input 
                      type="number" 
                      value={maxScore} 
                      onChange={e => setMaxScore(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Imlo (-ball)</label>
                    <input 
                      type="number" step="0.5" 
                      value={spellingPenalty} 
                      onChange={e => setSpellingPenalty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">Tinish (-ball)</label>
                    <input 
                      type="number" step="0.5" 
                      value={punctuationPenalty} 
                      onChange={e => setPunctuationPenalty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center text-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: OPEN QUESTION FIELDS (Text or Photo of Book) */}
            {taskType === 'OPEN_QUESTION' && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    2. Savol yoki Topshiriq
                  </label>
                  {/* Mode switcher: Matn yozish vs Suratga olish */}
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOpenInputMode('text')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        openInputMode === 'text' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <Type className="w-3 h-3" />
                      <span>Matn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenInputMode('image')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                        openInputMode === 'image' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>Surat (Kitob)</span>
                    </button>
                  </div>
                </div>

                {openInputMode === 'text' ? (
                  <textarea
                    rows={3}
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    placeholder="Masalan: Amir Temurning davlat boshqaruvidagi islohotlarini yoritib bering..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    required={openInputMode === 'text'}
                  />
                ) : (
                  <div className="space-y-2">
                    {!openSourcePreview ? (
                      <div className="relative border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer transition-colors bg-blue-50/30 dark:bg-blue-950/20">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleOpenSourceChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          required={openInputMode === 'image'}
                        />
                        <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                          Darslik yoki varaqdagi topshiriqni suratga oling
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          AI kitobdagi savolni o&apos;qib, o&apos;quvchilar javoblarini baholaydi
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800 p-2 bg-blue-50/40 dark:bg-blue-950/30 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={openSourcePreview} alt="open source" className="w-12 h-12 object-cover rounded-lg border" />
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                              {openSourceFile?.name || "Savol surati"}
                            </p>
                            <span className="text-[10px] text-blue-600 font-semibold">✓ Surat tayyor</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setOpenSourceFile(null); setOpenSourcePreview(null); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                          title="O'chirish"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Baholash Mezonlari (Rubrika)
                  </label>
                  <textarea
                    rows={2}
                    value={rubricRules}
                    onChange={e => setRubricRules(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* 3. Student Notebooks Upload Area */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  3. O&apos;quvchilar Daftarlari ({files.length}/30 ta rasm)
                </label>
                {files.length > 0 && (
                  <button 
                    type="button" 
                    onClick={() => { setFiles([]); setPreviews([]); }}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    Tozalash
                  </button>
                )}
              </div>

              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/60 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/40">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar suratlarini yuklang
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  1 tadan 30 tagacha daftarni bir vaqtda tanlang
                </p>
              </div>

              {/* Thumbnails list */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3 max-h-36 overflow-y-auto custom-scrollbar p-1">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="daftar" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || files.length === 0}
              className={`w-full h-11 text-sm font-bold text-white shadow-xs ${
                taskType === 'TEST' ? 'bg-indigo-600 hover:bg-indigo-700' :
                taskType === 'DIKTANT' ? 'bg-emerald-600 hover:bg-emerald-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isLoading ? "AI Daftarlarni tekshirmoqda..." : `${files.length} ta ishni AI orqali tekshirish`}
            </Button>
          </form>
        </Card>

        {/* Right Results Panel */}
        <div className="space-y-4">
          {!hasResults ? (
            <Card className="p-12 text-center bg-white dark:bg-slate-800 border-dashed min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mb-3">
                <CheckSquare className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">
                Natijalar bu yerda ko&apos;rinadi
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Chap tarafdan sinf va daftarlar rasmlarini yuklang, so&apos;ngra &quot;Tekshirish&quot; tugmasini bosing.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Results Action Bar */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                    Tekshirilgan daftarlar ({editableResults.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ball yoki izohni joyida o&apos;zgartirishingiz mumkin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowEmaktabModal(true)}
                    variant="outline"
                    className="h-9 text-xs border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                    leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                  >
                    eMaktab & Excel
                  </Button>
                  <Button
                    onClick={saveResults}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    {isSaving ? "Saqlanmoqda..." : "Tasdiqlash va Bazaga Saqlash"}
                  </Button>
                </div>
              </div>

              {/* Student Result Cards */}
              <div className="space-y-3">
                {editableResults.map((res: any, idx: number) => (
                  <Card key={idx} className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          value={res.student_name || `O'quvchi ${idx + 1}`}
                          onChange={(e) => handleStudentNameChange(idx, e.target.value)}
                          className="font-bold text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary outline-none text-slate-900 dark:text-slate-100"
                        />
                        {res.needsReview && (
                          <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Ko&apos;rib chiqish tavsiya etiladi
                          </span>
                        )}
                      </div>

                      {/* Score Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">Ball:</span>
                        <input
                          type="number"
                          value={res.score ?? 0}
                          onChange={(e) => handleScoreChange(idx, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-center text-indigo-600 dark:text-indigo-400"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                          {res.percentage ?? 0}%
                        </span>
                      </div>
                    </div>

                    {/* Dictation Errors Breakdown */}
                    {taskType === 'DIKTANT' && res.errorsList && res.errorsList.length > 0 && (
                      <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 text-xs space-y-1">
                        <span className="font-bold text-red-600 dark:text-red-400 block mb-1">Aniqlangan xatolar:</span>
                        {res.errorsList.map((err: any, eIdx: number) => (
                          <div key={eIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-[10px] font-bold">
                              {err.type}
                            </span>
                            <span>&quot;{err.written}&quot; ➡️ &quot;{err.original}&quot; ({err.explanation})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Open Question Rubric Breakdown */}
                    {taskType === 'OPEN_QUESTION' && res.criteriaBreakdown && (
                      <div className="grid sm:grid-cols-3 gap-2">
                        {res.criteriaBreakdown.map((crit: any, cIdx: number) => (
                          <div key={cIdx} className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              <span className="truncate">{crit.criterion}</span>
                              <span className="text-indigo-600 dark:text-indigo-400">{crit.awardedPoints}/{crit.maxPoints}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{crit.feedback}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Feedback */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">O&apos;qituvchi izohi (Feedback):</label>
                      <input
                        type="text"
                        value={res.feedback || ""}
                        onChange={(e) => handleFeedbackChange(idx, e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-primary"
                        placeholder="O'quvchiga izoh yozing..."
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* eMaktab Kundalik Export Modal */}
      {showEmaktabModal && (
        <EmaktabExportModal
          isOpen={showEmaktabModal}
          onClose={() => setShowEmaktabModal(false)}
          title={taskType === 'TEST' ? "Test natijalari" : taskType === 'DIKTANT' ? "Diktant baholari" : "Yozma ish baholari"}
          className={classes.find(c => c.id === selectedClassId)?.name || "Sinf"}
          subject={taskType === 'DIKTANT' ? "Ona tili (Diktant)" : "Fan"}
          results={editableResults.map(r => ({
            name: r.student_name || "O'quvchi",
            score: r.score,
            maxScore: r.maxScore || (taskType === 'DIKTANT' ? maxScore : 20),
            percentage: r.percentage
          }))}
        />
      )}
    </div>
  );
}
