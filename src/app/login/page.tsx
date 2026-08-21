"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { 
  Sparkles, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Loader2,
  KeyRound,
  UserPlus,
  LogIn
} from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userNotFoundMessage, setUserNotFoundMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Iltimos, username (foydalanuvchi nomi)ni kiriting");
      return;
    }
    if (!password) {
      toast.error("Iltimos, parolni kiriting");
      return;
    }

    setLoading(true);

    if (isRegisterMode) {
      // Registration mode
      if (!confirmPassword) {
        toast.error("Iltimos, parolni tasdiqlash uchun 2-marta kiriting");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Kiritilgan ikki xil parol mos kelmadi! Qaytadan tekshiring.");
        setLoading(false);
        return;
      }

      const success = await register({
        username: username.trim().toLowerCase(),
        password,
        confirmPassword,
        name: username.trim()
      });

      if (!success) {
        setLoading(false);
      }
    } else {
      // Login attempt
      const result = await login(username.trim(), password);

      if (result.notFound) {
        // User not found -> Auto-switch to Registration mode!
        setUserNotFoundMessage(true);
        setIsRegisterMode(true);
        toast.error("Bunday foydalanuvchi topilmadi! Yangi hisob ochish uchun parolni 2-marta kiriting.", { duration: 5000 });
      }

      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-1">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Maktab<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Faqat Username va Maxfiy Parol orqali himoyalangan kirish
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-7 rounded-3xl space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setUserNotFoundMessage(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                !isRegisterMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Kabinetga Kirish</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setUserNotFoundMessage(false);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                isRegisterMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Yangi hisob ochish</span>
            </button>
          </div>

          {/* User Not Found Notification */}
          {userNotFoundMessage && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-amber-800 dark:text-amber-300 text-xs space-y-1 animate-in fade-in duration-300">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bunday foydalanuvchi topilmadi</span>
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Ushbu username uchun yangi hisob ochish maqsadida parolingizni 2-marta kiriting va tugmani bosing.
              </p>
            </div>
          )}

          {/* Single Simple Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Foydalanuvchi nomi (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setUserNotFoundMessage(false);
                  }}
                  placeholder="Masalan: shirin_ustoz yoki ustoz_12"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isRegisterMode ? "Yangi parol yarating" : "Maxfiy Parol"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Confirm Password - only in Register Mode */}
            {isRegisterMode && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Parolni tasdiqlash (2-marta kiritish)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Parolni qaytadan kiriting"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border rounded-xl text-sm focus:ring-2 outline-none text-slate-900 dark:text-slate-100 ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-400 focus:ring-red-500' 
                        : confirmPassword && password === confirmPassword 
                        ? 'border-emerald-500 focus:ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">Parollar bir xil emas!</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Parollar mos keldi ✓</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-11 text-white font-bold text-sm shadow-md mt-2 ${
                isRegisterMode 
                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              leftIcon={
                loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRegisterMode ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )
              }
            >
              {loading 
                ? "Tekshirilmoqda..." 
                : isRegisterMode 
                ? "Ro'yxatdan o'tish va Kirish" 
                : "Kabinetga Kirish"}
            </Button>
          </form>

        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Xavfsiz va shaxsiy avtorizatsiya (Har bir ustoz faqat o&apos;z ma&apos;lumotlarini ko&apos;radi)</span>
        </div>

      </div>
    </div>
  );
}
