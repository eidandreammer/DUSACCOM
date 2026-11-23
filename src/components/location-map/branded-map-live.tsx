'use client';
/*
 * The MapLibre half of the location map (BiteSites site layer). Never imported
 * directly: BrandedMapCanvas reaches it through React.lazy once a map is about
 * to be drawn, so MapLibre, its CSS and the style document stay off every
 * page's critical path.
 *
 * Worker: MapLibre 6 finds its tile worker with new URL(..., import.meta.url),
 * which a bundler rewrites to a path where no worker was emitted. The worker is
 * a self-contained module, so scripts/copy-vendor.mjs copies it to
 * public/assets/vendor/ under a versioned name and setWorkerUrl points there
 * before the first map is constructed.
 */
import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { version as maplibreVersion } from 'maplibre-gl/package.json';
import type { StyleSpecification } from 'maplibre-gl';

export const MAPLIBRE_WORKER_URL = `/assets/vendor/maplibre-gl-worker-${maplibreVersion}.js`;

export type MapStatus = 'idle' | 'loading' | 'ready' | 'failed';

export type BrandedMapLiveProps = {
  lat: number;
  lng: number;
  mapsUrl: string;
  pinLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  zoom: number;
  interactive: boolean;
  pinScale: number;
  mapStyle: StyleSpecification | (() => StyleSpecification);
  /** Inner SVG markup drawn inside the badge (64×80 viewBox; badge circle centred at 32,27, r≈23). */
  pinMarkup: string;
  pinColor: string;
  onStatus: (status: MapStatus) => void;
};

/** A white teardrop badge outlined in the brand colour, with the client mark inside. */
function pinSvg(label: string, scale: number, color: string, inner: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 80');
  svg.setAttribute('width', String(Math.round(46 * scale)));
  svg.setAttribute('height', String(Math.round(58 * scale)));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.innerHTML = `
    <path d="M32 76 C25.5 63 9 46 9 27 A23 23 0 1 1 55 27 C55 46 38.5 63 32 76 Z"
      fill="#ffffff" stroke="${color}" stroke-width="3" stroke-linejoin="round" />
    ${inner}`;
  return svg;
}

/** The marker is a real link, so hover, focus and Enter come for free. */
function pinElement(href: string, label: string, scale: number, color: string, inner: string) {
  const anchor = document.createElement('a');
  anchor.className = 'store-pin';
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noreferrer';
  anchor.setAttribute('aria-label', label);
  anchor.append(pinSvg(label, scale, color, inner));
  return anchor;
}

export default function BrandedMapLive({
  lat, lng, mapsUrl, pinLabel, zoomInLabel, zoomOutLabel, zoom, interactive, pinScale, mapStyle, pinMarkup, pinColor, onStatus,
}: BrandedMapLiveProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  // The shell owns status; held in a ref so an inline callback does not rebuild the map.
  const report = useRef(onStatus);
  useEffect(() => { report.current = onStatus; }, [onStatus]);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    let map: import('maplibre-gl').Map | null = null;
    let cancelled = false;

    async function draw() {
      try {
        const { Map: MapLibreMap, Marker, NavigationControl, setWorkerUrl } = await import('maplibre-gl');
        if (cancelled || !canvasRef.current) return;
        setWorkerUrl(MAPLIBRE_WORKER_URL);

        map = new MapLibreMap({
          container: canvasRef.current,
          style: typeof mapStyle === 'function' ? mapStyle() : mapStyle,
          center: [lng, lat],
          zoom,
          interactive,
          // A wheel over the map scrolls the page; ctrl/⌘ + wheel or two fingers zoom it.
          cooperativeGestures: interactive,
          // A locator, not an explorer: north-up, no tilt.
          dragRotate: false,
          pitchWithRotate: false,
          attributionControl: { compact: true },
          locale: { 'NavigationControl.ZoomIn': zoomInLabel, 'NavigationControl.ZoomOut': zoomOutLabel },
        });
        if (interactive) {
          map.touchZoomRotate.disableRotation();
          map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
        }

        new Marker({ element: pinElement(mapsUrl, pinLabel, pinScale, pinColor, pinMarkup), anchor: 'bottom' })
          .setLngLat([lng, lat])
          .addTo(map);

        let loaded = false;
        map.on('load', () => {
          loaded = true;
          if (!cancelled) report.current('ready');
        });
        // Only style-level errors before load mean a dead map; a stray 404 tile carries a sourceId.
        map.on('error', (event: { sourceId?: string; error?: unknown }) => {
          console.error('[map]', event?.sourceId || 'style', event?.error || event);
          if (cancelled || loaded || event?.sourceId) return;
          report.current('failed');
        });
      } catch (error) {
        // No WebGL or offline. The address and directions link beside the map still render.
        console.error('[map] could not start', error);
        if (!cancelled) report.current('failed');
      }
    }

    draw();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lat, lng, mapsUrl, pinLabel, zoom, interactive, pinScale, mapStyle, pinMarkup, pinColor, zoomInLabel, zoomOutLabel]);

  return <div className="map-canvas" ref={canvasRef} />;
}
