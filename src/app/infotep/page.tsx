'use client';
import { Award, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import { PageIntro, Eyebrow, ClosingCTA, ButtonLink } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export default function InfotepPage() {
  const { lang } = useLanguage();
  const info = translations[lang].infotepPage;

  return (
    <>
      <PageIntro
        eyebrow={info.eyebrow}
        title={info.title}
        accent={info.accent}
        description={info.description}
      />

      <section className="section">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <div>
              <Eyebrow>{info.purposeEyebrow}</Eyebrow>
              <h2 className="section-title">{info.purposeTitle}</h2>
              <p className="mt-6 text-sm leading-8 text-slate-600">{info.purposeDesc}</p>

              <div className="mt-8 space-y-4">
                {info.bullets.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 size-5 shrink-0 text-crimson" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <ButtonLink href="/contact">
                  <span>{info.btnInfo}</span>
                </ButtonLink>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[8px] border border-slate-200 bg-mist p-7">
                <GraduationCap className="size-10 text-crimson mb-4" />
                <h3 className="text-xl font-semibold">{info.cards[0]?.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{info.cards[0]?.desc}</p>
              </div>

              <div className="rounded-[8px] border border-slate-200 bg-mist p-7">
                <BookOpen className="size-10 text-crimson mb-4" />
                <h3 className="text-xl font-semibold">{info.cards[1]?.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{info.cards[1]?.desc}</p>
              </div>

              <div className="rounded-[8px] border border-slate-200 bg-mist p-7 sm:col-span-2">
                <Award className="size-10 text-crimson mb-4" />
                <h3 className="text-xl font-semibold">{info.cards[2]?.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{info.cards[2]?.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}
