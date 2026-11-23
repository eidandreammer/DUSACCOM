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
