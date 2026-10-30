'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import images from '@/lib/hero-images.json';
import styles from '@/app/home.module.css';

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

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
      if (!document.hidden) setActive(previous => (previous + 1) % images.length);
    }, 30000);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  return <div className={styles.heroSlides} aria-hidden="true">
    {images.map(({ name }, index) => <Image key={name} src={`/assets/hero-${name}.jpg`} alt="" fill sizes="100vw" priority={index === 0}
      loading={index === 0 ? undefined : 'eager'} className={`${styles.heroImage} ${index === active ? styles.heroImageActive : ''}`} />)}
  </div>;
}
