// Types for the vendored BiteSites credit footer (bitesites-credit-footer.jsx / .js).
// The vendored files stay unedited so an upstream update can be copied over cleanly.
import type { JSX } from 'react';

export type BiteSitesCreditFooterProps = {
  href?: string;
  label?: string;
  eyebrow?: string | null;
  copy?: string;
  onDark?: boolean;
  /** Path to bitesites-logo-full.webp as the site serves it. */
  logoSrc?: string;
  bottomInset?: 'auto' | number;
  compactViewportWidth?: number;
};

declare function BiteSitesCreditFooter(props: BiteSitesCreditFooterProps): JSX.Element;
export default BiteSitesCreditFooter;
