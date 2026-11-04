'use client';

import { useEffect, useState } from 'react';
import styles from './bitesites-badge.module.css';

export function BiteSitesBadge() {
  const [atPageBottom, setAtPageBottom] = useState(false);

  useEffect(() => {
    let frame = 0;
    const checkBottom = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
        setAtPageBottom(remaining <= 2);
      });
    };

    // Measure the actual scroll boundary, including any existing page overflow.
    // Passive scrolling works on touch; resize observation covers route changes.
    window.addEventListener('scroll', checkBottom, { passive: true });
    window.addEventListener('resize', checkBottom);
    window.visualViewport?.addEventListener('resize', checkBottom);
    const observer = new ResizeObserver(checkBottom);
    observer.observe(document.body);
    checkBottom();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', checkBottom);
      window.removeEventListener('resize', checkBottom);
      window.visualViewport?.removeEventListener('resize', checkBottom);
    };
  }, []);

  return (
    <div className={styles.credit}>
      <a
        className={styles.badge}
        href="https://bitesites.org"
        target="_blank"
        rel="noopener"
        aria-label="Made by Bite Sites"
        data-at-page-bottom={atPageBottom}
      >
        <span className={styles.eyebrow} aria-hidden="true">Made by</span>
        <span className={styles.mark} aria-hidden="true">
          <span className={`${styles.logo} ${styles.rest}`} />
          <span className={`${styles.logo} ${styles.animated}`} />
        </span>
      </a>
    </div>
  );
}
