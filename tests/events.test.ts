import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initiatives, type Initiative } from '../src/lib/content';
import { eventDateKey, isEventRegistrationOpen, monthDays, upcomingEvents } from '../src/lib/events';

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

test('upcoming cards show the three soonest start times across time zones and months', () => {
  const makeEvent = (id: string, startsAt: string): Initiative => ({ ...event, id, schedule: { ...event.schedule!, startsAt } });
  const events = [
    makeEvent('december', '2026-12-01T09:00:00-05:00'),
    makeEvent('november', '2026-11-01T09:00:00-05:00'),
    makeEvent('later-instant', '2026-10-31T09:00:00-07:00'),
    makeEvent('soonest', '2026-10-31T10:00:00-04:00'),
  ];
  const originalOrder = events.map(item => item.id);
  assert.deepEqual(upcomingEvents(events, Date.parse('2026-10-30T12:00:00Z')).map(item => item.id), ['soonest', 'later-instant', 'november']);
  assert.deepEqual(events.map(item => item.id), originalOrder);
});

test('upcoming cards exclude proposed, undated, invalid, past, and already-started events', () => {
  const now = Date.parse(event.schedule!.startsAt);
  const events: Initiative[] = [
    { ...event, status: 'proposed' },
    { ...event, schedule: undefined },
    { ...event, schedule: { ...event.schedule!, startsAt: 'invalid' } },
    { ...event, schedule: { ...event.schedule!, startsAt: '2026-11-02T12:00:00' } },
    { ...event, schedule: { ...event.schedule!, startsAt: '2026-11-02T12:00:00Z', timeZone: 'invalid' } },
    { ...event, schedule: { ...event.schedule!, startsAt: '2026-10-30T12:00:00Z' } },
    event,
  ];
  assert.deepEqual(upcomingEvents(events, now), []);
  assert.deepEqual(upcomingEvents([], now), []);
});

test('upcoming cards show one or two available events even when registration is closed', () => {
  const now = Date.parse(event.schedule!.startsAt) - 1;
  const closed = { ...event, id: 'closed', schedule: { ...event.schedule!, registration: 'closed' as const, startsAt: '2026-11-02T12:00:00Z' } };
  assert.deepEqual(upcomingEvents([event], now), [event]);
  assert.deepEqual(upcomingEvents([closed, event], now), [event, closed]);
});
