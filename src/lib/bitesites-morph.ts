// Morph geometry and scroll timing from the BiteSites credit on oasispurifiedwater.com.
export const arms = {
  left: { x: [22.5, 5.5, 14], y: [38.5, 172.5, 136], scale: [1.273, .77, 1.321] },
  right: { x: [291.5, 382, 293], y: [38.5, 172.5, 136], scale: [1.273, .77, 1.321] },
};
const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
export function interpolate([start, middle, end]: number[], progress: number) {
  const first = progress < .5;
  const t = first ? progress * 2 : progress * 2 - 1;
  const a = first ? start : middle, b = first ? middle : end;
  const c = first ? middle - start : (end - start) / 2;
  const d = first ? (end - start) / 2 : end - middle;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * a + (t ** 3 - 2 * t ** 2 + t) * c
    + (3 * t ** 2 - 2 * t ** 3) * b + (t ** 3 - t ** 2) * d;
}
export function armTransform(arm: typeof arms.left, progress: number) {
  return `translate(${interpolate(arm.x, progress).toFixed(2)} ${interpolate(arm.y, progress).toFixed(2)}) scale(${interpolate(arm.scale, progress).toFixed(4)})`;
}
export function attachBiteSitesMorph(logo: HTMLAnchorElement, container: HTMLDivElement) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const left = logo.querySelector('[data-bitesites-arm="left"]');
  const right = logo.querySelector('[data-bitesites-arm="right"]');
  let frame = 0;
  const update = () => {
    frame = 0;
    const compact = window.innerWidth <= 900;
    const expanded = compact ? 124 : 158, collapsed = compact ? 54 : 62;
    const box = container.getBoundingClientRect(), mark = logo.getBoundingClientRect();
    const height = window.visualViewport?.height || window.innerHeight;
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const bottomInset = Math.min(Math.max(0, documentHeight - (window.scrollY + box.bottom)), height / 2);
    const centre = mark.top - box.top + mark.height / 2;
    const start = centre - collapsed / 2;
    const end = Math.min(box.height - 16, centre + expanded / 2 + 12);
    let progress = 1 - clamp((height - bottomInset - box.top - start) / Math.max(90, end - start));
    if (motion.matches) progress = Number(progress > .5);
    progress = smoothstep(0, 1, progress);
    logo.style.setProperty('--logo-size', `${expanded + (collapsed - expanded) * progress}px`);
    left?.setAttribute('transform', armTransform(arms.left, progress));
    right?.setAttribute('transform', armTransform(arms.right, progress));
    logo.style.setProperty('--type-x', `${interpolate([0, -2.5, -2.5], progress) / 5}%`);
    logo.style.setProperty('--type-y', `${interpolate([0, -97.5, -78.5], progress) / 5}%`);
    logo.style.setProperty('--type-scale', String(interpolate([1, .604, .42], progress)));
    logo.style.setProperty('--type-opacity', String(1 - smoothstep(.58, .9, progress)));
    logo.style.setProperty('--tag-opacity', String(1 - smoothstep(.03, .24, progress)));
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const observer = new ResizeObserver(schedule);
  observer.observe(document.body);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  motion.addEventListener('change', schedule);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    motion.removeEventListener('change', schedule);
  };
}
