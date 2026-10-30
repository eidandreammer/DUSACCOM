import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, deleteDoc, deleteField, Timestamp, where } from 'firebase/firestore';

let environment;
const payload = uid => ({ title: 'Community event', titleEs: '', description: 'Meet the chamber', descriptionEs: '', location: 'New York', category: 'Networking', startsAt: '2027-01-15T23:00:00.000Z', timeZone: 'America/New_York', status: 'confirmed', registration: 'open', createdBy: uid, createdAt: serverTimestamp() });
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-dusaccom', firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  await environment.withSecurityRulesDisabled(async context => { await Promise.all(['admin', 'creator-admin', 'other-admin'].map(uid => setDoc(doc(context.firestore(), 'admins', uid), { enabled: true }))); });
});
after(async () => environment?.cleanup());
test('only trusted admins publish and public queries see confirmed events', async () => {
  const admin = environment.authenticatedContext('admin').firestore();
  const member = environment.authenticatedContext('member').firestore();
  const visitor = environment.unauthenticatedContext().firestore();
  await assertFails(setDoc(doc(visitor, 'events', 'anonymous'), payload('anonymous')));
  await assertFails(setDoc(doc(member, 'events', 'member'), payload('member')));
  await assertFails(setDoc(doc(member, 'admins', 'member'), { enabled: true }));
  await assertFails(getDoc(doc(member, 'admins', 'admin')));
  await assertSucceeds(getDoc(doc(member, 'admins', 'member')));
  await assertFails(setDoc(doc(admin, 'events', 'forged'), payload('other-user')));
  await assertSucceeds(setDoc(doc(admin, 'events', 'valid'), payload('admin')));
  await assertSucceeds(getDoc(doc(visitor, 'events', 'valid')));
  await assertSucceeds(getDocs(query(collection(visitor, 'events'), where('status', '==', 'confirmed'), limit(500))));
  await assertFails(getDocs(collection(visitor, 'events')));
  await assertFails(updateDoc(doc(admin, 'events', 'valid'), { title: '' }));
  await assertFails(updateDoc(doc(admin, 'events', 'valid'), { createdBy: 'other-user' }));
  await assertFails(updateDoc(doc(admin, 'events', 'valid'), { admin: true }));
  await assertSucceeds(updateDoc(doc(admin, 'events', 'valid'), { title: 'Updated community event' }));
  await assertSucceeds(setDoc(doc(admin, 'events', 'custom'), { ...payload('admin'), category: 'Community celebration' }));
  await assertSucceeds(updateDoc(doc(admin, 'events', 'custom'), { category: 'Cultural festival' }));
  await assertSucceeds(getDoc(doc(visitor, 'events', 'custom')));
  for (const category of ['', '   ', 'a'.repeat(61), 123, ['Workshop'], null]) {
    await assertFails(setDoc(doc(admin, 'events', 'bad-category'), { ...payload('admin'), category }));
    await assertFails(updateDoc(doc(admin, 'events', 'valid'), { category }));
  }
  await assertSucceeds(updateDoc(doc(admin, 'events', 'custom'), { category: 'a'.repeat(60) }));
  await assertFails(updateDoc(doc(member, 'events', 'custom'), { category: 'Member edit' }));
  await assertFails(updateDoc(doc(visitor, 'events', 'custom'), { category: 'Visitor edit' }));
  await assertFails(updateDoc(doc(admin, 'events', 'valid'), { createdAt: Timestamp.fromMillis(0) }));
  await assertFails(setDoc(doc(admin, 'events', 'old-timestamp'), { ...payload('admin'), createdAt: Timestamp.fromMillis(0) }));
  await assertFails(updateDoc(doc(admin, 'events', 'valid'), { category: deleteField() }));
  const { category: omitted, ...missingCategory } = payload('admin');
  await assertFails(setDoc(doc(admin, 'events', 'missing-category'), missingCategory));
  await assertFails(updateDoc(doc(admin, 'events', 'valid'), { status: 'draft' }));
  await assertFails(updateDoc(doc(admin, 'events', 'valid'), { registration: 'invalid' }));
  await assertFails(setDoc(doc(admin, 'events', 'extra-field'), { ...payload('admin'), extraData: true }));
  await assertFails(setDoc(doc(admin, 'events', 'orphan', 'private', 'child'), { value: 'hidden' }));
  await assertFails(getDoc(doc(visitor, 'events', 'orphan', 'private', 'child')));
  await environment.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(), 'events', 'draft'), { ...payload('admin'), status: 'draft' }); });
  await assertFails(getDoc(doc(visitor, 'events', 'draft')));
  await assertFails(getDocs(query(collection(visitor, 'events'), where('status', '==', 'draft'), limit(500))));
  await environment.withSecurityRulesDisabled(async context => { await updateDoc(doc(context.firestore(), 'admins', 'admin'), { enabled: false }); });
  await assertFails(setDoc(doc(admin, 'events', 'revoked'), payload('admin')));
  await assertFails(deleteDoc(doc(member, 'events', 'valid')));
});

test('every enabled administrator can read, edit and delete events created by another administrator', async () => {
  const creator = environment.authenticatedContext('creator-admin').firestore();
  const other = environment.authenticatedContext('other-admin').firestore();
  const member = environment.authenticatedContext('member').firestore();
  const visitor = environment.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(creator, 'events', 'shared-event'), payload('creator-admin')));
  const before = (await assertSucceeds(getDoc(doc(other, 'events', 'shared-event')))).data();
  await assertSucceeds(getDocs(query(collection(other, 'events'), where('status', '==', 'confirmed'), limit(500))));
  await assertSucceeds(updateDoc(doc(other, 'events', 'shared-event'), {
    title: 'Updated by a different admin', category: 'Community celebration', registration: 'closed',
    startsAt: '2025-01-15T23:00:00.000Z',
  }));
  const after = (await getDoc(doc(creator, 'events', 'shared-event'))).data();
  assert.equal(after.title, 'Updated by a different admin');
  assert.equal(after.createdBy, 'creator-admin');
  assert.ok(after.createdAt.isEqual(before.createdAt));
  await assertFails(updateDoc(doc(other, 'events', 'shared-event'), { createdBy: 'other-admin' }));
  await assertFails(updateDoc(doc(other, 'events', 'shared-event'), { title: '' }));
  await assertFails(updateDoc(doc(member, 'events', 'shared-event'), { title: 'Member edit' }));
  await assertFails(updateDoc(doc(visitor, 'events', 'shared-event'), { title: 'Guest edit' }));
  await assertFails(deleteDoc(doc(member, 'events', 'shared-event')));
  await assertFails(deleteDoc(doc(visitor, 'events', 'shared-event')));
  await assertSucceeds(deleteDoc(doc(other, 'events', 'shared-event')));
  await environment.withSecurityRulesDisabled(async context => { assert.equal((await getDoc(doc(context.firestore(), 'events', 'shared-event'))).exists(), false); });
});
