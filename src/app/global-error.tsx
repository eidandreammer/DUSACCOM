'use client';
import { fontVariables } from './fonts';

const display = 'var(--typeface-merengue), var(--typeface-bricolage), sans-serif';
const mid = 'var(--typeface-bricolage), var(--typeface-noto-sans), sans-serif';

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en" className={fontVariables}><body style={{ margin: 0, padding: '80px 24px', background: '#f4f6f7', color: '#032a63', fontFamily: 'var(--typeface-noto-sans), sans-serif' }}><main style={{ maxWidth: 600, margin: 'auto' }}><p style={{ color: '#cb0716', letterSpacing: 2, fontSize: 12, fontFamily: mid, fontWeight: 600 }}>DUSACCOM</p><h1 style={{ fontSize: 44, lineHeight: 1.15, fontFamily: display, fontStyle: 'italic', fontWeight: 800, fontSynthesis: 'style', letterSpacing: '-0.035em', wordSpacing: '0.06em' }}>Let’s get you connected again.</h1><p style={{ lineHeight: 1.8 }}>This page couldn’t load. Please try again or contact the Chamber at <a href="mailto:dusaccom1@gmail.com">dusaccom1@gmail.com</a>.</p><button onClick={reset} style={{ minHeight: 48, padding: '12px 24px', border: 0, borderRadius: 4, color: '#fefefe', background: '#cb0716', cursor: 'pointer', fontFamily: mid, fontWeight: 600, fontSize: 15 }}>Try again</button></main></body></html>;
}
