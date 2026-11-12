import { resources } from './content';
import type { translations } from './translations';

type NavigationLabel = keyof typeof translations.en.nav;
export type NavigationLink = { href: string; label: NavigationLabel };

// Adapt the reference's three menu groups to our existing routes and sections.
// Keep this shared by desktop, mobile, footer, and the public XML sitemap.
export const navigationGroups: { id: string; label: NavigationLabel; links: NavigationLink[] }[] = [
  { id: 'chamber', label: 'chamber', links: [
    { href: '/about', label: 'about' },
    { href: '/about#mission', label: 'mission' },
    { href: '/contact', label: 'contact' },
  ] },
  { id: 'opportunities', label: 'opportunities', links: [
    { href: '/programs', label: 'programs' },
    { href: '/programs#trade', label: 'trade' },
    { href: '/infotep', label: 'infotep' },
    { href: '/contact#resources', label: 'resources' },
  ] },
  { id: 'participate', label: 'participate', links: [
    { href: '/membership', label: 'membership' },
    { href: '/#register-form', label: 'registration' },
    { href: '/#events', label: 'events' },
    { href: '/account', label: 'account' },
  ] },
];

export const homeLink: NavigationLink = { href: '/', label: 'home' };
export const legalLinks = [{ href: '/privacy', label: 'privacy' }, { href: '/terms', label: 'terms' }] as const;

// Accounts remain accessible in navigation, but are not search landing pages.
// Anchors describe hierarchy without introducing duplicate sitemap entries.
export const publicPagePaths = [...new Set([
  homeLink.href,
  ...navigationGroups.flatMap(group => group.links.map(link => link.href.split('#')[0]))
    .filter(path => path !== '/account'),
  ...legalLinks.map(link => link.href),
  ...resources.map(resource => `/resources/${resource.slug}`),
])];

export function isNavigationLinkCurrent(href: string, pathname: string, hash = '') {
  const [path, fragment] = href.split('#');
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return path === normalizedPath && (fragment ? hash === `#${fragment}` : !hash);
}
