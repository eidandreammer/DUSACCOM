import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Terms of Use',
  'Read the terms for using the DUSACCOM website, including membership inquiries, community information, and business resources.',
  '/terms',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
