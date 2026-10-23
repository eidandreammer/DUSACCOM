'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Check } from 'lucide-react';
import { usePathname } from 'next/navigation';
type Consent = 'essential' | 'all' | null;
type AnalyticsProperties = Record<string, string | number | boolean>;
declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; } }
const Preferences = createContext<() => void>(() => {});
export function track(event: string, properties: AnalyticsProperties = {}) {
  window.dispatchEvent(new CustomEvent('dusaccom:track', { detail: { event, properties } }));
}
export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<Consent>(null);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const gaId = process.env.NEXT_PUBLIC_GA_ID || '';
  const validGa = /^G-[A-Z0-9]+$/.test(gaId);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('dusaccom-consent-v2'); } catch { /* Preferences are optional. */ }
    if (saved === 'all' || saved === 'essential') setConsent(saved);
    else setVisible(true);
  }, []);
  const save = useCallback((value: Exclude<Consent, null>) => {
    setConsent(value); setVisible(false);
    try { localStorage.setItem('dusaccom-consent-v2', value); } catch { /* Apply to this visit. */ }
    if (validGa) {
      Object.assign(window, { [`ga-disable-${gaId}`]: value !== 'all' });
      window.gtag?.('consent', 'update', { analytics_storage: value === 'all' ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    }
    if (value === 'essential') document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (/^(_ga|_gid|_gat)/.test(name)) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname}`;
      }
    });
  }, [gaId, validGa]);
  useEffect(() => {
    if (consent !== 'all') return;
    window.dataLayer ||= [];
    window.gtag ||= function (...args: unknown[]) { window.dataLayer!.push(args); };
    if (validGa) {
      window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.gtag('js', new Date());
      window.gtag('config', gaId, { send_page_view: false });
    }
    function onTrack(event: Event) {
      const detail = (event as CustomEvent<{ event: string; properties: AnalyticsProperties }>).detail;
      window.dataLayer!.push({ event: detail.event, ...detail.properties });
      if (validGa) window.gtag?.('event', detail.event, detail.properties);
      window.dispatchEvent(new CustomEvent('dusaccom:analytics', { detail }));
    }
    window.addEventListener('dusaccom:track', onTrack);
    return () => window.removeEventListener('dusaccom:track', onTrack);
  }, [consent, gaId, validGa]);
  useEffect(() => { if (consent === 'all') track('page_view', { page_path: pathname }); }, [pathname, consent]);
  return <Preferences.Provider value={() => setVisible(true)}>{children}{consent === 'all' && validGa && <Script id="dusaccom-ga" src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />}{visible && <section aria-label="Cookie preferences" className="fixed right-3 bottom-3 left-3 z-50 mx-auto flex max-w-4xl flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-2xl md:right-6 md:bottom-6 md:left-6 md:flex-row md:items-center md:gap-8"><div><h2 className="text-sm font-semibold">A little privacy goes a long way.</h2><p className="mt-1 text-xs leading-6 text-slate-600">We save your privacy preference on this device. Optional analytics help us improve your experience. <Link href="/privacy" className="underline underline-offset-2">Learn more</Link></p></div><div className="flex shrink-0 gap-2"><button onClick={() => save('essential')} className="button button-outline flex-1 px-4! text-xs!">Essential only</button><button onClick={() => save('all')} className="button flex-1 px-4! text-xs!">Accept all<Check size={16} aria-hidden="true" /></button></div></section>}</Preferences.Provider>;
}
export function CookieSettings() { const open = useContext(Preferences); return <button onClick={open} className="min-h-11 text-left hover:text-white">Cookie preferences</button>; }
