'use client';
import { LoaderCircle } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { systemCopy } from '@/lib/system-copy';

export default function Loading() {
  const { lang } = useLanguage();
  return <div role="status" className="container flex min-h-[50vh] items-center justify-center gap-3 text-sm text-slate-600"><LoaderCircle className="animate-spin" size={22} aria-hidden="true" />{systemCopy[lang].loading}</div>;
}
