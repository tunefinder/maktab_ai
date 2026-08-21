"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Sparkles, 
  ShieldCheck, 
  KeyRound, 
  Crown, 
  Moon, 
  Sun, 
  Type, 
  Bell, 
  LogOut, 
  Check, 
  Lock, 
  Smartphone, 
  School, 
  Mail, 
  ArrowRight, 
  ExternalLink, 
  Save, 
  RefreshCw, 
  Palette, 
  CreditCard, 
  Zap, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  BookOpen,
  Calendar,
  Send
} from "lucide-react";
import toast from "react-hot-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PLANS } from "@/utils/aiConfig";
import Link from "next/link";

type SettingsTab = 'profile' | 'subscription' | 'security' | 'appearance';

export default function SettingsPage() {
  const { 
    theme, 
    fontSize, 
    profileName, 
    notificationsEnabled,
    setTheme, 
    setFontSize, 
    setProfileName, 
    setNotificationsEnabled, 
    t 
  } = useSettings();

  const { user, logout, updateProfile } = useAuth();
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form State
  const [name, setName] = useState(user?.name || profileName || "O'qituvchi");
  const [subject, setSubject] = useState(user?.subject || "Biologiya");
  const [school, setSchool] = useState(user?.school || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      if (user.subject) setSubject(user.subject);
      if (user.school) setSchool(user.school);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Ism bo'sh bo'lishi mumkin emas");
      return;
    }

    setIsSavingProfile(true);
    try {
      setProfileName(name);
      if (user) {
        await updateProfile({
          name: name.trim(),
          subject: subject.trim(),
          school: school.trim(),
          phone: phone.trim(),
          email: email.trim()
        });
      }
      toast.success("Profil ma'lumotlari saqlandi! 🎉");
    } catch {
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Yangi parollar bir-biriga mos kelmadi");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Parolni yangilashda xatolik");
      }

      toast.success("Parolingiz muvaffaqiyatli yangilandi! 🔒");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const displayName = user?.name || profileName || "Ustoz";
  const userPlan = (user?.plan || "FREE").toUpperCase();
  const currentPlanMeta = PLANS[userPlan as keyof typeof PLANS] || PLANS.FREE;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-300">
      
      {/* 1. Ultra-Premium Glassmorphism Profile Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with Plan Crown */}
            <div className="relative self-start sm:self-auto">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl font-black shadow-xl ring-4 ring-white/10 shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-amber-400 text-slate-950 rounded-xl shadow-md ring-2 ring-slate-900">
                <Crown className="w-4 h-4 fill-current" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {displayName}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-xs ${
                  userPlan === 'PRO' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-300/50' :
                  userPlan === 'VIP' || userPlan === 'MAKTAB_VIP' ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white' :
                  userPlan === 'MAX' || userPlan === 'MAKTAB_PRO' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                  'bg-white/15 text-indigo-200 border border-white/20'
                }`}>
                  {currentPlanMeta?.name || userPlan} TARIFI
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-indigo-200/90 font-medium">
                <span className="font-mono text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-lg">
                  @{user?.username || 'ustoz'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{user?.subject || subject || "Pedagog"}</span>
                </span>
                {user?.school && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{user.school}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 pt-2 md:pt-0">
            <Link
              href="/pricing"
              className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-95 shrink-0"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Tarifni Yangilash</span>
            </Link>
            
            {user && (
              <button
                onClick={() => {
                  if (confirm("Haqiqatan ham hisobingizdan chiqmoqchimisiz?")) {
                    logout();
                  }
                }}
                className="p-3 bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 rounded-2xl transition-colors border border-white/10"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 2. Modern Segmented Tab Navigation */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-300/50 dark:border-slate-700/60 overflow-x-auto scrollbar-none gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-900/5'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Shaxsiy Profil</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscription')}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
            activeTab === 'subscription'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-900/5'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Tarif & Balans</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-900/5'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Xavfsizlik & Parol</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md shadow-slate-900/5'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4 text-blue-500" />
          <span>Ko'rinish & Tizim</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: Shaxsiy Profil */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              Shaxsiy Ma'lumotlar
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Ism-sharif, mutaxassislik va maktab ma'lumotlaringizni yangilang
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ism va Familiya *</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Ra'no Karimova"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dars beradigan fan</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Masalan: Biologiya, Matematika, Tarix"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* School */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Maktab raqami yoki nomi</span>
                </label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Masalan: 45-sonli umumiy o'rta ta'lim maktabi"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Telefon raqami</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Elektron pochta (ixtiyoriy)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ustoz@maktab.uz"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-98"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saqlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>O'zgarishlarni Saqlash</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Tarif & Balans */}
      {activeTab === 'subscription' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Main Plan Card */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-800/60 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-300/30">
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  <span>Joriy Rejangiz</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  {currentPlanMeta?.name || userPlan} TARIFI
                </h3>
                <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                  {currentPlanMeta?.tagline || "O'qituvchilar va maktablar uchun qulay reja"}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-3xl font-black text-white tracking-tight">
                  {currentPlanMeta?.price || "0 so'm"}
                </div>
                <div className="text-xs text-indigo-300">
                  {currentPlanMeta?.period || "30 kun"}
                </div>
              </div>
            </div>

            {/* AI Limit Progress */}
            <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="flex items-center gap-1.5 text-indigo-200">
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>AI Limiti holati</span>
                </span>
                <span className="text-white">
                  {currentPlanMeta?.maxAiCredits?.toLocaleString() || 100} ta limit
                </span>
              </div>
              <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full w-full" />
              </div>
              <p className="text-[11px] text-indigo-300">
                AI daftarlarni tekshirish, testlar yaratish va dars rejalari tuzish uchun to'liq limit mavjud.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cheksiz saqlash va to'liq hisobotlar kafolatlangan</span>
              </div>

              <Link
                href="/pricing"
                className="w-full sm:w-auto px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Barcha tariflar va AI Paketlar</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Key Activation Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Telegram Botdan kalit oldingizmi?
                </h4>
                <p className="text-xs text-slate-500">
                  Litsenziya kalitini Tariflar sahifasining eng yuqorisiga kiritib, 1 soniyada faollashtiring.
                </p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <span>Kalitni faollashtirish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      )}

      {/* TAB 3: Xavfsizlik & Parol */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Security Status Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500">Parol Shifri</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>PBKDF2 (100 000)</span>
              </div>
              <p className="text-[11px] text-slate-400">OWASP standarti bo'yicha kuchli xavfsizlik</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500">Brute-Force Himoya</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Anti-Brute Force</span>
              </div>
              <p className="text-[11px] text-slate-400">5 ta xato urinishdan so'ng avto-blok</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500">Sessiya Himoyasi</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>HMAC SHA-256</span>
              </div>
              <p className="text-[11px] text-slate-400">Soxtalashtirishdan himoyalangan token</p>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Parolni O'zgartirish
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Hisobingizni xavfsiz saqlash uchun parolingizni yangilang
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Hozirgi parol *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Eski parolingizni kiriting"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Yangi parol *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Yangi parolni tasdiqlash *
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Yangi parolni qayta kiriting"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-98"
                >
                  {isChangingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Yangilanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Parolni Yangilash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* TAB 4: Ko'rinish & Tizim */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-200">
          
          {/* Dark Mode */}
          <div className="p-6 sm:p-7 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-amber-400">
                {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6 text-amber-500" />}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Tungi rejim (Dark Mode)
                </h4>
                <p className="text-xs sm:text-sm text-slate-500">Ko'zni charchatmaydigan qorong'i interfeys</p>
              </div>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-14 h-7 rounded-full transition-colors relative p-0.5 ${
                theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform shadow-xs ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Font Size for Older Teachers */}
          <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Type className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Matn o'lchami (Typography)
                </h4>
                <p className="text-xs sm:text-sm text-slate-500">O'qish qulayligi uchun yozuvlarni moslashtirish</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(['sm', 'base', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    fontSize === size
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {size === 'sm' ? "Kichik" : size === 'base' ? "O'rtacha" : "Katta (Kattalar uchun)"}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 sm:p-7 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-blue-400">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Bildirishnomalar
                </h4>
                <p className="text-xs sm:text-sm text-slate-500">Darslar va tekshirish natijalari haqida eslatmalar</p>
              </div>
            </div>

            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-14 h-7 rounded-full transition-colors relative p-0.5 ${
                notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white transition-transform shadow-xs ${
                notificationsEnabled ? 'translate-x-7' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Telegram Support Bot */}
          <div className="p-6 sm:p-7 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Telegram Yordam Boti
                </h4>
                <p className="text-xs sm:text-sm text-slate-500">Savollar va litsenziya kalitlari uchun: @Novdaaibot</p>
              </div>
            </div>

            <a
              href="https://t.me/Novdaaibot"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span>@Novdaaibot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      )}

    </div>
  );
}
