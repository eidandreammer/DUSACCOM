'use client';
import { ButtonLink } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { systemCopy } from '@/lib/system-copy';

export default function NotFound() {
  const { lang } = useLanguage();
  const c = systemCopy[lang].notFound;
  return <section className="section"><div className="container max-w-2xl! py-12"><p className="mb-5 font-mid text-xs font-semibold tracking-widest text-crimson">{c.eyebrow}</p><h1 className="section-title">{c.title}</h1><p className="mt-6 mb-8 text-sm leading-8 text-slate-600">{c.body}</p><ButtonLink href="/">{c.button}</ButtonLink></div></section>;
}
