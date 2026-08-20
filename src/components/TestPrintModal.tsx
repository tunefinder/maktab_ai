"use client";

import { useState, useRef } from "react";
import { 
  Printer, 
  X, 
  Check, 
  FileText, 
  CheckSquare, 
  Settings2, 
  Sparkles,
  Download,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface TestQuestion {
  question: string;
  options: string[];
  correct_answer?: string;
  explanation?: string;
}

interface TestPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  grade?: string;
  questions: TestQuestion[];
}

export default function TestPrintModal({
  isOpen,
  onClose,
  title,
  subject,
  grade,
  questions
}: TestPrintModalProps) {
  const [includeBubbleSheet, setIncludeBubbleSheet] = useState(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [twoColumnLayout, setTwoColumnLayout] = useState(true);
  const [schoolName, setSchoolName] = useState("____-sonli umumta'lim maktabi");
  const [variant, setVariant] = useState("1-Variant");

  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyAnswerKey = () => {
    const keyText = questions.map((q, idx) => {
      const correctIdx = q.options.findIndex(opt => opt === q.correct_answer);
      const letter = correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : "A";
      return `${idx + 1}-${letter}`;
    }).join(", ");

    navigator.clipboard.writeText(keyText);
    toast.success("Kalit nusxalandi: " + keyText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      
      {/* Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header - Screen only */}
        <div className="print:hidden flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                A4 Chop etish va DTM Blankasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subject} • {title} ({questions.length} ta savol)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm h-9 sm:h-10 px-4 shadow-md"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Chop etish (Print / PDF)
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Controls - Screen only */}
        <div className="print:hidden p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Maktab nomi</label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Variant</label>
            <input
              type="text"
              value={variant}
              onChange={e => setVariant(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>
          <div className="flex flex-col justify-center space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={includeBubbleSheet}
                onChange={e => setIncludeBubbleSheet(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>DTM Javoblar varaqasi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={twoColumnLayout}
                onChange={e => setTwoColumnLayout(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>2 Ustunli kitob formati</span>
            </label>
          </div>
          <div className="flex flex-col justify-center space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={e => setIncludeAnswerKey(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>O&apos;qituvchi kalitini ko&apos;rsatish</span>
            </label>
            <button
              type="button"
              onClick={handleCopyAnswerKey}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
            >
              <Copy className="w-3 h-3" />
              <span>Kalitni matn qilib nusxalash</span>
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex justify-center">
          
          <div 
            ref={printAreaRef}
            className="w-full max-w-[210mm] bg-white text-black p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-[13px] leading-relaxed font-serif"
          >
            
            {/* EXAM PAPER HEADER */}
            <div className="border-b-2 border-black pb-4 mb-6 text-center space-y-1">
              <div className="flex justify-between items-center text-[11px] uppercase font-sans font-bold tracking-wider text-slate-600 print:text-black">
                <span>{schoolName}</span>
                <span>{grade ? `${grade}-sinf` : ""} • {variant}</span>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight font-sans">
                {subject.toUpperCase()} FANI BO&apos;YICHA NAZORAT ISHI
              </h2>
              <p className="text-xs italic font-serif">Mavzu: {title}</p>
              
              {/* Student info box */}
              <div className="grid grid-cols-2 gap-4 pt-3 text-left font-sans text-xs">
                <div className="border border-black p-2 rounded">
                  <span className="font-bold">O&apos;quvchining F.I.SH:</span>
                  <div className="border-b border-dotted border-black mt-3"></div>
                </div>
                <div className="border border-black p-2 rounded flex justify-between">
                  <div>
                    <span className="font-bold">Sinf:</span> _______
                  </div>
                  <div>
                    <span className="font-bold">Sana:</span> ___.___.2026-yil
                  </div>
                  <div>
                    <span className="font-bold">Ball:</span> _____
                  </div>
                </div>
              </div>
            </div>

            {/* QUESTIONS LIST */}
            <div className={twoColumnLayout ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 print:grid-cols-2" : "space-y-4"}>
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="break-inside-avoid mb-3 text-justify">
                  <p className="font-bold text-[13px] mb-1.5">
                    <span className="font-black">{qIdx + 1}.</span> {q.question}
                  </p>
                  <div className="space-y-1 pl-3 text-[12px] font-sans">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <div key={optIdx} className="flex items-start gap-1.5">
                          <span className="font-bold shrink-0">{letter})</span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* DTM ANSWER BUBBLE SHEET (Optional) */}
            {includeBubbleSheet && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-black break-inside-avoid font-sans">
                <div className="text-center mb-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    JAVOBLAR VARAQASI (DTM BLANKASI)
                  </h4>
                  <p className="text-[10px] text-slate-500 print:text-black">
                    To&apos;g&apos;ri deb hisoblagan javob doirachasini to&apos;liq bo&apos;yang: ●
                  </p>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 border border-black p-3 rounded-lg bg-slate-50 print:bg-white">
                  {questions.map((_, qIdx) => (
                    <div key={qIdx} className="flex flex-col items-center border-r last:border-none border-slate-300 print:border-black pr-1">
                      <span className="font-bold text-[11px] mb-1 text-slate-700 print:text-black">{qIdx + 1}</span>
                      {['A', 'B', 'C', 'D'].map((letter) => (
                        <div key={letter} className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-[9px] font-bold my-0.5 hover:bg-slate-200">
                          {letter}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEACHER ANSWER KEY (Optional) */}
            {includeAnswerKey && (
              <div className="mt-6 pt-4 border-t border-black break-inside-avoid font-sans text-xs">
                <h4 className="font-bold uppercase text-[11px] mb-2">
                  🔑 O&apos;qituvchi uchun to&apos;g&apos;ri javoblar kaliti:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {questions.map((q, qIdx) => {
                    const correctIdx = q.options.findIndex(opt => opt === q.correct_answer);
                    const letter = correctIdx !== -1 ? String.fromCharCode(65 + correctIdx) : "A";
                    return (
                      <span key={qIdx} className="px-2 py-1 bg-slate-100 print:bg-slate-200 border border-slate-400 rounded font-bold">
                        {qIdx + 1}: {letter}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Print Stylesheet */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block,
            .print\\:grid-cols-2 {
              display: block !important;
            }
            div[class*="printable"],
            div[class*="printable"] * {
              visibility: visible;
            }
            @page {
              size: A4;
              margin: 12mm;
            }
          }
        `}</style>

      </div>
    </div>
  );
}
