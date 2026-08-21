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
  ShieldCheck,
  Smartphone,
  School,
  ArrowRight,
  KeyRound,
  Lock,
  X,
  Mail,
  Phone
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
  
  // Profile Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(user?.name || profileName || "O'qituvchi");
  const [tempSubject, setTempSubject] = useState(user?.subject || "Biologiya");
  const [tempSchool, setTempSchool] = useState(user?.school || "");
  const [tempPhone, setTempPhone] = useState(user?.phone || "");
  const [tempEmail, setTempEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  // Password Change Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setTempName(user.name);
      if (user.subject) setTempSubject(user.subject);
      if (user.school) setTempSchool(user.school);
      if (user.phone) setTempPhone(user.phone);
      if (user.email) setTempEmail(user.email);
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
          phone: tempPhone,
          email: tempEmail
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
      setIsChangePasswordOpen(false);
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
  const userPlan = user?.plan || "FREE";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-28 animate-in fade-in duration-300">
      
      {/* Header */}
      <SectionHeader
        title="Sozlamalar va Xavfsizlik"
        subtitle="Shaxsiy ma'lumotlar, parol xavfsizligi, tarif obunasi va platforma ko'rinishini boshqaring."
      />

      {/* 1. Profile Overview & Security Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{displayName}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase">
                {userPlan}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Username: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">@{user?.username || 'ustoz'}</span> • Fan: <b>{user?.subject || tempSubject}</b> {user?.school ? `• ${user.school}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setIsEditingProfile(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Profilni tahrirlash
          </button>
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Parol</span>
          </button>
        </div>
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

      {/* 3. Security & Privacy Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Akkaunt Xavfsizligi
            </h3>
            <p className="text-xs text-slate-500">Hisobingiz zamonaviy xavfsizlik protokollari bilan himoyalangan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <div className="text-[11px] text-slate-500">Parol shifrlanishi</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>PBKDF2 (100k)</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <div className="text-[11px] text-slate-500">Bot va Brute-Force himoya</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Faol (Anti-Brute)</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
            <div className="text-[11px] text-slate-500">Sessiya xavfsizligi</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>HMAC SHA-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. System & UI Settings Grid */}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Profil ma'lumotlarini tahrirlash
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Maktab raqami yoki nomi</label>
              <input
                type="text"
                placeholder="Masalan: 45-maktab"
                value={tempSchool}
                onChange={(e) => setTempSchool(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Telefon raqam</label>
              <input
                type="tel"
                placeholder="+998 90 123 45 67"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50"
              >
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleChangePassword} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Parolni o'zgartirish
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Hisobingiz xavfsizligini ta'minlash uchun kuchli paroldan foydalaning (kamida 6 ta belgi).
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Hozirgi parol *
              </label>
              <input
                type="password"
                placeholder="Eski parolingizni kiriting"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Yangi parol *
              </label>
              <input
                type="password"
                placeholder="Kamida 6 ta belgi"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Yangi parolni tasdiqlash *
              </label>
              <input
                type="password"
                placeholder="Yangi parolni qayta kiriting"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
                minLength={6}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? "Yangilanmoqda..." : "Parolni Yangilash"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
