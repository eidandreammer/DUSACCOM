import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Free English and Spanish Courses with INFOTEP',
  'Free English and Spanish language learning through INFOTEP, offered with the support of the Dominican USA Chamber of Commerce of New Jersey.',
  '/infotep',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
