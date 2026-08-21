"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Check, 
  KeyRound, 
  Send, 
  ShieldCheck, 
  Zap, 
  Star, 
  Crown, 
  HelpCircle,
  ArrowRight,
  School,
  Flame,
  PlusCircle,
  RefreshCw,
  Users,
  Gift,
  CheckCircle2,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import { PLANS, AI_PACKS, PlanType, isUnlimited, REFERRAL_CONFIG } from "@/utils/aiConfig";
import AiLimitInfoModal from "@/components/AiLimitInfoModal";
import Link from "next/link";

interface SubscriptionStatus {
  plan: PlanType;
  planDetails: any;
  planExpiresAt: string | null;
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

export default function PricingPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/license/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      toast.error("Iltimos, faollashtirish kalitini kiriting");
      return;
    }

    setActivating(true);
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kalitni faollashtirishda xatolik");
      }

      toast.success(data.message, { duration: 5000 });
      setLicenseKey("");
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setActivating(false);
    }
  };

  const currentPlan = status?.plan || 'FREE';

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4 space-y-12 animate-in fade-in duration-300 pb-28">
      
      {/* 1. Header & Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ustozlar va Maktablar uchun hamyonbop tariflar</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Oddiy, tushunarli va qulay tariflar
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Kutubxonangizdagi har bir sinf va daftar uchun eng maqbul rejani tanlang. Yashirin to'lovlar yo'q.
        </p>
      </div>

      {/* 2. Current Subscription Status Card (If Logged In) */}
      {status && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Joriy tarifingiz:</span>
              <span className="px-3 py-1 bg-indigo-600 text-white font-black text-xs rounded-full shadow-xs">
                {PLANS[currentPlan]?.name || currentPlan}
              </span>
              {status.daysLeft !== null && currentPlan !== 'FREE' && (
                <span className="text-xs text-slate-500 font-medium">
                  ({status.daysLeft > 0 ? `${status.daysLeft} kun qoldi` : "Muddati tugagan"})
                </span>
              )}
            </div>

            {/* AI Limit Progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>AI limiti:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">
                    {(status.usage.remainingAiCredits || 0).toLocaleString()} ta qoldi
                  </span>
                  <span className="text-slate-400 font-normal">
                    / {(status.usage.totalAiCredits || 0).toLocaleString()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>ⓘ Qanday hisoblanadi?</span>
                </button>
              </div>
              <div className="w-full sm:w-80 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    status.usage.aiProgressPct >= 90 ? 'bg-rose-500' : status.usage.aiProgressPct >= 70 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, status.usage.aiProgressPct)}%` }}
                />
              </div>
            </div>
          </div>

          <a
            href="https://t.me/Novdaaibot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-indigo-200/80 dark:border-indigo-800 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>@Novdaaibot orqali to'lash</span>
          </a>
        </div>
      )}

      {/* 3. Main SaaS Plans Grid (Mobile-first, PRO prominently highlighted) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* FREE PLAN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{PLANS.FREE.name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                {PLANS.FREE.badge}
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">0 so'm</div>
              <p className="text-xs text-slate-500 mt-0.5">{PLANS.FREE.tagline || "Karta ma'lumoti talab qilinmaydi."}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200">
              ⚡ 100 AI limiti (7 kunlik sinov)
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {PLANS.FREE.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://t.me/Novdaaibot?start=trial"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-all block"
          >
            {PLANS.FREE.ctaText || "7 kun bepul boshlash"}
          </a>
        </div>

        {/* START PLAN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{PLANS.START.name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                {PLANS.START.badge}
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                19 000 <span className="text-sm font-normal text-slate-500">so'm / oy</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{PLANS.START.tagline}</p>
            </div>

            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold text-indigo-900 dark:text-indigo-200">
              ⚡ 1 500 AI limiti
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {PLANS.START.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://t.me/Novdaaibot?start=buy_START"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs text-center border border-indigo-200 dark:border-indigo-800 transition-all block"
          >
            {PLANS.START.ctaText || "19 000 so'mga boshlash"}
          </a>
        </div>

        {/* PRO PLAN (⭐ ENG OMMABOP - HIGHLIGHTED) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border-2 border-indigo-600 dark:border-indigo-500 shadow-lg relative flex flex-col justify-between space-y-6 md:-translate-y-2">
          
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-black rounded-full shadow-sm flex items-center gap-1.5 whitespace-nowrap">
            <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>Eng ommabop</span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">PRO TARIF</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                ⭐ Tavsiya etiladi
              </span>
            </div>

            <div>
              <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                39 000 <span className="text-sm font-normal text-slate-500">so'm / oy</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{PLANS.PRO.tagline}</p>
            </div>

            <div className="p-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-xs flex items-center justify-between">
              <span>⚡ 3 200 AI limiti</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">3 200 tagacha test</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
              {PLANS.PRO.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                  <span className="font-medium">{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://t.me/Novdaaibot?start=buy_PRO"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm text-center shadow-md hover:shadow-indigo-500/20 transition-all block active:scale-98"
          >
            {PLANS.PRO.ctaText || "PRO ni tanlash"}
          </a>
        </div>

        {/* MAX PLAN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{PLANS.MAX.name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                {PLANS.MAX.badge}
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                69 000 <span className="text-sm font-normal text-slate-500">so'm / oy</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{PLANS.MAX.tagline}</p>
            </div>

            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold text-indigo-900 dark:text-indigo-200">
              ⚡ 6 000 AI limiti
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {PLANS.MAX.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://t.me/Novdaaibot?start=buy_MAX"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-center transition-all block"
          >
            {PLANS.MAX.ctaText || "MAX ni tanlash"}
          </a>
        </div>

        {/* MAKTAB PRO PLAN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{PLANS.MAKTAB_PRO.name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                {PLANS.MAKTAB_PRO.badge}
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                129 000 <span className="text-sm font-normal text-slate-500">so'm / oy</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{PLANS.MAKTAB_PRO.tagline}</p>
            </div>

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-xs font-bold text-blue-900 dark:text-blue-200">
              ⚡ 11 000 AI limiti (5 o'qituvchi)
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {PLANS.MAKTAB_PRO.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://t.me/Novdaaibot?start=buy_MAKTAB_PRO"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs text-center border border-blue-200 dark:border-blue-800 transition-all block"
          >
            {PLANS.MAKTAB_PRO.ctaText || "Maktab PRO ni tanlash"}
          </a>
        </div>

        {/* MAKTAB VIP PLAN */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{PLANS.MAKTAB_VIP.name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                {PLANS.MAKTAB_VIP.badge}
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
                199 000 <span className="text-sm font-normal text-slate-500">so'm / oy</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{PLANS.MAKTAB_VIP.tagline}</p>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-xs font-bold text-amber-900 dark:text-amber-200">
              ⚡ 17 000 AI limiti (15 o'qituvchi)
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {PLANS.MAKTAB_VIP.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://t.me/Novdaaibot?start=buy_MAKTAB_VIP"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs text-center border border-amber-200 dark:border-amber-800 transition-all block"
          >
            {PLANS.MAKTAB_VIP.ctaText || "Maktab VIP ni tanlash"}
          </a>
        </div>

      </div>

      {/* 4. Desktop Comparison Table */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tariflarni taqqoslash</h3>
          <p className="text-xs text-slate-500">O'zingizga eng mos keladigan imkoniyatlarni o'rganing</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-bold">Imkoniyat</th>
                <th className="py-3 px-4 font-bold">START</th>
                <th className="py-3 px-4 font-bold text-indigo-600">PRO ⭐</th>
                <th className="py-3 px-4 font-bold">MAX</th>
                <th className="py-3 px-4 font-bold">MAKTAB PRO</th>
                <th className="py-3 px-4 font-bold">VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3.5 px-4 font-bold">Oylik to'lov</td>
                <td className="py-3.5 px-4">19 000 so'm</td>
                <td className="py-3.5 px-4 font-black text-indigo-600">39 000 so'm</td>
                <td className="py-3.5 px-4">69 000 so'm</td>
                <td className="py-3.5 px-4">129 000 so'm</td>
                <td className="py-3.5 px-4">199 000 so'm</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">AI limiti</td>
                <td className="py-3.5 px-4">1 500 ta</td>
                <td className="py-3.5 px-4 font-black text-indigo-600">3 200 ta</td>
                <td className="py-3.5 px-4">6 000 ta</td>
                <td className="py-3.5 px-4">11 000 ta</td>
                <td className="py-3.5 px-4">17 000 ta</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">O'qituvchilar soni</td>
                <td className="py-3.5 px-4">1 ta</td>
                <td className="py-3.5 px-4">1 ta</td>
                <td className="py-3.5 px-4">2 ta</td>
                <td className="py-3.5 px-4">5 ta</td>
                <td className="py-3.5 px-4 font-bold">15 ta</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Sinflar</td>
                <td className="py-3.5 px-4">2 ta</td>
                <td className="py-3.5 px-4 font-bold">6 ta</td>
                <td className="py-3.5 px-4">15 ta</td>
                <td className="py-3.5 px-4">50 ta</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600">Cheksiz</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Dars rejalari va testlar</td>
                <td className="py-3.5 px-4">30 ta</td>
                <td className="py-3.5 px-4 font-bold">100 ta</td>
                <td className="py-3.5 px-4">300 ta</td>
                <td className="py-3.5 px-4">1 000 ta</td>
                <td className="py-3.5 px-4 font-bold text-emerald-600">Cheksiz</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">PDF / Excel eksport</td>
                <td className="py-3.5 px-4 text-slate-300">—</td>
                <td className="py-3.5 px-4 text-emerald-600 font-bold">✓ Bor</td>
                <td className="py-3.5 px-4 text-emerald-600 font-bold">✓ Bor</td>
                <td className="py-3.5 px-4 text-emerald-600 font-bold">✓ Bor</td>
                <td className="py-3.5 px-4 text-emerald-600 font-bold">✓ Bor</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Qo'llab-quvvatlash</td>
                <td className="py-3.5 px-4">Standart</td>
                <td className="py-3.5 px-4 font-bold text-indigo-600">Ustuvor</td>
                <td className="py-3.5 px-4">Ustuvor</td>
                <td className="py-3.5 px-4">Priority</td>
                <td className="py-3.5 px-4 font-bold text-amber-600">24/7 Menejer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add-On AI Packs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Qo'shimcha AI limit paketlari
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tarifingizni almashtirmasdan AI limitini oshiring. Limit mavjud tarifingiz davomida amal qiladi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 self-start sm:self-auto"
          >
            ⓘ Qanday hisoblanadi?
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">AI Pack 1 000</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">9 000 so'm</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">+1 000 ta qo'shimcha AI limiti</p>
            </div>
            <a
              href="https://t.me/Novdaaibot?start=buy_PACK_1000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl text-center border border-slate-200 dark:border-slate-600 block transition-all"
            >
              Sotib olish
            </a>
          </div>

          <div className="p-5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">AI Pack 3 000 ⭐</span>
              <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200">19 000 so'm</div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">+3 000 ta qo'shimcha AI limiti</p>
            </div>
            <a
              href="https://t.me/Novdaaibot?start=buy_PACK_3000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl text-center shadow-xs block transition-all"
            >
              Sotib olish
            </a>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">AI Pack 7 000</span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">39 000 so'm</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">+7 000 ta qo'shimcha AI limiti</p>
            </div>
            <a
              href="https://t.me/Novdaaibot?start=buy_PACK_7000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl text-center border border-slate-200 dark:border-slate-600 block transition-all"
            >
              Sotib olish
            </a>
          </div>
        </div>
      </div>

      {/* 6. Referral Program Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20 shrink-0">
            <Gift className="w-8 h-8 text-amber-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Do'stingizni taklif qiling!</h3>
            <p className="text-xs sm:text-sm text-indigo-100">
              {REFERRAL_CONFIG.bannerText}
            </p>
          </div>
        </div>

        <a
          href="https://t.me/Novdaaibot?start=referral"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 bg-white text-indigo-700 font-black text-xs rounded-2xl shadow-sm hover:bg-indigo-50 transition-all shrink-0 active:scale-95"
        >
          Havolani olish
        </a>
      </div>

      {/* 7. License Key Activation Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Telegram Bot orqali olingan kalit bormi?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              @Novdaaibot orqali to'lov qilib olgan kalitingizni kiriting va tarifingizni bir zumda faollashtiring.
            </p>
          </div>
        </div>

        <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Masalan: PRO-2026-XXXXX yoki START-XXXXX"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            disabled={activating}
            className="flex-1 px-4 py-3.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            disabled={activating}
            className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all shrink-0 active:scale-98"
          >
            {activating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Faollashtirish</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Modal Component */}
      <AiLimitInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
      />

    </div>
  );
}
