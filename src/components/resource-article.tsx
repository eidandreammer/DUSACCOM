'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageIntro, ClosingCTA } from '@/components/ui';
import { useLanguage } from '@/lib/language-context';
import { resourceCopy, resourceUi, type ResourceSlug } from '@/lib/resources-copy';

export function ResourceArticle({ slug }: { slug: ResourceSlug }) {
  const { lang } = useLanguage();
  const resource = resourceCopy[lang][slug];
  const ui = resourceUi[lang];
  return <>
    <PageIntro eyebrow={`${resource.category} · ${ui.chamberResource}`} title={resource.title} description={resource.description} />
    <article className="section"><div className="container max-w-3xl! editorial-content">
      <Link href="/contact#resources" className="text-link mb-5 no-underline!"><ArrowLeft size={18} aria-hidden="true" />{ui.backToAll}</Link>
      {resource.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></section>)}
      <p className="mt-8 border-t border-slate-200 pt-6 text-xs!">{ui.disclaimer}</p>
    </div></article>
    <ClosingCTA />
  </>;
}
