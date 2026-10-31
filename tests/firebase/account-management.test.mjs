import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteApp, initializeApp } from 'firebase/app';
import { applyActionCode, connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, setDoc, terminate, updateDoc, where } from 'firebase/firestore';

test('password and verified email changes preserve the account and reject a wrong password', async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Local emulators only.');
  Object.assign(process.env, { NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-test-key', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-dusaccom', NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:settings-test' });
  const { getFirebase } = await import('../../src/lib/firebase.ts');
  const { changeAccountName, changeAccountPassword, changeAccountEmail } = await import('../../src/lib/account-management.ts');
  const { auth, db } = getFirebase();
  const host = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
  connectAuthEmulator(auth, host, { disableWarnings: true });
  const email = `settings-${crypto.randomUUID()}@example.invalid`;
  const nextEmail = `changed-${crypto.randomUUID()}@example.invalid`;
  const password = `${crypto.randomUUID()}-Aa9!`;
  const nextPassword = `${crypto.randomUUID()}-Bb8!`;
  let uid;
  try {
    uid = (await createUserWithEmailAndPassword(auth, email, password)).user.uid;
    await changeAccountName('Updated account name');
    assert.equal(auth.currentUser.displayName, 'Updated account name');
    await assert.rejects(changeAccountPassword('wrong-password', nextPassword));
    await changeAccountPassword(password, nextPassword);
    await signOut(auth);
    await assert.rejects(signInWithEmailAndPassword(auth, email, password));
    assert.equal((await signInWithEmailAndPassword(auth, email, nextPassword)).user.uid, uid);
    await changeAccountEmail(nextPassword, nextEmail, 'en');
    assert.equal(auth.currentUser.email, email, 'Unverified email must not replace the current address.');
    const codes = await (await fetch(`${host}/emulator/v1/projects/demo-dusaccom/oobCodes`)).json();
    const code = codes.oobCodes.find(code => code.newEmail === nextEmail);
    assert.ok(code, 'Verification email is recorded locally, never sent.');
    await applyActionCode(auth, code.oobCode);
    await signOut(auth);
    assert.equal((await signInWithEmailAndPassword(auth, nextEmail, nextPassword)).user.uid, uid);
  } finally {
    if (uid) await fetch(`${host}/identitytoolkit.googleapis.com/v1/projects/demo-dusaccom/accounts:delete`, { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: uid }) });
    await terminate(db);
    await deleteApp(auth.app);
  }
});

test('deletion requests are private and every client write or approval is denied', async () => {
  const environment = await initializeTestEnvironment({ projectId: 'demo-dusaccom', firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  try {
    await environment.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await setDoc(doc(db, 'admins', 'delete-parent'), { enabled: true });
      await setDoc(doc(db, 'admins', 'delete-other'), { enabled: true });
      await setDoc(doc(db, 'accountDeletionRequests', 'delete-child'), { targetUid: 'delete-child', parentUid: 'delete-parent', status: 'pending', requestedAt: Date.now() });
      await setDoc(doc(db, 'accountDeletionChallenges', 'delete-child'), { hash: 'private-hash' });
    });
    for (const uid of ['delete-child', 'delete-parent']) {
      const db = environment.authenticatedContext(uid).firestore();
      const request = doc(db, 'accountDeletionRequests', 'delete-child');
      await assertSucceeds(getDoc(request));
      await assertFails(updateDoc(request, { status: 'approved' }));
      await assertFails(deleteDoc(request));
      await assertFails(setDoc(doc(db, 'accountDeletionRequests', uid), { parentUid: uid, status: 'approved' }));
      await assertFails(getDoc(doc(db, 'accountDeletionChallenges', 'delete-child')));
      await assertFails(setDoc(doc(db, 'accountDeletionChallenges', uid), { hash: 'forged' }));
    }
    const parent = environment.authenticatedContext('delete-parent').firestore();
    await assertSucceeds(getDocs(query(collection(parent, 'accountDeletionRequests'), where('parentUid', '==', 'delete-parent'), limit(500))));
    await assertFails(getDocs(collection(parent, 'accountDeletionRequests')));
    for (const db of [environment.authenticatedContext('delete-other').firestore(), environment.unauthenticatedContext().firestore()]) {
      await assertFails(getDoc(doc(db, 'accountDeletionRequests', 'delete-child')));
      await assertFails(getDocs(query(collection(db, 'accountDeletionRequests'), where('parentUid', '==', 'delete-parent'), limit(500))));
    }
  } finally { await environment.cleanup(); }
});

