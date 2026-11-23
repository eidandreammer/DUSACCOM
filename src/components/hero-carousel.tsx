'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import images from '@/lib/hero-images.json';
import videos from '@/lib/hero-videos.json';
import styles from '@/app/home.module.css';

// Slides alternate (staggered): bridge aerial, parade photo, aerial, photo…
// Each video plays once through; photos hold for PHOTO_MS.
const PHOTO_MS = 9000;
type Slide = { kind: 'video' | 'photo'; i: number };
const order: Slide[] = [];
for (let i = 0; i < Math.max(videos.length, images.length); i++) {
  if (i < videos.length) order.push({ kind: 'video', i });
  if (i < images.length) order.push({ kind: 'photo', i });
}
const slideCount = order.length;
const videoSlot = videos.map((_, i) => order.findIndex(slide => slide.kind === 'video' && slide.i === i));
const photoSlot = images.map((_, i) => order.findIndex(slide => slide.kind === 'photo' && slide.i === i));
// How many slides ahead of the current one a slot is (0 = current).
const ahead = (slot: number, active: number) => (slot - active + slideCount) % slideCount;
type Size = 540 | 720 | 1080;

// Encode by viewport: 1080p desktop, 720p tablet, 540p phones.
function pickSize(): Size {
  if (window.matchMedia('(min-width: 1200px)').matches) return 1080;
  return window.matchMedia('(min-width: 600px)').matches ? 720 : 540;
}

// Data Saver or a 2G/3G connection: keep the posters, do not download or autoplay video.
function isLowData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData) || /2g|3g/.test(connection?.effectiveType ?? '');
}

export function HeroCarousel({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [size, setSize] = useState<Size>();
  const [lowData, setLowData] = useState(false);
  const players = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    setSize(pickSize());
    setLowData(isLowData());
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    players.current.forEach((player, index) => {
      if (!player || !size) return;
      if (videoSlot[index] === active && !reducedMotion && !lowData) {
        player.currentTime = 0;
        player.play().catch(() => {});
      } else player.pause();
    });
  }, [active, reducedMotion, size, lowData]);

  useEffect(() => {
    if (reducedMotion) return;
    const slide = order[active];
    const ms = slide.kind === 'video' ? videos[slide.i].seconds * 1000 + 300 : PHOTO_MS;
    const timer = setTimeout(() => {
      if (!document.hidden) setActive(previous => (previous + 1) % slideCount);
    }, ms);
    return () => clearTimeout(timer);
  }, [active, reducedMotion]);

  const advance = () => setActive(previous => (previous + 1) % slideCount);
  function onHeroClick(event: MouseEvent<HTMLElement>) {
    // Keep navigation, controls, and text selection independent of the photos.
    if ((event.target as HTMLElement).closest('a, button, input, select, textarea, [role="button"]') || window.getSelection()?.toString()) return;
    advance();
  }

  return <section className={`home-hero ${styles.hero}`} aria-labelledby="about-title" onClick={onHeroClick}>
    <div className={styles.heroSlides} aria-hidden="true">
      {videos.map(({ name, title }, index) => <video key={name} ref={element => { players.current[index] = element; }}
        className={`${styles.heroImage} ${styles.heroVideo} ${videoSlot[index] === active ? styles.heroImageActive : ''}`}
        // Only the current video and the next one (two slides ahead) load; the rest wait their turn.
        src={size && !lowData && (ahead(videoSlot[index], active) <= 2 || players.current[index]?.src) ? `/assets/${name}-${size}.mp4` : undefined}
        poster={`/assets/${name}-poster.webp`} muted playsInline preload={index === 0 ? 'auto' : 'metadata'} title={title} />)}
      {images.map(({ name }, index) => <Image key={name} src={`/assets/hero-${name}.jpg`} alt="" fill sizes="100vw"
        loading="lazy" className={`${styles.heroImage} ${photoSlot[index] === active ? styles.heroImageActive : ''}`} />)}
    </div>
    {children}
  </section>;
}
