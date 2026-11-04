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
