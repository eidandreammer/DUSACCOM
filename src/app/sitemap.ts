import type { MetadataRoute } from 'next';
import { canonicalUrl } from '@/lib/site';
import { publicPagePaths } from '@/lib/navigation';

// Generate from the route/content list at build time, including Firebase export.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // Add lastModified only when actual content modification dates are available.
  return publicPagePaths.map(path => ({ url: canonicalUrl(path) }));
}
