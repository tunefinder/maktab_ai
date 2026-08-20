"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockTests, SavedTest, Question, AnswerOption } from "@/data/mockTests";
import { ChevronLeft, Save, FileSignature } from "lucide-react";
import toast from "react-hot-toast";

// Inline Editable component
const EditableText = ({ value, onSave, className }: { value: string, onSave: (val: string) => void, className?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (tempVal.trim() !== value) {
      onSave(tempVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempVal(value);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-600 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-amber-500 w-full ${className}`}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-1 rounded transition-colors ${className}`}
      title="Tahrirlash uchun bosing"
    >
      {value}
    </span>
  );
};

export default function SavedTestPage() {
  const params = useParams();
  const router = useRouter();
  const [test, setTest] = useState<SavedTest | null>(null);

  useEffect(() => {
    if (params.id) {
      const found = mockTests.find(t => t.id === params.id);
      if (found) {
        // Deep copy to avoid mutating the original mock data directly across navigations
        setTest(JSON.parse(JSON.stringify(found)));
      }
    }
  }, [params.id]);

  if (!test) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-500">Test topilmadi...</p>
      </div>
    );
  }

  const updateQuestionText = (qId: string, newText: string) => {
    setTest(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map(q => q.id === qId ? { ...q, text: newText } : q)
      };
    });
    toast.success("Savol tahrirlandi");
  };

  const updateOptionText = (qId: string, optId: string, newText: string) => {
    setTest(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map(q => {
          if (q.id === qId) {
            return {
              ...q,
              options: q.options.map(opt => opt.id === optId ? { ...opt, text: newText } : opt)
            };
          }
          return q;
        })
      };
    });
    toast.success("Javob tahrirlandi");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-indigo-500" />
              <EditableText 
                value={test.title} 
                onSave={(val) => setTest({ ...test, title: val })}
              />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {test.grade} • {test.subject} • Yaratilgan: {test.timeAgo}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => toast.success("O'zgarishlar saqlandi!")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          Saqlash
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/30 text-sm flex items-center gap-2">
        💡 <strong>Eslatma:</strong> Savol yoki javob variantini tahrirlash uchun matn ustiga bosing!
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {test.questions.map((q, qIndex) => (
          <div key={q.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 p-6 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">{qIndex + 1}.</span>
              <EditableText 
                value={q.text} 
                onSave={(val) => updateQuestionText(q.id, val)} 
                className="flex-1"
              />
            </h3>
            
            <div className="space-y-3 pl-6">
              {q.options.map((opt, optIndex) => {
                const letters = ['A', 'B', 'C', 'D', 'E'];
                return (
                  <div 
                    key={opt.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      opt.isCorrect 
                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10' 
                        : 'border-slate-100 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      opt.isCorrect 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' 
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {letters[optIndex]}
                    </div>
                    <div className="flex-1 text-slate-700 dark:text-slate-300">
                      <EditableText 
                        value={opt.text} 
                        onSave={(val) => updateOptionText(q.id, opt.id, val)}
                        className="w-full inline-block"
                      />
                    </div>
                    {opt.isCorrect && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-md">
                        To'g'ri javob
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
