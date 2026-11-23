'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { systemCopy } from '@/lib/system-copy';
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useLanguage();
  const c = systemCopy[lang].error;
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Page render failed:', error);
    } else {
      console.error(JSON.stringify({ level: 'error', event: 'ui.render_failed', digest: error.digest || 'unknown' }));
    }
  }, [error]);
  return <section className="section"><div className="container max-w-2xl! py-12"><p className="mb-5 font-mid text-xs font-semibold tracking-widest text-crimson">{c.eyebrow}</p><h1 className="section-title">{c.title}</h1><p className="mt-6 mb-8 text-sm leading-8 text-slate-600">{c.body}</p><div className="flex flex-wrap gap-3"><button className="button" onClick={reset}>{c.retry}</button><Link className="button button-outline" href="/contact">{c.contact}</Link></div>{error.digest && <p className="mt-6 text-xs text-slate-600">{c.reference}: {error.digest}</p>}</div></section>;
}
