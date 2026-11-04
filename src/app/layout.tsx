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
  title: { default: 'DUSACCOM | Two Nations. One Business Community.', template: '%s | DUSACCOM' },
  description: site.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.fullName,
    locale: 'en_US',
    title: 'DUSACCOM — Two nations. One business community.',
    description: site.description,
    url: '/',
    images: [{ url: '/assets/new-york.jpg', width: 1400, height: 933, alt: 'New York City skyline at golden hour' }],
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
  };

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
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}
        />
      </body>
    </html>
  );
}
