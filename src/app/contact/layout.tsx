import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata(
  'Contact the Chamber',
  'Contact DUSACCOM about membership, business networking, community events, or training opportunities. Reach our team by phone, email, or inquiry form.',
  '/contact',
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
