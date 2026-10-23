'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Globe, Mail, Menu, Phone, ShoppingCart, X } from 'lucide-react';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="brand flex items-center shrink-0" aria-label="DUSACCOM home">
      <Image
        src="/imgs/DUSACCOM large logo.png"
        alt="DUSACCOM"
        width={180}
        height={60}
        priority
        className="h-12 w-auto object-contain"
        style={light ? { filter: 'brightness(0) invert(1)' } : undefined}
      />
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { lang, toggleLang } = useLanguage();
  const t = translations[lang];
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setDropdownOpen(false);
        toggle.current?.focus();
      }
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);

  return (
    <>
      {/* Top Heritage Bar */}
      <div className="bg-navy-deep text-slate-200">
        <div className="container flex min-h-9 items-center justify-between gap-4 text-[10px]">
          <span>{t.tagline}</span>
          <div className="flex gap-6">
            <a className="hidden items-center gap-2 sm:flex transition-colors" href={`mailto:${site.email}`}>
              <Mail size={12} aria-hidden="true" />
              {site.email}
            </a>
            <a href={`tel:${site.phoneHref}`} className="flex items-center gap-2 transition-colors">
              <Phone size={12} aria-hidden="true" />
              {site.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="container flex h-21 items-center justify-between gap-3">
          <Brand />

          {/* Desktop Navigation */}
          <nav aria-label="Main navigation" className="hidden items-center gap-3.5 2xl:gap-5 xl:flex">
            {/* 1. Members: Registration Cart / Miembros: Carrito para registrar */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <Link
                href="/membership#apply"
                className={`flex min-h-11 items-center gap-1 text-xs font-semibold transition hover:text-crimson ${
                  pathname === '/membership' ? 'text-crimson' : 'text-slate-600'
                }`}
              >
                <span>{t.nav.membersCart}</span>
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </Link>

              {dropdownOpen && (
                <div className="absolute top-full left-0 w-64 rounded-[8px] border border-slate-200 bg-white py-2 shadow-xl">
                  <div className="px-4 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {t.nav.quickLinks}
                  </div>
                  <Link
                    href="/membership#apply"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-red-50 hover:text-crimson"
                  >
                    <ShoppingCart size={15} className="text-crimson" />
                    <span>{t.nav.cartOnly}</span>
                  </Link>
                  <Link
                    href="/membership"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-crimson"
                  >
                    <span>{t.nav.viewTiers}</span>
                  </Link>
                  <Link
                    href="/enviar-fotos"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-crimson"
                  >
                    <span>{t.nav.enviarFotos}</span>
                  </Link>
                  <Link
                    href="/agendar-cita"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-crimson"
                  >
                    <span>{t.nav.agendarCita}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Mission / Misión */}
            <Link
              href="/about#mission"
              className="flex min-h-11 items-center text-xs font-semibold text-slate-600 transition hover:text-crimson"
            >
              {t.nav.mission}
            </Link>

            {/* 3. About Us / Sobre Nosotros */}
            <Link
              href="/about"
              aria-current={pathname === '/about' ? 'page' : undefined}
              className={`flex min-h-11 items-center text-xs font-semibold transition hover:text-crimson ${
                pathname === '/about' ? 'text-crimson' : 'text-slate-600'
              }`}
            >
              {t.nav.about}
            </Link>

            {/* 4. Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-xs font-semibold text-slate-600 transition hover:text-crimson"
            >
              {t.nav.instagram}
            </a>

            {/* 5. Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center text-xs font-semibold text-slate-600 transition hover:text-crimson"
            >
              {t.nav.facebook}
            </a>

            {/* 6. Photos (FaceApp Photos) / Fotos (Foto FaceApp) */}
            <Link
              href="/fotos"
              aria-current={pathname === '/fotos' ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-1 text-xs font-semibold transition hover:text-crimson ${
                pathname === '/fotos' ? 'text-crimson' : 'text-slate-600'
              }`}
            >
              <span>{t.nav.fotos}</span>
              <span className="rounded-[8px] bg-slate-100 px-1.5 py-0.5 text-[9px] font-normal text-slate-500 italic">
                ({t.nav.fotosSidenote})
              </span>
            </Link>

            {/* 7. INFOTEP */}
            <Link
              href="/infotep"
              aria-current={pathname === '/infotep' ? 'page' : undefined}
              className={`flex min-h-11 items-center text-xs font-semibold transition hover:text-crimson ${
                pathname === '/infotep' ? 'text-crimson' : 'text-slate-600'
              }`}
            >
              {t.nav.infotep}
            </Link>

            {/* 8. Submit Member Photos / Enviar fotos de miembros */}
            <Link
              href="/enviar-fotos"
              aria-current={pathname === '/enviar-fotos' ? 'page' : undefined}
              className={`flex min-h-11 items-center text-xs font-semibold transition hover:text-crimson ${
                pathname === '/enviar-fotos' ? 'text-crimson' : 'text-slate-600'
              }`}
            >
              {t.nav.enviarFotos}
            </Link>

            {/* 9. Schedule Member Photo Appointment / Agendar cita para fotos de miembros */}
            <Link
              href="/agendar-cita"
              aria-current={pathname === '/agendar-cita' ? 'page' : undefined}
              className={`flex min-h-11 items-center text-xs font-semibold transition hover:text-crimson ${
                pathname === '/agendar-cita' ? 'text-crimson' : 'text-slate-600'
              }`}
            >
              {t.nav.agendarCita}
            </Link>
          </nav>

          {/* Right Menu Controls: Language Button + Member CTA + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Language shift button */}
            <button
              onClick={toggleLang}
              aria-label={t.nav.shiftLangAria}
              title={t.nav.shiftLangAria}
              className="lang-toggle inline-flex min-h-[44px] items-center gap-2 rounded-[8px] border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-navy shadow-xs transition hover:border-crimson hover:bg-red-50 hover:text-crimson"
            >
              <Globe size={16} className="text-crimson" aria-hidden="true" />
              <span className="tracking-wide">
                {lang === 'en' ? (
                  <>
                    EN / <strong className="text-crimson font-extrabold">ES</strong>
                  </>
                ) : (
                  <>
                    <strong className="text-crimson font-extrabold">EN</strong> / ES
                  </>
                )}
              </span>
            </button>

            {/* Join CTA button */}
            <Link
              className="button hidden min-h-11 px-4! text-xs! md:flex"
              href="/membership#apply"
            >
              <span>{t.nav.becomeMember}</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              ref={toggle}
              className="icon-button xl:hidden"
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          hidden={!open}
          className="absolute top-full right-0 left-0 max-h-[calc(100vh-84px)] overflow-y-auto border-t border-slate-200 bg-white px-5 py-6 shadow-2xl xl:hidden"
        >
          {/* Mobile Language Switcher banner */}
          <div className="mb-4 flex items-center justify-between rounded-[8px] border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'en' ? 'Language / Idioma:' : 'Idioma / Language:'}
            </span>
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-2 rounded-[8px] bg-white px-3 py-1.5 text-xs font-bold text-navy shadow-xs border border-slate-300 hover:border-crimson hover:text-crimson"
            >
              <Globe size={15} className="text-crimson" />
              <span>{lang === 'en' ? 'Cambiar a Español' : 'Switch to English'}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {/* 1. Members: Registration Cart / Miembros: Carrito para registrar */}
            <Link
              href="/membership#apply"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center justify-between text-sm font-semibold text-navy hover:text-crimson"
            >
              <span>{t.nav.membersCart}</span>
              <ShoppingCart size={16} className="text-crimson" />
            </Link>

            {/* 2. Mission / Misión */}
            <Link
              href="/about#mission"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center text-sm font-medium text-slate-700 hover:text-crimson"
            >
              {t.nav.mission}
            </Link>

            {/* 3. About Us / Sobre Nosotros */}
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center text-sm font-medium text-slate-700 hover:text-crimson"
            >
              {t.nav.about}
            </Link>

            {/* 4. Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center text-sm font-medium text-slate-700 hover:text-crimson"
            >
              {t.nav.instagram}
            </a>

            {/* 5. Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center text-sm font-medium text-slate-700 hover:text-crimson"
            >
              {t.nav.facebook}
            </a>

            {/* 6. Photos (FaceApp Photos) / Fotos (Foto FaceApp) */}
            <Link
              href="/fotos"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center justify-between text-sm font-medium text-slate-700 hover:text-crimson"
            >
              <span>{t.nav.fotos}</span>
              <span className="rounded-[8px] bg-slate-100 px-2 py-0.5 text-xs text-slate-500 italic">
                ({t.nav.fotosSidenote})
              </span>
            </Link>

            {/* 7. INFOTEP */}
            <Link
              href="/infotep"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center text-sm font-medium text-slate-700 hover:text-crimson"
            >
              {t.nav.infotep}
            </Link>

            {/* 8. Submit Member Photos / Enviar fotos de miembros */}
            <Link
              href="/enviar-fotos"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center text-sm font-medium text-slate-700 hover:text-crimson"
            >
              {t.nav.enviarFotos}
            </Link>

            {/* 9. Schedule Member Photo Appointment / Agendar cita para fotos de miembros */}
            <Link
              href="/agendar-cita"
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center text-sm font-medium text-slate-700 hover:text-crimson"
            >
              {t.nav.agendarCita}
            </Link>
          </div>

          <Link
            href="/membership#apply"
            onClick={() => setOpen(false)}
            className="button mt-6 w-full"
          >
            <span>{t.nav.joinChamber}</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </nav>
      </header>
    </>
  );
}
