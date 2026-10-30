'use client';
import Link from 'next/link';
import { Mail, Phone, ArrowUpRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { PageIntro, Eyebrow, ClosingCTA } from '@/components/ui';
import { InquiryForm } from '@/components/inquiry-form';
import { site } from '@/lib/site';
import { resources } from '@/lib/content';
import { useLanguage } from '@/lib/language-context';
import { translations } from '@/lib/translations';

export default function Contact() {
  const { lang } = useLanguage();
  const c = translations[lang].contactPage;

  return (
    <>
      <PageIntro
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
      />

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <Eyebrow>{c.startEyebrow}</Eyebrow>
            <h2 className="section-title">{c.startTitle}</h2>
            <p className="mt-6 mb-6 max-w-md text-sm leading-8 text-slate-600">
              {c.startDesc}
            </p>

            {[
              { Icon: Mail, label: c.writeUs, text: site.email, href: `mailto:${site.email}` },
              { Icon: Phone, label: c.callUs, text: site.phone, href: `tel:${site.phoneHref}` },
            ].map(({ Icon, label, text, href }) => (
              <a key={label} href={href} className="group flex items-center gap-4 border-b border-slate-200 py-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[8px] bg-mist text-crimson">
                  <Icon size={23} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col gap-2">
                  <span className="text-xs tracking-widest text-slate-600">{label}</span>
                  <span className="text-sm font-medium group-hover:text-crimson md:text-base">{text}</span>
                </span>
                <ArrowUpRight size={17} className="shrink-0 text-slate-500" aria-hidden="true" />
              </a>
            ))}

            <div className="mt-8 flex items-start gap-3 text-xs leading-6 text-slate-600">
              <ShieldCheck size={23} className="mt-1 shrink-0" strokeWidth={1.3} aria-hidden="true" />
              <p>{c.privacyNote}</p>
            </div>
          </div>

          <InquiryForm />
        </div>
      </section>

      <section id="resources" className="section scroll-mt-24 bg-mist">
        <div className="container">
          <Eyebrow>{c.resourcesEyebrow}</Eyebrow>
          <h2 className="section-title mb-9">{c.resourcesTitle}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {resources.map((resource) => (
              <article
                key={resource.slug}
                className="flex flex-col rounded-[8px] border border-slate-200 border-t-2 border-t-crimson bg-white p-7"
              >
                <span className="text-xs tracking-widest text-slate-600 uppercase">{resource.category}</span>
                <h3 className="mt-6 mb-4 text-2xl leading-8 font-semibold tracking-tight">{resource.title}</h3>
                <p className="mb-6 text-sm leading-7 text-slate-600">{resource.description}</p>
                <Link href={`/resources/${resource.slug}`} className="text-link mt-auto">
                  <span>{c.readInsight}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ClosingCTA />
    </>
  );
}
