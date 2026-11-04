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
