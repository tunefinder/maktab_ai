"use client";

import { useState, useEffect } from "react";
import { Settings, Moon, Sun, Globe, User, Save, Type, Monitor, ChevronRight, ChevronLeft, Check, Bell, Palette, Zap, Star, LogOut, LogIn, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { useSettings, DesignTheme } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { mockTests } from "@/data/mockTests";
import Link from "next/link";
import { Language } from "@/utils/translations";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type FontSize = 'sm' | 'base' | 'lg';
type FontFamily = 'inter' | 'roboto' | 'nunito';

type ViewState = 'main' | 'system' | 'language' | 'profile' | 'notifications' | 'design' | 'saved';

export default function SettingsPage() {
  const { 
    theme, language, fontSize, fontFamily, profileName, notificationsEnabled, notificationsMuted,
    neonMode, designTheme, primaryColor, neonGlowColor, iconColor, appBgColor, appBgColorDark,
    savedTestIds = [], toggleSaveTest,
    setTheme, setLanguage, setFontSize, setFontFamily, setProfileName, setNotificationsEnabled, setNotificationsMuted,
    setNeonMode, setDesignTheme, setPrimaryColor, setNeonGlowColor, setIconColor, setAppBgColor, setAppBgColorDark, t 
  } = useSettings();

  const { user, logout, updateProfile } = useAuth();
  
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [tempName, setTempName] = useState(user?.name || profileName);
  const [tempSubject, setTempSubject] = useState(user?.subject || "Biologiya");
  const [tempSchool, setTempSchool] = useState(user?.school || "");
  const [tempPhone, setTempPhone] = useState(user?.phone || "");
  const [hueValue, setHueValue] = useState(250);

  useEffect(() => {
    if (user) {
      setTempName(user.name);
      if (user.subject) setTempSubject(user.subject);
      if (user.school) setTempSchool(user.school);
      if (user.phone) setTempPhone(user.phone);
    }
  }, [user]);

  const savedTests = mockTests.filter(test => savedTestIds?.includes(test.id));

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const handleHueChange = (val: string) => {
    const h = parseInt(val);
    setHueValue(h);
    const hex = hslToHex(h, 80, 55);
    setPrimaryColor(hex);
    setNeonGlowColor(hex);
    setIconColor(hex);
    setDesignTheme('custom');
  };
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'panel' | 'mute' | 'logout' | null;
  }>({ isOpen: false, type: null });

  const handleSaveProfile = async () => {
    if (tempName.trim().length === 0) {
      toast.error("Ism bo'sh bo'lishi mumkin emas");
      return;
    }
    setProfileName(tempName);
    if (user) {
      await updateProfile({
        name: tempName,
        subject: tempSubject,
        school: tempSchool,
        phone: tempPhone
      });
    } else {
      toast.success(t("saved_msg"));
    }
    setCurrentView('main');
  };

  const renderMainView = () => (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      {/* Account / Profile Card */}
      {user ? (
        <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700">
          <button 
            onClick={() => setCurrentView('profile')}
            className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{user.name}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{user.subject || "Pedagog"} • {user.school || "Maktab"}</p>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold group-hover:text-indigo-500">
              <span>Tahrirlash</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </Card>
      ) : (
        <Card className="p-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Shaxsiy kabinetga kiring</h3>
            <p className="text-xs text-slate-500">Barcha sinflar va testlaringiz saqlanib qoladi</p>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Kirish / Ro&apos;yxat</span>
          </Link>
        </Card>
      )}

      {/* Settings list */}
      <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700">
        
        {/* Pricing / Subscription Item */}
        <Link 
          href="/pricing"
          className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
        >
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tariflar va Obuna</h3>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold rounded-full">
                {user?.plan === 'VIP' ? 'Maktab VIP' : user?.plan === 'PRO' ? 'Ustoz PRO' : 'Bepul'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Telegram bot kalitini kiritish va limitlarni ko&apos;rish</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
        </Link>

        {/* Saved Items List Item */}
        <button 
          onClick={() => setCurrentView('saved')}
          className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
        >
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Star className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Saqlangan testlar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Belgilab qo&apos;yilgan testlar to&apos;plami</p>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              {savedTestIds?.length || 0}
            </span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        {/* System Settings List Item */}
        <button 
          onClick={() => setCurrentView('system')}
          className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("system_settings")}</h3>
            <p className="text-xs text-slate-500">Mavzu va shrift o&apos;lchami</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </button>

        {/* Design Settings List Item */}
        <button 
          onClick={() => setCurrentView('design')}
          className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
        >
          <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Dizayn sozlanmalari</h3>
            <p className="text-xs text-slate-500">Ranglar va neon rejimi</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-fuchsia-500 transition-colors" />
        </button>

        {/* Language List Item */}
        <button 
          onClick={() => setCurrentView('language')}
          className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Globe className="w-5 h-5" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("lang_title")}</h3>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            <span className="text-xs font-semibold">
              {language === 'uz' ? "O'zbekcha" : language === 'ru' ? "Русский" : "English"}
            </span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        {/* Notifications List Item */}
        <button 
          onClick={() => setCurrentView('notifications')}
          className="w-full flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group text-left"
        >
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <Bell className="w-5 h-5" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("notifications_title")}</h3>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            <span className="text-xs font-semibold">
              {notificationsEnabled ? "Yoqilgan" : "O'chirilgan"}
            </span>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

      </Card>

      {/* Logout Button */}
      {user && (
        <button
          onClick={() => setConfirmModal({ isOpen: true, type: 'logout' })}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-sm rounded-2xl border border-red-200/60 dark:border-red-900/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan chiqish</span>
        </button>
      )}
    </div>
  );

  const renderSystemView = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setCurrentView('main')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("system_settings")}</h2>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] dark:shadow-[0_0_15px_rgba(99,102,241,0.2)] shrink-0">
              {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("theme_title")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("theme_desc")}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                    theme === 'light' 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-500/50 dark:text-indigo-300' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  <Sun className="w-4 h-4" /> {t("theme_light")}
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                    theme === 'dark' 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-500/50 dark:text-indigo-300' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  <Moon className="w-4 h-4" /> {t("theme_dark")}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Font Size Settings */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] dark:shadow-[0_0_15px_rgba(59,130,246,0.2)] shrink-0">
              <Type className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("font_size_title")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("font_size_desc")}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFontSize('sm')}
                  className={`flex-1 py-2 px-2 text-sm rounded-xl border flex items-center justify-center font-medium transition-all ${
                    fontSize === 'sm' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-500/50 dark:text-blue-300' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {t("size_sm")}
                </button>
                <button
                  onClick={() => setFontSize('base')}
                  className={`flex-1 py-2 px-2 text-base rounded-xl border flex items-center justify-center font-medium transition-all ${
                    fontSize === 'base' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-500/50 dark:text-blue-300' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {t("size_base")}
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  className={`flex-1 py-2 px-2 text-lg rounded-xl border flex items-center justify-center font-medium transition-all ${
                    fontSize === 'lg' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-500/50 dark:text-blue-300' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                  }`}
                >
                  {t("size_lg")}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Font Family Settings */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.4)] dark:shadow-[0_0_15px_rgba(139,92,246,0.2)] shrink-0">
              <Type className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("font_family_title")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("font_family_desc")}</p>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'inter', name: 'Inter (Zamonaviy)', class: 'font-inter' },
                  { id: 'roboto', name: 'Roboto (Klassik)', class: 'font-roboto' },
                  { id: 'nunito', name: 'Nunito (Yumshoq)', class: 'font-nunito' },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setFontFamily(font.id as FontFamily)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${font.class} ${
                      fontFamily === font.id
                        ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/50 dark:border-violet-500/50 dark:text-violet-300'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-medium text-lg">{font.name}</span>
                    {fontFamily === font.id && <Check className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderLanguageView = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setCurrentView('main')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("lang_title")}</h2>
      </div>

      <Card className="p-0 overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700">
        {[
          { code: 'uz', name: "O'zbekcha" },
          { code: 'ru', name: "Русский" },
          { code: 'en', name: "English" },
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code as Language);
              setCurrentView('main'); // Go back after selecting
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <span className={`text-base ${language === lang.code ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
              {lang.name}
            </span>
            {language === lang.code && <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          </button>
        ))}
      </Card>
    </div>
  );

  const renderProfileView = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setCurrentView('main')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("profile_title")}</h2>
      </div>

      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60 p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-xs shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">O&apos;qituvchi Ma&apos;lumotlari</h3>
            <p className="text-xs text-slate-500">Platformadagi ismingiz, faningiz va maktabingiz</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ism va familiya
            </label>
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Masalan: Nilufar Karimova"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Asosiy fan
              </label>
              <select
                value={tempSubject}
                onChange={(e) => setTempSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Biologiya">Biologiya</option>
                <option value="Matematika">Matematika</option>
                <option value="Ona tili va adabiyot">Ona tili</option>
                <option value="Fizika">Fizika</option>
                <option value="Kimyo">Kimyo</option>
                <option value="Tarix">Tarix</option>
                <option value="Ingliz tili">Ingliz tili</option>
                <option value="Informatika">Informatika</option>
                <option value="Boshqa">Boshqa fan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Maktab / Muassasa
              </label>
              <input 
                type="text" 
                value={tempSchool}
                onChange={(e) => setTempSchool(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="45-maktab"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Telefon raqam
            </label>
            <input 
              type="text" 
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="+998 90 123 45 67"
            />
          </div>

          <Button 
            onClick={handleSaveProfile}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md mt-3"
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t("save_btn")}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderNotificationsView = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setCurrentView('main')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("notifications_title")}</h2>
      </div>

      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shadow-[0_0_15px_rgba(243,24,125,0.4)] dark:shadow-[0_0_15px_rgba(243,24,125,0.2)] shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("notifications_desc")}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{t("notifications_enable")}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("notifications_enable_desc")}</p>
              </div>
              
              <button 
                onClick={() => {
                  if (notificationsEnabled) {
                    setConfirmModal({ isOpen: true, type: 'panel' });
                  } else {
                    setNotificationsEnabled(true);
                    toast.success(t("saved_msg"));
                  }
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${!notificationsEnabled ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${!notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Ovozsizlantirish (Mute)</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Bildirishnomalar kelganda ovoz chiqarmaslik</p>
              </div>
              
              <button 
                onClick={() => {
                  if (!notificationsMuted) {
                    setConfirmModal({ isOpen: true, type: 'mute' });
                  } else {
                    setNotificationsMuted(false);
                    toast.success(t("saved_msg"));
                  }
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${notificationsMuted ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${notificationsMuted ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderDesignView = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setCurrentView('main')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dizayn sozlanmalari</h2>
      </div>

      {/* Neon Mode Toggle */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.4)] dark:shadow-[0_0_15px_rgba(217,70,239,0.2)] shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">Neon Rejim</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Yoritgichli neon effektlarini yoqish</p>
              </div>
              <button 
                onClick={() => setNeonMode(!neonMode)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${neonMode ? 'bg-fuchsia-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${neonMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Theme Presets */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Tayyor ta&apos;lim temalari</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { id: 'default', name: 'Klassik', hex: '#6366f1', bg: '#f8fafc', bgDark: '#0f172a' },
            { id: 'ocean', name: 'Bilim dengizi', hex: '#0ea5e9', bg: '#f0f9ff', bgDark: '#082f49' },
            { id: 'emerald', name: 'Zamonaviy maktab', hex: '#10b981', bg: '#f0fdf4', bgDark: '#022c22' },
            { id: 'cyberpunk', name: 'Innovatsiya', hex: '#8b5cf6', bg: '#f5f3ff', bgDark: '#2e1065' },
            { id: 'sunset', name: 'Energiya', hex: '#f97316', bg: '#fff7ed', bgDark: '#431407' },
            { id: 'ruby', name: "Faol ta'lim", hex: '#e11d48', bg: '#fff1f2', bgDark: '#4c0519' },
          ].map(tPreset => (
            <button
              key={tPreset.id}
              onClick={() => {
                setDesignTheme(tPreset.id as DesignTheme);
                setPrimaryColor(tPreset.hex);
                setNeonGlowColor(tPreset.hex);
                setIconColor(tPreset.hex);
                setAppBgColor(tPreset.bg);
                setAppBgColorDark(tPreset.bgDark);
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${designTheme === tPreset.id ? 'border-2 border-slate-900 dark:border-white shadow-md' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <div className="w-8 h-8 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: tPreset.hex }}></div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{tPreset.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Custom Colors */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Maxsus ranglar</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Asosiy tugmalar rangi</p>
              <p className="text-xs text-slate-500">Platformadagi muhim tugmalar</p>
            </div>
            <input 
              type="color" 
              value={primaryColor} 
              onChange={(e) => {
                setPrimaryColor(e.target.value);
                if (designTheme !== 'custom') setDesignTheme('custom');
              }}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Neon yoritgich rangi</p>
              <p className="text-xs text-slate-500">Soya va porlash effektlari</p>
            </div>
            <input 
              type="color" 
              value={neonGlowColor} 
              onChange={(e) => {
                setNeonGlowColor(e.target.value);
                if (designTheme !== 'custom') setDesignTheme('custom');
              }}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Sahifa ikonkalari rangi</p>
              <p className="text-xs text-slate-500">Menyu va sarlavhalardagi belgilar</p>
            </div>
            <input 
              type="color" 
              value={iconColor} 
              onChange={(e) => {
                setIconColor(e.target.value);
                if (designTheme !== 'custom') setDesignTheme('custom');
              }}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Ranglar palitrasi (Tezkor tanlash)</p>
          <div className="relative flex items-center h-14 rounded-[2rem] p-1 bg-slate-100 dark:bg-slate-800 shadow-inner">
            <input 
              type="range" 
              min="0" max="360" 
              value={hueValue}
              onChange={(e) => handleHueChange(e.target.value)}
              className="w-full h-12 rounded-[2rem] appearance-none cursor-pointer outline-none 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:h-10 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.3)]
                         [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-90"
              style={{
                background: `linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`,
              }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">Yorug&apos;lik tugmasini siljitish orqali barcha qismlar uchun o&apos;zingizga yoqqan yorqin rangni tanlang.</p>
        </div>
      </Card>
    </div>
  );

  const renderSavedView = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setCurrentView('main')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Saqlangan testlar
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full">
              {savedTests.length}
            </span>
          </h2>
        </div>
      </div>

      {savedTests.length > 0 ? (
        <div className="space-y-3">
          {savedTests.map((test) => (
            <div 
              key={`saved-${test.id}`} 
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{test.subject} - {test.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{test.grade} sinf • {test.questions?.length || 0} ta savol</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link 
                  href={`/saved-tests/${test.id}`}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg transition-colors"
                >
                  Ko&apos;rish
                </Link>
                <button
                  onClick={() => toggleSaveTest?.(test.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="O'chirish"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/60 dark:border-slate-700/60">
          <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">Hozircha saqlangan testlar yo&apos;q</h3>
          <p className="text-xs text-slate-500 mt-1">Testlar sahifasidagi yulduzcha orqali testlarni saqlab qo&apos;yishingiz mumkin</p>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Header, only show if in main view to save space */}
      {currentView === 'main' && (
        <div className="flex items-center gap-3 mb-8 animate-in fade-in duration-300">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("settings_title")}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t("settings_desc")}</p>
          </div>
        </div>
      )}

      {currentView === 'main' && renderMainView()}
      {currentView === 'system' && renderSystemView()}
      {currentView === 'language' && renderLanguageView()}
      {currentView === 'profile' && renderProfileView()}
      {currentView === 'notifications' && renderNotificationsView()}
      {currentView === 'design' && renderDesignView()}
      {currentView === 'saved' && renderSavedView()}

      {/* Global Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                Diqqat
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
                {confirmModal.type === 'panel' 
                  ? "Haqiqatan ham panelni o'chirasizmi?" 
                  : confirmModal.type === 'logout'
                  ? "Haqiqatan ham hisobingizdan chiqmoqchimisiz?"
                  : "Sizga yangi habarlar va ilova haqidagi yangiliklar kelishini o'tkazib yuborishingiz mumkin. Haqiqatan ham ovozsizlantirasizmi?"}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal({ isOpen: false, type: null })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={async () => {
                    if (confirmModal.type === 'panel') {
                      setNotificationsEnabled(false);
                      toast.success(t("saved_msg"));
                    } else if (confirmModal.type === 'mute') {
                      setNotificationsMuted(true);
                      toast.success(t("saved_msg"));
                    } else if (confirmModal.type === 'logout') {
                      await logout();
                    }
                    setConfirmModal({ isOpen: false, type: null });
                  }}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold text-xs sm:text-sm transition-colors ${confirmModal.type === 'panel' || confirmModal.type === 'logout' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                  {confirmModal.type === 'logout' ? 'Chiqish' : 'Ha, o\'chirish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
