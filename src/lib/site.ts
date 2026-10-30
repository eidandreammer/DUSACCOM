import type { Metadata } from 'next';
export const site = {
  name: 'DUSACCOM',
  fullName: 'Dominican USA Chamber of Commerce',
  email: 'dusaccom1@gmail.com',
  phone: '646-326-6052',
  phoneHref: '+16463266052',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://dusaccom-business-community.bluesole13.chatgpt.site',
  description: 'A chapter supporting Latinos in the United States through English and Spanish lessons, community events, and meaningful connections.'
} as const;
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { title: `${title} | DUSACCOM`, description, url: path, images: [{ url: '/assets/new-york.jpg', width: 1400, height: 933, alt: 'New York City at golden hour' }] } };
}
