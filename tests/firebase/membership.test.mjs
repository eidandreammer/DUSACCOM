import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { saveFirestoreInquiry } from '../../src/lib/firestore-inquiries.ts';

let environment;
const email = 'membership@example.com';
const member = (uid, extra = {}) => environment.authenticatedContext(uid, { email, firebase: { sign_in_provider: 'password' }, ...extra }).firestore();
const inquiry = (patch = {}) => ({ kind: 'membership', name: 'Membership Applicant', email, company: 'Community Organization', interest: 'nonprofit', message: 'We would like to join this community.', consent: true, website: '', submissionId: crypto.randomUUID(), ...patch });
const profile = data => ({ company: data.company, membershipTier: data.interest, status: 'submitted', submissionId: data.submissionId, updatedAt: serverTimestamp() });
function batchFor(db, uid, data, profilePatch = {}, includeReceipt = true, includeProfile = true) {
  const batch = writeBatch(db);
  if (includeReceipt) {
    batch.set(doc(db, 'inquiries', data.submissionId), { ...data, ownerUid: uid, reference: `DUS-${data.submissionId.replaceAll('-', '').slice(0, 12).toUpperCase()}`, payloadHash: 'a'.repeat(64), receivedAt: serverTimestamp(), status: 'new' });
    batch.set(doc(db, 'inquiryLimits', uid), { count: 1, windowStart: serverTimestamp(), updatedAt: serverTimestamp(), lastSubmission: data.submissionId });
  }
  if (includeProfile) batch.set(doc(db, 'membershipProfiles', uid), { ...profile(data), ...profilePatch });
  return batch;
}
before(async () => { environment = await initializeTestEnvironment({ projectId: 'demo-dusaccom', firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } }); });
after(async () => environment?.cleanup());

test('membership receipt and company/pathway profile save atomically for the signed-in account', async () => {
  const uid = 'membership-owner';
  const db = member(uid);
  const first = inquiry({ company: 'First Company', interest: 'startup' });
  const receipt = await saveFirestoreInquiry(db, uid, first);
  assert.equal(receipt.ok, true);
  const firstProfile = (await getDoc(doc(db, 'membershipProfiles', uid))).data();
  assert.equal(firstProfile.company, first.company);
  assert.equal(firstProfile.membershipTier, first.interest);
  assert.equal(firstProfile.status, 'submitted');
  assert.ok(firstProfile.updatedAt instanceof Timestamp);
  const second = inquiry({ company: 'Latest Organization', interest: 'nonprofit' });
  assert.equal((await saveFirestoreInquiry(db, uid, second)).ok, true);
  assert.deepEqual(await saveFirestoreInquiry(db, uid, first), receipt);
  assert.equal((await getDoc(doc(db, 'membershipProfiles', uid))).data().company, second.company, 'Retrying an old receipt must not overwrite the latest profile.');
  assert.equal((await getDoc(doc(db, 'inquiryLimits', uid))).data().count, 2);
  for (const other of [member('membership-intruder'), environment.unauthenticatedContext().firestore()]) {
    await assertFails(getDoc(doc(other, 'membershipProfiles', uid)));
    await assertFails(getDocs(collection(other, 'membershipProfiles')));
    await assertFails(setDoc(doc(other, 'membershipProfiles', uid), profile(first)));
    await assertFails(getDoc(doc(other, 'membershipProfiles', uid, 'private', 'child')));
  }
  await assertFails(getDocs(collection(db, 'membershipProfiles')));
  await assertFails(deleteDoc(doc(db, 'membershipProfiles', uid)));
  for (const patch of [{ company: 'Independent edit' }, { status: 'active' }, { membershipTier: 'corporate' }, { isAdmin: true }, { ownerUid: 'another' }, { company: 'x'.repeat(151) }, { updatedAt: Timestamp.fromMillis(0) }]) await assertFails(updateDoc(doc(db, 'membershipProfiles', uid), patch));
  await assertFails(setDoc(doc(db, 'membershipProfiles', uid), { ...profile(first), updatedAt: serverTimestamp() }));
});

test('anonymous membership, forged email and missing atomic receipt or profile are denied', async () => {
  const guest = environment.authenticatedContext('membership-guest', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
  await assertFails(batchFor(guest, 'membership-guest', inquiry()).commit());
  const uid = 'membership-unpaired';
  const db = member(uid);
  await assertFails(batchFor(db, uid, inquiry({ email: 'someone-else@example.com' })).commit());
  await assertFails(batchFor(db, uid, inquiry(), {}, false).commit());
  await assertFails(batchFor(db, uid, inquiry(), {}, true, false).commit());
  await assertFails(setDoc(doc(db, 'membershipProfiles', uid), profile(inquiry())));
  await assertSucceeds(getDoc(doc(db, 'membershipProfiles', uid)));
  assert.equal((await getDoc(doc(db, 'membershipProfiles', uid))).exists(), false);
});

test('create and update validators reject forged status, fields, values, timestamps and ownership', async () => {
  const invalid = [{ status: 'approved' }, { status: 'active' }, { isAdmin: true }, { company: 5 }, { company: 'x'.repeat(151) }, { company: 'Other company' }, { membershipTier: 'gold' }, { membershipTier: 'corporate' }, { submissionId: '../escape' }, { submissionId: crypto.randomUUID() }, { updatedAt: Timestamp.fromMillis(0) }, { role: 'admin' }, { ownerUid: 'other' }];
  for (const [index, patch] of invalid.entries()) {
    const uid = `membership-invalid-${index}`;
    const db = member(uid);
    await assertFails(batchFor(db, uid, inquiry(), patch).commit());
    const valid = inquiry();
    assert.equal((await saveFirestoreInquiry(db, uid, valid)).ok, true);
    await assertFails(updateDoc(doc(db, 'membershipProfiles', uid), patch));
  }
  const uid = 'membership-missing-fields';
  const data = inquiry();
  const db = member(uid);
  for (const field of Object.keys(profile(data))) {
    const candidate = profile(data); delete candidate[field];
    await assertFails(setDoc(doc(db, 'membershipProfiles', uid), candidate));
  }
  await assertFails(batchFor(member('membership-wrong-owner'), 'membership-someone-else', inquiry()).commit());
});

test('a delegate can apply with its immutable shared mailbox only while its parent remains enabled', async () => {
  const parentUid = 'membership-parent';
  const uid = 'membership-delegate';
  const shared = 'shared@gmail.com';
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'admins', parentUid), { enabled: true });
    await setDoc(doc(context.firestore(), 'admins', uid), { enabled: true, parentUid, email: shared, username: 'admin1' });
  });
  const db = member(uid, { email: 'shared+dusaccom-admin1@gmail.com' });
  assert.equal((await saveFirestoreInquiry(db, uid, inquiry({ email: shared }))).ok, true);
  await environment.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), 'admins', parentUid), { enabled: false }));
  await assert.rejects(saveFirestoreInquiry(db, uid, inquiry({ email: shared })));
});
