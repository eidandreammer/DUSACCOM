# DUSACCOM technical SEO files

These files are implemented in this repository. The landing-page skeleton below is an optional reference; the existing homepage design is preserved.

No code can guarantee a #1 ranking. [Google ranking guidance](https://developers.google.com/search/docs/fundamentals/do-i-need-seo).

## 1. Site configuration and root metadata

Keep the canonical origin in `.env.local` and the production build environment. Use your owned public origin; this project currently uses the Firebase origin. Existing Firebase SDK variables remain in place.

```dotenv
NEXT_PUBLIC_SITE_URL=https://dusaccom.web.app
# Optional override for Firebase builds; otherwise derived from firebase.json.
FIREBASE_SITE_URL=https://dusaccom.web.app
```

Restart/rebuild after changing public environment variables. Server builds use slashless page URLs; Firebase exports use trailing slashes. Canonicals and sitemap URLs use the same helper.

`src/lib/site.ts`

```ts
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
```

`src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PrivacyProvider } from '@/components/privacy-controls';
import { LanguageProvider } from '@/lib/language-context';
import { canonicalUrl, site, socialImage } from '@/lib/site';
import { BusinessJsonLd, dusaccomEntity } from '@/components/business-json-ld';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'DUSACCOM | Dominican USA Chamber of Commerce', template: '%s | DUSACCOM' },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: canonicalUrl() },
  openGraph: {
    type: 'website',
    siteName: site.fullName,
    locale: 'en_US',
    title: 'DUSACCOM | Dominican USA Chamber of Commerce',
    description: site.description,
    url: canonicalUrl(),
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DUSACCOM | Dominican USA Chamber of Commerce',
    description: site.description,
    images: [socialImage],
  },
  icons: { icon: '/assets/favicon.ico' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#032a63' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = process.env.FIREBASE_HOSTING === 'true' ? undefined : (await headers()).get('x-nonce') || undefined;

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <a href="#main" className="fixed -top-24 left-5 z-[100] rounded-[8px] bg-white px-5 py-3 shadow focus:top-3">
          Skip to main content
        </a>
        <LanguageProvider>
          <AuthProvider>
            <PrivacyProvider>
              <Header />
              <main id="main">{children}</main>
              <Footer />
            </PrivacyProvider>
          </AuthProvider>
        </LanguageProvider>
        <BusinessJsonLd business={dusaccomEntity} nonce={nonce} />
      </body>
    </html>
  );
}
```

Each client-rendered route has a small server `layout.tsx` to declare metadata. The same pattern applies to new routes. Resource pages already use `generateMetadata` with this helper.

`src/app/programs/layout.tsx`

```tsx
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Business Programs & Networking',
  'Explore DUSACCOM programs for business development, networking, Dominican–U.S. trade connections, and community engagement.',
  '/programs',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
```

`src/app/account/layout.tsx`

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = {
  ...pageMetadata('Member Account', 'Sign in to manage your DUSACCOM membership account and preferences.', '/account'),
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
```

## 2. Reusable entity JSON-LD

`BusinessJsonLd` accepts `Organization`, `LocalBusiness`, or `ProfessionalService`. DUSACCOM currently emits `Organization` and `WebSite`: a verified postal address is absent from the project. For either local-business type, supply the real address displayed on the website; TypeScript requires it. Add `sameAs` only for verified official profiles. [Google entity guidance](https://developers.google.com/search/docs/appearance/structured-data/organization), [local-business requirements](https://developers.google.com/search/docs/appearance/structured-data/local-business).

The existing server nonce and static-export CSP hashing are preserved. JSON-LD escapes `<` before insertion.

`src/components/business-json-ld.tsx`

```tsx
import { canonicalUrl, site } from '@/lib/site';

type PostalAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
};

type BusinessDetails = {
  name: string;
  alternateName?: string;
  url: string;
  description: string;
  email?: string;
  telephone?: string;
  logo: string;
  image?: string;
  sameAs?: readonly string[];
};

export type BusinessEntity = BusinessDetails & (
  | { type: 'Organization'; address?: PostalAddress }
  | { type: 'LocalBusiness' | 'ProfessionalService'; address: PostalAddress }
);

export const dusaccomEntity: BusinessEntity = {
  type: 'Organization',
  name: site.fullName,
  alternateName: site.name,
  url: canonicalUrl(),
  description: site.description,
  email: site.email,
  telephone: site.phoneHref,
  logo: new URL('/imgs/DUSACCOM complete logo.png', site.url).href,
  image: new URL('/assets/new-york.jpg', site.url).href,
};

