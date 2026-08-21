"use client";

import React from "react";
import { X, Sparkles, CheckCircle2, ChevronRight, HelpCircle, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface AiLimitInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiLimitInfoModal({ isOpen, onClose }: AiLimitInfoModalProps) {
  const [showDetailed, setShowDetailed] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              AI limiti qanday hisoblanadi?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Oddiy va tushunarli qo'llanma
            </p>
          </div>
        </div>

        {/* Friendly Plain Uzbek Explanation */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          Har bir AI funksiyasi turli darajada hisoblash quvvatidan foydalanadi. Shu sababli foydalanish miqdori funksiyaning murakkabligiga qarab farq qiladi.
        </div>

        {/* Visual Level Table */}
        <div className="space-y-2.5">
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Oddiy testni tekshirish</span>
            </div>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-xl">
              {showDetailed ? "1 AI limiti" : "Eng kam"}
            </span>
          </div>

          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">AI test yaratish</span>
            </div>
            <span className="text-xs font-black text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-1 rounded-xl">
              {showDetailed ? "3 AI limiti" : "Kam"}
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Dars rejasini yaratish</span>
            </div>
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-1 rounded-xl">
              {showDetailed ? "5 AI limiti" : "O'rtacha"}
            </span>
          </div>

          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Diktant tekshirish</span>
            </div>
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-xl">
              {showDetailed ? "8 AI limiti" : "Ko'proq"}
            </span>
          </div>

          <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Ochiq savol / yozma ish</span>
            </div>
            <span className="text-xs font-black text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-1 rounded-xl">
              {showDetailed ? "8 AI limiti" : "Ko'proq"}
            </span>
          </div>
        </div>

        {/* Toggle Detailed Numbers */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowDetailed(!showDetailed)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            <span>{showDetailed ? "Qisqa ko'rinish" : "Aniq raqamlarni ko'rish"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <Link
            href="/pricing"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Tariflarni ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}
