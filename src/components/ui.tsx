'use client';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, TrendingUp, UsersRound, Globe2, HeartHandshake, Check, Sparkles, BriefcaseBusiness } from 'lucide-react';
import type { ReactNode } from 'react';
import { type Program } from '@/lib/content';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div className={`mb-5 flex items-center gap-3 text-[10px] font-bold tracking-[.15em] uppercase ${light ? 'text-slate-300' : 'text-slate-600'}`}>
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
}: {
  children: ReactNode;
  href: string;
  variant?: 'red' | 'outline' | 'white';
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`button ${
        variant === 'outline' ? 'button-outline' : variant === 'white' ? 'button-white' : ''
      } ${className}`}
    >
      <span>{children}</span>
      <ArrowRight size={18} aria-hidden="true" />
    </Link>
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
          <span className="absolute top-7 right-6 text-[11px] text-slate-500">{program.number} /</span>
          <span className="mb-7 flex size-12 items-center justify-center rounded-[8px] bg-red-50 text-crimson">
            <ProgramIcon type={iconTypes[index] || 'growth'} />
          </span>
          <h3 className="mb-4 text-xl font-semibold tracking-tight">{program.title}</h3>
          <p className="mb-7 text-[13px] leading-7 text-slate-600">{program.description}</p>
          <span className="mt-auto flex min-h-16 items-center justify-between gap-2 border-t border-slate-100 text-[11px] font-semibold">
            {program.label}
            <ArrowUpRight size={18} className="text-crimson" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function MembershipCards() {
  const { lang } = useLanguage();
  const tiersList = translations[lang].membershipTiers;

  return (
    <div className="grid gap-8 pt-3 lg:grid-cols-3 lg:gap-6">
      {tiersList.map((tier, i) => {
        const Icon = [Sparkles, BriefcaseBusiness, Globe2][i];
        const isFeatured = 'featuredBadge' in tier && Boolean(tier.featuredBadge);

        return (
          <article
            key={tier.id}
            className={`relative flex flex-col rounded-[8px] border p-7 ${
              isFeatured ? 'border-crimson bg-red-50/20' : 'border-slate-200 bg-white'
            }`}
          >
            {isFeatured && (
              <div className="absolute -top-3.5 -right-px -left-px rounded-t-[8px] bg-crimson py-1.5 text-center text-[9px] font-semibold tracking-widest text-white">
                {tier.featuredBadge}
              </div>
            )}
            <Icon
              size={29}
              strokeWidth={1.4}
              className={`mb-7 ${isFeatured ? 'text-crimson' : 'text-slate-600'}`}
              aria-hidden="true"
            />
            <span className="text-[9px] font-semibold tracking-widest text-slate-600">{tier.eyebrow}</span>
            <h3 className="mt-3 mb-4 text-[28px] font-semibold tracking-tight">{tier.name}</h3>
            <p className="mb-6 min-h-14 text-sm leading-7 text-slate-600">{tier.description}</p>
            <ul className="mb-7 space-y-4 border-t border-slate-200 pt-6">
              {tier.benefits.map((benefit) => (
                <li className="flex items-start gap-2 text-xs leading-6 text-slate-600" key={benefit}>
                  <Check className="mt-1 shrink-0 text-crimson" size={15} aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
            <ButtonLink
              className="mt-auto w-full text-xs"
              href={`/membership?tier=${tier.id}#apply`}
              variant={isFeatured ? 'red' : 'outline'}
            >
              {tier.btnText}
            </ButtonLink>
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
        <h1 className="max-w-4xl text-[clamp(2.8rem,5.7vw,4.8rem)] leading-[1.08] font-semibold tracking-[-.055em]">
          {title}
          {accent && (
            <>
              <br />
              <span className="text-crimson">{accent}</span>
            </>
          )}
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600">{description}</p>
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
          <p className="mb-3 text-[9px] font-semibold tracking-[.17em] text-red-100">
            {cta.tagline}
          </p>
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">
            {cta.title1} <span className="text-red-100">{cta.title2}</span>
          </h2>
        </div>
        <ButtonLink href="/membership#apply" variant="white">
          {cta.btn}
        </ButtonLink>
      </div>
    </section>
  );
}
