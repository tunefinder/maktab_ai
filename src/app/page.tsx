"use client";

import Link from "next/link";
import { 
  Users, 
  FileBarChart, 
  ChevronRight, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  BookOpen, 
  GraduationCap, 
  Layers 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { fastFetch } from "@/utils/fastFetch";
import { isUnlimited } from "@/utils/aiConfig";

interface StatsData {
  studentCount?: number;
  testCount?: number;
  attemptCount?: number;
  avgPercentage?: number;
}

interface LicenseStatus {
  plan: string;
  planDetails: {
    name: string;
    badge: string;
    maxAiCredits: number;
    maxClasses: number;
    maxLessons: number;
    maxTests: number;
  };
  daysLeft: number | null;
  isExpired: boolean;
  usage: {
    usedAiCredits: number;
    totalAiCredits: number;
    remainingAiCredits: number;
    aiProgressPct: number;
    classesCount: number;
    maxClasses: number;
    classesProgressPct: number;
    testsCount: number;
    maxTests: number;
    testsProgressPct: number;
    lessonsCount: number;
    maxLessons: number;
    lessonsProgressPct: number;
  };
}

export default function Home() {
  const { profileName } = useSettings();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [licStatus, setLicStatus] = useState<LicenseStatus | null>(null);

  useEffect(() => {
    fastFetch<StatsData>("/api/stats")
      .then(data => setStats(data))
      .catch(() => {});

    fastFetch<LicenseStatus>("/api/license/status")
      .then(data => setLicStatus(data))
      .catch(() => {});
  }, []);

  const u = licStatus?.usage;
  const isAiCritical = (u?.aiProgressPct || 0) >= 90;
  const isAiWarning = (u?.aiProgressPct || 0) >= 70 && !isAiCritical;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      
      {/* Ustoz nomidan salomlashuv */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Xush kelibsiz, {profileName || "O'qituvchi"} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Bugun qaysi bo'limdan boshlaymiz?
          </p>
        </div>

        {licStatus && (
          <Link
            href="/pricing"
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>{licStatus.planDetails.name}</span>
            {licStatus.daysLeft !== null && (
              <span className="text-[11px] text-slate-500 font-normal">
                ({licStatus.daysLeft} kun qoldi)
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Subscription & Real-Time AI Usage Bar */}
      {licStatus && u && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarif:</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{licStatus.planDetails.name}</span>
              {licStatus.daysLeft !== null && (
                <span className="text-xs text-slate-500">
                  • <b>{licStatus.daysLeft} kun</b> qoldi
                </span>
              )}
            </div>

            {(isAiWarning || isAiCritical || u.remainingAiCredits === 0) && (
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>AI Pack yoki Upgrade</span>
              </Link>
            )}
          </div>

          {/* 4 Usage Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. AI Tekshirish */}
            <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
              isAiCritical 
                ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60'
                : isAiWarning
                ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60'
                : 'bg-slate-50/80 border-slate-100 dark:bg-slate-800/40 dark:border-slate-700/50'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>AI Tekshirish</span>
                <Zap className={`w-3.5 h-3.5 ${isAiCritical ? 'text-rose-500' : isAiWarning ? 'text-amber-500' : 'text-indigo-500'}`} />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100">
                {u.remainingAiCredits.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {u.totalAiCredits.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAiCritical ? 'bg-rose-500' : isAiWarning ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${u.aiProgressPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Ishlatildi: {u.usedAiCredits}</span>
                <span>{u.aiProgressPct}%</span>
              </div>
            </div>

            {/* 2. Sinflar */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Sinflar</span>
                <Users className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100">
                {u.classesCount} <span className="text-xs text-slate-400 font-normal">/ {isUnlimited(u.maxClasses) ? 'Cheksiz' : u.maxClasses}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${u.classesProgressPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Faol sinflar</span>
                <span>{isUnlimited(u.maxClasses) ? '∞' : `${u.classesProgressPct}%`}</span>
              </div>
            </div>

            {/* 3. Darslar */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Darslar</span>
                <BookOpen className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100">
                {u.lessonsCount} <span className="text-xs text-slate-400 font-normal">/ {isUnlimited(u.maxLessons) ? 'Cheksiz' : u.maxLessons}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${u.lessonsProgressPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Yaratilgan</span>
                <span>{isUnlimited(u.maxLessons) ? '∞' : `${u.lessonsProgressPct}%`}</span>
              </div>
            </div>

            {/* 4. Testlar */}
            <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Testlar</span>
                <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100">
                {u.testsCount} <span className="text-xs text-slate-400 font-normal">/ {isUnlimited(u.maxTests) ? 'Cheksiz' : u.maxTests}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${u.testsProgressPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Mavjud</span>
                <span>{isUnlimited(u.maxTests) ? '∞' : `${u.testsProgressPct}%`}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tezkor Asosiy Bo'limlar Kartalari */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        
        {/* 1. SINFLAR */}
        <Link href="/classes" prefetch={true} className="group block">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-lg transition-transform duration-150 relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[190px] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-white">
                O'tish <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg sm:text-2xl font-black tracking-tight">Sinflar</h3>
              <p className="text-indigo-100 text-xs sm:text-sm font-medium mt-1 opacity-90 truncate">
                {stats?.studentCount !== undefined ? `${stats.studentCount} nafar o'quvchi` : "Boshqarish"}
              </p>
            </div>
          </div>
        </Link>

        {/* 2. HISOBOT */}
        <Link href="/report" prefetch={true} className="group block">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-lg transition-transform duration-150 relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[190px] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                <FileBarChart className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-white">
                O'tish <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg sm:text-2xl font-black tracking-tight">Hisobot</h3>
              <p className="text-cyan-100 text-xs sm:text-sm font-medium mt-1 opacity-90 truncate">
                {stats?.avgPercentage !== undefined ? `${stats.avgPercentage}% o'rtacha tahlil` : "Tahlillar"}
              </p>
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
