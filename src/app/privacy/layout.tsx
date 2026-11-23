import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Privacy Policy',
  'How the Dominican USA Chamber of Commerce of New Jersey handles inquiries, account information, cookies, and privacy choices.',
  '/privacy',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
