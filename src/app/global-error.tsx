'use client';
import { useEffect, useState } from 'react';
import { fontVariables } from './fonts';
import { systemCopy } from '@/lib/system-copy';
import { HTML_LANG, readStoredLang } from '@/lib/language-context';
import type { Lang } from '@/lib/translations';

const display = 'var(--typeface-merengue), var(--typeface-bricolage), sans-serif';
const mid = 'var(--typeface-bricolage), var(--typeface-noto-sans), sans-serif';

export default function GlobalError({ reset }: { reset: () => void }) {
  // This component renders its own <html>, outside the language provider, so it reads the saved choice directly.
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => setLang(readStoredLang()), []);
  const c = systemCopy[lang].globalError;
  return <html lang={HTML_LANG[lang]} className={fontVariables}><body style={{ margin: 0, padding: '80px 24px', background: '#f4f6f7', color: '#032a63', fontFamily: 'var(--typeface-noto-sans), sans-serif' }}><main style={{ maxWidth: 600, margin: 'auto' }}><p style={{ color: '#cb0716', letterSpacing: 2, fontSize: 12, fontFamily: mid, fontWeight: 600 }}>DUSACCOM</p><h1 style={{ fontSize: 44, lineHeight: 1.15, fontFamily: display, fontStyle: 'italic', fontWeight: 800, fontSynthesis: 'style', letterSpacing: '-0.035em', wordSpacing: '0.06em' }}>{c.title}</h1><p style={{ lineHeight: 1.8 }}>{c.bodyBefore} <a href="mailto:admin@dusaccnj.org">admin@dusaccnj.org</a>{c.bodyAfter}</p><button onClick={reset} style={{ minHeight: 48, padding: '12px 24px', border: 0, borderRadius: 4, color: '#fefefe', background: '#cb0716', cursor: 'pointer', fontFamily: mid, fontWeight: 600, fontSize: 15 }}>{c.retry}</button></main></body></html>;
}
