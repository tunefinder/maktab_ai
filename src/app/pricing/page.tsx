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
  ExternalLink, 
  Clock, 
  HelpCircle,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { PLANS, PlanType } from "@/utils/limits";

interface SubscriptionStatus {
  plan: PlanType;
  planDetails: any;
  planExpiresAt: string | null;
  daysLeft: number | null;
  isExpired: boolean;
  usage: {
    classesCount: number;
    maxClasses: number;
    testsCount: number;
    maxTests: number;
    usedNotebooks: number;
    maxNotebooks: number;
  };
}

export default function PricingPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);

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
    <div className="max-w-5xl mx-auto py-6 px-4 pb-20 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Shaffof va Qulay Tariflar</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          O&apos;qituvchi faoliyatingizni yangi bosqichga olib chiqing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          O&apos;zingizga mos tarifni tanlang, Telegram bot orqali kalit oling va bir necha soniyada barcha imkoniyatlarni faollashtiring.
        </p>
      </div>

      {/* Current Active Plan Status Banner */}
      {status && (
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-3xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md shrink-0">
                {currentPlan === 'VIP' ? (
                  <Crown className="w-6 h-6" />
                ) : currentPlan === 'PRO' ? (
                  <Zap className="w-6 h-6" />
                ) : (
                  <Star className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Sizning joriy tarifingiz:
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[11px] font-extrabold rounded-full">
                    {PLANS[currentPlan]?.name || "Bepul"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {currentPlan === 'FREE' ? "Bepul Sinov Rejimi" : `${PLANS[currentPlan]?.name} Faol`}
                </h3>
                {status.daysLeft !== null && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Amal qilish muddati: <strong className="text-slate-800 dark:text-slate-200">{status.daysLeft} kun</strong> qoldi</span>
                  </p>
                )}
              </div>
            </div>

            {/* Progress Counters (fixed no-wrap) */}
            <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-6">
              <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sinflar</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {status.usage.classesCount} / {status.usage.maxClasses > 1000 ? "∞" : status.usage.maxClasses}
                </p>
              </div>
              <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Daftarlar</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {status.usage.usedNotebooks} / {status.usage.maxNotebooks}
                </p>
              </div>
              <div className="text-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Testlar</p>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {status.usage.testsCount} / {status.usage.maxTests > 1000 ? "∞" : status.usage.maxTests}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Key Activation Card - Solid high-contrast dark container */}
      <div className="p-6 sm:p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md shrink-0">
            <KeyRound className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Telegram Bot orqali olingan kalit bormi?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Telegram botimizda to&apos;lov qilganingizda berilgan maxsus litsenziya kalitini kiriting va hisobingizni darhol PRO/VIP ga aylantiring.
            </p>
          </div>
        </div>

        <form onSubmit={handleActivate} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="Masalan: PRO-USTOZ-2026"
              className="w-full h-12 px-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-sm uppercase tracking-wider placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
          <Button
            type="submit"
            disabled={activating}
            className="w-full sm:w-auto h-12 px-7 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shrink-0"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            {activating ? "Tekshirilmoqda..." : "Faollashtirish"}
          </Button>
        </form>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-slate-300 border-t border-slate-800">
          <span className="flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kalit kiritilishi bilan soniyalar ichida faollashadi</span>
          </span>
          <a
            href="https://t.me/NovdaAIBot"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Botdan kalit sotib olish (@NovdaAIBot)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
        
        {/* FREE PLAN */}
        <div className={`p-6 bg-white dark:bg-slate-900 rounded-3xl flex flex-col justify-between transition-all border ${currentPlan === 'FREE' ? 'border-2 border-slate-400 dark:border-slate-600 shadow-md' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full">
                {PLANS.FREE.badge}
              </span>
              {currentPlan === 'FREE' && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  Joriy tarif
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{PLANS.FREE.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{PLANS.FREE.description}</p>
            </div>

            <div className="py-2">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">0 so&apos;m</span>
              <span className="text-xs text-slate-500 ml-1">/ doimiy</span>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              {PLANS.FREE.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={true}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-default"
            >
              {currentPlan === 'FREE' ? "Hozirda faol" : "Boshlang'ich"}
            </button>
          </div>
        </div>

        {/* PRO PLAN (RECOMMENDED) */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl flex flex-col justify-between relative overflow-hidden border-2 border-indigo-500 shadow-xl scale-[1.02]">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-extrabold uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-xs">
            Eng Ommabop
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full">
                {PLANS.PRO.badge}
              </span>
              {currentPlan === 'PRO' && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  Joriy tarif
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{PLANS.PRO.name}</span>
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">{PLANS.PRO.description}</p>
            </div>

            <div className="py-2">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{PLANS.PRO.price}</span>
              <span className="text-xs text-slate-500 ml-1">/ {PLANS.PRO.period}</span>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              {PLANS.PRO.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <a
              href="https://t.me/NovdaAIBot"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{currentPlan === 'PRO' ? "Muddati uzaytirish (Bot)" : "Kalit sotib olish (Bot)"}</span>
            </a>
          </div>
        </div>

        {/* VIP PLAN */}
        <div className={`p-6 bg-white dark:bg-slate-900 rounded-3xl flex flex-col justify-between transition-all border ${currentPlan === 'VIP' ? 'border-2 border-purple-500 shadow-md' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full">
                {PLANS.VIP.badge}
              </span>
              {currentPlan === 'VIP' && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  Joriy tarif
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{PLANS.VIP.name}</span>
                <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">{PLANS.VIP.description}</p>
            </div>

            <div className="py-2">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{PLANS.VIP.price}</span>
              <span className="text-xs text-slate-500 ml-1">/ {PLANS.VIP.period}</span>
            </div>

            <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              {PLANS.VIP.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            <a
              href="https://t.me/NovdaAIBot"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Send className="w-4 h-4 text-purple-400" />
              <span>VIP Kalit olish (Bot)</span>
            </a>
          </div>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-4 pt-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          <span>Ko&apos;p beriladigan savollar</span>
        </h3>

        <div className="space-y-3">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Telegram botdan qanday qilib kalit sotib olaman?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Telegramda @NovdaAIBot manziliga o&apos;ting, &quot;Tarif sotib olish&quot; bo&apos;limini tanlang va Click/Payme orqali to&apos;lov qiling. Bot sizga maxsus kod beradi. Ushbu kodni yuqoridagi maydonga kiritib &quot;Faollashtirish&quot; tugmasini bosing.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">2. Obuna muddati tugasa nima bo&apos;ladi?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Barcha saqlangan sinflaringiz, testlaringiz va o&apos;quvchilar natijalari o&apos;chib ketmaydi. Faqat yangi daftar tekshirish yoki test yaratish bepul tarif limitiga (oyiga 20 ta daftar) qaytadi.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Sinov uchun bepul kalit bormi?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Ha! Dastur imkoniyatlarini sinab ko&apos;rish uchun <code className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold rounded">PRO-8899-7711</code> kalitini kiritib PRO tarifni faollashtirishingiz mumkin.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
