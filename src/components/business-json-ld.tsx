import { canonicalUrl, site } from '@/lib/site';

type PostalAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
};

type BusinessDetails = {
  name: string;
  alternateName?: string;
  url: string;
  description: string;
  email?: string;
  telephone?: string;
  logo: string;
  image?: string;
  sameAs?: readonly string[];
};

export type BusinessEntity = BusinessDetails & (
  | { type: 'Organization'; address?: PostalAddress }
  | { type: 'LocalBusiness' | 'ProfessionalService'; address: PostalAddress }
);

export const dusaccomEntity: BusinessEntity = {
  type: 'Organization',
  name: site.fullName,
  alternateName: site.name,
  url: canonicalUrl(),
  description: site.description,
  email: site.email,
  telephone: site.phoneHref,
  logo: new URL('/imgs/DUSACCOM complete logo.png', site.url).href,
  image: new URL('/assets/new-york.jpg', site.url).href,
};

export function BusinessJsonLd({ business, nonce }: { business: BusinessEntity; nonce?: string }) {
  const { type, address, ...details } = business;
  const entityId = new URL('#organization', business.url).href;
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': type,
        '@id': entityId,
        ...details,
        ...(address ? { address: { '@type': 'PostalAddress', ...address } } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': new URL('#website', business.url).href,
        url: business.url,
        name: business.alternateName || business.name,
        alternateName: business.name,
        publisher: { '@id': entityId },
      },
    ],
  };

  return (
    <script
      id="business-json-ld"
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
