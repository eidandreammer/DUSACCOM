import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('English and Spanish Lessons with INFOTEP', 'Free English and Spanish language learning through INFOTEP, offered with the support of the Dominican USA Chamber of Commerce of New Jersey.', '/infotep/');

export default function Layout({ children }: { children: ReactNode }) { return children; }
