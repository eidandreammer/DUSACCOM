import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Privacy Policy',
  'Read how DUSACCOM handles inquiries, account information, cookies, and privacy choices on the Dominican USA Chamber of Commerce website.',
  '/privacy',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
