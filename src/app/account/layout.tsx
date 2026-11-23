import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My account', robots: { index: false, follow: false } };

export default function Layout({ children }: { children: ReactNode }) { return children; }
