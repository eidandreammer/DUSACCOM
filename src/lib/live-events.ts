import { z } from 'zod';
import type { Initiative } from './content';

export const liveEventSchema = z.object({
  title: z.string().trim().min(1).max(160), titleEs: z.string().trim().max(160),
  description: z.string().trim().min(1).max(2000), descriptionEs: z.string().trim().max(2000),
  location: z.string().trim().min(1).max(240), category: z.string().trim().min(1).max(60),
  startsAt: z.iso.datetime(), timeZone: z.string().min(1).max(80).refine(value => {
    try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; } catch { return false; }
  }), status: z.literal('confirmed'), registration: z.enum(['open', 'closed']), createdBy: z.string().min(1),
});
export function liveEvent(id: string, data: unknown): Initiative | null {
  const result = liveEventSchema.safeParse(data);
  if (!result.success) return null;
  const event = result.data;
  return { id, title: event.title, titleEs: event.titleEs, description: event.description, descriptionEs: event.descriptionEs,
    category: event.category, location: event.location, status: event.status, art: 'navy', tagline: ['', ''],
    schedule: { startsAt: event.startsAt, timeZone: event.timeZone, registration: event.registration } };
}

export function eventTimeToInput(startsAt: string, timeZone: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(startsAt)).replace(' ', 'T');
}

// Resolve a wall-clock time in the selected zone, independent of the browser's zone.
// Nonexistent spring-forward times are rejected; repeated fall-back times use the first occurrence.
export function eventTimeToISO(value: string, timeZone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const naive = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(naive)) return null;
  try {
    const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    for (let offset = 14 * 60; offset >= -12 * 60; offset -= 15) {
      const candidate = new Date(naive - offset * 60000);
      if (formatter.format(candidate).replace(' ', 'T') === value) return candidate.toISOString();
    }
  } catch { return null; }
  return null;
}
