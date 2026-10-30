'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Globe, Mail, Menu, Phone, X } from 'lucide-react';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export function Brand({ light = false, large = false }: { light?: boolean; large?: boolean }) {
  return (
    <Link href="/" className={`brand flex items-center shrink-0 ${large ? 'header-brand' : ''}`} aria-label="DUSACCOM home">
      <Image
        src="/imgs/DUSACCOM large logo.png"
        alt="DUSACCOM"
        width={2048}
        height={1117}
        priority
        className={large ? 'header-brand-image' : 'h-12 w-auto object-contain'}
        style={light ? { filter: 'brightness(0) invert(1)' } : { filter: 'none' }}
      />
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [overHero, setOverHero] = useState(isHome);
  const [hidden, setHidden] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(140);
  const header = useRef<HTMLElement>(null);
  const { lang, toggleLang } = useLanguage();
  const t = translations[lang];
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const registrationToggle = useRef<HTMLButtonElement>(null);
  const registration = useRef<HTMLDivElement>(null);
  const photoLinks = [
    { href: '/fotos', label: t.nav.fotos },
    { href: '/enviar-fotos', label: t.nav.enviarFotos },
    { href: '/agendar-cita', label: t.nav.agendarCita },
  ];
  const registrationLinks = [{ href: '/#membership', label: t.nav.viewTiers }, ...photoLinks];
  const registrationActive = pathname === '/membership' || photoLinks.some(({ href }) => pathname === href);
  const closeNavigation = () => { setOpen(false); setDropdownOpen(false); };

  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (dropdownOpen) {
          setDropdownOpen(false);
          registrationToggle.current?.focus();
        } else if (open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }
    }
    function outside(e: PointerEvent) {
      if (!registration.current?.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [dropdownOpen, open]);

  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeaderHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let hero = isHome ? document.querySelector('.home-hero') : null;
    const element = header.current;
    let previousY = window.scrollY;
    let previousInHero: boolean | undefined;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    const clearHideTimer = () => {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    };
    // The homepage may finish streaming after this header hydrates.
    const heroVisible = () => isHome && (!hero || hero.getBoundingClientRect().bottom > 0);
    const headerHasFocus = () => !!element?.contains(document.activeElement);
    const scheduleHide = () => {
      if (hideTimer !== undefined) return;
      hideTimer = setTimeout(() => {
        hideTimer = undefined;
        if (!heroVisible() && !open && !dropdownOpen && !headerHasFocus()) setHidden(true);
      }, 2000);
    };
    const update = () => {
      frame = 0;
      const currentY = window.scrollY;
      const delta = currentY - previousY;
      const inHero = heroVisible();
      const exitedHero = previousInHero === true && !inHero;
      const initialUpdate = previousInHero === undefined;
      previousInHero = inHero;
      setOverHero(inHero);
      if (inHero || currentY <= 0 || open || dropdownOpen || headerHasFocus()) {
        clearHideTimer();
        setHidden(false);
      } else if (delta < -2) {
        clearHideTimer();
        setHidden(false);
      } else if (delta > 2 || exitedHero || initialUpdate) {
        // Hide two seconds after leaving the hero or resuming a downward scroll.
        // After an upward scroll, stay visible until the next downward scroll.
        scheduleHide();
      }
      if (Math.abs(delta) > 2) previousY = currentY;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    const observer = new IntersectionObserver(onScroll);
    if (hero) observer.observe(hero);
    const pendingHero = isHome && !hero ? new MutationObserver(() => {
      hero = document.querySelector('.home-hero');
      if (hero) {
        observer.observe(hero);
        pendingHero?.disconnect();
        onScroll();
      }
    }) : null;
    pendingHero?.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    element?.addEventListener('focusin', onScroll);
    element?.addEventListener('focusout', onScroll);
    return () => {
      clearHideTimer();
      cancelAnimationFrame(frame);
      observer.disconnect();
      pendingHero?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      element?.removeEventListener('focusin', onScroll);
      element?.removeEventListener('focusout', onScroll);
    };
  }, [isHome, pathname, open, dropdownOpen]);

  const navLinkClass = (href: string) =>
    `flex min-h-12 items-center text-[15px] font-semibold transition-colors hover:text-crimson ${pathname === href ? 'text-crimson' : 'text-slate-600'}`;

  return (
    <>
    {!isHome && <div aria-hidden="true" style={{ height: headerHeight }} />}
    <header ref={header} inert={hidden} className={`site-header ${overHero ? 'home-header text-white' : 'solid-header text-navy'} ${hidden ? 'is-hidden' : ''}`}>
      <div className="header-information border-b">
        <div className="container flex min-h-9 items-center justify-between gap-4 py-2 text-[10px]">
          <span>{t.tagline}</span>
          <div className="flex shrink-0 gap-6">
            <a className="hidden items-center gap-2 sm:flex" href={`mailto:${site.email}`}><Mail size={12} aria-hidden="true" />{site.email}</a>
            <a href={`tel:${site.phoneHref}`} className="hidden items-center gap-2 md:flex"><Phone size={12} aria-hidden="true" />{site.phone}</a>
          </div>
        </div>
      </div>
      <div className="header-surface relative border-b">
        <div className="container flex min-h-26 items-center gap-3 sm:gap-6">
          <Brand light={overHero} large />
          <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-7 lg:flex">
            <Link href="/#about" className={navLinkClass('/about')}>{t.nav.about}</Link>
            <div ref={registration} className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropdownOpen(false); }}>
              <div className="flex items-center">
                <Link href="/#register-form" onClick={closeNavigation} className={navLinkClass(registrationActive ? pathname : '/membership')}>{t.nav.registration}</Link>
                <button ref={registrationToggle} className="flex size-11 items-center justify-center text-slate-600 hover:text-crimson" aria-label={`${t.nav.registration}: ${t.nav.quickLinks}`} aria-expanded={dropdownOpen} aria-controls="registration-submenu" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <ChevronDown size={16} aria-hidden="true" className={dropdownOpen ? 'rotate-180' : ''} />
                </button>
              </div>
              <div id="registration-submenu" hidden={!dropdownOpen} className="absolute top-full left-0 w-80 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                {registrationLinks.map(({ href, label }) => <Link key={href} href={href} onClick={closeNavigation} aria-current={pathname === href ? 'page' : undefined} className="flex min-h-12 items-center rounded-lg px-4 py-3 text-[14px] font-medium leading-6 text-slate-600 hover:bg-slate-50 hover:text-crimson">{label}</Link>)}
              </div>
            </div>
            <Link href="/#infotep" className={navLinkClass('/infotep')}>{t.nav.infotep}</Link>
            <Link href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined} className={navLinkClass('/contact')}>{t.nav.contact}</Link>
          </nav>
          <div className="header-controls ml-auto flex items-center gap-2 lg:ml-0">
            <button onClick={toggleLang} aria-label={t.nav.shiftLangAria} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[13px] font-bold hover:border-crimson">
              <Globe size={16} aria-hidden="true" /><span>{lang === 'en' ? 'EN / ES' : 'ES / EN'}</span>
            </button>
            <button ref={toggle} className="icon-button lg:hidden" aria-label={open ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
          </div>
        </div>
        <nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!open} className="absolute top-full right-0 left-0 max-h-[calc(100dvh-84px)] overflow-y-auto border-t border-slate-200 bg-white px-6 py-4 shadow-xl lg:hidden">
          <Link href="/#about" className={navLinkClass('/about')} onClick={closeNavigation}>{t.nav.about}</Link>
          <details className="border-y border-slate-100 py-1">
            <summary className="cursor-pointer py-3 text-[15px] font-semibold text-slate-600">{t.nav.registration}</summary>
            <Link href="/#register-form" onClick={closeNavigation} className="flex min-h-11 items-center pl-4 text-[14px] font-semibold text-crimson">{t.nav.registration}<ArrowUpRight size={16} className="ml-2" aria-hidden="true" /></Link>
            {registrationLinks.map(({ href, label }) => <Link key={href} href={href} onClick={closeNavigation} className="flex min-h-12 items-center py-2 pl-4 text-[14px] text-slate-600 hover:text-crimson">{label}</Link>)}
          </details>
          <Link href="/#infotep" className={navLinkClass('/infotep')} onClick={closeNavigation}>{t.nav.infotep}</Link>
          <Link href="/contact" className={navLinkClass('/contact')} onClick={closeNavigation}>{t.nav.contact}</Link>
        </nav>
      </div>
    </header>
    </>
  );
}
