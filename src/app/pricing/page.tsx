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
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { PLANS, AI_PACKS, PlanType, isUnlimited } from "@/utils/aiConfig";

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
  const u = status?.usage;

  const planOrder: PlanType[] = ['START', 'PRO', 'MAX', 'MAKTAB_PRO', 'MAKTAB_VIP'];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 pb-24 space-y-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Shaffof va Qulay Ta'lim Tariflari</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          O'zingizga mos tarifni tanlang
        </h1>
        
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          O'qituvchilar va maktablar uchun sun'iy intellekt orqali darslar, testlar va daftarlarni tekshirish imkoniyati.
        </p>
      </div>

      {/* Current Subscription & Usage Bar (If user is logged in) */}
      {status && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-900/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold">Joriy Obuna:</span>
                <span className="px-3 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-black rounded-full">
                  {status.planDetails.name}
                </span>
                {status.daysLeft !== null && (
                  <span className="text-xs text-slate-300">
                    ({status.daysLeft} kun qoldi)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {status.planExpiresAt 
                  ? `Amal qilish muddati: ${new Date(status.planExpiresAt).toLocaleDateString('uz-UZ')}`
                  : "Bepul sinov holati"}
              </p>
            </div>

            {/* Quick Progress Mini Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* AI Credits */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>AI Qoldiq</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm font-black text-white">
                  {u?.remainingAiCredits.toLocaleString()} / {u?.totalAiCredits.toLocaleString()}
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (u?.aiProgressPct || 0) > 90 ? 'bg-rose-500' :
                      (u?.aiProgressPct || 0) > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${u?.aiProgressPct || 0}%` }}
                  />
                </div>
              </div>

              {/* Classes */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <div className="text-[11px] text-slate-300">Sinflar</div>
                <div className="text-sm font-black text-white">
                  {u?.classesCount} / {isUnlimited(u?.maxClasses || 0) ? 'Cheksiz' : u?.maxClasses}
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${u?.classesProgressPct || 0}%` }} />
                </div>
              </div>

              {/* Tests */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <div className="text-[11px] text-slate-300">Testlar</div>
                <div className="text-sm font-black text-white">
                  {u?.testsCount} / {isUnlimited(u?.maxTests || 0) ? 'Cheksiz' : u?.maxTests}
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${u?.testsProgressPct || 0}%` }} />
                </div>
              </div>

              {/* Lessons */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <div className="text-[11px] text-slate-300">Darslar</div>
                <div className="text-sm font-black text-white">
                  {u?.lessonsCount} / {isUnlimited(u?.maxLessons || 0) ? 'Cheksiz' : u?.maxLessons}
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${u?.lessonsProgressPct || 0}%` }} />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 5 Main Subscription Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 items-stretch">
        {planOrder.map((planKey) => {
          const p = PLANS[planKey];
          const isCurrent = currentPlan === planKey;
          const isPopular = p.isPopular;
          const isSchool = p.isSchool;

          return (
            <div
              key={planKey}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 relative ${
                isPopular
                  ? 'bg-gradient-to-b from-indigo-50/90 to-white dark:from-indigo-950/40 dark:to-slate-900 border-2 border-indigo-600 dark:border-indigo-500 shadow-xl lg:-translate-y-2'
                  : isSchool
                  ? 'bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800/80 shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md'
              }`}
            >
              {/* Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between min-h-[28px]">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                    isPopular 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : isSchool 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {p.badge}
                  </span>

                  {isCurrent && (
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                      Faol
                    </span>
                  )}
                </div>

                {/* Title & Price */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {isPopular && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    {isSchool && <Crown className="w-4 h-4 text-purple-500" />}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 min-h-[32px]">{p.description}</p>
                </div>

                <div className="py-2 border-y border-slate-100 dark:border-slate-800/80">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                    {p.price.replace(" so'm", "")}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold ml-1">so'm / 30 kun</span>
                </div>

                {/* Core Specifications */}
                <div className="space-y-1.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">AI tekshirish:</span>
                    <b className="text-indigo-600 dark:text-indigo-400">{p.maxAiCredits.toLocaleString()} ta</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sinflar:</span>
                    <b>{isUnlimited(p.maxClasses) ? 'Cheksiz' : `${p.maxClasses} ta`}</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Darslar:</span>
                    <b>{isUnlimited(p.maxLessons) ? 'Cheksiz' : `${p.maxLessons} ta`}</b>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Testlar:</span>
                    <b>{isUnlimited(p.maxTests) ? 'Cheksiz' : `${p.maxTests} ta`}</b>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2 pt-2">
                  {p.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isPopular ? 'text-indigo-600' : 'text-emerald-500'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href="https://t.me/Novdaaibot"
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 ${
                    isPopular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : isSchool
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isCurrent ? "Muddatni uzaytirish" : "Tarifni tanlash"}</span>
                </a>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add-on AI Packs Section */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 p-8 rounded-3xl border border-indigo-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Qo'shimcha AI Paketlar</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              Tarifni o'zgartirmasdan AI kredit qo'shish
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Oylik AI tekshirish limitingiz tugab qolsa, alohida qo'shimcha paket xarid qilib balansingizni to'ldirishingiz mumkin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(AI_PACKS).map(([packKey, pack]) => (
            <div
              key={packKey}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">
                  {pack.name}
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                  +{pack.credits.toLocaleString()} ta AI tekshirish
                </div>
                <p className="text-xs text-slate-500">{pack.price}</p>
              </div>

              <a
                href="https://t.me/Novdaaibot"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Paketni olish ({pack.price})</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* License Key Activation Card */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-5 text-center">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Telegram Bot orqali olingan kalit bormi?
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Bot orqali sotib olingan tarif yoki AI Pack kalitini kiriting va darhol faollashtiring.
          </p>
        </div>

        <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="text"
            placeholder="PRO-XXXX-YYYY yoki PACK500-..."
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 text-xs sm:text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={activating}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {activating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Faollashtirish</span>}
          </button>
        </form>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-4 pt-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          <span>Ko'p beriladigan savollar</span>
        </h3>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">1. AI tekshirish nima degani?</h4>
            <p className="text-slate-500 mt-1">
              AI orqali daftar, test javob varaqasi, diktant yoki ochiq savollarni tekshirish 1 ta yoki 2 ta AI kreditni tashkil etadi. Barcha AI xizmatlari yagona kredit hisobingizdan yechiladi.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">2. Cheksiz dars va test nima degani?</h4>
            <p className="text-slate-500 mt-1">
              Maktab VIP tarifida o'zingiz mustaqil tuzadigan standart test va darslar soni cheksiz. Agar AI yordamida avtomatik test yoki dars reja yaratmoqchi bo'lsangiz, ajratilgan 6 500 ta AI kreditdan foydalaniladi.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">3. AI limitingiz tugasa nima qilish kerak?</h4>
            <p className="text-slate-500 mt-1">
              Tarifni o'zgartirmasdan, atigi 29 000 so'mga <b>AI Pack 500</b> yoki 49 000 so'mga <b>AI Pack 1000</b> qo'shimcha paketini sotib olishingiz mumkin.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
