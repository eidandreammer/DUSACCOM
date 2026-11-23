'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParallax } from '@/lib/use-parallax';
import styles from '@/app/home.module.css';

type Size = 540 | 720 | 1080;

// Encode by viewport: 1080p desktop, 720p tablet, 540p phones.
function pickSize(): Size {
  if (window.matchMedia('(min-width: 1200px)').matches) return 1080;
  return window.matchMedia('(min-width: 600px)').matches ? 720 : 540;
}

// Data Saver or a 2G/3G connection: keep the poster, do not download or autoplay.
function isLowData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData) || /2g|3g/.test(connection?.effectiveType ?? '');
}

type Props = {
  id?: string;
  video: string; // base name in /assets, without -1080.mp4
  videoTitle: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
  caption?: string;
  focus?: string; // object-position for the video
};

// Full-bleed video band. The video sits on an oversized layer that drifts on
// scroll, loads only near the viewport, and plays only while visible.
export function ParallaxVideoBand({ id, video, videoTitle, eyebrow, title, children, caption, focus = 'center' }: Props) {
  const frame = useRef<HTMLElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string>();
  const [visible, setVisible] = useState(false);
  useParallax(frame, layer, 0.18);

  // Attach the source as the band nears the viewport (200px early).
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const lowData = isLowData();
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting && !lowData) setSrc(current => current ?? `/assets/${video}-${pickSize()}.mp4`);
    }, { rootMargin: '200px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [video]);

  // Play only once the source is actually on the element (the first sighting
  // used to call play() before React had attached src, so it silently failed).
  useEffect(() => {
    const element = player.current;
    if (!element || !src) return;
    if (visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) element.play().catch(() => {});
    else element.pause();
  }, [visible, src]);

  return <section id={id} ref={frame} className={styles.videoBand} aria-label={title}>
    <div ref={layer} className={styles.videoBandLayer} aria-hidden="true">
      <video ref={player} src={src} poster={`/assets/${video}-poster.webp`} muted loop playsInline preload={src ? 'auto' : 'none'} title={videoTitle} style={{ objectPosition: focus }} />
    </div>
    <div className={`${styles.container} ${styles.videoBandCopy}`}>
      <p className={styles.label}>{eyebrow}</p>
      <h2 className={styles.videoBandTitle}>{title}</h2>
      {children}
    </div>
    {caption && <p className={styles.videoBandCaption}>{caption}</p>}
  </section>;
}
