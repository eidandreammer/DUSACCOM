'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import images from '@/lib/hero-images.json';
import styles from '@/app/home.module.css';

export function HeroCarousel({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState([0]);
  const [pending, setPending] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const advance = useCallback(() => {
    if (pending !== null) return;
    const next = (active + 1) % images.length;
    if (visited.includes(next)) {
      setPending(null);
      setActive(next);
    } else {
      // Keep the current slide visible until the next photograph has loaded.
      setPending(next);
      setVisited(previous => [...previous, next]);
    }
  }, [active, pending, visited]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => {
      if (!document.hidden) advance();
    }, 25000);
    return () => clearInterval(timer);
  }, [advance, reducedMotion]);

  function onHeroClick(event: MouseEvent<HTMLElement>) {
    // Keep navigation, controls, and text selection independent of the photos.
    if ((event.target as HTMLElement).closest('a, button, input, select, textarea, [role="button"]') || window.getSelection()?.toString()) return;
    advance();
  }

  return <section className={`home-hero ${styles.hero}`} data-active-image={images[active].file} aria-labelledby="about-title" onClick={onHeroClick}>
    <div className={styles.heroSlides} aria-hidden="true">
      {images.map(({ name }, index) => visited.includes(index) && <Image key={name} src={`/assets/hero-${name}.jpg`} alt="" fill sizes="100vw" priority={index === 0}
        loading={index === 0 ? undefined : 'eager'} onLoad={() => {
          if (pending === index) { setActive(index); setPending(null); }
        }} onError={() => {
          if (pending === index) {
            setPending(null);
            setVisited(previous => previous.filter(slide => slide !== index));
          }
        }} className={`${styles.heroImage} ${index === active ? styles.heroImageActive : ''}`} />)}
    </div>
    {children}
  </section>;
}
