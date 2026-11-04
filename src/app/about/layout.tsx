import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'About the Chamber',
  'Meet DUSACCOM, the Dominican USA Chamber of Commerce, and learn about our mission to connect businesses and strengthen our community.',
  '/about',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
