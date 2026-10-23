import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { resources } from '@/lib/content';
export default function sitemap(): MetadataRoute.Sitemap { return ['', '/about', '/programs', '/membership', '/contact', '/privacy', '/terms', ...resources.map(item => `/resources/${item.slug}`)].map(path => ({ url: `${site.url}${path}`, changeFrequency: path.includes('/resources/') ? 'monthly' : 'weekly', priority: path === '' ? 1 : .7 })); }
