import type { Metadata } from 'next';

const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dusaccom.web.app');
if (origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password ||
    (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname)))) {
  throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTPS origin (HTTP is allowed for localhost).');
}

export const site = {
  name: 'DUSACCOM',
  fullName: 'Dominican USA Chamber of Commerce',
  email: 'dusaccom1@gmail.com',
  phone: '646-326-6052',
  phoneHref: '+16463266052',
  url: origin.origin,
  description: 'DUSACCOM connects Dominican and U.S. entrepreneurs through business networking, community events, language learning, and INFOTEP training.',
} as const;

export const socialImage = {
  url: '/assets/new-york.jpg',
  width: 1400,
  height: 933,
  alt: 'New York City skyline at golden hour — DUSACCOM',
} as const;

export function canonicalUrl(path = '/'): string {
  if (!path.startsWith('/') || path.startsWith('//') || /[?#]/.test(path)) {
    throw new Error('Canonical paths must be local paths without queries or fragments.');
  }
  const pathname = path === '/' ? '/' : path.replace(/\/+$/, '') + (process.env.FIREBASE_HOSTING === 'true' ? '/' : '');
  const canonical = new URL(pathname, site.url);
  if (canonical.origin !== site.url) throw new Error('Canonical URLs must use the site origin.');
  return canonical.href;
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const fullTitle = `${title} | ${site.name}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(path) },
    openGraph: {
      type: 'website', siteName: site.fullName, locale: 'en_US',
      title: fullTitle, description, url: canonicalUrl(path), images: [socialImage],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [socialImage] },
  };
}
