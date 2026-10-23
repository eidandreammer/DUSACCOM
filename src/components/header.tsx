'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Mail, Menu, Phone, X } from 'lucide-react';
import { site } from '@/lib/site';
const links = [{ href: '/about', label: 'About us' }, { href: '/programs', label: 'Programs & events' }, { href: '/membership', label: 'Membership' }, { href: '/contact', label: 'Contact & resources' }];
export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brand ${light ? 'text-white' : 'text-navy'}`} aria-label="DUSACCOM home"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span><span><strong>DUSACCOM<span className="text-crimson">.</span></strong><small>DOMINICAN USA CHAMBER OF COMMERCE</small></span></Link>;
}
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { function escape(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); } } document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, []);
  return <><div className="bg-navy-deep text-slate-200"><div className="container flex min-h-9 items-center justify-between gap-4 text-[10px]"><span>A shared heritage. A world of opportunity.</span><div className="flex gap-6"><a className="hidden items-center gap-2 sm:flex" href={`mailto:${site.email}`}><Mail size={12} aria-hidden="true" />{site.email}</a><a href={`tel:${site.phoneHref}`} className="flex items-center gap-2"><Phone size={12} aria-hidden="true" />{site.phone}</a></div></div></div><header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl"><div className="container flex h-21 items-center justify-between gap-6"><Brand /><nav aria-label="Main navigation" className="hidden items-center gap-7 xl:flex">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} className={`flex min-h-11 items-center text-xs font-semibold transition hover:text-crimson ${pathname === link.href ? 'text-crimson' : 'text-slate-600'}`}>{link.label}</Link>)}</nav><Link className="button ml-auto hidden min-h-11 px-4! text-xs! md:flex xl:ml-0" href="/membership#apply">Become a member<ArrowUpRight size={17} aria-hidden="true" /></Link><button ref={toggle} className="icon-button xl:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(value => !value)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></div><nav id="mobile-navigation" aria-label="Mobile navigation" hidden={!open} className="absolute top-full right-0 left-0 border-t border-slate-200 bg-white px-5 pb-6 shadow-xl xl:hidden">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-14 items-center border-b border-slate-100 text-sm" aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</Link>)}<Link href="/membership#apply" onClick={() => setOpen(false)} className="button mt-5 w-full">Join the Chamber<ArrowUpRight size={18} aria-hidden="true" /></Link></nav></header></>;
}
