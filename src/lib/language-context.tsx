'use client';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from './translations';

export type { Lang };
export const LANGS: readonly Lang[] = ['en', 'es', 'pt'];
export const HTML_LANG: Record<Lang, string> = { en: 'en', es: 'es', pt: 'pt-BR' };
/** Firebase Auth language code (emails and the Google popup). */
export const FIREBASE_LANG: Record<Lang, string> = { en: 'en', es: 'es', pt: 'pt-BR' };
/** BCP 47 locale used for Intl formatting and Firebase Auth emails. */
export const LOCALE: Record<Lang, string> = { en: 'en-US', es: 'es-US', pt: 'pt-BR' };

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
});

const STORAGE_KEY = 'dusaccom_lang';

const isLang = (value: unknown): value is Lang => value === 'en' || value === 'es' || value === 'pt';

export function readStoredLang(): Lang {
  return detectLang();
}

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // ignore
  }
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of preferred) {
    const base = String(tag || '').toLowerCase();
    if (base.startsWith('pt')) return 'pt';
    if (base.startsWith('es')) return 'es';
    if (base.startsWith('en')) return 'en';
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const detected = detectLang();
    setLangState(detected);
    document.documentElement.lang = HTML_LANG[detected];
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    document.documentElement.lang = HTML_LANG[next];
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
