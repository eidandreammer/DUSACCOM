'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { PageIntro, Eyebrow, ProgramIcon, ButtonLink, ClosingCTA } from '@/components/ui';
import { ProgramList } from '@/components/program-list';
import { InquiryForm } from '@/components/inquiry-form';
import { initiatives, type Program } from '@/lib/content';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

function ProgramsContent() {
  const { lang } = useLanguage();
  const p = translations[lang].programsPage;
  const list = translations[lang].programsList;
  const searchParams = useSearchParams();
  const initiativeParam = searchParams.get('initiative') || '';
  const selected = initiatives.some((item) => item.id === initiativeParam) ? initiativeParam : '';

  const featuresMap: Record<string, { en: string[]; es: string[] }> = {
    'business-development': {
      en: ['Business planning and growth conversations', 'Introductions to relevant resources', 'Learning opportunities for entrepreneurs'],
      es: ['Conversaciones de planificación y crecimiento empresarial', 'Presentaciones a recursos relevantes', 'Oportunidades de aprendizaje para emprendedores'],
    },
    'networking': {
      en: ['Business-to-business introductions', 'Community networking opportunities', 'Conversations with fellow business owners'],
      es: ['Presentaciones de negocio a negocio', 'Oportunidades de networking comunitario', 'Diálogo con otros propietarios de negocios'],
    },
    'trade': {
      en: ['Cross-border business conversations', 'Dominican–American business connections', 'Resources for exploring new markets'],
      es: ['Conversaciones comerciales transfronterizas', 'Conexiones de negocios dominico-estadounidenses', 'Recursos para explorar nuevos mercados'],
    },
    'community': {
      en: ['Local business community initiatives', 'Entrepreneur engagement', 'Collaborations for shared growth'],
      es: ['Iniciativas comunitarias de negocios locales', 'Participación de emprendedores', 'Colaboraciones para el crecimiento compartido'],
    },
  };

  const iconTypes: Program['icon'][] = ['growth', 'users', 'globe', 'heart'];

  return (
    <>
      <PageIntro
        eyebrow={p.eyebrow}
        title={p.title}
        accent={p.accent}
        description={p.description}
      />

      <section className="section">
        <div className="container">
          <Eyebrow>{p.supportEyebrow}</Eyebrow>
          <h2 className="section-title">{p.supportTitle}</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {list.map((program, index) => {
              const features = featuresMap[program.id]?.[lang] || [];
              return (
                <article
                  id={program.id}
                  key={program.id}
                  className="scroll-mt-28 rounded-[8px] border border-slate-200 p-7 lg:p-9"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-[8px] bg-red-50 text-crimson">
                      <ProgramIcon type={iconTypes[index] || 'growth'} />
                    </span>
                    <span className="text-xs text-slate-500">{program.number} /</span>
                  </div>
                  <span className="text-xs font-semibold tracking-widest text-slate-600 uppercase">
                    {program.label}
                  </span>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">{program.title}</h3>
                  <p className="mt-5 text-sm leading-8 text-slate-600">{program.description}</p>
                  <ul className="mt-6 space-y-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                        <Check className="mt-1 shrink-0 text-crimson" size={16} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href="/contact" variant="outline" className="mt-8 text-xs">
                    {p.exploreBtn}
                  </ButtonLink>
                </article>
              );
            })}
          </div>
          <p className="mt-6 text-xs leading-6 text-slate-600">{p.disclaimer}</p>
        </div>
      </section>

      <section id="initiatives" className="section scroll-mt-24 bg-mist">
        <div className="container">
          <Eyebrow>{p.initiativesEyebrow}</Eyebrow>
          <h2 className="section-title mb-8">{p.initiativesTitle}</h2>
          <ProgramList />
        </div>
      </section>

      <section id="interest" className="section scroll-mt-24">
        <div className="container grid gap-10 lg:grid-cols-2 lg:gap-24">
          <div>
            <Eyebrow>{p.interestEyebrow}</Eyebrow>
            <h2 className="section-title">{p.interestTitle}</h2>
            <p className="mt-6 max-w-md text-sm leading-8 text-slate-600">
              {p.interestDesc}
            </p>
            <div className="mt-8 border-l-2 border-crimson pl-5 text-sm leading-8 text-slate-600">
              {p.interestNote}
            </div>
          </div>
          <InquiryForm key={selected} kind="event" initialInterest={selected} />
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}

export default function Programs() {
  return (
    <Suspense fallback={<div className="container py-20 text-center">Loading…</div>}>
      <ProgramsContent />
    </Suspense>
  );
}
