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
  CheckSquare,
  ArrowRight,
  User,
  Plus,
  Clock,
  Lightbulb,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { fastFetch } from "@/utils/fastFetch";
import { isUnlimited } from "@/utils/aiConfig";

interface StatsData {
  classCount?: number;
  studentCount?: number;
  testCount?: number;
  attemptCount?: number;
  avgPercentage?: number;
  recentTests?: Array<{
    id: string;
    title: string;
    subject: string;
    class?: { name: string };
    _count?: { attempts: number };
  }>;
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
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [licStatus, setLicStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fastFetch<StatsData>("/api/stats").catch(() => null),
      fastFetch<LicenseStatus>("/api/license/status").catch(() => null)
    ]).then(([statsData, licData]) => {
      if (statsData) setStats(statsData);
      if (licData) setLicStatus(licData);
      setLoading(false);
    });
  }, []);

  const displayName = user?.name || profileName || "Ustoz";
  const u = licStatus?.usage;
  const isAiCritical = (u?.aiProgressPct || 0) >= 90;
  const isAiWarning = (u?.aiProgressPct || 0) >= 70 && !isAiCritical;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      
      {/* 1. Header: Teacher Welcome & Current Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
              Ta'lim boshqaruvi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Assalomu alaykum, {displayName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Dars rejalari, testlar va o'quvchilar natijalarini boshqarish markazi.
          </p>
        </div>

        {licStatus && (
          <Link
            href="/pricing"
            className="self-start sm:self-auto flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl transition-all shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left pr-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Tarif: {licStatus.planDetails.name}</div>
              <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                {licStatus.daysLeft !== null ? `${licStatus.daysLeft} kun qoldi` : "Faol"}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* 2. Key Metrics Bar (4 Simple Clear Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: AI Tekshirish */}
        <div className={`p-5 rounded-3xl border transition-all ${
          isAiCritical
            ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60'
            : isAiWarning
            ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>AI Tekshirish</span>
            <Zap className={`w-4 h-4 ${isAiCritical ? 'text-rose-500' : isAiWarning ? 'text-amber-500' : 'text-indigo-500'}`} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {u ? u.remainingAiCredits.toLocaleString() : (stats?.attemptCount || 0)}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {u?.totalAiCredits || 1000}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full transition-all ${
                isAiCritical ? 'bg-rose-500' : isAiWarning ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${u?.aiProgressPct || 25}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>Qoldiq tekshiruvlar</span>
            <Link href="/pricing" className="text-indigo-600 font-bold hover:underline">+Olish</Link>
          </div>
        </div>

        {/* Metric 2: Sinflar */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Sinflarim</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {stats?.classCount || u?.classesCount || 0}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {isUnlimited(u?.maxClasses || 6) ? 'Cheksiz' : (u?.maxClasses || 6)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${u?.classesProgressPct || 40}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>{stats?.studentCount || 0} nafar o'quvchi</span>
            <Link href="/classes" className="text-blue-600 font-bold hover:underline">O'tish</Link>
          </div>
        </div>

        {/* Metric 3: Darslar */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Dars Rejalari</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {u?.lessonsCount || 0}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {isUnlimited(u?.maxLessons || 100) ? 'Cheksiz' : (u?.maxLessons || 100)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${u?.lessonsProgressPct || 10}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>45 daqiqalik reja</span>
            <Link href="/lesson-planner" className="text-purple-600 font-bold hover:underline">Tuzish</Link>
          </div>
        </div>

        {/* Metric 4: Testlar */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Testlar</span>
            <GraduationCap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {stats?.testCount || u?.testsCount || 0}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {isUnlimited(u?.maxTests || 100) ? 'Cheksiz' : (u?.maxTests || 100)}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${u?.testsProgressPct || 20}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>DTM / Test kalitlari</span>
            <Link href="/tests" className="text-cyan-600 font-bold hover:underline">Ko'rish</Link>
          </div>
        </div>

      </div>

      {/* 3. Tezkor Amallar (4 Large Action Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Tezkor amallar</span>
          </h2>
          <span className="text-xs text-slate-400">Kerakli bo'limni tanlang</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Action 1: AI Tekshirish */}
          <Link href="/grader" className="group block">
            <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between min-h-[170px] active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-white flex items-center gap-1">
                  1-qadam <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">AI Tekshirish</h3>
                <p className="text-xs text-indigo-100 mt-1 opacity-90">
                  Daftar va test varaqalarini suratga olib tekshirish
                </p>
              </div>
            </div>
          </Link>

          {/* Action 2: Dars Rejasi */}
          <Link href="/lesson-planner" className="group block">
            <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between min-h-[170px] active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-white flex items-center gap-1">
                  AI <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Dars Rejasi</h3>
                <p className="text-xs text-purple-100 mt-1 opacity-90">
                  45 daqiqalik dars ishlanmasi va o'yinlar tuzish
                </p>
              </div>
            </div>
          </Link>

          {/* Action 3: Test Yaratish */}
          <Link href="/tests" className="group block">
            <div className="p-6 bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between min-h-[170px] active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-white flex items-center gap-1">
                  DTM <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Testlar</h3>
                <p className="text-xs text-cyan-100 mt-1 opacity-90">
                  AI test tuzish va A4 javob varaqasi chop etish
                </p>
              </div>
            </div>
          </Link>

          {/* Action 4: Sinflarim */}
          <Link href="/classes" className="group block">
            <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between min-h-[170px] active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-white flex items-center gap-1">
                  Ro'yxat <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Sinflarim</h3>
                <p className="text-xs text-slate-300 mt-1 opacity-90">
                  O'quvchilar ro'yxati va eMaktab import/eksport
                </p>
              </div>
            </div>
          </Link>

        </div>
      </div>

      {/* 4. Pedagogical Hint & Quick Help Banner */}
      <div className="p-5 sm:p-6 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-3xl border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              O'qituvchi uchun foydali maslahat
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar tekshirishdan oldin <b>"Testlar"</b> bo'limida to'g'ri javob kalitini kiriting yoki AI orqali tezda tuzing.
            </p>
          </div>
        </div>

        <Link
          href="/grader"
          className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0 transition-all flex items-center gap-1.5"
        >
          <span>Tekshirishni boshlash</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
