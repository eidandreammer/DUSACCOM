import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'INFOTEP Training & Skills',
  'Explore INFOTEP training opportunities through DUSACCOM, including practical skills, professional development, and language learning.',
  '/infotep',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
