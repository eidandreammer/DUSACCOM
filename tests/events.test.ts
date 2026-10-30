import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initiatives, type Initiative } from '../src/lib/content';
import { eventDateKey, isEventRegistrationOpen, monthDays } from '../src/lib/events';

const event: Initiative = { ...initiatives[0], status: 'confirmed', schedule: { startsAt: '2026-11-01T00:30:00Z', timeZone: 'America/Los_Angeles', registration: 'open' } };

test('calendar uses the event time zone across midnight and daylight saving changes', () => {
  assert.equal(eventDateKey(event), '2026-10-31');
  assert.equal(eventDateKey({ ...event, schedule: { ...event.schedule!, startsAt: '2026-11-01T01:30:00-04:00', timeZone: 'America/New_York' } }), '2026-11-01');
  assert.equal(eventDateKey({ ...event, schedule: { ...event.schedule!, startsAt: '2026-11-01T01:30:00-05:00', timeZone: 'America/New_York' } }), '2026-11-01');
});

test('calendar omits unconfirmed, offset-free, and invalid schedules', () => {
  assert.equal(eventDateKey({ ...event, status: 'proposed' }), null);
  assert.equal(eventDateKey({ ...event, schedule: { ...event.schedule!, startsAt: '2026-11-01T12:00:00' } }), null);
  assert.equal(eventDateKey({ ...event, schedule: { ...event.schedule!, startsAt: 'invalid' } }), null);
  assert.equal(eventDateKey({ ...event, schedule: { ...event.schedule!, timeZone: 'invalid' } }), null);
});

test('registration closes at the event start and honors the explicit closed setting', () => {
  const start = Date.parse(event.schedule!.startsAt);
  assert.equal(isEventRegistrationOpen(event, start - 1), true);
  assert.equal(isEventRegistrationOpen(event, start), false);
  assert.equal(isEventRegistrationOpen(event, start + 1), false);
  assert.equal(isEventRegistrationOpen({ ...event, schedule: { ...event.schedule!, registration: 'closed' } }, start - 1), false);
});

test('calendar aligns Sundays and includes leap days without extra numbered dates', () => {
  assert.equal(monthDays(2026, 1)[0], 1);
  assert.deepEqual(monthDays(2028, 1).filter(day => day !== null), Array.from({ length: 29 }, (_, index) => index + 1));
  assert.equal(monthDays(2026, 11).filter(day => day !== null).at(-1), 31);
  assert.equal(monthDays(2026, 1).length % 7, 0);
});
