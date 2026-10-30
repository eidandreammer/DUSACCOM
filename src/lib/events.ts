import type { Initiative } from './content';

export function dateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find(value => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function eventDateKey(event: Initiative): string | null {
  if (event.status !== 'confirmed' || !event.schedule) return null;
  // Require an explicit offset so a host's local time zone cannot change the date.
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(event.schedule.startsAt)) return null;
  const date = new Date(event.schedule.startsAt);
  if (!Number.isFinite(date.getTime())) return null;
  try { return dateKey(date, event.schedule.timeZone); } catch { return null; }
}

export function isEventRegistrationOpen(event: Initiative, now = Date.now()): boolean {
  return eventDateKey(event) !== null && event.schedule?.registration === 'open' && new Date(event.schedule.startsAt).getTime() > now;
}

export function upcomingEvents(events: readonly Initiative[], now = Date.now()): Initiative[] {
  return events
    .filter(event => eventDateKey(event) !== null && Date.parse(event.schedule!.startsAt) > now)
    .sort((a, b) => Date.parse(a.schedule!.startsAt) - Date.parse(b.schedule!.startsAt))
    .slice(0, 3);
}

export function monthDays(year: number, month: number): Array<number | null> {
  const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => index >= offset && index < offset + count ? index - offset + 1 : null);
}

export function eventTitle(event: Initiative, lang: 'en' | 'es') { return lang === 'es' ? event.titleEs || event.title : event.title; }
export function eventDescription(event: Initiative, lang: 'en' | 'es') { return lang === 'es' ? event.descriptionEs || event.description : event.description; }
