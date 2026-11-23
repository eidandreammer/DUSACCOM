import { SkipLink } from '@/components/skip-link';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PrivacyProvider } from '@/components/privacy-controls';
import { LanguageProvider } from '@/lib/language-context';
import { site } from '@/lib/site';
import { fontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'DUSACCOM | Dominican Roots. A Business Community Open to All.', template: '%s | DUSACCOM' },
  description: site.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.fullName,
    locale: 'en_US',
    title: 'DUSACCOM — Dominican roots. A business community open to all.',
    description: site.description,
    url: '/',
    images: [{ url: '/assets/dusaccom-og.jpg', width: 1200, height: 630, alt: 'Dominican USA Chamber of Commerce of New Jersey' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/assets/favicon.ico' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#032a63' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = process.env.FIREBASE_HOSTING === 'true' ? undefined : (await headers()).get('x-nonce') || undefined;
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.fullName,
    alternateName: site.name,
    url: site.url,
    email: site.email,
    telephone: site.phoneHref,
    description: site.description,
    logo: `${site.url}/assets/dominican-usa-chamber-of-commerce-nj-logo.svg`,
    image: `${site.url}/assets/dusaccom-og.jpg`,
    areaServed: { '@type': 'State', name: 'New Jersey' },
    address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressRegion: site.address.region, postalCode: site.address.postalCode, addressCountry: site.address.country },
    location: {
      '@type': 'Place',
      name: site.fullName,
      address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressRegion: site.address.region, postalCode: site.address.postalCode, addressCountry: site.address.country },
      geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
      hasMap: site.directionsUrl,
    },
    knowsLanguage: ['en', 'es', 'pt'],
    nonprofitStatus: 'Nonprofit',
  };

  return (
    // Browser extensions (e.g. crxemulator) inject attributes on <html> before hydration.
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <SkipLink />
          <AuthProvider>
            <PrivacyProvider>
              <Header />
              <main id="main">{children}</main>
              <Footer />
            </PrivacyProvider>
          </AuthProvider>
        </LanguageProvider>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}
        />
      </body>
    </html>
  );
}
