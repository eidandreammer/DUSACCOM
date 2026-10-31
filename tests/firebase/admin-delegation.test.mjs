import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteField, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

let environment;
const role = (parentUid, patch = {}) => ({ enabled: true, parentUid, displayName: 'Admin One', email: `${parentUid}@gmail.com`, username: 'admin1', createdAt: serverTimestamp(), ...patch });
const event = uid => ({ title: 'Delegated event', titleEs: '', description: 'A community gathering', descriptionEs: '', location: 'New York', category: 'Community', startsAt: '2027-01-15T23:00:00.000Z', timeZone: 'America/New_York', status: 'confirmed', registration: 'open', createdBy: uid, createdAt: serverTimestamp() });
const rootDb = uid => environment.authenticatedContext(uid, { email: `${uid}@gmail.com` }).firestore();
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-dusaccom', firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  await environment.withSecurityRulesDisabled(async context => {
    for (const uid of ['team-root', 'team-other-root', 'team-disabled-root', 'team-revocation-root']) {
      await setDoc(doc(context.firestore(), 'admins', uid), { enabled: uid !== 'team-disabled-root' });
    }
  });
});
after(async () => environment?.cleanup());

test('only roots can create one-level delegated admins with immutable parent and shared email', async () => {
  const parent = rootDb('team-root');
  const member = rootDb('team-member');
  await assertSucceeds(setDoc(doc(parent, 'admins', 'team-child'), role('team-root')));
  const child = rootDb('team-child');
  await assertSucceeds(getDoc(doc(child, 'admins', 'team-root')));
  await assertFails(getDoc(doc(child, 'admins', 'team-other-root')));
  await assertFails(setDoc(doc(child, 'admins', 'team-grandchild'), role('team-child')));
  await assertFails(setDoc(doc(child, 'admins', 'team-forged-child'), role('team-root')));
  await assertFails(setDoc(doc(member, 'admins', 'team-member'), { enabled: true }));
  await assertFails(setDoc(doc(parent, 'admins', 'team-new-root'), { enabled: true }));
  await assertFails(setDoc(doc(parent, 'admins', 'team-wrong-parent'), role('team-other-root')));
  await assertFails(setDoc(doc(parent, 'admins', 'team-wrong-email'), role('team-root', { email: 'someone-else@gmail.com' })));
  await assertFails(setDoc(doc(rootDb('team-disabled-root'), 'admins', 'team-disabled-child'), role('team-disabled-root')));
  for (const patch of [{ canManageAdmins: true }, { parentUid: null }, { username: 'Bad User' }, { displayName: ' ' }, { email: 'bad' }]) {
    await assertFails(setDoc(doc(parent, 'admins', 'team-invalid-child'), role('team-root', patch)));
  }
  for (const patch of [{ parentUid: null }, { parentUid: 'team-other-root' }, { parentUid: deleteField() }, { username: 'changed' }, { email: 'other@gmail.com' }, { canManageAdmins: true }]) {
    await assertFails(updateDoc(doc(parent, 'admins', 'team-child'), patch));
    await assertFails(updateDoc(doc(child, 'admins', 'team-child'), patch));
  }
  const batch = writeBatch(child);
  batch.set(doc(child, 'admins', 'team-child'), { enabled: true });
  batch.set(doc(child, 'admins', 'team-batch-grandchild'), role('team-child'));
  await assertFails(batch.commit());
});

test('parents can query and disable only their own delegates', async () => {
  const parent = rootDb('team-other-root');
  await assertSucceeds(setDoc(doc(parent, 'admins', 'team-other-child'), role('team-other-root')));
  await assertSucceeds(getDocs(query(collection(parent, 'admins'), where('parentUid', '==', 'team-other-root'), limit(500))));
  await assertFails(getDocs(collection(parent, 'admins')));
  await assertFails(getDocs(query(collection(parent, 'admins'), where('parentUid', '==', 'team-root'), limit(500))));
  await assertFails(getDocs(query(collection(rootDb('team-other-child'), 'admins'), where('parentUid', '==', 'team-other-child'), limit(500))));
  await assertFails(updateDoc(doc(parent, 'admins', 'team-child'), { enabled: false }));
  await assertSucceeds(updateDoc(doc(parent, 'admins', 'team-other-child'), { enabled: false }));
  await assertFails(setDoc(doc(rootDb('team-other-child'), 'events', 'team-disabled-publish'), event('team-other-child')));
  await assertSucceeds(updateDoc(doc(parent, 'admins', 'team-other-child'), { enabled: true }));
});

test('delegates manage all events and lose access when their root is revoked', async () => {
  const parent = rootDb('team-revocation-root');
  await assertSucceeds(setDoc(doc(parent, 'admins', 'team-revocation-child'), role('team-revocation-root')));
  await assertSucceeds(setDoc(doc(parent, 'events', 'team-parent-event'), event('team-revocation-root')));
  const child = rootDb('team-revocation-child');
  await assertSucceeds(setDoc(doc(child, 'events', 'team-child-event'), event('team-revocation-child')));
  await assertSucceeds(updateDoc(doc(child, 'events', 'team-parent-event'), { title: 'Edited by delegate' }));
  await assertSucceeds(updateDoc(doc(child, 'events', 'team-child-event'), { registration: 'closed' }));
  await assertFails(updateDoc(doc(child, 'admins', 'team-revocation-root'), { enabled: false }));
  await environment.withSecurityRulesDisabled(async context => { await updateDoc(doc(context.firestore(), 'admins', 'team-revocation-root'), { enabled: false }); });
  await assertFails(updateDoc(doc(child, 'events', 'team-parent-event'), { title: 'Unauthorized after revocation' }));
  await assertFails(setDoc(doc(child, 'events', 'team-after-revocation'), event('team-revocation-child')));
});