test('the HTTPS function verifies real emulator tokens and deletes only a parent’s delegate', async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Local emulators only.');
  assert.ok(process.env.ACCOUNT_API_EMULATOR_URL, 'Run test:rules with the Functions emulator.');
  const require = createRequire(new URL('../../functions/package.json', import.meta.url));
  const { initializeApp: initializeAdminApp, deleteApp: deleteAdminApp } = require('firebase-admin/app');
  const { getAuth: getAdminAuth } = require('firebase-admin/auth');
  const { getFirestore: getAdminFirestore } = require('firebase-admin/firestore');
  const adminApp = initializeAdminApp({ projectId: 'demo-dusaccom' }, 'api-integration');
  const adminAuth = getAdminAuth(adminApp);
  const db = getAdminFirestore(adminApp);
  const app = initializeApp({ projectId: 'demo-dusaccom', apiKey: 'demo-test-key' }, 'api-integration');
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  const password = `${crypto.randomUUID()}-Aa9!`;
  const parent = await adminAuth.createUser({ email: `api-parent-${crypto.randomUUID()}@gmail.com`, password });
  const delegate = await adminAuth.createUser({ email: `api-child-${crypto.randomUUID()}@gmail.com`, password });
  const member = await adminAuth.createUser({ email: `api-member-${crypto.randomUUID()}@gmail.com`, password });
  const call = async (path, token, body = {}) => fetch(`${process.env.ACCOUNT_API_EMULATOR_URL}/${path}`, { method: 'POST', headers: { Origin: 'https://dusaccom.web.app', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    await db.doc(`admins/${parent.uid}`).set({ enabled: true });
    await db.doc(`admins/${delegate.uid}`).set({ enabled: true, parentUid: parent.uid });
    assert.equal((await call('availability', 'invalid-token')).status, 401);
    const childToken = await (await signInWithEmailAndPassword(auth, delegate.email, password)).user.getIdToken();
    assert.equal((await call('deletion-request', childToken)).status, 200);
    assert.equal((await call('begin-self-deletion', childToken)).status, 403);
    assert.equal((await db.doc(`accountDeletionRequests/${delegate.uid}`).get()).data().parentUid, parent.uid);
    const parentToken = await (await signInWithEmailAndPassword(auth, parent.email, password)).user.getIdToken();
    assert.equal((await call('delete-delegate', parentToken, { targetUid: member.uid })).status, 403);
    assert.equal((await call('delete-delegate', parentToken, { targetUid: delegate.uid })).status, 200);
    await assert.rejects(adminAuth.getUser(delegate.uid), { code: 'auth/user-not-found' });
    assert.equal((await db.doc(`admins/${delegate.uid}`).get()).exists, false);
    assert.equal((await call('deletion-request', childToken)).status, 401, 'Deleted tokens must be rejected.');
    const memberToken = await (await signInWithEmailAndPassword(auth, member.email, password)).user.getIdToken();
    const confirmation = await (await call('begin-self-deletion', memberToken)).json();
    assert.ok(confirmation.confirmation);
    assert.equal((await call('delete-self', memberToken, { confirmation: confirmation.confirmation })).status, 409);
    // Elapse the server challenge without adding five seconds to every test run.
    await db.doc(`accountDeletionChallenges/${member.uid}`).update({ createdAt: Date.now() - 5100 });
    assert.equal((await call('delete-self', memberToken, { confirmation: confirmation.confirmation })).status, 200);
    await assert.rejects(adminAuth.getUser(member.uid), { code: 'auth/user-not-found' });
  } finally {
    for (const uid of [parent.uid, delegate.uid, member.uid]) {
      await adminAuth.deleteUser(uid).catch(() => {});
      await Promise.all(['admins', 'accountDeletionRequests', 'accountDeletionChallenges'].map(collection => db.doc(`${collection}/${uid}`).delete()));
    }
    await deleteApp(app);
    await db.terminate();
    await deleteAdminApp(adminApp);
  }
});
