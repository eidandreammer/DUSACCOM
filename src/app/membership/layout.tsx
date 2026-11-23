import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata('Membership', 'Join the Dominican USA Chamber of Commerce of New Jersey. Membership options for startups, small businesses, corporate partners, and nonprofits. Everyone is welcome.', '/membership/');

export default function Layout({ children }: { children: ReactNode }) { return children; }
