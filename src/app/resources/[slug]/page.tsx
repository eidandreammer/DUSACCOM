import { notFound } from 'next/navigation';
import { resources } from '@/lib/content';
import { pageMetadata } from '@/lib/site';
import { ResourceArticle } from '@/components/resource-article';
export function generateStaticParams() { return resources.map(resource => ({ slug: resource.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const resource = resources.find(item => item.slug === slug); if (!resource) return {}; return pageMetadata(resource.title, resource.description, `/resources/${slug}`); }
export default async function Resource({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = resources.find(item => item.slug === slug);
  if (!resource) notFound();
  return <ResourceArticle slug={resource.slug} />;
}
