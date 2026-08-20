import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "MaktabAI - O'qituvchilar uchun AI Yordamchi",
  description: "Daftar va diktant tekshirish, testlar yaratish, dars ishlanmasi va eMaktab integratsiyasi.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MaktabAI",
  },
  applicationName: "MaktabAI",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="light text-base">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="text-slate-900 dark:text-slate-100 antialiased h-[100dvh] flex flex-col md:flex-row overflow-hidden app-ambient-bg relative font-sans select-none">
        <AuthProvider>
          <SettingsProvider>
            <Toaster position="top-center" toastOptions={{
              className: '!bg-white dark:!bg-slate-800 !text-slate-800 dark:!text-slate-200 !shadow-xl !rounded-2xl border border-slate-200 dark:border-slate-700',
            }} />
            
            <div className="z-10 flex flex-col md:flex-row w-full h-full p-0 md:p-4 gap-0 md:gap-4 relative overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-white/95 dark:bg-slate-900/95 md:rounded-3xl border-none md:border md:border-slate-200/80 md:dark:border-slate-800/80 shadow-xs relative z-10 w-full mb-0 md:mb-0">
                <div className="mx-auto max-w-6xl p-4 md:p-8 pb-28 md:pb-8 min-h-full">
                  {children}
                </div>
              </main>
              <BottomNav />
            </div>

            {/* PWA 1-Click Install Modal/Toast */}
            <PwaInstallPrompt />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
