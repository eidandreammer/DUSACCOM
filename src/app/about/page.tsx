'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Globe2, UsersRound, ArrowRight, HeartHandshake, ShieldCheck } from 'lucide-react';
import { PageIntro, Eyebrow, ClosingCTA, ButtonLink } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export default function About() {
  const { lang } = useLanguage();
  const a = translations[lang].aboutPage;

  return (
    <>
      <PageIntro
        eyebrow={a.eyebrow}
        title={a.title}
        accent={a.accent}
        description={a.description}
      />

      <section id="mission" className="section scroll-mt-28">
        <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow>{a.purposeEyebrow}</Eyebrow>
            <h2 className="section-title">
              {a.purposeTitle}
            </h2>
            <p className="mt-6 text-sm leading-8 text-slate-600">
              {a.purposeDesc}
            </p>
            <div className="mt-9 space-y-7">
              {[
                {
                  Icon: Globe2,
                  title: a.missionTitle,
                  text: a.missionText,
                },
                {
                  Icon: UsersRound,
                  title: a.visionTitle,
                  text: a.visionText,
                },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-red-50 text-crimson">
                    <Icon size={25} strokeWidth={1.4} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                    <p className="text-sm leading-7 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-96 rounded-[8px] bg-mist lg:h-[550px]">
            <Image
              src="/assets/networking.jpg"
              alt="Community members sharing ideas and perspectives"
              fill
              sizes="(max-width:1023px) 100vw, 50vw"
              className="rounded-[8px] object-cover"
            />
            <div className="absolute right-5 bottom-5 left-5 rounded-[8px] bg-white/95 p-6 backdrop-blur">
              <p className="text-xs font-semibold tracking-widest text-slate-600">
                {a.tagTwoCultures}
              </p>
              <p className="mt-3 text-2xl leading-8 font-medium tracking-tight">
                {a.titlePeopleFirst}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container">
          <Eyebrow>{a.bridgeEyebrow}</Eyebrow>
          <h2 className="section-title max-w-3xl">
            {a.bridgeTitle}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {a.cards.map(({ title, text }, idx) => {
              const Icons = [Globe2, HeartHandshake, ShieldCheck];
              const Icon = Icons[idx] || Globe2;
              return (
                <article key={title} className="rounded-[8px] border border-slate-200 bg-white p-7">
                  <Icon className="mb-6 text-crimson" size={29} strokeWidth={1.4} aria-hidden="true" />
                  <h3 className="mb-4 text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{text}</p>
                </article>
              );
            })}
          </div>
          <Link href="/contact" className="text-link mt-7">
            <span>{a.explorePartnership}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <Eyebrow>{a.leadershipEyebrow}</Eyebrow>
            <h2 className="section-title">
              {a.leadershipTitle}
            </h2>
            <p className="mt-6 max-w-md text-sm leading-8 text-slate-600">
              {a.leadershipDesc}
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-[8px] border border-slate-200 bg-mist p-8 lg:p-10">
            <span className="mb-5 text-xs font-semibold tracking-widest text-slate-600">
              {a.leadershipCalloutTag}
            </span>
            <h3 className="mb-4 text-2xl font-semibold tracking-tight">
              {a.leadershipCalloutTitle}
            </h3>
            <p className="mb-7 text-sm leading-8 text-slate-600">
              {a.leadershipCalloutDesc}
            </p>
            <ButtonLink href="/contact" variant="outline" className="w-fit">
              <span>{a.leadershipCalloutBtn}</span>
            </ButtonLink>
          </div>
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}
