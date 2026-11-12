'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe, Menu, X } from 'lucide-react';
import { ProfileMenu } from './profile-menu';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';
import { homeLink, isNavigationLinkCurrent, navigationGroups, type NavigationLink } from '@/lib/navigation';

// The emblem is an image; the wordmark is live Merengue Bold text so it stays
// crisp at every size and can change color with the header state.
export function Brand() {
  return (
    <Link href="/" className="brand header-brand" aria-label="DUSACCOM home">
      <Image src="/assets/dusaccom-emblem.webp" alt="" width={188} height={192} priority className="header-brand-emblem" />
      <span className="header-brand-wordmark" aria-hidden="true">
        <span className="header-brand-name">DUSACCOM</span>
        <span className="header-brand-region">New Jersey</span>
      </span>
    </Link>
  );
}

function InfotepMark() {
  return <span className="header-infotep-mark"><Image src="/assets/infotep-nav-transparent.webp" alt="INFOTEP" width={300} height={72} className="header-infotep-image" /></span>;
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [overHero, setOverHero] = useState(isHome);
  const [hidden, setHidden] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(104);
  const header = useRef<HTMLElement>(null);
  const { lang, toggleLang } = useLanguage();
  const t = translations[lang];
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const closeNavigation = () => { setOpen(false); setDropdownOpen(null); };
  const followLink = (href: string) => {
    setCurrentHash(href.includes('#') ? `#${href.split('#')[1]}` : '');
    closeNavigation();
  };

  useEffect(() => {
    const updateHash = () => setCurrentHash(window.location.hash);
    updateHash();
    window.addEventListener('hashchange', updateHash);
    window.addEventListener('popstate', updateHash);
    return () => {
      window.removeEventListener('hashchange', updateHash);
      window.removeEventListener('popstate', updateHash);
    };
  }, [pathname]);

  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (dropdownOpen) {
          header.current?.querySelector<HTMLButtonElement>('[data-group-toggle][aria-expanded="true"]')?.focus();
          setDropdownOpen(null);
        } else if (open) {
          setOpen(false);
          toggle.current?.focus();
        }
      }
    }
    function outside(e: PointerEvent) {
      if (!(e.target instanceof Element) || !header.current?.contains(e.target) ||
          e.target.closest('[data-navigation-group]')?.getAttribute('data-navigation-group') !== dropdownOpen) {
        setDropdownOpen(null);
      }
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
    // Streaming or hydration can replace the initially observed hero node.
    // Always measure the current element rather than a detached earlier copy.
    const heroVisible = () => {
      const currentHero = isHome ? document.querySelector('.home-hero') : null;
      return isHome && (!currentHero || currentHero.getBoundingClientRect().bottom > 0);
    };
    const headerHasFocus = () => !!element?.contains(document.activeElement);
    const scheduleHide = () => {
      if (hideTimer !== undefined) return;
      hideTimer = setTimeout(() => {
        hideTimer = undefined;
        if (!heroVisible() && !open && !dropdownOpen && !profileOpen && !headerHasFocus()) setHidden(true);
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
      // Keep the translucent surface until the hero has completely left view.
      setOverHero(inHero);
      if (inHero || currentY <= 0 || open || dropdownOpen || profileOpen || headerHasFocus()) {
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
  }, [isHome, pathname, open, dropdownOpen, profileOpen]);

  const navLinkClass = (href: string) =>
    `header-nav-link hover-scale flex min-h-12 items-center text-base font-semibold transition-colors ${isNavigationLinkCurrent(href, pathname, currentHash) ? 'is-active' : ''}`;
  const renderLink = (link: NavigationLink, className: string) => (
    <Link key={link.href} href={link.href} onClick={() => followLink(link.href)}
      aria-current={isNavigationLinkCurrent(link.href, pathname, currentHash) ? (link.href.includes('#') ? 'location' : 'page') : undefined}
      className={className}>
      {link.label === 'infotep' ? <InfotepMark /> : t.nav[link.label]}
    </Link>
  );
  const renderGroups = (mobile: boolean) => navigationGroups.map(group => {
    const panelId = mobile ? `mobile-${group.id}-submenu` : group.id === 'participate' ? 'registration-submenu' : `${group.id}-submenu`;
    const groupKey = `${mobile ? 'mobile' : 'desktop'}-${group.id}`;
    const expanded = dropdownOpen === groupKey;
    const active = group.links.some(link => isNavigationLinkCurrent(link.href, pathname, currentHash));
    return (
      <div key={group.id} data-navigation-group={groupKey} className={mobile ? 'registration-details border-t py-1' : 'relative'}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropdownOpen(null); }}>
        <button type="button" data-group-toggle aria-expanded={expanded} aria-controls={panelId}
          className={`header-nav-link hover-scale flex min-h-12 items-center gap-2 text-base font-semibold ${mobile ? 'w-full justify-between py-3' : 'header-pill'} ${active ? 'is-active' : ''}`}
          onClick={() => setDropdownOpen(expanded ? null : groupKey)}>
          {t.nav[group.label]}<ChevronDown size={16} aria-hidden="true" className={expanded ? 'rotate-180' : ''} />
        </button>
        <div id={panelId} hidden={!expanded} className={mobile ? 'pb-2' : 'header-menu-panel absolute top-full right-0 max-h-[calc(100dvh-140px)] w-80 overflow-y-auto rounded-lg border p-2'}>
          {group.links.map(link => renderLink(link, 'registration-link hover-scale flex min-h-12 items-center rounded-lg px-4 py-3 text-sm font-medium leading-6'))}
        </div>
      </div>
    );
  });

  return (
    <>
    {!isHome && <div aria-hidden="true" style={{ height: headerHeight }} />}
    <header ref={header} inert={hidden} className={`site-header ${overHero ? 'home-header text-white' : 'solid-header text-navy'} ${hidden ? 'is-hidden' : ''}`}>
      <div className="header-surface relative border-b">
        <div className="container flex min-h-26 items-center gap-3 sm:gap-6">
          <Brand />
          <nav aria-label={t.nav.mainNavigation} className="ml-auto hidden items-center gap-2 lg:flex">
            {renderLink(homeLink, `${navLinkClass('/')} header-pill`)}
            {renderGroups(false)}
          </nav>
          <div className="header-controls ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <button onClick={toggleLang} aria-label={t.nav.shiftLangAria} className="header-language header-pill hover-scale inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold hover:border-crimson">
              <Globe size={16} aria-hidden="true" /><span>{lang === 'en' ? 'EN / ES' : 'ES / EN'}</span>
            </button>
            <button ref={toggle} className="icon-button header-pill hover-scale lg:hidden" aria-label={open ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => { setOpen(!open); setDropdownOpen(null); }}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
            <ProfileMenu onOpenChange={setProfileOpen} />
          </div>
        </div>
        <nav id="mobile-navigation" aria-label={t.nav.mobileNavigation} hidden={!open} className="header-menu-panel absolute top-full right-0 left-0 max-h-[calc(100dvh-104px)] overflow-y-auto border-t px-6 py-4 lg:hidden">
          {renderLink(homeLink, navLinkClass('/'))}
          {renderGroups(true)}
        </nav>
      </div>
    </header>
    </>
  );
}
