'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }

    // 2. Check if already installed
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // 4. Capture beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user dismissed recently
      const dismissedUntil = localStorage.getItem('pwa_dismissed_until');
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Also show for iOS if not installed
    if (iosDevice && !isInstalled) {
      const dismissedUntil = localStorage.getItem('pwa_dismissed_until');
      if (!dismissedUntil || Date.now() > Number(dismissedUntil)) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Hide for 2 days
    localStorage.setItem('pwa_dismissed_until', String(Date.now() + 2 * 24 * 60 * 60 * 1000));
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-950/60 backdrop-blur-xl relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-400 p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-indigo-950/60 rounded-[10px] flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-cyan-300" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide text-white">
              <span>MaktabAI Mobil Ilovasi</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded font-semibold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Yangi
              </span>
            </div>
            
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {isIOS ? (
                <>Ilovani o'rnatish uchun: Safari da <b>Ulashish (Share)</b> tugmasini bosib, <b>"Bosh ekranga qo'shish"</b> ni tanlang.</>
              ) : (
                <>Telefoningizga o'rnating — brauzersiz, to'liq ekranli va 1-klikda tezkor ishlaydi!</>
              )}
            </p>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ilovani O'rnatish</span>
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Keyinroq
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-0 right-0 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
