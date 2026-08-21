"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users,
  BookOpen, 
  FileSignature, 
  CheckSquare 
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useSettings();

  if (pathname === '/login') return null;

  const navButtons = [
    {
      id: "home",
      name: "Asosiy",
      href: "/",
      icon: Home,
      exact: true
    },
    {
      id: "classes",
      name: "Sinflar",
      href: "/classes",
      icon: Users
    },
    {
      id: "lesson-planner",
      name: "Dars rejasi",
      href: "/lesson-planner",
      icon: BookOpen
    },
    {
      id: "tests",
      name: "Testlar",
      href: "/tests",
      icon: FileSignature,
      aliases: ["/test-generator"]
    },
    {
      id: "grader",
      name: "Tekshirish",
      href: "/grader",
      icon: CheckSquare
    }
  ];

  return (
    <nav 
      aria-label="Mobil navigatsiya"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] transition-all duration-300"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = btn.exact 
            ? pathname === btn.href 
            : pathname.startsWith(btn.href) || (btn.aliases && btn.aliases.some(a => pathname.startsWith(a)));

          return (
            <Link
              key={btn.id}
              href={btn.href}
              prefetch={true}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <div 
                className={`p-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-950/60 shadow-xs scale-105" 
                    : "bg-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              </div>
              <span 
                className={`text-[11px] tracking-tight text-center leading-none mt-1 transition-all ${
                  isActive ? "font-black text-indigo-600 dark:text-indigo-400" : "font-semibold text-slate-500 dark:text-slate-400"
                }`}
              >
                {t(btn.name)}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-1" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
