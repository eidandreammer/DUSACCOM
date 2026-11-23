'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CookieSettings } from './privacy-controls';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';
import { homeLink, legalLinks, navigationGroups } from '@/lib/navigation';
import { FooterAccount } from './footer-account';
import BiteSitesCreditFooter from './bitesites/bitesites-credit-footer.jsx';

const madeBy = {
  en: { eyebrow: 'Made by', label: 'Made by BiteSites — visit bitesites.org' },
  es: { eyebrow: 'Hecho por', label: 'Hecho por BiteSites — visita bitesites.org' },
  pt: { eyebrow: 'Feito por', label: 'Feito por BiteSites — visite bitesites.org' },
} as const;

export function Footer() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <footer className="bg-[#0c2334] pt-14 text-slate-300">
      <div className="container grid gap-8 pb-12 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
        {/* Brand column */}
        <div className="max-w-sm">
          <Link href="/" aria-label={t.common.brandHomeAria} className="inline-block">
            <div className="footer-logo">
              <Image
                src="/assets/dominican-usa-chamber-of-commerce-nj-logo-reversed.svg"
                alt={t.common.logoAlt}
                width={214}
                height={200}
                unoptimized
                className="footer-logo-image"
              />
            </div>
          </Link>
          <p className="mt-6 text-sm leading-7 text-slate-400">
            {t.footer.description}
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs tracking-wider">
            <span className="flag flag-dr rounded-[8px]" role="img" aria-label={t.common.drFlag} />
            {t.footer.dominicanRepublic}
            <span className="text-slate-500">/</span>
            <span className="flag flag-us rounded-[8px]" role="img" aria-label={t.common.usFlag} />
            {t.footer.unitedStates}
          </div>
        </div>

        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:w-full lg:max-w-[850px] lg:justify-self-end lg:grid-cols-3">
          {navigationGroups.map(group => (
            <div key={group.id}>
              <nav className="footer-links" aria-labelledby={`footer-${group.id}`}>
                <h2 id={`footer-${group.id}`}>{t.nav[group.label]}</h2>
                {group.id === 'chamber' && <Link href={homeLink.href}>{t.nav[homeLink.label]}</Link>}
                {group.links.map(link => <Link key={link.href} href={link.href}>{t.nav[link.label]}</Link>)}
              </nav>
              {group.id === 'participate' && <div className="mt-6"><FooterAccount /></div>}
            </div>
          ))}

          {/* Let's connect links */}
          <div className="footer-links sm:col-span-2 lg:col-span-3">
            <h2>{t.footer.connectTitle}</h2>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
            <a href={site.directionsUrl} target="_blank" rel="noreferrer">{site.addressLine}</a>
            <Link href="/contact" className="flex items-center gap-3">
              <span>{t.footer.contactTeam}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <span className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} aria-hidden="true" />
              {t.footer.noPayments}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container flex flex-col justify-between gap-2 border-t border-white/10 py-5 text-xs text-slate-400 lg:flex-row lg:items-center">
        <span>
          © {new Date().getFullYear()} {site.fullName}. {t.footer.rightsReserved}
        </span>
        <div className="footer-actions ml-auto flex flex-wrap justify-end gap-x-2.5 gap-y-1">
          {legalLinks.map(link => (
            <Link key={link.href} className="flex min-h-11 items-center hover:text-white" href={link.href}>
              {t.footer[link.label]}
            </Link>
          ))}
          <CookieSettings />
        </div>
      </div>

      <div className="container pb-8">
        <BiteSitesCreditFooter onDark logoSrc="/assets/bitesites-logo-full.webp" eyebrow={madeBy[lang].eyebrow} label={madeBy[lang].label} />
      </div>
    </footer>
  );
}
