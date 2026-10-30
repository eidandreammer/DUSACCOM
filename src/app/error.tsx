'use client';
import Link from 'next/link';
import { useEffect } from 'react';
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Page render failed:', error);
    } else {
      console.error(JSON.stringify({ level: 'error', event: 'ui.render_failed', digest: error.digest || 'unknown' }));
    }
  }, [error]);
  return <section className="section"><div className="container max-w-2xl! py-12"><p className="mb-5 text-xs font-semibold tracking-widest text-crimson">LET’S TRY AGAIN</p><h1 className="section-title">We couldn’t load this page.</h1><p className="mt-6 mb-8 text-sm leading-8 text-slate-600">Please try again, or contact the Chamber if you need help. Your next connection is still within reach.</p><div className="flex flex-wrap gap-3"><button className="button" onClick={reset}>Try again</button><Link className="button button-outline" href="/contact">Contact the Chamber</Link></div>{error.digest && <p className="mt-6 text-xs text-slate-600">Reference: {error.digest}</p>}</div></section>;
}
