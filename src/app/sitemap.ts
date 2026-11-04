import type { MetadataRoute } from 'next';
import { canonicalUrl } from '@/lib/site';
import { resources } from '@/lib/content';

// Generate from the route/content list at build time, including Firebase export.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/', '/about', '/programs', '/membership', '/infotep', '/contact', '/privacy', '/terms',
    ...resources.map(resource => `/resources/${resource.slug}`),
  ];
  // Add lastModified only when actual content modification dates are available.
  return paths.map(path => ({ url: canonicalUrl(path) }));
}
