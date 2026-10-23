import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { resources } from '@/lib/content';
import { pageMetadata } from '@/lib/site';
import { PageIntro, ClosingCTA } from '@/components/ui';
export function generateStaticParams() { return resources.map(resource => ({ slug: resource.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const resource = resources.find(item => item.slug === slug); if (!resource) return {}; return pageMetadata(resource.title, resource.description, `/resources/${slug}`); }
export default async function Resource({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = resources.find(item => item.slug === slug);
  if (!resource) notFound();
  return <><PageIntro eyebrow={`${resource.category} · CHAMBER RESOURCE`} title={resource.title} description={resource.description} /><article className="section"><div className="container max-w-3xl! editorial-content"><Link href="/contact#resources" className="text-link mb-5 no-underline!"><ArrowLeft size={18} aria-hidden="true" />All business resources</Link>{resource.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></section>)}<p className="mt-8 border-t border-slate-200 pt-6 text-xs!">This resource provides general business information. For guidance specific to your circumstances, seek appropriate professional support.</p></div></article><ClosingCTA /></>;
}
