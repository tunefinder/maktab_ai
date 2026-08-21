"use client";

import React from "react";
import { Sparkles, X, ArrowRight, Zap, Crown } from "lucide-react";
import Link from "next/link";

interface LimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LimitExceededModal({ isOpen, onClose, message }: LimitExceededModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-center relative animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Zap className="w-8 h-8" />
        </div>

        <div className="space-y-2.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            AI limitingiz tugadi
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {message || "AI funksiyalaridan foydalanish uchun limitingiz yetarli emas."}
          </p>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200">
            Tariflar va limitni oshirish bo'limini ochasizmi?
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <Link
            href="/pricing"
            onClick={onClose}
            className="w-full py-4 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Ha, Tariflar bo'limini ochish</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl transition-all block"
          >
            Keyinroq
          </button>
        </div>
      </div>
    </div>
  );
}
