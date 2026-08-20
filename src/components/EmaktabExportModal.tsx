"use client";

import { useState } from "react";
import { 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Download, 
  X, 
  Sparkles,
  ExternalLink,
  Table
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface StudentGradeItem {
  name: string;
  score: number;
  maxScore?: number;
  percentage: number;
  grade?: number; // 5, 4, 3, 2
}

interface EmaktabExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  subject?: string;
  date?: string;
  results: StudentGradeItem[];
}

export default function EmaktabExportModal({
  isOpen,
  onClose,
  title,
  className = "Sinf",
  subject = "Fan",
  date = new Date().toLocaleDateString('uz-UZ'),
  results
}: EmaktabExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Calculate 5-point Uzbek school grade based on percentage
  const calculateGrade = (pct: number): number => {
    if (pct >= 86) return 5;
    if (pct >= 71) return 4;
    if (pct >= 56) return 3;
    return 2;
  };

  const processedResults = results.map(r => ({
    ...r,
    grade5: r.grade || calculateGrade(r.percentage)
  }));

  // 1-Click Copy formatted for eMaktab / Excel pasting
  const handleCopyForEmaktab = () => {
    // Format: F.I.SH \t Baho \t Foiz
    const header = "№\tF.I.SH\tBaho (5-ballik)\tFoiz (%)\tBall\n";
    const rows = processedResults.map((r, idx) => 
      `${idx + 1}\t${r.name}\t${r.grade5}\t${r.percentage}%\t${r.score}`
    ).join('\n');

    const fullText = header + rows;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("🎉 eMaktab (Kundalik) uchun barcha baholar nusxalandi!");
    setTimeout(() => setCopied(false), 3000);
  };

  // Download CSV for Excel
  const handleDownloadCsv = () => {
    const header = "№,F.I.SH,Baho (5-ballik),Foiz (%),Ball,Fan,Sinf,Sana\n";
    const rows = processedResults.map((r, idx) => 
      `"${idx + 1}","${r.name.replace(/"/g, '""')}","${r.grade5}","${r.percentage}%","${r.score}","${subject}","${className}","${date}"`
    ).join('\n');

    // UTF-8 BOM for Excel Cyrillic/Uzbek characters
    const bom = "\uFEFF";
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eMaktab_Baholar_${className}_${subject}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel CSV fayli yuklab olindi!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>eMaktab (Kundalik) Baholar Jadvali</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {processedResults.length} ta o&apos;quvchi
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {className} • {subject} • {title}
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

        {/* Action Banner */}
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-emerald-900 dark:text-emerald-200">
            <span className="font-bold block">💡 eMaktabga qanday ko&apos;chiriladi?</span>
            <span>&quot;eMaktab uchun nusxalash&quot; tugmasini bosing va eMaktab jurnalida <b>Ctrl+V</b> qiling!</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCopyForEmaktab}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-sm"
              leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? "Nusxalandi!" : "eMaktab uchun nusxalash"}
            </Button>
            <Button
              onClick={handleDownloadCsv}
              variant="outline"
              className="flex-1 sm:flex-initial text-xs h-9 border-slate-300 dark:border-slate-700"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Excel (.csv)
            </Button>
          </div>
        </div>

        {/* Grades Table */}
        <div className="p-5 overflow-y-auto flex-1 max-h-[450px] custom-scrollbar">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">№</th>
                  <th className="py-2.5 px-3">O&apos;quvchi F.I.SH</th>
                  <th className="py-2.5 px-3 text-center">5-ballik Baho</th>
                  <th className="py-2.5 px-3 text-center">Foiz (%)</th>
                  <th className="py-2.5 px-3 text-center">Ball</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {processedResults.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{r.name}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs shadow-xs ${
                        r.grade5 === 5 ? 'bg-emerald-500 text-white' :
                        r.grade5 === 4 ? 'bg-indigo-500 text-white' :
                        r.grade5 === 3 ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {r.grade5}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-300">
                      {r.percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      {r.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Baholash mezoni: 86-100% (5), 71-85% (4), 56-70% (3), 0-55% (2)
          </span>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-8"
          >
            Yopish
          </Button>
        </div>

      </div>
    </div>
  );
}