export function BusinessJsonLd({ business, nonce }: { business: BusinessEntity; nonce?: string }) {
  const { type, address, ...details } = business;
  const entityId = new URL('#organization', business.url).href;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': type,
        '@id': entityId,
        ...details,
        ...(address ? { address: { '@type': 'PostalAddress', ...address } } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': new URL('#website', business.url).href,
        url: business.url,
        name: business.alternateName || business.name,
        alternateName: business.name,
        publisher: { '@id': entityId },
      },
    ],
  };

  return (
    <script
      id="business-json-ld"
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
```

## 3. Native sitemap and robots

No `next-sitemap` dependency or postbuild hook is needed. These functions generate `/sitemap.xml` and `/robots.txt` from the route list and resource content. `/infotep` is included; `/account` is omitted and marked `noindex`. Account pages stay crawlable so crawlers can read that directive. There are no fabricated modification dates.

This site's Firebase deployment is a static export: crawl files regenerate on every build/deployment. Runtime regeneration requires a server deployment. If moving sitemap content into a CMS on a server deployment, replace `export const dynamic = 'force-static'` with `export const revalidate = 3600`, and fetch the published content in the function. Do not use that runtime configuration for Firebase static export.

`src/app/sitemap.ts`

```ts
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
```

`src/app/robots.ts`

```ts
import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    // /account remains crawlable so its noindex metadata can be read.
    sitemap: `${site.url}/sitemap.xml`,
  };
}
```

```bash
# Run from the project root. No SEO package installation is needed.
mkdir -p src/app src/components
npm run typecheck
npm test

# Standalone server build; existing image script generates responsive WebP files.
NEXT_PUBLIC_SITE_URL=https://dusaccom.web.app npm run build
# next.config.ts uses output: 'standalone'. Copy its static assets before starting.
mkdir -p .next/standalone/public .next/standalone/.next/static
cp -R public/. .next/standalone/public/
cp -R .next/static/. .next/standalone/.next/static/
HOSTNAME=127.0.0.1 PORT=3001 node .next/standalone/server.js
```

```bash
# In a second terminal, inspect the generated endpoints and server-rendered tags.
curl -fsS http://127.0.0.1:3001/sitemap.xml
curl -fsS http://127.0.0.1:3001/robots.txt
curl -fsS http://127.0.0.1:3001/programs -o /tmp/dusaccom-programs.html
rg -o '<title>[^<]+|<link[^>]+rel="canonical"[^>]*|<meta[^>]+(og:|twitter:)[^>]*' /tmp/dusaccom-programs.html
```

```bash
# Build the current Firebase Hosting artifact instead of the server artifact.
# This generates out/ and validates the existing Firebase configuration.
FIREBASE_SITE_URL=https://dusaccom.web.app npm run build:firebase
cat out/robots.txt
cat out/sitemap.xml
```

After the chosen artifact is deployed, submit `https://dusaccom.web.app/sitemap.xml` in Google Search Console and inspect the homepage URL. Validate the public URL with Google's [Rich Results Test](https://search.google.com/test/rich-results) and the [Schema Markup Validator](https://validator.schema.org/).

## 4. Semantic landing-page skeleton

Optional `src/app/page.tsx` replacement for a new landing page. Root `layout.tsx` already supplies the site `<header>`, `<nav>`, one `<main id="main">`, and `<footer>`. This page renders inside that `<main>`; do not add a nested main. The existing homepage already uses one H1 followed by H2 sections and H3 subsection headings.

```tsx
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <header className="relative isolate flex min-h-[42rem] items-center bg-navy text-white">
        <Image
          src="/assets/hero-slide-one.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="-z-10 object-cover"
        />
        <div className="container py-32">
          <h1 className="max-w-3xl text-5xl font-bold">
            DUSACCOM — Dominican USA Chamber of Commerce
          </h1>
          <p className="mt-6 max-w-2xl text-lg">
            Business networking, community connections, and learning opportunities
            for Dominican and U.S. entrepreneurs.
          </p>
          <nav aria-label="Explore DUSACCOM" className="mt-8 flex flex-wrap gap-6">
            <Link href="/membership">Explore membership</Link>
            <a href="#programs">Explore our programs</a>
          </nav>
        </div>
      </header>

      <section id="programs" aria-labelledby="programs-title" className="container py-20">
        <h2 id="programs-title" className="text-3xl">Business programs and networking</h2>
        <p className="mt-6">Connect with entrepreneurs and explore opportunities across markets.</p>
        <Link href="/programs" className="mt-6 inline-flex">View business programs</Link>
      </section>

      <article aria-labelledby="training-title" className="container py-20">
        <header>
          <h2 id="training-title" className="text-3xl">INFOTEP training opportunities</h2>
        </header>
        <p className="mt-6">Explore practical skills, professional development, and language learning.</p>
        <Link href="/infotep" className="mt-6 inline-flex">Explore INFOTEP training</Link>
      </article>

      <section aria-labelledby="contact-title" className="container py-20">
        <h2 id="contact-title" className="text-3xl">Connect with DUSACCOM</h2>
        <p className="mt-6">Ask our team about membership, programs, and community events.</p>
        <Link href="/contact" className="mt-6 inline-flex">Contact the Chamber</Link>
      </section>
    </>
  );
}
```

