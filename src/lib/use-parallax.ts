'use client';
import { useEffect, type RefObject } from 'react';

/**
 * Moves `target` vertically as its `frame` scrolls through the viewport.
 * speed 0.15 = the layer drifts 15% of the distance between the frame's centre
 * and the viewport's centre. Off for prefers-reduced-motion.
 */
export function useParallax(frame: RefObject<HTMLElement | null>, target: RefObject<HTMLElement | null>, speed = 0.15) {
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    const update = () => {
      raf = 0;
      const f = frame.current, t = target.current;
      if (!f || !t) return;
      if (motion.matches) { t.style.transform = ''; return; }
      const box = f.getBoundingClientRect();
      if (box.bottom < -200 || box.top > window.innerHeight + 200) return;
      const offset = (box.top + box.height / 2 - window.innerHeight / 2) * speed;
      t.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
    };
  }, [frame, target, speed]);
}
