'use client';
/*
 * The location map shell (BiteSites site layer): the reserved frame, the
 * deferral, the failure notice. It contains no MapLibre code, so the library,
 * its CSS and the style document load only when the map is near the viewport.
 *
 * Every caller renders the address, phone and a directions link beside this
 * frame, so the map is never the only place that information lives. A chunk
 * that never arrives is caught by the boundary here; no WebGL or a broken style
 * is caught inside BrandedMapLive. All three end the same way: a plain notice.
 */
import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { StyleSpecification } from 'maplibre-gl';
import type { MapStatus } from './branded-map-live';

/* Start rendering about a phone screen before the panel enters the viewport. */
const PRELOAD_MARGIN = '600px';
export const DEFAULT_ZOOM = 16.4;

const BrandedMapLive = lazy(() => import('./branded-map-live'));

function useNearViewport(ref: React.RefObject<HTMLDivElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: PRELOAD_MARGIN });
    observer.observe(node);
    return () => observer.disconnect();
  }, [near, ref]);
  return near;
}

/** A zero/zero pair is a missing location, not a usable coordinate. */
export function hasStorePosition(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && (lat !== 0 || lng !== 0);
}

class MapChunkBoundary extends Component<{ onFailed: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[map] could not load the map chunk', error);
    this.props.onFailed();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export type BrandedMapCanvasProps = {
  lat: number;
  lng: number;
  mapsUrl: string;
  mapStyle: StyleSpecification | (() => StyleSpecification);
  pinMarkup: string;
  pinColor: string;
  pinLabel?: string;
  unavailableLabel?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  zoom?: number;
  interactive?: boolean;
  pinScale?: number;
  className?: string;
};

export default function BrandedMapCanvas({
  lat, lng, mapsUrl, mapStyle, pinMarkup, pinColor,
  pinLabel = 'Location',
  unavailableLabel = 'This map is unavailable.',
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  zoom = DEFAULT_ZOOM,
  interactive = true,
  pinScale = 1,
  className = '',
}: BrandedMapCanvasProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(frameRef);
  const [status, setStatus] = useState<MapStatus>('idle');
  const hasPosition = hasStorePosition(lat, lng);
  const draw = near && hasPosition;
  const fail = useCallback(() => setStatus('failed'), []);

  useEffect(() => {
    if (draw) setStatus(current => (current === 'idle' ? 'loading' : current));
  }, [draw]);

  // The empty canvas holds the frame open before the map arrives and after it fails.
  const placeholder = hasPosition ? <div className="map-canvas" aria-hidden="true" /> : null;
  const live = draw && status !== 'failed';

  return (
    <div className={`map-frame${className ? ` ${className}` : ''}`} ref={frameRef} data-status={status}>
      {live ? (
        <MapChunkBoundary onFailed={fail}>
          <Suspense fallback={placeholder}>
            <BrandedMapLive
              lat={lat} lng={lng} mapsUrl={mapsUrl} pinLabel={pinLabel}
              zoomInLabel={zoomInLabel} zoomOutLabel={zoomOutLabel} zoom={zoom}
              interactive={interactive} pinScale={pinScale} mapStyle={mapStyle}
              pinMarkup={pinMarkup} pinColor={pinColor} onStatus={setStatus}
            />
          </Suspense>
        </MapChunkBoundary>
      ) : placeholder}
      {status === 'failed' && <p className="map-notice">{unavailableLabel}</p>}
    </div>
  );
}
