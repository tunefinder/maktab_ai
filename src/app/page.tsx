"use client";

import Link from "next/link";
import { Users, FileBarChart, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { fastFetch } from "@/utils/fastFetch";

interface StatsData {
  studentCount?: number;
  testCount?: number;
  attemptCount?: number;
  avgPercentage?: number;
}

export default function Home() {
  const { profileName } = useSettings();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fastFetch<StatsData>("/api/stats")
      .then(data => {
        setStats(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Ustoz nomidan salomlashuv */}
      <div className="text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Xush kelibsiz, {profileName || "O'qituvchi"} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">
          Bugun qaysi bo&apos;limdan boshlaymiz?
        </p>
      </div>

      {/* Ustoz nomidan pastda BIR QATORDA: SINFLAR va HISOBOT */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* 1. SINFLAR */}
        <Link href="/classes" prefetch={true} className="group block">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-lg transition-transform duration-150 relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[190px] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-white">
                O&apos;tish <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg sm:text-2xl font-black tracking-tight">Sinflar</h3>
              <p className="text-indigo-100 text-xs sm:text-sm font-medium mt-1 opacity-90 truncate">
                {stats?.studentCount !== undefined ? `${stats.studentCount} nafar o'quvchi` : "Boshqarish"}
              </p>
            </div>
          </div>
        </Link>

        {/* 2. HISOBOT */}
        <Link href="/report" prefetch={true} className="group block">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-5 sm:p-7 rounded-3xl shadow-sm hover:shadow-lg transition-transform duration-150 relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[190px] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                <FileBarChart className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-white">
                O&apos;tish <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-lg sm:text-2xl font-black tracking-tight">Hisobot</h3>
              <p className="text-cyan-100 text-xs sm:text-sm font-medium mt-1 opacity-90 truncate">
                {stats?.avgPercentage !== undefined ? `${stats.avgPercentage}% o'rtacha tahlil` : "Tahlillar"}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
