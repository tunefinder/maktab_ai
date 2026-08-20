"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/utils/translations';

type Theme = 'light' | 'dark';
type FontSize = 'sm' | 'base' | 'lg';
type FontFamily = 'inter' | 'roboto' | 'nunito';
export type DesignTheme = 'default' | 'ocean' | 'emerald' | 'cyberpunk' | 'sunset' | 'ruby' | 'custom';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  fontSize: FontSize;
  fontFamily: FontFamily;
  profileName: string;
  notificationsEnabled: boolean;
  notificationsMuted: boolean;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  setFontSize: (s: FontSize) => void;
  setFontFamily: (f: FontFamily) => void;
  setProfileName: (n: string) => void;
  setNotificationsEnabled: (n: boolean) => void;
  setNotificationsMuted: (m: boolean) => void;
  savedTestIds: string[];
  toggleSaveTest: (id: string) => void;
  t: (key: string) => string;
  
  // Design Settings
  neonMode: boolean;
  designTheme: DesignTheme;
  primaryColor: string;
  neonGlowColor: string;
  iconColor: string;
  appBgColor: string;
  appBgColorDark: string;
  setNeonMode: (v: boolean) => void;
  setDesignTheme: (t: DesignTheme) => void;
  setPrimaryColor: (c: string) => void;
  setNeonGlowColor: (c: string) => void;
  setIconColor: (c: string) => void;
  setAppBgColor: (c: string) => void;
  setAppBgColorDark: (c: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('uz');
  const [fontSize, setFontSizeState] = useState<FontSize>('base');
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('inter');
  const [profileName, setProfileNameState] = useState<string>("O'qituvchi");
  const [notificationsEnabled, setNotificationsState] = useState<boolean>(true);
  const [notificationsMuted, setNotificationsMutedState] = useState<boolean>(false);
  const [savedTestIds, setSavedTestIds] = useState<string[]>([]);
  
  // Design Settings State
  const [neonMode, setNeonModeState] = useState<boolean>(false);
  const [designTheme, setDesignThemeState] = useState<DesignTheme>('default');
  const [primaryColor, setPrimaryColorState] = useState<string>('#6366f1'); // default indigo-600
  const [neonGlowColor, setNeonGlowColorState] = useState<string>('#6366f1');
  const [iconColor, setIconColorState] = useState<string>('#6366f1');
  const [appBgColor, setAppBgColorState] = useState<string>('#f8fafc');
  const [appBgColorDark, setAppBgColorDarkState] = useState<string>('#0f172a');

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage on mount
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLang = localStorage.getItem('language') as Language;
    const savedSize = localStorage.getItem('fontSize') as FontSize;
    const savedFont = localStorage.getItem('fontFamily') as FontFamily;
    const savedName = localStorage.getItem('profileName');
    const savedNotifications = localStorage.getItem('notificationsEnabled');
    const savedMuted = localStorage.getItem('notificationsMuted');
    const savedTests = localStorage.getItem('savedTestIds');

    if (savedTheme) setThemeState(savedTheme);
    if (savedLang) setLanguageState(savedLang);
    if (savedSize) setFontSizeState(savedSize);
    if (savedFont) setFontFamilyState(savedFont);
    if (savedName) setProfileNameState(savedName);
    if (savedNotifications !== null) setNotificationsState(savedNotifications === 'true');
    if (savedMuted !== null) setNotificationsMutedState(savedMuted === 'true');
    if (savedTests) {
      try {
        setSavedTestIds(JSON.parse(savedTests));
      } catch (e) {
        console.error('Failed to parse saved tests in context', e);
      }
    }
    
    // Load design settings
    const savedNeonMode = localStorage.getItem('neonMode');
    const savedDesignTheme = localStorage.getItem('designTheme') as DesignTheme;
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedNeonGlowColor = localStorage.getItem('neonGlowColor');
    const savedIconColor = localStorage.getItem('iconColor');
    const savedAppBgColor = localStorage.getItem('appBgColor');
    const savedAppBgColorDark = localStorage.getItem('appBgColorDark');

    if (savedNeonMode !== null) setNeonModeState(savedNeonMode === 'true');
    if (savedDesignTheme) setDesignThemeState(savedDesignTheme);
    if (savedPrimaryColor) setPrimaryColorState(savedPrimaryColor);
    if (savedNeonGlowColor) setNeonGlowColorState(savedNeonGlowColor);
    if (savedIconColor) setIconColorState(savedIconColor);
    if (savedAppBgColor) setAppBgColorState(savedAppBgColor);
    if (savedAppBgColorDark) setAppBgColorDarkState(savedAppBgColorDark);
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Font size classes
      localStorage.setItem('fontSize', fontSize);
      document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
      document.documentElement.classList.add(`text-${fontSize}`);

      // Font family classes
      localStorage.setItem('fontFamily', fontFamily);
      document.documentElement.classList.remove('font-inter', 'font-roboto', 'font-nunito');
      document.documentElement.classList.add(`font-${fontFamily}`);
      
      // Design settings
      localStorage.setItem('neonMode', neonMode.toString());
      localStorage.setItem('designTheme', designTheme);
      localStorage.setItem('primaryColor', primaryColor);
      localStorage.setItem('neonGlowColor', neonGlowColor);
      localStorage.setItem('iconColor', iconColor);
      localStorage.setItem('appBgColor', appBgColor);
      localStorage.setItem('appBgColorDark', appBgColorDark);

      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--neon-glow-color', neonGlowColor);
      document.documentElement.style.setProperty('--icon-color', iconColor);
      document.documentElement.style.setProperty('--app-bg', appBgColor);
      document.documentElement.style.setProperty('--app-bg-dark', appBgColorDark);
      
      if (neonMode) {
        document.documentElement.classList.add('neon-mode');
      } else {
        document.documentElement.classList.remove('neon-mode');
      }
    }
  }, [theme, fontSize, fontFamily, neonMode, designTheme, primaryColor, neonGlowColor, iconColor, appBgColor, appBgColorDark, isLoaded]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  
  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (isLoaded) localStorage.setItem('language', newLang);
  };

  const setFontSize = (newSize: FontSize) => setFontSizeState(newSize);
  const setFontFamily = (newFont: FontFamily) => setFontFamilyState(newFont);

  const setProfileName = (newName: string) => {
    setProfileNameState(newName);
    if (isLoaded) localStorage.setItem('profileName', newName);
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsState(enabled);
    if (isLoaded) localStorage.setItem('notificationsEnabled', enabled.toString());
  };

  const setNotificationsMuted = (muted: boolean) => {
    setNotificationsMutedState(muted);
    if (isLoaded) localStorage.setItem('notificationsMuted', muted.toString());
  };

  const toggleSaveTest = (id: string) => {
    setSavedTestIds(prev => {
      const newSaved = prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id];
      if (isLoaded) localStorage.setItem('savedTestIds', JSON.stringify(newSaved));
      return newSaved;
    });
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const setNeonMode = (v: boolean) => {
    setNeonModeState(v);
    if (isLoaded) localStorage.setItem('neonMode', v.toString());
  };
  const setDesignTheme = (t: DesignTheme) => {
    setDesignThemeState(t);
    if (isLoaded) localStorage.setItem('designTheme', t);
  };
  const setPrimaryColor = (c: string) => {
    setPrimaryColorState(c);
    if (isLoaded) localStorage.setItem('primaryColor', c);
  };
  const setNeonGlowColor = (c: string) => {
    setNeonGlowColorState(c);
    if (isLoaded) localStorage.setItem('neonGlowColor', c);
  };
  const setIconColor = (c: string) => {
    setIconColorState(c);
    if (isLoaded) localStorage.setItem('iconColor', c);
  };
  const setAppBgColor = (c: string) => {
    setAppBgColorState(c);
    if (isLoaded) localStorage.setItem('appBgColor', c);
  };
  const setAppBgColorDark = (c: string) => {
    setAppBgColorDarkState(c);
    if (isLoaded) localStorage.setItem('appBgColorDark', c);
  };

  return (
    <SettingsContext.Provider value={{ 
      theme, language, fontSize, fontFamily, profileName, notificationsEnabled, notificationsMuted, savedTestIds,
      neonMode, designTheme, primaryColor, neonGlowColor, iconColor, appBgColor, appBgColorDark,
      setTheme, setLanguage, setFontSize, setFontFamily, setProfileName, setNotificationsEnabled, setNotificationsMuted, toggleSaveTest, t,
      setNeonMode, setDesignTheme, setPrimaryColor, setNeonGlowColor, setIconColor, setAppBgColor, setAppBgColorDark
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
