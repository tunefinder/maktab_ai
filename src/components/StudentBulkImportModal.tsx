"use client";

import { useState, useRef } from "react";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  ClipboardCopy, 
  Check, 
  Trash2, 
  X, 
  Sparkles,
  Users,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface ParsedStudent {
  id: string;
  firstName: string;
  lastName: string;
  rawText: string;
}

interface StudentBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  onSuccess: () => void;
}

export default function StudentBulkImportModal({
  isOpen,
  onClose,
  classId,
  className,
  onSuccess
}: StudentBulkImportModalProps) {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [inputText, setInputText] = useState("");
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Text parser logic (Clean numbers, dots, dashes, tabs, prefixes)
  const parseRawText = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const results: ParsedStudent[] = [];

    lines.forEach((line, idx) => {
      // Clean leading numbers e.g. "1. ", "1) ", "- ", "• "
      let cleaned = line.replace(/^[\d\s\.\)\-\–\—\•\*\t\:\,\;]+/, '').trim();
      
      // Remove trailing comma/semicolon/dots
      cleaned = cleaned.replace(/[\,\;\.]+$/, '').trim();

      if (!cleaned || cleaned.length < 2) return;

      // Split words
      const parts = cleaned.split(/[\t\,\;]|\s{2,}|\s+/).filter(Boolean);
      
      if (parts.length >= 2) {
        // e.g. "Abdullayev Jasur" -> lastName: Abdullayev, firstName: Jasur
        const lastName = parts[0];
        const firstName = parts.slice(1).join(' ');
        results.push({
          id: `p-${idx}-${Date.now()}`,
          lastName,
          firstName,
          rawText: line
        });
      } else if (parts.length === 1) {
        results.push({
          id: `p-${idx}-${Date.now()}`,
          lastName: "-",
          firstName: parts[0],
          rawText: line
        });
      }
    });

    setParsedStudents(results);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    parseRawText(val);
  };

  // File Upload Handler (CSV, TXT, Word .docx)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        // Word file parsing via server route /api/parse-word
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/parse-word', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.text) {
          setInputText(data.text);
          parseRawText(data.text);
          setActiveTab('paste');
          toast.success(`Word fayldan matn ajratildi: ${file.name}`);
        } else {
          toast.error(data.error || "Word faylini o'qishda xatolik");
        }
      } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt') || fileName.endsWith('.tsv')) {
        // Text / CSV parsing
        const text = await file.text();
        setInputText(text);
        parseRawText(text);
        setActiveTab('paste');
        toast.success(`Fayl muvaffaqiyatli o'qildi: ${file.name}`);
      } else {
        toast.error("Faqat .docx (Word), .csv yoki .txt fayllar qabul qilinadi. Excel faylni CSV qilib saqlab yuklashingiz mumkin.");
      }
    } catch (err) {
      console.error("Fayl o'qishda xatolik:", err);
      toast.error("Faylni o'qishda xatolik yuz berdi");
    } finally {
      setParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdateStudent = (id: string, field: 'firstName' | 'lastName', value: string) => {
    setParsedStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDeleteStudent = (id: string) => {
    setParsedStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleSubmit = async () => {
    if (parsedStudents.length === 0) {
      toast.error("Qo'shish uchun kamida 1 ta o'quvchi bo'lishi kerak");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          students: parsedStudents.map(s => ({
            firstName: s.firstName.trim(),
            lastName: s.lastName.trim()
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`🎉 ${parsedStudents.length} ta o'quvchi muvaffaqiyatli qo'shildi!`);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "O'quvchilarni qo'shishda xatolik");
      }
    } catch {
      toast.error("Tarmoqda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                O&apos;quvchilarni tezkor yuklash
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sinf: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{className}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>Ro&apos;yxatdan nusxa tashlash (Matn)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Word / CSV Fayl yuklash</span>
            </button>
          </div>

          {/* TAB 1: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>O&apos;quvchilar ro&apos;yxatini shu yerga tashlang (Ctrl + V):</span>
                  <span className="text-slate-400 font-normal text-[11px]">
                    Telegram / Word / eMaktab ro&apos;yxatlari avtomatik tozalanadi
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={inputText}
                  onChange={handleTextChange}
                  placeholder={`Masalan:\n1. Abdullayev Jasur\n2. Boboyeva Nilufar\n3) Valijonov Doniyor\n4. Karimova Madina`}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* TAB 2: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,.csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {parsingFile ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {parsingFile ? "Fayl qayta ishlanmoqda..." : "Faylni tanlang yoki shu yerga tashlang"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Qo&apos;llab-quvvatlanadigan formatlar: <b>Word (.docx)</b>, <b>CSV (.csv)</b>, <b>Matn (.txt)</b>
                </p>
              </div>
            </div>
          )}

          {/* PARSED PREVIEW TABLE */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Aniqlangan o&apos;quvchilar ({parsedStudents.length} ta):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedStudents([]);
                    setInputText("");
                  }}
                  className="text-[11px] text-red-500 hover:underline font-semibold"
                >
                  Tozalash
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10">№</th>
                      <th className="py-2 px-3">Familiya</th>
                      <th className="py-2 px-3">Ism</th>
                      <th className="py-2 px-2 w-10 text-center">O&apos;chirish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={s.lastName}
                            onChange={(e) => handleUpdateStudent(s.id, 'lastName', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={s.firstName}
                            onChange={(e) => handleUpdateStudent(s.id, 'firstName', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Bekor qilish
          </button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || parsedStudents.length === 0}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md"
            leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          >
            {loading 
              ? "Qo'shilmoqda..." 
              : parsedStudents.length > 0 
              ? `${parsedStudents.length} ta o'quvchini sinfga qo'shish` 
              : "O'quvchilarni qo'shish"}
          </Button>
        </div>

      </div>
    </div>
  );
}
