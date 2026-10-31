'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, TrendingUp, UsersRound, Globe2, HeartHandshake, Check, Sparkles, BriefcaseBusiness } from 'lucide-react';
import type { ReactNode } from 'react';
import { type Program } from '@/lib/content';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';
import membershipStyles from './membership-cards.module.css';

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`mb-5 flex items-center gap-3 text-xs font-bold tracking-[.15em] uppercase ${light ? 'text-slate-300' : 'text-slate-600'}`}>
      <span className="h-0.5 w-7 shrink-0 bg-crimson" />
      {children}
    </div>
  );
}

export function ButtonLink({
  children,
  href,
  variant = 'red',
  className = '',
  onClick,
}: {
  children: ReactNode;
  href: string;
  variant?: 'red' | 'outline' | 'white';
  className?: string;
  onClick?: () => void;
}) {
  // Let the browser handle section navigation without the router resetting scroll.
  const Element = href.includes('#') ? 'a' : Link;
  return (
    <Element
      href={href}
      onClick={onClick}
      className={`button ${
        variant === 'outline' ? 'button-outline' : variant === 'white' ? 'button-white' : ''
      } ${className}`}
    >
      <span>{children}</span>
      <ArrowRight size={18} aria-hidden="true" />
    </Element>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="section-title mb-0">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const icons = { growth: TrendingUp, users: UsersRound, globe: Globe2, heart: HeartHandshake };

export function ProgramIcon({ type }: { type: Program['icon'] }) {
  const Icon = icons[type];
  return <Icon size={27} strokeWidth={1.5} aria-hidden="true" />;
}

export function ProgramGrid() {
  const { lang } = useLanguage();
  const list = translations[lang].programsList;
  const iconTypes: Program['icon'][] = ['growth', 'users', 'globe', 'heart'];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {list.map((program, index) => (
        <Link
          key={program.id}
          href={`/programs#${program.id}`}
          className="group relative flex flex-col rounded-[8px] border border-slate-200 bg-white px-6 pt-7 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg motion-reduce:transform-none"
        >
          <span className="absolute top-7 right-6 text-xs text-slate-500">{program.number} /</span>
          <span className="mb-7 flex size-12 items-center justify-center rounded-[8px] bg-red-50 text-crimson">
            <ProgramIcon type={iconTypes[index] || 'growth'} />
          </span>
          <h3 className="mb-4 text-xl font-semibold tracking-tight">{program.title}</h3>
          <p className="mb-7 text-sm leading-7 text-slate-600">{program.description}</p>
          <span className="mt-auto flex min-h-16 items-center justify-between gap-2 border-t border-slate-100 text-xs font-semibold">
            {program.label}
            <ArrowUpRight size={18} className="text-crimson" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function MembershipCards({ registrationHref, onSelect, nonprofitPortrait = false }: { registrationHref?: string; onSelect?: (tier: string) => void; nonprofitPortrait?: boolean } = {}) {
  const { lang } = useLanguage();
  const tiersList = translations[lang].membershipTiers;

  return (
    <div className={`${membershipStyles.grid} ${nonprofitPortrait ? membershipStyles.hasPortrait : ''}`}>
      {tiersList.map((tier) => {
        const Icon = { startup: Sparkles, 'small-business': BriefcaseBusiness, corporate: Globe2, nonprofit: HeartHandshake }[tier.id];
        const featured = 'featuredBadge' in tier;
        return (
          <article key={tier.id} className={`${membershipStyles.card} ${featured ? membershipStyles.featured : ''} ${nonprofitPortrait && tier.id === 'nonprofit' ? membershipStyles.portraitCard : ''}`}>
            {nonprofitPortrait && tier.id === 'nonprofit' && <Image
              src="/assets/heidy-portrait.webp" alt="Heidy" width={384} height={512} sizes="136px"
              className={membershipStyles.portrait}
            />}
            <Icon size={25} strokeWidth={1.5} className={membershipStyles.icon} aria-hidden="true" />
            <span className={membershipStyles.eyebrow}>{tier.eyebrow}</span>
            <h3>{tier.name}</h3>
            <div className={membershipStyles.content}>
              <p>{tier.description}</p>
              <ul>{tier.benefits.map(benefit => <li key={benefit}><Check size={15} aria-hidden="true" /><span>{benefit}</span></li>)}</ul>
              <ButtonLink className={membershipStyles.apply} href={registrationHref || `/?tier=${tier.id}#register-form`}
                onClick={onSelect ? () => onSelect(tier.id) : undefined} variant={featured ? 'red' : 'outline'}>
                {tier.btnText}
              </ButtonLink>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-mist py-14 md:py-20">
      <div className="container">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="max-w-4xl page-title leading-[1.08] font-semibold tracking-[-.055em]">
          {title}
          {accent && (
            <>
              <br />
              <span className="text-crimson">{accent}</span>
            </>
          )}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">{description}</p>
      </div>
    </section>
  );
}

export function ClosingCTA() {
  const { lang } = useLanguage();
  const cta = translations[lang].home.closingCTA;

  return (
    <section className="bg-crimson py-12 text-white">
      <div className="container flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[.17em] text-red-100">
            {cta.tagline}
          </p>
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
            {cta.title1} <span className="text-red-100">{cta.title2}</span>
          </h2>
        </div>
        <ButtonLink href="/#register-form" variant="white">
          {cta.btn}
        </ButtonLink>
      </div>
    </section>
  );
}
