'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CookieSettings } from './privacy-controls';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export function Footer() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <footer className="bg-navy-deep pt-14 text-slate-300">
      <div className="container grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        {/* Brand column */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" aria-label="DUSACCOM home" className="inline-block">
            <div className="footer-logo">
              <Image
                src="/imgs/DUSACCOM complete logo.png"
                alt="DUSACCOM complete logo"
                width={2248}
                height={2048}
                className="footer-logo-image"
              />
            </div>
          </Link>
          <p className="mt-6 text-sm leading-7 text-slate-400">
            {t.footer.description}
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs tracking-wider">
            <span className="flag flag-dr rounded-[8px]" role="img" aria-label="Dominican Republic flag" />
            {t.footer.dominicanRepublic}
            <span className="text-slate-500">/</span>
            <span className="flag flag-us rounded-[8px]" role="img" aria-label="United States flag" />
            {t.footer.unitedStates}
          </div>
        </div>

        {/* The Chamber links */}
        <div className="footer-links">
          <h2>{t.footer.chamberTitle}</h2>
          <a href="/#about">{t.footer.about}</a>
          <a href="/#mission">{t.footer.mission}</a>
          <a href="/#membership">{t.footer.becomeMember}</a>
          <a href="/#register-form">{t.nav.registration}</a>
          <a href="/#infotep">{t.footer.infotep}</a>
          <a href="/#events">{t.nav.events}</a>
        </div>

        {/* Let's connect links */}
        <div className="footer-links">
          <h2>{t.footer.connectTitle}</h2>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
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

      {/* Bottom bar */}
      <div className="container flex flex-col justify-between gap-2 border-t border-white/10 py-5 text-xs text-slate-400 lg:flex-row lg:items-center">
        <span>
          © {new Date().getFullYear()} {site.fullName}. {t.footer.rightsReserved}
        </span>
        <div className="flex flex-wrap gap-5">
          <Link className="flex min-h-11 items-center hover:text-white" href="/privacy">
            {t.footer.privacy}
          </Link>
          <Link className="flex min-h-11 items-center hover:text-white" href="/terms">
            {t.footer.terms}
          </Link>
          <CookieSettings />
        </div>
      </div>
    </footer>
  );
}
