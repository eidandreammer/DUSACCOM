import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('Privacy Policy', 'How the Dominican USA Chamber of Commerce of New Jersey collects, uses, and protects your information.', '/privacy/');

export default function Layout({ children }: { children: ReactNode }) { return children; }
