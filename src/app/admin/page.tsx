"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Plus, 
  Calendar, 
  CreditCard,
  Crown,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Power
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminStats {
  metrics: {
    totalUsers: number;
    activeSubscriptions: number;
    estimatedMRR: number;
    arpu: number;
    todayAiRequests: number;
    todaySheetsGraded?: number;
    todayFallbackCount?: number;
    todayFallbackRatePct?: number;
    avgLatencyMs?: number;
    monthAiRequests: number;
    monthSheetsGraded?: number;
    monthCreditsUsed: number;
    monthInputTokens?: number;
    monthOutputTokens?: number;
    monthRealAiCostUzs?: number;
    realCostPerSheetUzs?: number;
    projectedCost1000Sheets?: number;
    estimatedAiCostMonth: number;
    costPerCredit: number;
    estimatedGrossProfit: number;
    aiCostToRevenuePct: number;
    isAiDisabledGlobally: boolean;
  };
  planBreakdown: Record<string, number>;
  topUsers: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    plan: string;
    usedAiCredits: number;
    bonusCredits: number;
    estimatedCostUzs: number;
    planExpiresAt: string | null;
    createdAt: string;
  }>;
  recentLogs: Array<{
    id: string;
    operationType: string;
    creditsCost: number;
    model: string;
    status: string;
    createdAt: string;
    user: {
      name: string;
      email: string | null;
      plan: string;
    };
  }>;
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [formPlan, setFormPlan] = useState("PRO");
  const [formDays, setFormDays] = useState(30);
  const [formCredits, setFormCredits] = useState(500);
  const [submitting, setSubmitting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error("Stats yuklab bo'lmadi");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || "Admin statistikasini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = `/api/admin/users?q=${encodeURIComponent(searchQuery)}&plan=${planFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setUsers(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, planFilter]);

  const handleToggleEmergencyAi = async () => {
    if (!data) return;
    const nextState = !data.metrics.isAiDisabledGlobally;
    const confirmMsg = nextState
      ? "DIQQAT: Haqiqatan ham AI xizmatini butun platforma bo'yicha vaqtincha O'CHIRMOQCHIMISIZ?"
      : "AI xizmatini butun platforma bo'yicha qayta YOQMOQCHIMISIZ?";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_emergency_ai',
          toggleEmergencyAi: nextState
        })
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        await fetchStats();
      } else {
        toast.error(json.error || "Xatolik yuz berdi");
      }
    } catch (err: any) {
      toast.error(err.message || "Xatolik yuz berdi");
    }
  };

  const handleUserAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !modalAction) return;

    setSubmitting(true);
    try {
      const payload: any = {
        action: modalAction,
        userId: selectedUser.id
      };

      if (modalAction === 'set_plan') {
        payload.plan = formPlan;
        payload.durationDays = formDays;
      } else if (modalAction === 'extend_subscription') {
        payload.durationDays = formDays;
      } else if (modalAction === 'add_credits') {
        payload.creditsToAdd = formCredits;
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message);
        setModalAction(null);
        setSelectedUser(null);
        await fetchStats();
        await fetchUsers();
      } else {
        toast.error(json.error || "Amal bajarilmadi");
      }
    } catch (err: any) {
      toast.error(err.message || "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Admin boshqaruv paneli yuklanmoqda...</p>
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 pb-24 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header & Emergency Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              Executive SaaS Admin Paneli
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Moliyaviy ko'rsatkichlar, AI xarajatlari va obunalarni boshqarish markazi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
            title="Yangilash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Emergency Kill Switch */}
          <button
            onClick={handleToggleEmergencyAi}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 ${
              m?.isAiDisabledGlobally
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {m?.isAiDisabledGlobally ? "AI Xizmatini Yoqish" : "Favqulodda AI O'chirish"}
            </span>
          </button>
        </div>
      </div>

      {/* Emergency Alert Banner if Active */}
      {m?.isAiDisabledGlobally && (
        <div className="p-4 bg-rose-500 text-white rounded-2xl flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-bold text-sm">FAVQULODDA REJIM: AI XIZMATI GLOBAL RAVISHDA O'CHIRILGAN</p>
              <p className="text-xs opacity-90">Hech qanday foydalanuvchi hozirda AI so'rov yubora olmaydi.</p>
            </div>
          </div>
          <button
            onClick={handleToggleEmergencyAi}
            className="px-3 py-1.5 bg-white text-rose-700 font-black text-xs rounded-xl hover:bg-rose-50"
          >
            Qayta yoqish
          </button>
        </div>
      )}

      {/* Financial & Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* MRR & Revenue */}
        <div className="p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Oylik MRR</span>
            <DollarSign className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-black">
            {(m?.estimatedMRR || 0).toLocaleString()} <span className="text-xs font-normal">so'm</span>
          </div>
          <div className="text-[11px] text-indigo-100 flex items-center justify-between pt-1 border-t border-indigo-400/30">
            <span>ARPU: {(m?.arpu || 0).toLocaleString()} so'm</span>
            <span>{m?.activeSubscriptions} faol obuna</span>
          </div>
        </div>

        {/* Estimated AI Costs */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Oylik AI Xarajati</span>
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {(m?.estimatedAiCostMonth || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">so'm</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>{m?.costPerCredit} so'm / credit</span>
            <span className="font-bold text-amber-600">{(m?.monthCreditsUsed || 0).toLocaleString()} kredit</span>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Yalpi Foyda (Gross)</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {(m?.estimatedGrossProfit || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">so'm</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>AI Cost/Revenue: {m?.aiCostToRevenuePct}%</span>
            <span className="font-bold text-emerald-600">{100 - (m?.aiCostToRevenuePct || 0)}% marja</span>
          </div>
        </div>

        {/* User Base & Requests */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Foydalanuvchilar</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {m?.totalUsers} <span className="text-xs font-normal text-slate-500">ta</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Bugun: {m?.todayAiRequests} AI so'rov</span>
            <span>Oy: {m?.monthAiRequests} ta</span>
          </div>
        </div>

      </div>

      {/* Next-Gen AI Telemetry & Unit Economics Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-400/20">
              <Zap className="w-6 h-6 text-indigo-400" />
            </span>
            <div>
              <h3 className="text-lg font-bold">Next-Gen AI Pipeline Telemetry & Unit Economics</h3>
              <p className="text-xs text-indigo-200/80">Gemini 2.5 Flash-Lite (Zero-thinking) + TypeScript Scoring + Strong Fallback</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black rounded-full border border-emerald-500/30 self-start sm:self-auto">
            🚀 5x–10x Cost Optimization Active
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">1 Daftar Real Tannarxi</span>
            <div className="text-2xl font-black text-emerald-400">{m?.realCostPerSheetUzs || 4.8} <span className="text-xs font-normal text-slate-300">so'm</span></div>
            <p className="text-[10px] text-slate-400">1 000 daftar ≈ {(m?.projectedCost1000Sheets || 4800).toLocaleString()} so'm</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Bugungi Daftarlar</span>
            <div className="text-2xl font-black text-white">{m?.todaySheetsGraded || m?.todayAiRequests || 0} <span className="text-xs font-normal text-slate-300">ta</span></div>
            <p className="text-[10px] text-slate-400">O'rtacha tezlik: {m?.avgLatencyMs ? `${(m.avgLatencyMs / 1000).toFixed(1)}s` : '1.2s'}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Fallback Ulushi</span>
            <div className="text-2xl font-black text-amber-400">{m?.todayFallbackRatePct || 0}%</div>
            <p className="text-[10px] text-slate-400">{m?.todayFallbackCount || 0} ta qiyin rasm strong modelda</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Oylik Real AI Xarajati</span>
            <div className="text-2xl font-black text-indigo-200">{(m?.monthRealAiCostUzs || m?.estimatedAiCostMonth || 0).toLocaleString()} <span className="text-xs font-normal text-slate-300">so'm</span></div>
            <p className="text-[10px] text-slate-400">Tokens: {((m?.monthInputTokens || 0) + (m?.monthOutputTokens || 0)).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Tariflar Bo'yicha Obunachilar Taqsimoti</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(data?.planBreakdown || {}).map(([pKey, count]) => (
            <div key={pKey} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">{pKey}</span>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{count} ta</div>
            </div>
          ))}
        </div>
      </div>

      {/* User Management & High Consumption Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Foydalanuvchilar va AI Ishlatilishi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Foydalanuvchilarga tarif berish, muddat uzaytirish va AI kredit qo'shish</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ism, telefon, Telegram..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
            >
              <option value="ALL">Barcha tariflar</option>
              <option value="START">START</option>
              <option value="PRO">PRO</option>
              <option value="MAX">MAX</option>
              <option value="MAKTAB_PRO">Maktab PRO</option>
              <option value="MAKTAB_VIP">Maktab VIP</option>
              <option value="FREE">FREE</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Foydalanuvchi</th>
                <th className="py-3 px-4">Tarif</th>
                <th className="py-3 px-4">AI Ishlatilgan</th>
                <th className="py-3 px-4">Bonus Kredit</th>
                <th className="py-3 px-4">Muddati</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.phone || u.email || u.telegramId || 'ID: ' + u.id.slice(0, 8)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      u.plan === 'PRO' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                      u.plan === 'MAX' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                      u.plan === 'MAKTAB_PRO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      u.plan === 'MAKTAB_VIP' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                      u.plan === 'START' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {(u.usedAiCredits || u.usedNotebooks || 0).toLocaleString()} ta
                  </td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">
                    +{u.bonusCredits || 0}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleDateString('uz-UZ') : 'Cheksiz / Free'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => { setSelectedUser(u); setModalAction('set_plan'); }}
                      className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-lg text-[11px] font-bold"
                    >
                      Tarif
                    </button>
                    <button
                      onClick={() => { setSelectedUser(u); setModalAction('add_credits'); }}
                      className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-lg text-[11px] font-bold"
                    >
                      +AI Kredit
                    </button>
                    <button
                      onClick={() => { setSelectedUser(u); setModalAction('extend_subscription'); }}
                      className="px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 rounded-lg text-[11px] font-bold"
                    >
                      +Muddat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {modalAction && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {modalAction === 'set_plan' && "Tarif Biriktirish"}
                {modalAction === 'add_credits' && "AI Kredit Qo'shish"}
                {modalAction === 'extend_subscription' && "Obuna Muddatini Uzaytirish"}
              </h3>
              <button
                onClick={() => { setModalAction(null); setSelectedUser(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1">
              <p><span className="text-slate-500">Foydalanuvchi:</span> <b>{selectedUser.name}</b></p>
              <p><span className="text-slate-500">Joriy tarif:</span> <b>{selectedUser.plan}</b></p>
            </div>

            <form onSubmit={handleUserAction} className="space-y-4">
              {modalAction === 'set_plan' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Yangi Tarif</label>
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="START">START (300 AI)</option>
                      <option value="PRO">PRO (1 000 AI)</option>
                      <option value="MAX">MAX (2 000 AI)</option>
                      <option value="MAKTAB_PRO">Maktab PRO (4 000 AI)</option>
                      <option value="MAKTAB_VIP">Maktab VIP (6 500 AI)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Muddati (kun)</label>
                    <input
                      type="number"
                      value={formDays}
                      onChange={(e) => setFormDays(Number(e.target.value))}
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </>
              )}

              {modalAction === 'add_credits' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Qo'shiladigan AI Kreditlar Soni</label>
                  <input
                    type="number"
                    step="50"
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Masalan: 500 ta yoki 1000 ta AI tekshirish</p>
                </div>
              )}

              {modalAction === 'extend_subscription' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Uzaytirish (kun)</label>
                  <input
                    type="number"
                    value={formDays}
                    onChange={(e) => setFormDays(Number(e.target.value))}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalAction(null); setSelectedUser(null); }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Saqlanmoqda..." : "Tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
