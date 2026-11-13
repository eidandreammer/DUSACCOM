'use client';

import { useEffect, useId, useRef } from 'react';
import { arms, armTransform, attachBiteSitesMorph } from '@/lib/bitesites-morph';
import styles from './bitesites-badge.module.css';

export function BiteSitesBadge() {
  const logo = useRef<HTMLAnchorElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const maskId = `bitesites-bite-${useId().replace(/:/g, '')}`;
  useEffect(() => {
    if (logo.current && container.current) return attachBiteSitesMorph(logo.current, container.current);
  }, []);
  return <div ref={container} className={styles.credit}>
    <div className={styles.inner}>
      <p className={styles.eyebrow} aria-hidden="true">Made by</p>
      <a ref={logo} className={styles.logo} href="https://bitesites.org" target="_blank" rel="noopener" aria-label="Made by BiteSites — visit bitesites.org">
        <span className={styles.stage} aria-hidden="true">
          <svg className={styles.svg} viewBox="0 0 500 500" fill="currentColor" focusable="false">
            <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="-2" y="-2" width={150.109375} height={192.328125}>
              <rect x="-2" y="-2" width={150.109375} height={192.328125} fill="#fff" />
              <circle cx={57.465} cy={43.233} r={24.369} fill="#000" />
              <circle cx={91.602} cy={18.862} r={24.369} fill="#000" />
            </mask></defs>
            <g data-bitesites-arm="left" transform={armTransform(arms.left, 1)}><path d="M146.109 0L146.109 20.781L60.625 92.641L146.109 166.875L146.109 188.328L0 91.953Z" mask={`url(#${maskId})`} /></g>
            <g data-bitesites-arm="right" transform={armTransform(arms.right, 1)}><path d="M0 188.328L0 167.547L85.484 95.688L0 21.453L0 0L146.109 96.375Z" /></g>
          </svg>
          <span className={styles.type}>
            {/* Clipped layers preserve the exact wordmark from the reference. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.wordline} src="/assets/bitesites/logo-full.webp" alt="" width="500" height="500" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.tagline} src="/assets/bitesites/logo-full.webp" alt="" width="500" height="500" />
          </span>
        </span>
      </a>
      <p className={styles.copy}>bitesites.org · © {new Date().getFullYear()} BiteSites. All rights reserved.</p>
    </div>
  </div>;
}
