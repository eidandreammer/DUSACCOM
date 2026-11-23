import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('Terms of Use', 'Terms of use for the Dominican USA Chamber of Commerce of New Jersey website.', '/terms/');

export default function Layout({ children }: { children: ReactNode }) { return children; }
