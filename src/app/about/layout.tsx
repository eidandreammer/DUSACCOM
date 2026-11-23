import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('About the Chamber', 'Learn about the Dominican USA Chamber of Commerce of New Jersey: Dominican roots, an open door for Latin American and multicultural entrepreneurs, our mission, vision, and leadership.', '/about/');

export default function Layout({ children }: { children: ReactNode }) { return children; }