## 5. Hero LCP image

The first slide is preloaded with the requested `priority` flag. Next.js 16 deprecates `priority` in favor of `preload`; for a migration, replace `priority={index === 0}` with `preload={index === 0}`. Do not combine `preload` with `loading` or `fetchPriority` on the first image.

`fill` uses the existing positioned, full-height hero container; `sizes="100vw"` matches the actual full-width photograph. The hero's CSS reserves height before the image loads, and the image is absolutely positioned. Empty alt text is intentional for the decorative background; all brand and service content is real text.

Only the first slide mounts initially. Further slides mount when selected, preserving the carousel without six competing image requests at initial load.

`src/components/hero-carousel.tsx`

```tsx
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import images from '@/lib/hero-images.json';
import styles from '@/app/home.module.css';

export function HeroCarousel({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState([0]);
  const [pending, setPending] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const advance = useCallback(() => {
    if (pending !== null) return;
    const next = (active + 1) % images.length;
    if (visited.includes(next)) {
      setPending(null);
      setActive(next);
    } else {
      // Keep the current slide visible until the next photograph has loaded.
      setPending(next);
      setVisited(previous => [...previous, next]);
    }
  }, [active, pending, visited]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      if (!document.hidden) advance();
    }, 25000);
    return () => clearInterval(timer);
  }, [advance, reducedMotion]);

  function onHeroClick(event: MouseEvent<HTMLElement>) {
    // Keep navigation, controls, and text selection independent of the photos.
    if ((event.target as HTMLElement).closest('a, button, input, select, textarea, [role="button"]') || window.getSelection()?.toString()) return;
    advance();
  }

  return <section className={`home-hero ${styles.hero}`} data-active-image={images[active].file} aria-labelledby="about-title" onClick={onHeroClick}>
    <div className={styles.heroSlides} aria-hidden="true">
      {images.map(({ name }, index) => visited.includes(index) && <Image key={name} src={`/assets/hero-${name}.jpg`} alt="" fill sizes="100vw" priority={index === 0}
        loading={index === 0 ? undefined : 'eager'} onLoad={() => {
          if (pending === index) { setActive(index); setPending(null); }
        }} onError={() => {
          if (pending === index) {
            setPending(null);
            setVisited(previous => previous.filter(slide => slide !== index));
          }
        }} className={`${styles.heroImage} ${index === active ? styles.heroImageActive : ''}`} />)}
    </div>
    {children}
  </section>;
}
```

Existing layout rules in `src/app/home.module.css`:

```css
.home .hero {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}
.home .heroSlides {
  position: absolute;
  inset: 0;
  z-index: -2;
  overflow: hidden;
}
.home .heroImage { object-fit: cover; object-position: 65% center; }
```

The existing custom loader serves generated WebP files on Firebase and server deployments. `images.formats` would not convert files when this custom loader is active; the build script performs conversion with Sharp.

`src/lib/image-loader.ts`

```ts
'use client';
import type { ImageLoaderProps } from 'next/image';
import heroImages from './hero-images.json';
const optimized = new Set(['new-york', 'networking', ...heroImages.map(({ name }) => `hero-${name}`)]);
export default function imageLoader({ src, width }: ImageLoaderProps): string {
  const match = /^\/assets\/([a-z-]+)\.jpg$/.exec(src);
  if (!match || !optimized.has(match[1])) return src;
  const sizes = [96, 160, 256, 384, 480, 768, 1200, 1600];
  const selected = sizes.find(size => size >= width) || 1600;
  return `/assets/${match[1]}-${selected}.webp`;
}
```

## Verification

```bash
npm run typecheck
npm test
npm run build
# Or use npm run build:firebase for the active static Hosting target.
```

Check the deployed site in PageSpeed Insights for field LCP/CLS/INP when data is available. Source checks and a successful build do not establish measured Core Web Vitals scores. The EN/ES switch currently shares one URL and English server metadata; dedicated crawlable locale URLs and hreflang require a separate localization change.
