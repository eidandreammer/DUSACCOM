import type { Metadata } from 'next';

/*
 * Location: the pin coordinate is Google Maps' own point for this address
 * (place 0x89c2f11e9446775b:0x35482547bb47d14a, checked Nov 2026), which sits on
 * the storefront row on the north side of W Palisade Ave, beside 99 W Palisade.
 * OpenStreetMap's interpolated point lands in the roadway, so it is not used.
 * Never geocode the address at runtime.
 */
const address = {
  street: '101 W Palisade Ave',
  city: 'Englewood',
  region: 'NJ',
  postalCode: '07631',
  country: 'US',
} as const;

export const site = {
  name: 'DUSACCOM',
  fullName: 'Dominican USA Chamber of Commerce',
  email: 'admin@dusaccnj.org',
  phone: '646-326-6052',
  phoneHref: '+16463266052',
  address,
  addressLine: `${address.street}, ${address.city}, ${address.region} ${address.postalCode}`,
  geo: { lat: 40.8965465, lng: -73.9788248 },
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address.street}, ${address.city}, ${address.region} ${address.postalCode}`)}`,
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://dusaccnj.org',
  description: 'A nonprofit chamber of commerce in New Jersey with Dominican roots and an open door. Everyone is welcome: we connect Dominican, Latin American, and multicultural entrepreneurs through business connections, community events, and English and Spanish lessons.'
} as const;
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { title: `${title} | DUSACCOM`, description, url: path, images: [{ url: '/assets/dusaccom-og.jpg', width: 1200, height: 630, alt: 'Dominican USA Chamber of Commerce of New Jersey' }] } };
}
