"use client";

import { X, Bell, CheckCircle2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/contexts/SettingsContext";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const { notificationsEnabled, notificationsMuted } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  // Static list of notifications for demo
  const notifications = [
    {
      id: 1,
      title: "Test javoblari tekshirildi",
      message: "8-A sinf o&apos;quvchilarining biologiya fanidan olgan test javoblari to&apos;liq tekshirib bo&apos;lindi. Natijalarni ko&apos;rishingiz mumkin.",
      time: "2 daqiqa oldin",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      unread: true,
    },
    {
      id: 2,
      title: "Yangi tizim yangilanishi",
      message: "Dasturga yangi &apos;Bildirishnomalar&apos; moduli qo&apos;shildi. Endi siz barcha o&apos;zgarishlardan xabardor bo&apos;lasiz.",
      time: "1 soat oldin",
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      unread: false,
    }
  ];

  return createPortal(
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-1/2 max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-l border-white/60 dark:border-slate-700/60 shadow-2xl z-50 transform transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Bildirishnomalar
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            
            {/* Warning Banners */}
            {!notificationsEnabled && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 rounded-2xl border border-rose-100 dark:border-rose-800/30 flex items-start gap-3">
                <Bell className="w-5 h-5 mt-0.5 opacity-70" />
                <div>
                  <h4 className="font-semibold text-sm">Bildirishnomalar panelini o&apos;chirib qo&apos;ydingiz</h4>
                  <p className="text-xs opacity-80 mt-1">Sizga endi xabarlar kelmaydi, bu yerda faqat eski xabarlarni ko&apos;rishingiz mumkin.</p>
                </div>
              </div>
            )}

            {notificationsEnabled && notificationsMuted && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-3">
                <Bell className="w-5 h-5 mt-0.5 opacity-70" />
                <div>
                  <h4 className="font-semibold text-sm">Ovozsizlantirildi</h4>
                  <p className="text-xs opacity-80 mt-1">Yangi xabarlar kelaveradi, ammo ekraningizda ogohlantirish sifatida chiqmaydi.</p>
                </div>
              </div>
            )}

            {/* Notifications List */}
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all ${notif.unread ? 'bg-white dark:bg-slate-800 border-rose-100 dark:border-rose-900/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {notif.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold ${notif.unread ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
