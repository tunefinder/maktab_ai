"use client";

import Link from "next/link";
import { 
  Users, 
  ChevronRight, 
  Zap, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  CheckSquare,
  ArrowRight,
  Plus,
  Clock,
  Lightbulb,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Camera,
  FileText,
  Crown
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { fastFetch } from "@/utils/fastFetch";
import { isUnlimited, PLANS } from "@/utils/aiConfig";
import AiLimitInfoModal from "@/components/AiLimitInfoModal";

interface StatsData {
  classCount?: number;
  studentCount?: number;
  testCount?: number;
  attemptCount?: number;
  avgPercentage?: number;
  classes?: Array<{
    id: string;
    name: string;
    _count?: { students: number; tests: number };
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
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fastFetch<StatsData>("/api/stats").catch(() => null),
      fastFetch<LicenseStatus>("/api/license/status").catch(() => null),
      fastFetch<any[]>("/api/classes").catch(() => [])
    ]).then(([statsData, licData, classesData]) => {
      if (statsData) setStats(statsData);
      if (licData) setLicStatus(licData);
      if (Array.isArray(classesData)) setClassesList(classesData);
      setLoading(false);
    });
  }, []);

  const displayName = user?.name || profileName || "Ustoz";
  const userPlan = (user?.plan || licStatus?.plan || "FREE").toUpperCase();
  const planMeta = PLANS[userPlan as keyof typeof PLANS] || PLANS.FREE;
  const u = licStatus?.usage;

  const remainingCredits = u?.remainingAiCredits ?? (user ? 3195 : 100);
  const totalCredits = u?.totalAiCredits ?? planMeta.maxAiCredits;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 pb-28 animate-in fade-in duration-300">
      
      {/* 1. Warm & Clean Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 sm:p-8 shadow-xl">
        
        {/* Subtle Decorative Aura */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Welcome Text */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ta'lim va AI Markazi</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Assalomu alaykum, {displayName}! 👋
            </h1>
            
            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-lg leading-relaxed">
              Bugun qaysi dars yoki sinf bilan shug'ullanamiz? Quyidagi bo'limlardan birini tanlang:
            </p>
          </div>

          {/* Plan & AI Status Pill */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
            <Link
              href="/pricing"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border border-white/20 text-white transition-all flex items-center gap-2 text-xs font-bold group"
            >
              <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{planMeta.name} TARIFI</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={() => setIsInfoModalOpen(true)}
              className="px-3.5 py-1.5 bg-black/20 hover:bg-black/30 text-indigo-100 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{remainingCredits.toLocaleString()} / {totalCredits.toLocaleString()} AI limiti</span>
            </button>
          </div>

        </div>

      </div>

      {/* 2. 3 High-Impact Primary Pedagogical Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARD 1: AI Tekshirish (Grader) */}
        <Link href="/grader" className="group block">
          <div className="h-full p-6 sm:p-7 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/60 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 relative overflow-hidden group-hover:-translate-y-1">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black rounded-full">
                  ⭐ ASOSIY
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                AI Daftar Tekshirish
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                O'quvchi daftarlari yoki test varaqalarini rasmga oling — AI 5 soniyada xatolarni aniqlab, ball qo'yadi.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-black text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Tekshirishni boshlash</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>

          </div>
        </Link>

        {/* CARD 2: Dars Rejasi (Lesson Planner) */}
        <Link href="/lesson-planner" className="group block">
          <div className="h-full p-6 sm:p-7 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 relative overflow-hidden group-hover:-translate-y-1">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black rounded-full">
                  📖 METODIK
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Dars Ishlanmasi
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                45 daqiqalik to'liq dars ishlanmasi, interaktiv o'yinlar, konspekt va taqdimot materiallarini tuzing.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Dars rejasini tuzish</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>

          </div>
        </Link>

        {/* CARD 3: Test Yaratish & A4 (Tests) */}
        <Link href="/tests" className="group block">
          <div className="h-full p-6 sm:p-7 bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 relative overflow-hidden group-hover:-translate-y-1">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[11px] font-black rounded-full">
                  📝 DTM & A4
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Testlar & Chop etish
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Fan va mavzu bo'yicha AI test savollari tuzing, A4 formatda chop eting va kalitlarni saqlang.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-black text-purple-600 dark:text-purple-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Testlar bo'limiga o'tish</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>

          </div>
        </Link>

      </div>

      {/* 3. Clean Stats & Classes Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Sinflarim Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sinflarim</div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {classesList.length || stats?.classCount || 0} ta sinf
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stats?.studentCount || 0} nafar o'quvchi
              </div>
            </div>
          </div>

          <Link
            href="/classes"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Boshqarish
          </Link>
        </div>

        {/* Testlar Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mavjud Testlar</div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {stats?.testCount || 0} ta test
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stats?.attemptCount || 0} ta topshirilgan ish
              </div>
            </div>
          </div>

          <Link
            href="/tests"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Ko'rish
          </Link>
        </div>

        {/* Hisobot Card */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">O'rtacha Ball</div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {stats?.avgPercentage ? `${Math.round(stats.avgPercentage)}%` : "N/A"}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Sinflar o'zlashtirishi
              </div>
            </div>
          </div>

          <Link
            href="/report"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Hisobot
          </Link>
        </div>

      </div>

      {/* 4. Active Classes Quick Jump */}
      {classesList.length > 0 && (
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Tezkor sinf tanlash</span>
            </h3>
            <Link href="/classes" className="text-xs font-bold text-indigo-600 hover:underline">
              Barcha sinflar ({classesList.length})
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {classesList.map((cls) => (
              <Link
                key={cls.id}
                href={`/grader`}
                className="px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all flex items-center gap-2 group shadow-xs"
              >
                <span>{cls.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({cls._count?.students || 0} o'quvchi)
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info Modal Component */}
      <AiLimitInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />

    </div>
  );
}
