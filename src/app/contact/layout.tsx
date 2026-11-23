import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('Contact', 'Contact the Dominican USA Chamber of Commerce of New Jersey about membership, events, partnerships, and community programs.', '/contact/');

export default function Layout({ children }: { children: ReactNode }) { return children; }
