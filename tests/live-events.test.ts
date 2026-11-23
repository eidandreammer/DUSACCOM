import test from 'node:test';
import assert from 'node:assert/strict';
import { eventTimeToInput, eventTimeToISO, liveEvent, liveEventSchema } from '../src/lib/live-events';

test('event times use the chosen zone, including daylight saving boundaries', () => {
  assert.equal(eventTimeToISO('2027-01-15T18:00', 'America/New_York'), '2027-01-15T23:00:00.000Z');
  assert.equal(eventTimeToISO('2027-07-15T18:00', 'America/New_York'), '2027-07-15T22:00:00.000Z');
  assert.equal(eventTimeToISO('2027-01-15T18:00', 'America/Santo_Domingo'), '2027-01-15T22:00:00.000Z');
  assert.equal(eventTimeToISO('2027-03-14T02:30', 'America/New_York'), null);
  assert.equal(eventTimeToISO('2027-11-07T01:30', 'America/New_York'), '2027-11-07T05:30:00.000Z');
  assert.equal(eventTimeToISO('2027-02-30T18:00', 'America/New_York'), null);
  assert.equal(eventTimeToISO('2027-01-15T18:00', 'Invalid'), null);
});
test('malformed event documents cannot break the public calendar', () => {
  assert.equal(liveEvent('x', { title: 'Incomplete' }), null);
  const event = liveEvent('live-example', { title: 'Business meetup', titleEs: '', description: 'Meet the community', descriptionEs: '', location: 'New York', category: 'Networking', startsAt: '2027-01-15T23:00:00.000Z', timeZone: 'America/New_York', status: 'confirmed', registration: 'open', createdBy: 'admin' });
  assert.equal(event?.schedule?.startsAt, '2027-01-15T23:00:00.000Z');
});

test('custom event categories survive validation and reject blank or oversized values', () => {
  const payload = { title: 'Community event', titleEs: '', description: 'Meet the chamber', descriptionEs: '', location: 'New York', category: 'Community celebration', startsAt: '2027-01-15T23:00:00.000Z', timeZone: 'America/New_York', status: 'confirmed', registration: 'open', createdBy: 'admin' };
  assert.equal(liveEvent('custom', payload)?.category, 'Community celebration');
  assert.equal(liveEventSchema.parse({ ...payload, category: '  Cultural event  ' }).category, 'Cultural event');
  assert.ok(liveEventSchema.safeParse({ ...payload, category: 'a'.repeat(60) }).success);
  for (const category of ['', '   ', 'a'.repeat(61), 123, null]) {
    assert.equal(liveEvent('invalid-category', { ...payload, category }), null);
  }
});

test('editing displays event-local time independently of the browser time zone', () => {
  assert.equal(eventTimeToInput('2027-07-15T22:00:00.000Z', 'America/New_York'), '2027-07-15T18:00');
  assert.equal(eventTimeToInput('2027-01-15T23:00:00.000Z', 'America/Santo_Domingo'), '2027-01-15T19:00');
  assert.equal(eventTimeToInput('2027-11-07T06:30:45.123Z', 'America/New_York'), '2027-11-07T01:30');
  assert.equal(eventTimeToInput('2027-01-15T01:30:00.000Z', 'America/Los_Angeles'), '2027-01-14T17:30');
});

test('live events carry Spanish and Portuguese text, and older events without Portuguese still load', async () => {
  const { eventDescription, eventTitle } = await import('../src/lib/events');
  const payload = { title: 'Business mixer', titleEs: 'Encuentro', description: 'Meet owners', descriptionEs: 'Conoce empresarios', location: 'New York', category: 'Networking', startsAt: '2027-01-15T23:00:00.000Z', timeZone: 'America/New_York', status: 'confirmed', registration: 'open', createdBy: 'admin' };
  const legacy = liveEvent('legacy', payload)!;
  assert.equal(eventTitle(legacy, 'pt'), 'Business mixer');
  assert.equal(eventTitle(legacy, 'es'), 'Encuentro');
  const translated = liveEvent('translated', { ...payload, titlePt: 'Encontro', descriptionPt: 'Conheça empresários', translation: { sourceHash: 'a'.repeat(64), es: 'manual', pt: 'auto', fields: {} } })!;
  assert.equal(eventTitle(translated, 'pt'), 'Encontro');
  assert.equal(eventDescription(translated, 'pt'), 'Conheça empresários');
  assert.equal(eventDescription(translated, 'en'), 'Meet owners');
  assert.equal(eventTitle(liveEvent('blank', { ...payload, titleEs: '', titlePt: '' })!, 'es'), 'Business mixer');
  assert.equal(liveEvent('too-long', { ...payload, titlePt: 'x'.repeat(161) }), null);
});
