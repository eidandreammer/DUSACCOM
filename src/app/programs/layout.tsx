import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Business Programs & Networking',
  'Networking, workshops, and cross-border business programs from the Dominican USA Chamber of Commerce of New Jersey for Latino and multicultural entrepreneurs.',
  '/programs',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
