'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Globe2, TrendingUp, UsersRound, MoveRight, Sparkles } from 'lucide-react';
import { Eyebrow, ButtonLink, ProgramGrid, SectionHeading, MembershipCards, ClosingCTA } from '@/components/ui';
import { InitiativeCard } from '@/components/program-list';
import { initiatives, memberMilestones, testimonials, partners } from '@/lib/content';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export default function Home() {
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      {/* Hero Section */}
      <section className="overflow-hidden bg-mist">
        <div className="container grid items-center gap-12 pt-12 pb-18 lg:grid-cols-[1.07fr_1fr] lg:gap-14 lg:pt-16 lg:pb-21">
          <div>
            <Eyebrow>{t.home.eyebrow1}</Eyebrow>
            <h1 className="max-w-2xl text-[clamp(2.75rem,4.65vw,4.7rem)] leading-[1.075] font-semibold tracking-[-.055em]">
              {t.home.heroTitle1}
              <br />
              {t.home.heroTitle2}
              <br />
              <span className="text-crimson">{t.home.heroTitle3}</span>
            </h1>
            <p className="mt-7 max-w-md text-sm leading-8 text-slate-600 md:text-base">
              {t.home.heroDesc}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/membership#apply">{t.home.joinBtn}</ButtonLink>
              <ButtonLink href="/programs" variant="outline">
                {t.home.exploreBtn}
              </ButtonLink>
            </div>
            <div className="mt-8 flex items-center gap-2 text-[10px] leading-5 text-slate-600">
              <span className="flag flag-dr" role="img" aria-label="Dominican Republic flag" />
              <span className="flag flag-us" role="img" aria-label="United States flag" />
              <span className="ml-1">{t.home.twoCultures}</span>
            </div>
          </div>

          <div className="hero-photo relative isolate mx-2 mb-5 h-[370px] rounded-[8px] sm:h-[440px] lg:mx-0 lg:mb-0 lg:h-[510px]">
            <Image
              src="/assets/new-york.jpg"
              alt="Golden sunlight between the buildings of the Midtown Manhattan skyline"
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              priority
              className="rounded-[8px] object-cover object-[57%_center]"
            />
            <div className="absolute inset-0 rounded-[8px] bg-gradient-to-t from-navy/80 via-navy/5 to-transparent" />
            <span className="absolute top-6 left-6 flex items-center gap-2 rounded-[8px] bg-navy/75 px-3 py-2 text-[8px] font-semibold tracking-widest text-white">
              <span className="size-1.5 rounded-full bg-white" />
              {t.home.localRoots}
            </span>
            <div className="absolute right-7 bottom-20 left-8 flex items-end justify-between text-white">
              <p className="text-[28px] leading-9 tracking-tight">
                {t.home.buildingBridges}
                <br />
                <strong className="font-semibold">{t.home.creatingOpportunity}</strong>
              </p>
              <ArrowUpRight size={34} strokeWidth={1.2} aria-hidden="true" />
            </div>
            <div className="absolute -bottom-6 -left-3 flex items-center gap-3 rounded-[8px] bg-white p-4 pr-6 shadow-lg shadow-navy/5 md:-left-5">
              <span className="flex size-11 items-center justify-center rounded-full bg-red-50 text-crimson">
                <Globe2 size={27} strokeWidth={1.3} aria-hidden="true" />
              </span>
              <p className="text-[11px] leading-5">
                {t.home.fromDrToUs}
              </p>
            </div>
            <div className="absolute right-0 -bottom-12 flex items-center gap-2 text-[8px] tracking-wider text-slate-600">
              DOMINICAN REPUBLIC
              <MoveRight size={15} className="text-crimson" aria-hidden="true" />
              UNITED STATES
            </div>
          </div>
        </div>
      </section>

      {/* Commitments Section */}
      <section aria-label="Our commitments" className="border-b border-slate-200">
        <div className="container grid grid-cols-2 items-center gap-7 py-8 lg:grid-cols-[1fr_1.1fr_1fr_1.2fr]">
          <p className="text-sm leading-6 text-slate-600 lg:border-r lg:border-slate-200">
            {t.home.commitments.title1}
            <br />
            <strong className="font-semibold text-navy">{t.home.commitments.title2}</strong>
          </p>
          {[
            { Icon: Globe2, text: t.home.commitments.crossBorder, strong: t.home.commitments.crossBorderBold },
            { Icon: TrendingUp, text: t.home.commitments.bizFirst, strong: t.home.commitments.bizFirstBold },
            { Icon: UsersRound, text: t.home.commitments.commPowered, strong: t.home.commitments.commPoweredBold },
          ].map(({ Icon, text, strong }) => (
            <div key={text} className="flex items-center gap-4 lg:justify-center">
              <Icon size={29} strokeWidth={1.2} className="shrink-0 text-slate-600" aria-hidden="true" />
              <p className="text-xs leading-6 text-slate-600">
                {text}
                <br />
                <strong className="font-semibold text-navy">{strong}</strong>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Power of Connection */}
      <section className="section">
        <div className="container grid gap-7 lg:grid-cols-2 lg:gap-24">
          <div>
            <Eyebrow>{t.home.powerConnection.eyebrow}</Eyebrow>
            <h2 className="section-title">
              {t.home.powerConnection.title1}
              <br />
              <span className="text-slate-500">{t.home.powerConnection.title2}</span>
            </h2>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">{t.home.powerConnection.subheading}</h3>
            <p className="text-sm leading-8 text-slate-600">{t.home.powerConnection.desc}</p>
            <Link href="/about" className="text-link mt-4">
              <span>{t.home.powerConnection.link}</span>
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Programs Grid Section */}
      <section className="section bg-mist">
        <div className="container">
          <SectionHeading eyebrow={t.home.programsSec.eyebrow} title={t.home.programsSec.title}>
            <Link href="/contact" className="text-link shrink-0">
              <span>{t.home.programsSec.link}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </SectionHeading>
          <ProgramGrid />
        </div>
      </section>

      {/* Community Callout */}
      <section className="bg-navy py-14 text-white lg:py-18">
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="relative h-80 overflow-hidden rounded-[8px] sm:h-96">
            <Image
              src="/assets/networking.jpg"
              alt="Professionals exchanging ideas at a community gathering"
              fill
              sizes="(max-width:1023px) 100vw, 50vw"
              className="rounded-[8px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 to-transparent" />
            <span className="absolute bottom-6 left-6 text-[9px] tracking-widest">
              {t.home.communitySec.tagline}
            </span>
          </div>
          <div>
            <Eyebrow light>{t.home.communitySec.eyebrow}</Eyebrow>
            <h2 className="section-title text-white">
              {t.home.communitySec.title1}
              <br />
              {t.home.communitySec.title2}
            </h2>
            <p className="mt-6 max-w-md text-sm leading-8 text-slate-300">
              {t.home.communitySec.desc}
            </p>
            <ButtonLink className="mt-7" href="/programs#initiatives" variant="white">
              {t.home.communitySec.btn}
            </ButtonLink>
            <p className="mt-8 flex items-center gap-3 text-[9px] tracking-widest text-slate-300">
              <span className="h-px w-7 bg-slate-500" />
              {t.home.communitySec.footerTag}
            </p>
          </div>
        </div>
      </section>

      {/* Membership Tiers Section */}
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.home.membershipSec.eyebrow} title={t.home.membershipSec.title}>
            <span className="border-l-2 border-slate-200 pl-4 text-xs leading-6 text-slate-600">
              {t.home.membershipSec.side1}
              <br />
              <strong className="font-medium text-navy">{t.home.membershipSec.side2}</strong>
            </span>
          </SectionHeading>
          <p className="mb-9 text-sm text-slate-600">{t.home.membershipSec.desc}</p>
          <MembershipCards />
          <p className="mt-6 text-center text-xs leading-6 text-slate-600">
            {t.home.membershipSec.disclaimer}
          </p>
        </div>
      </section>

      {/* Events / Initiatives Section */}
      <section className="section bg-mist">
        <div className="container">
          <SectionHeading eyebrow={t.home.eventsSec.eyebrow} title={t.home.eventsSec.title}>
            <Link href="/programs#initiatives" className="text-link">
              <span>{t.home.eventsSec.link}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </SectionHeading>
          <p className="mb-7 flex items-start gap-2 text-xs leading-6 text-slate-600">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-crimson" />
            {t.home.eventsSec.notice}
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {initiatives.map((initiative) => (
              <InitiativeCard key={initiative.id} initiative={initiative} />
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={t.home.milestonesSec.eyebrow} title={t.home.milestonesSec.title} />
          {memberMilestones.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {memberMilestones.map((milestone) => (
                <article key={milestone.title} className="rounded-[8px] border border-slate-200 p-7">
                  <span className="text-xs text-crimson">{milestone.business}</span>
                  <h3 className="mt-4 text-xl font-semibold">{milestone.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{milestone.summary}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-7 rounded-[8px] border border-slate-200 bg-mist p-8 md:grid-cols-[auto_1fr_auto] md:items-center lg:p-10">
              <div className="flex size-14 items-center justify-center rounded-full bg-white text-crimson">
                <Sparkles size={28} strokeWidth={1.3} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight">{t.home.milestonesSec.cardTitle}</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{t.home.milestonesSec.cardDesc}</p>
              </div>
              <ButtonLink href="/contact" variant="outline">
                {t.home.milestonesSec.cardBtn}
              </ButtonLink>
            </div>
          )}
          {testimonials.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {testimonials.map((quote) => (
                <figure key={quote.name} className="border-l-2 border-crimson p-6">
                  <blockquote className="text-xl leading-9">“{quote.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    {quote.name} · {quote.role}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {partners.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-10">
              {partners.map((partner) => (
                <a key={partner.name} href={partner.url} rel="noopener noreferrer">
                  <Image src={partner.logo} alt={partner.name} width={150} height={60} />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}
