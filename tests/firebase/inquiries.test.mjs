import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, Timestamp, serverTimestamp } from 'firebase/firestore';
import { saveFirestoreInquiry } from '../../src/lib/firestore-inquiries.ts';

let environment;
const input = (patch = {}) => ({ kind: 'contact', name: 'Deployment Test', email: 'test@example.com', company: '', interest: 'General inquiry', message: 'Please send more information.', consent: true, website: '', submissionId: crypto.randomUUID(), ...patch });
const stored = (uid, data) => ({ ...data, ownerUid: uid, reference: `DUS-${data.submissionId.replaceAll('-', '').slice(0, 12).toUpperCase()}`, payloadHash: 'a'.repeat(64), receivedAt: serverTimestamp(), status: 'new' });
const guest = uid => environment.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
function batchFor(db, uid, data, patch = {}, ratePatch = {}) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'inquiries', data.submissionId), { ...stored(uid, data), ...patch });
  batch.set(doc(db, 'inquiryLimits', uid), { count: 1, windowStart: serverTimestamp(), updatedAt: serverTimestamp(), lastSubmission: data.submissionId, ...ratePatch });
  return batch;
}
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-dusaccom', firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'admins', 'inquiry-role-admin'), { enabled: true });
    const event = { status: 'confirmed', registration: 'open', startsAt: new Date(Date.now() + 86400000).toISOString() };
    await Promise.all(Object.entries({ 'inquiry-future': event, 'inquiry-past': { ...event, startsAt: '2020-01-01T00:00:00.000Z' }, 'inquiry-closed': { ...event, registration: 'closed' }, 'inquiry-draft': { ...event, status: 'draft' } }).map(([id, value]) => setDoc(doc(db, 'events', id), value)));
  });
});
after(async () => environment?.cleanup());

test('all form kinds persist with private server receipts and idempotent retries', async () => {
  const db = guest('inquiry-owner');
  for (const patch of [{}, { kind: 'membership', interest: 'nonprofit' }, { kind: 'event', interest: 'beyond-borders' }, { kind: 'event-registration', interest: 'inquiry-future', message: '' }]) {
    const data = input(patch);
    const first = await saveFirestoreInquiry(db, 'inquiry-owner', data);
    assert.equal(first.ok, true);
    assert.match(first.reference, /^DUS-[A-F0-9]{12}$/);
    assert.ok(Date.parse(first.receivedAt));
    assert.deepEqual(await saveFirestoreInquiry(db, 'inquiry-owner', data), first);
    const changed = await saveFirestoreInquiry(db, 'inquiry-owner', { ...data, name: 'Changed name' });
    assert.equal(changed.ok, false);
    const ref = doc(db, 'inquiries', data.submissionId);
    await assertSucceeds(getDoc(ref));
    for (const other of [guest('inquiry-intruder'), guest('inquiry-role-admin'), environment.unauthenticatedContext().firestore()]) {
      await assertFails(getDoc(doc(other, 'inquiries', data.submissionId)));
      await assertFails(getDocs(collection(other, 'inquiries')));
    }
    await assertFails(updateDoc(ref, { message: 'Edited after acceptance' }));
    await assertFails(deleteDoc(ref));
  }
  assert.equal((await getDoc(doc(db, 'inquiryLimits', 'inquiry-owner'))).data().count, 4);
  await assertFails(getDocs(collection(db, 'inquiries')));
  await assertFails(getDoc(doc(guest('inquiry-intruder'), 'inquiryLimits', 'inquiry-owner')));
});

test('server rules validate complete payloads even when browser validation is bypassed', async () => {
  const invalid = [
    { consent: false }, { website: 'spam' }, { email: 'invalid' }, { name: ' ' }, { name: 'a'.repeat(101) },
    { message: 'short' }, { message: 'a'.repeat(3001) }, { company: 123 }, { ownerUid: 'other' },
    { receivedAt: Timestamp.fromMillis(0) }, { status: 'approved' }, { privateOverride: true },
    { reference: 'fake' }, { payloadHash: 'fake' }, { kind: 'membership', interest: 'fake-tier' },
    { kind: 'event', interest: 'nonexistent-event' }, { submissionId: crypto.randomUUID() },
  ];
  for (const [index, patch] of invalid.entries()) {
    const uid = `inquiry-invalid-${index}`;
    await assertFails(batchFor(guest(uid), uid, input(), patch).commit());
  }
  const db = environment.unauthenticatedContext().firestore();
  await assertFails(batchFor(db, 'not-authenticated', input()).commit());
  const missing = input();
  const raw = stored('inquiry-missing-field', missing);
  delete raw.consent;
  await assertFails(setDoc(doc(guest('inquiry-missing-field'), 'inquiries', missing.submissionId), raw));
});

test('registration rejects missing, closed, draft and past events on the server', async () => {
  for (const interest of ['does-not-exist', 'inquiry-past', 'inquiry-closed', 'inquiry-draft', 'beyond-borders']) {
    const uid = `registration-${interest}`;
    await assertFails(batchFor(guest(uid), uid, input({ kind: 'event-registration', interest, message: '' })).commit());
  }
});

test('atomic rate limits cannot be omitted, reset, forged or bypassed after five submissions', async () => {
  const uid = 'inquiry-rate-test';
  const db = guest(uid);
  const first = input();
  await assertFails(setDoc(doc(db, 'inquiries', first.submissionId), stored(uid, first)));
  await assertFails(setDoc(doc(db, 'inquiryLimits', uid), { count: 1, windowStart: serverTimestamp(), updatedAt: serverTimestamp(), lastSubmission: first.submissionId }));
  assert.equal((await saveFirestoreInquiry(db, uid, first)).ok, true);
  await assertFails(batchFor(db, uid, input()).commit());
  for (let i = 0; i < 4; i++) assert.equal((await saveFirestoreInquiry(db, uid, input())).ok, true);
  assert.equal((await saveFirestoreInquiry(db, uid, input())).ok, false);
  const sixth = input();
  const current = (await getDoc(doc(db, 'inquiryLimits', uid))).data();
  await assertFails(batchFor(db, uid, sixth, {}, { count: 6, windowStart: current.windowStart }).commit());
  await assertFails(batchFor(db, uid, sixth).commit());
  await assertFails(deleteDoc(doc(db, 'inquiryLimits', uid)));
  await environment.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'inquiryLimits', uid), { windowStart: Timestamp.fromMillis(Date.now() - 601000) }));
  assert.equal((await saveFirestoreInquiry(db, uid, sixth)).ok, true);
  assert.equal((await getDoc(doc(db, 'inquiryLimits', uid))).data().count, 1);
});
