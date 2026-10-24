'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Globe2, Target, TrendingUp, Truck, Megaphone, UsersRound } from 'lucide-react';
import { Eyebrow, ButtonLink } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

const trainingIcons = [TrendingUp, Truck, Megaphone, UsersRound];

export default function Home() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const copy = t.homeOverview;

  return (
    <>
      <section className="home-hero relative isolate flex w-full flex-col overflow-hidden bg-navy text-white" aria-labelledby="about-title">
        <Image
          src="/assets/new-york.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="-z-20 object-cover object-[60%_center]"
        />
        <div className="hero-shade absolute inset-0 -z-10" />
        <div className="container hero-layout">
          <div className="hero-copy">
            <Eyebrow light>{copy.aboutEyebrow}</Eyebrow>
            <h1 id="about-title" className="text-[clamp(2.8rem,6vw,6rem)] leading-[1.06] font-semibold tracking-[-.05em]">
              {copy.aboutTitle}
            </h1>
            <p className="home-about-statement mt-6 max-w-2xl text-rose-300">{copy.aboutStatement}</p>
            <p className="hero-description mt-6 max-w-2xl text-slate-200">{t.aboutPage.description}</p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-6 border-t border-white/20 pt-6">
            <span className="max-w-sm text-[11px] leading-6 tracking-[.12em] uppercase text-slate-300">{copy.aboutFootnote}</span>
            <Link href="#mission" className="text-link text-white hover:text-rose-300">
              {copy.discoverPurpose}
              <ArrowDown size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section id="mission" className="section scroll-mt-40" aria-labelledby="purpose-title">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-20">
            <div>
              <Eyebrow>{copy.purposeEyebrow}</Eyebrow>
              <h2 id="purpose-title" className="section-title">{copy.purposeTitle}</h2>
            </div>
            <p className="max-w-xl text-slate-600 lg:pt-10">{t.aboutPage.purposeDesc}</p>
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
            {[
              { Icon: Target, title: t.aboutPage.missionTitle, description: t.aboutPage.missionText },
              { Icon: Globe2, title: t.aboutPage.visionTitle, description: t.aboutPage.visionText },
            ].map(({ Icon, title, description }, index) => (
              <article key={title} className="border-t border-slate-200 pt-7">
                <div className="mb-6 flex items-center justify-between">
                  <Icon size={32} strokeWidth={1.3} className="text-crimson" aria-hidden="true" />
                  <span className="text-[11px] tracking-widest text-slate-500">0{index + 1}</span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-4 max-w-xl text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy text-white" aria-label={copy.getInvolved}>
        <div className="container grid md:grid-cols-2">
          <div className="py-12 md:pr-10 lg:pr-16">
            <Eyebrow light>{copy.membershipEyebrow}</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight">{copy.membershipTitle}</h2>
            <p className="mt-4 max-w-lg text-slate-300">{copy.membershipDescription}</p>
            <ButtonLink href="/membership" className="mt-6">{t.nav.becomeMember}</ButtonLink>
          </div>
          <div className="border-t border-white/20 py-12 md:border-t-0 md:border-l md:pl-10 lg:pl-16">
            <Eyebrow light>{copy.registrationEyebrow}</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight">{copy.registrationTitle}</h2>
            <p className="mt-4 max-w-lg text-slate-300">{copy.registrationDescription}</p>
            <ButtonLink href="/membership#apply" variant="white" className="mt-6">{copy.registrationButton}</ButtonLink>
          </div>
        </div>
      </section>

      <section className="section bg-mist" aria-labelledby="training-title">
        <div className="container">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end lg:gap-16">
            <div className="max-w-2xl">
              <Eyebrow>{copy.trainingEyebrow}</Eyebrow>
              <h2 id="training-title" className="section-title">{copy.trainingTitle}</h2>
              <p className="mt-5 text-slate-600">{copy.trainingDescription}</p>
            </div>
            <Link href="/infotep" className="text-link shrink-0 self-start lg:self-end">
              {copy.trainingButton}<ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 grid border-y border-slate-300 sm:grid-cols-2 lg:grid-cols-4">
            {copy.trainingAreas.map((area, index) => {
              const Icon = trainingIcons[index];
              return (
                <div key={area.title} className="home-training-area py-7 sm:px-6">
                  <Icon size={29} strokeWidth={1.4} className="mb-5 text-crimson" aria-hidden="true" />
                  <h3 className="text-xl font-semibold tracking-tight">{area.title}</h3>
                  <p className="home-training-description mt-3 text-slate-600">{area.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
