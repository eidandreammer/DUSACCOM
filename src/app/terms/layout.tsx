import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Terms of Use',
  'Terms for using the Dominican USA Chamber of Commerce of New Jersey website, including membership inquiries, community information, and business resources.',
  '/terms',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
