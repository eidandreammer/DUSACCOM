'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageIntro, Eyebrow, MembershipCards, ClosingCTA } from '@/components/ui';
import { InquiryForm } from '@/components/inquiry-form';
import { tiers } from '@/lib/content';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

function MembershipSelection({ onChange }: { onChange: (value: string) => void }) {
  const value = useSearchParams().get('tier') || '';
  const selected = tiers.some(tier => tier.id === value) ? value : '';
  useEffect(() => onChange(selected), [selected, onChange]);
  return null;
}

function MembershipContent() {
  const { lang } = useLanguage();
  const m = translations[lang].membershipPage;
  const [selected, setSelected] = useState('');

  return (
    <>
      <Suspense fallback={null}><MembershipSelection onChange={setSelected} /></Suspense>
      <PageIntro
        eyebrow={m.eyebrow}
        title={m.title}
        accent={m.accent}
        description={m.description}
      />

      <section className="section">
        <div className="container">
          <Eyebrow>{m.tiersEyebrow}</Eyebrow>
          <h2 className="section-title mb-10">{m.tiersTitle}</h2>
          <MembershipCards />
          <p className="mt-7 text-center text-xs leading-7 text-slate-600">
            {m.tiersDisclaimer}
          </p>
        </div>
      </section>

      <section className="section bg-mist">
        <div className="container">
          <Eyebrow>{m.stepsEyebrow}</Eyebrow>
          <h2 className="section-title">{m.stepsTitle}</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {m.steps.map((step, index) => (
              <li key={step.title} className="border-t border-slate-300 pt-6">
                <span className="text-sm text-crimson">0{index + 1} /</span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-8 text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Target for both #apply and #carrito */}
      <span id="carrito" className="scroll-mt-28" />
      <section id="apply" className="section scroll-mt-24">
        <div className="container grid gap-10 lg:grid-cols-2 lg:gap-24">
          <div>
            <Eyebrow>{m.applyEyebrow}</Eyebrow>
            <h2 className="section-title">{m.applyTitle}</h2>
            <p className="mt-6 max-w-md text-sm leading-8 text-slate-600">
              {m.applyDesc}
            </p>
            <div className="mt-8 max-w-md rounded-[8px] border border-slate-200 bg-mist p-6">
              <h3 className="font-semibold">{m.applyBoxTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {m.applyBoxDesc}
              </p>
            </div>
          </div>
          <InquiryForm key={selected} kind="membership" initialInterest={selected} />
        </div>
      </section>

      <section className="section border-t border-slate-200">
        <div className="container max-w-4xl">
          <Eyebrow>{m.faqEyebrow}</Eyebrow>
          <h2 className="section-title mb-7">{m.faqTitle}</h2>
          {m.faqs.map((item) => (
            <details key={item.q} className="border-b border-slate-200 py-1">
              <summary className="cursor-pointer py-5 text-sm font-semibold">{item.q}</summary>
              <p className="pr-7 pb-5 text-sm leading-8 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}

export default function Membership() {
  return <MembershipContent />;
}
