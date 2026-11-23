'use client';
import { useLanguage, type Lang } from '@/lib/language-context';

const LABEL: Record<Lang, string> = { en: 'Skip to main content', es: 'Saltar al contenido principal', pt: 'Pular para o conteúdo principal' };

export function SkipLink() {
  const { lang } = useLanguage();
  return (
    <a href="#main" className="fixed -top-24 left-5 z-[100] rounded-[8px] bg-white px-5 py-3 shadow focus:top-3">
      {LABEL[lang]}
    </a>
  );
}
