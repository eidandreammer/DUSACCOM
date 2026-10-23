'use client';
import type { ImageLoaderProps } from 'next/image';
const optimized = new Set(['new-york', 'networking']);
export default function imageLoader({ src, width }: ImageLoaderProps): string {
  const match = /^\/assets\/([a-z-]+)\.jpg$/.exec(src);
  if (!match || !optimized.has(match[1])) return src;
  const sizes = [96, 160, 256, 384, 480, 768, 1200, 1600];
  const selected = sizes.find(size => size >= width) || 1600;
  return `/assets/${match[1]}-${selected}.webp`;
}
