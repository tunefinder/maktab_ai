"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileSignature, 
  CheckSquare, 
  FileBarChart, 
  Settings, 
  Sparkles, 
  Users,
  User,
  LogIn,
  Crown
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { name: "Asosiy", href: "/", icon: LayoutDashboard },
  { name: "Sinflar", href: "/classes", icon: Users },
  { name: "Dars Rejasi", href: "/lesson-planner", icon: BookOpen },
  { name: "Testlar", href: "/tests", icon: FileSignature },
  { name: "Tekshirish", href: "/grader", icon: CheckSquare },
  { name: "Hisobot", href: "/report", icon: FileBarChart },
  { name: "Tariflar", href: "/pricing", icon: Crown },
  { name: "Sozlamalar", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profileName, t } = useSettings();
  const { user } = useAuth();

  if (pathname === '/login') return null;

  const displayName = user?.name || profileName || "O'qituvchi";
  const displaySubject = user?.subject || "Pedagog";
  const userPlan = user?.plan || "FREE";

  return (
    <>
      {/* Mobile Top Minimal Header */}
      <div className="md:hidden flex items-center justify-between p-3.5 px-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 z-30 relative">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">MaktabAI</span>
            <span className="text-sm font-bold text-primary truncate max-w-[150px]">
              {displayName} 👋
            </span>
          </div>
        </Link>
        
        {user ? (
          <Link 
            href="/settings" 
            className="w-8 h-8 rounded-xl overflow-hidden bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary border border-primary/20 transition-colors shrink-0"
            title="Profil"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </Link>
        ) : (
          <Link 
            href="/login" 
            className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Kirish</span>
          </Link>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] glass-panel h-full flex-col shadow-2xl border md:rounded-3xl border-white/60 dark:border-slate-700/60 overflow-hidden shrink-0">
        {/* Header inside sidebar */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/40 dark:border-slate-700/40">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg transition-all duration-300 transform group-hover:rotate-6 shrink-0">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Xush kelibsiz</span>
              <span className="text-base font-bold text-primary truncate max-w-[150px]">
                {displayName} 👋
              </span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? "text-primary font-bold bg-white/70 dark:bg-slate-800/70 shadow-xs border border-white/80 dark:border-slate-700/80" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-1"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-md scale-105' 
                    : 'bg-white text-slate-600 shadow-xs border border-slate-100 group-hover:text-primary group-hover:shadow-sm dark:bg-slate-800 dark:border-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{t(item.name)}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md">
          {user ? (
            <Link href="/settings" className="flex items-center justify-between p-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700/60 shadow-xs hover:shadow-sm transition-all group">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate">{displaySubject}</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full shrink-0 ${
                userPlan === 'VIP' 
                  ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-300'
                  : userPlan === 'PRO'
                  ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {userPlan === 'VIP' ? 'VIP' : userPlan === 'PRO' ? 'PRO' : 'Start'}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors">
              <LogIn className="w-4 h-4" />
              <span>Tizimga Kirish / Ro&apos;yxat</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
