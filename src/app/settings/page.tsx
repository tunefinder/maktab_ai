"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  User, 
  Save, 
  Type, 
  Monitor, 
  ChevronRight, 
  Check, 
  Bell, 
  Palette, 
  Zap, 
  Star, 
  LogOut, 
  LogIn, 
  Crown,
  HelpCircle,
  ExternalLink,
  Shield,
  Smartphone,
  School,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Link from "next/link";

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
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(user?.name || profileName || "O'qituvchi");
  const [tempSubject, setTempSubject] = useState(user?.subject || "Biologiya");
  const [tempSchool, setTempSchool] = useState(user?.school || "");
  const [tempPhone, setTempPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setTempName(user.name);
      if (user.subject) setTempSubject(user.subject);
      if (user.school) setTempSchool(user.school);
      if (user.phone) setTempPhone(user.phone);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) {
      toast.error("Ism bo'sh bo'lishi mumkin emas");
      return;
    }

    setIsSaving(true);
    try {
      setProfileName(tempName);
      if (user) {
        await updateProfile({
          name: tempName,
          subject: tempSubject,
          school: tempSchool,
          phone: tempPhone
        });
      }
      toast.success("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
      setIsEditingProfile(false);
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = user?.name || profileName || "Ustoz";
  const userPlan = user?.plan || "FREE";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">
      
      {/* Header */}
      <SectionHeader
        title="Sozlamalar va Profil"
        subtitle="Shaxsiy ma'lumotlar, tarif obunasi va platforma ko'rinishini boshqaring."
      />

      {/* 1. Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{displayName}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase">
                {userPlan}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Fan: <b>{user?.subject || tempSubject}</b> {user?.school ? `• Maktab: ${user.school}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditingProfile(true)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs"
        >
          Profilni tahrirlash
        </button>
      </div>

      {/* 2. Prominent Subscription & Plan Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/30">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Joriy Obuna: {userPlan}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Cheklovlarsiz ishlash uchun tarifni yangilang
          </h3>
          <p className="text-xs text-slate-300 max-w-md">
            AI tekshirishlar, darslar va sinflar sonini oshirish yoki qo'shimcha AI paketlar xarid qilish.
          </p>
        </div>

        <Link
          href="/pricing"
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          <span>Tariflarni ko'rish / Kalit kiritish</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 3. System & UI Settings Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
        
        {/* Dark Mode */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tungi rejim (Dark Mode)
              </h4>
              <p className="text-xs text-slate-500">Ko'zni charchatmaydigan qorong'i interfeys</p>
            </div>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Font Size for Older Teachers */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Type className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Matn o'lchami (Typography)
              </h4>
              <p className="text-xs text-slate-500">O'qish qulayligi uchun yozuvlarni kattalashtirish</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['sm', 'base', 'lg'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  fontSize === size
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {size === 'sm' ? "Kichik" : size === 'base' ? "O'rtacha" : "Katta (Kattalar uchun)"}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Bildirishnomalar
              </h4>
              <p className="text-xs text-slate-500">Darslar va tekshirish natijalari haqida xabarlar</p>
            </div>
          </div>

          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Telegram Bot & Support */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <HelpCircle className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Telegram Bot va Yordam
              </h4>
              <p className="text-xs text-slate-500">To'lovlar, yangiliklar va texnik yordam boti</p>
            </div>
          </div>

          <a
            href="https://t.me/Novdaaibot"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <span>@Novdaaibot</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Logout */}
        {user && (
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-600">
                  Tizimdan chiqish
                </h4>
                <p className="text-xs text-slate-500">Hisobingizdan xavfsiz chiqish</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm("Haqiqatan ham hisobingizdan chiqmoqchimisiz?")) {
                  logout();
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all"
            >
              Chiqish
            </button>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Profil ma'lumotlarini tahrirlash
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ism va Familiya *</label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Dars beradigan fani</label>
              <input
                type="text"
                value={tempSubject}
                onChange={(e) => setTempSubject(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Maktab raqami yoki nomi</label>
              <input
                type="text"
                placeholder="Masalan: 45-maktab"
                value={tempSchool}
                onChange={(e) => setTempSchool(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
