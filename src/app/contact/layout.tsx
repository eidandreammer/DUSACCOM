import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Contact the Chamber',
  'Contact the Dominican USA Chamber of Commerce of New Jersey in Englewood about membership, events, partnerships, and community programs. Call, email, or visit us.',
  '/contact',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
