import localFont from 'next/font/local';
import { Bricolage_Grotesque, Noto_Sans } from 'next/font/google';

/*
 * Type roles (wired into Tailwind in globals.css):
 *   --font-display  Merengue — h1/h2 and large display copy only.
 *   --font-mid      Bricolage Grotesque — subheadings, eyebrows, leads, nav, buttons.
 *   --font-sans     Noto Sans — body copy, small text, and form fields.
 */

// Merengue covers only A–Z a–z 0–9 space . ! ? ¡ ¿ and Spanish accented vowels/Ñ/Ü.
// Missing punctuation (commas, apostrophes, dashes…) falls back to the next
// family in --font-display, so no metric-adjusted Arial fallback is generated.
// It is an italic design, so it is registered as italic: display headings ask
// for italic, which slants the fallback punctuation to match.
// Weights are ranges so the heavier weights headings request (to embolden the
// Bricolage fallback marks) still pick the intended Merengue face and are
// never synthesized: 400–600 → Regular, 700–900 → Bold.
export const merengue = localFont({
  src: [
    { path: '../../public/fonts/Merengue-Regular.woff2', weight: '400 600', style: 'italic' },
    { path: '../../public/fonts/Merengue-Bold.woff2', weight: '700 900', style: 'italic' },
  ],
  display: 'swap',
  adjustFontFallback: false,
  variable: '--typeface-merengue',
});

export const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--typeface-bricolage',
});

export const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--typeface-noto-sans',
});

export const fontVariables = `${merengue.variable} ${bricolage.variable} ${notoSans.variable}`;
