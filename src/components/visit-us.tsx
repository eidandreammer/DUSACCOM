'use client';
import { MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { Eyebrow } from '@/components/ui';
import BrandedMapCanvas from '@/components/location-map/branded-map-canvas';
import { brandedMapStyle, DUSACCOM_MAP_PALETTE } from '@/components/location-map/branded-map-style';
import '@/components/location-map/location-map.css';
import { site } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';
import type { Lang } from '@/lib/translations';

// Module constants: an inline style or pin would rebuild the map on every render.
const MAP_STYLE = brandedMapStyle({ name: 'DUSACCOM, Englewood NJ', palette: DUSACCOM_MAP_PALETTE });
const PIN_COLOR = '#032a63';
// The Dominican flag's quartered field and white cross, inside the pin badge.
const PIN_MARKUP = `
  <defs><clipPath id="dusaccom-pin-flag"><rect x="20" y="15" width="24" height="24" rx="4" /></clipPath></defs>
  <g clip-path="url(#dusaccom-pin-flag)">
    <rect x="20" y="15" width="12" height="12" fill="#032a63" />
    <rect x="32" y="15" width="12" height="12" fill="#cb0716" />
    <rect x="20" y="27" width="12" height="12" fill="#cb0716" />
    <rect x="32" y="27" width="12" height="12" fill="#032a63" />
    <rect x="29.5" y="15" width="5" height="24" fill="#ffffff" />
    <rect x="20" y="24.5" width="24" height="5" fill="#ffffff" />
  </g>`;

const copy: Record<Lang, {
  eyebrow: string; title: string; description: string; directions: string; pinLabel: string;
  unavailable: string; zoomIn: string; zoomOut: string; office: string;
}> = {
  en: {
    eyebrow: 'Visit us', title: 'Find us in Englewood',
    description: 'Our office is on West Palisade Avenue in downtown Englewood, New Jersey. Stop by, call, or write to plan a visit.',
    directions: 'Get directions', pinLabel: 'DUSACCOM office: open directions in Google Maps',
    unavailable: 'The map could not load. The address and directions link are still here.',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', office: 'Chamber office',
  },
  es: {
    eyebrow: 'Visítanos', title: 'Encuéntranos en Englewood',
    description: 'Nuestra oficina está en West Palisade Avenue, en el centro de Englewood, Nueva Jersey. Pasa, llama o escríbenos para coordinar tu visita.',
    directions: 'Cómo llegar', pinLabel: 'Oficina de DUSACCOM: abrir indicaciones en Google Maps',
    unavailable: 'El mapa no se pudo cargar. La dirección y el enlace para llegar siguen aquí.',
    zoomIn: 'Acercar', zoomOut: 'Alejar', office: 'Oficina de la Cámara',
  },
  pt: {
    eyebrow: 'Visite-nos', title: 'Encontre-nos em Englewood',
    description: 'Nosso escritório fica na West Palisade Avenue, no centro de Englewood, Nova Jersey. Passe por aqui, ligue ou escreva para combinar sua visita.',
    directions: 'Como chegar', pinLabel: 'Escritório da DUSACCOM: abrir rotas no Google Maps',
    unavailable: 'Não foi possível carregar o mapa. O endereço e o link de rotas continuam aqui.',
    zoomIn: 'Aproximar', zoomOut: 'Afastar', office: 'Escritório da Câmara',
  },
};

export function VisitUs({ tone = 'white' }: { tone?: 'white' | 'mist' }) {
  const { lang } = useLanguage();
  const c = copy[lang];
  const { address } = site;

  return (
    <section id="visit" className={`section scroll-mt-24 ${tone === 'mist' ? 'bg-mist' : 'bg-white'}`} aria-labelledby="visit-title">
      <div className="container">
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h2 id="visit-title" className="section-title">{c.title}</h2>
        <p className="mt-5 mb-9 max-w-xl text-sm leading-8 text-slate-600">{c.description}</p>

        <div className="branded-map">
          <div className="map-panel">
            <BrandedMapCanvas
              lat={site.geo.lat}
              lng={site.geo.lng}
              mapsUrl={site.directionsUrl}
              mapStyle={MAP_STYLE}
              pinMarkup={PIN_MARKUP}
              pinColor={PIN_COLOR}
              pinLabel={c.pinLabel}
              unavailableLabel={c.unavailable}
              zoomInLabel={c.zoomIn}
              zoomOutLabel={c.zoomOut}
              pinScale={1.15}
            />
            <address className="map-card">
              <span className="map-card-eyebrow">{c.office}</span>
              <strong>{site.name}</strong>
              <span className="map-card-line"><MapPin size={15} aria-hidden="true" />{address.street}<br />{address.city}, {address.region} {address.postalCode}</span>
              <a className="map-card-line map-card-link" href={`tel:${site.phoneHref}`}><Phone size={15} aria-hidden="true" />{site.phone}</a>
              <a className="map-card-line map-card-link" href={`mailto:${site.email}`}><Mail size={15} aria-hidden="true" />{site.email}</a>
              <a className="button map-card-button" href={site.directionsUrl} target="_blank" rel="noreferrer">
                {c.directions}<ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </address>
          </div>
        </div>
      </div>
    </section>
  );
}
