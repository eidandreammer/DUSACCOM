import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Chamber Membership',
  'Explore DUSACCOM membership options for startups, small businesses, corporations, and nonprofits. Connect with our Dominican–U.S. business community.',
  '/membership',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
