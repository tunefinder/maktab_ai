"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  username?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  subject?: string | null;
  school?: string | null;
  avatarUrl?: string | null;
  role: string;
  plan?: string | null;
  planExpiresAt?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (usernameOrIdentifier: string, password: string) => Promise<{ success: boolean; notFound?: boolean; error?: string }>;
  register: (data: { username: string; password: string; confirmPassword?: string; name?: string; subject?: string; school?: string }) => Promise<boolean>;
  loginWithGoogle: (data?: { name?: string; email?: string; avatarUrl?: string }) => Promise<boolean>;
  loginWithTelegram: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (usernameOrIdentifier: string, password: string): Promise<{ success: boolean; notFound?: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameOrIdentifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.notFound) {
          return { success: false, notFound: true, error: data.error };
        }
        toast.error(data.error || "Kirishda xatolik yuz berdi");
        return { success: false, error: data.error };
      }

      setUser(data.user);
      toast.success(`Xush kelibsiz, ${data.user.name}!`);
      router.push('/');
      return { success: true };
    } catch {
      toast.error("Tarmoqda xatolik yuz berdi");
      return { success: false, error: "Tarmoqda xatolik" };
    }
  };

  const register = async (formData: { username: string; password: string; confirmPassword?: string; name?: string; subject?: string; school?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Ro'yxatdan o'tishda xatolik");
        return false;
      }

      setUser(data.user);
      toast.success(data.message || `Muvaffaqiyatli ro'yxatdan o'tdingiz, ${data.user.name}!`);
      router.push('/');
      return true;
    } catch {
      toast.error("Tarmoqda xatolik yuz berdi");
      return false;
    }
  };

  const loginWithGoogle = async (googleData?: { name?: string; email?: string; avatarUrl?: string }): Promise<boolean> => {
    try {
      // If no explicit data provided, create a smooth mock for demo or use provided
      const email = googleData?.email || `ustoz.${Date.now().toString().slice(-4)}@gmail.com`;
      const name = googleData?.name || "Google O'qituvchi";
      const avatarUrl = googleData?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80";

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Google orqali kirishda xatolik");
        return false;
      }

      setUser(data.user);
      toast.success(`Google orqali ulandingiz, ${data.user.name}!`);
      router.push('/');
      return true;
    } catch {
      toast.error("Google orqali ulanishda xatolik");
      return false;
    }
  };

  const loginWithTelegram = async (telegramData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Telegram orqali kirishda xatolik");
        return false;
      }

      setUser(data.user);
      toast.success(`Telegram orqali ulandingiz, ${data.user.name}!`);
      router.push('/');
      return true;
    } catch {
      toast.error("Telegram orqali ulanishda xatolik");
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast.success("Tizimdan chiqildi");
      window.location.href = '/login';
    } catch {
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        toast.error(resData.error || "Profilni yangilashda xatolik");
        return false;
      }

      setUser(resData.user);
      toast.success("Profil ma'lumotlari saqlandi!");
      return true;
    } catch {
      toast.error("Profilni yangilashda xatolik");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithTelegram,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
