import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, connectFirestoreEmulator, deleteDoc, doc, getDocsFromServer, limit, query, setDoc, terminate, where } from 'firebase/firestore';

test('shared-email delegates get separate logins without replacing the parent session', async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Use local emulators only.');
  const projectId = 'demo-dusaccom';
  Object.assign(process.env, {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-test-key', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId, NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:team-test',
  });
  const { getFirebase } = await import('../../src/lib/firebase.ts');
  const { createDelegatedAdmin } = await import('../../src/lib/delegated-admins.ts');
  const { teamLoginEmail } = await import('../../src/lib/team-login.ts');
  const environment = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  const { auth, db } = getFirebase();
  const host = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
  connectAuthEmulator(auth, host, { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const email = `team-${crypto.randomUUID()}@gmail.com`;
  const password = `${crypto.randomUUID()}-Aa9!`;
  const childPassword = `${crypto.randomUUID()}-Bb8!`;
  const secondaryApp = initializeApp(auth.app.options, 'team-test-signin');
  const secondaryAuth = getAuth(secondaryApp);
  connectAuthEmulator(secondaryAuth, host, { disableWarnings: true });
  let rootUid;
  let childUid;
  try {
    const root = await createUserWithEmailAndPassword(auth, email, password);
    rootUid = root.user.uid;
    await environment.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(), 'admins', rootUid), { enabled: true }); });
    await createDelegatedAdmin({ displayName: 'Administrator One', username: 'Admin1', password: childPassword });
    assert.equal(auth.currentUser.uid, rootUid);
    const team = await getDocsFromServer(query(collection(db, 'admins'), where('parentUid', '==', rootUid), limit(500)));
    assert.equal(team.size, 1);
    const record = team.docs[0];
    childUid = record.id;
    assert.equal(record.data().email, email);
    assert.equal(record.data().username, 'admin1');
    assert.equal(record.data().parentUid, rootUid);
    assert.equal(record.data().password, undefined);
    const child = await signInWithEmailAndPassword(secondaryAuth, teamLoginEmail(email, 'admin1'), childPassword);
    assert.equal(child.user.uid, childUid);
    assert.notEqual(child.user.uid, rootUid);
    assert.equal(auth.currentUser.uid, rootUid);
    await assert.rejects(createDelegatedAdmin({ displayName: 'Duplicate Name', username: 'admin1', password: childPassword }), { code: 'auth/email-already-in-use' });
    assert.equal(auth.currentUser.uid, rootUid);
    await sendPasswordResetEmail(secondaryAuth, teamLoginEmail(email, 'admin1'), { url: 'https://dusaccom.web.app/account/' });
    const codes = await (await fetch(`${host}/emulator/v1/projects/${projectId}/oobCodes`)).json();
    assert.ok(codes.oobCodes.some(code => code.email === teamLoginEmail(email, 'admin1') && code.requestType === 'PASSWORD_RESET'));
    await signInWithEmailAndPassword(auth, teamLoginEmail(email, 'admin1'), childPassword);
    await assert.rejects(createDelegatedAdmin({ displayName: 'Unauthorized Child', username: 'admin2', password: childPassword }), /team\/permission-denied/);
  } finally {
    for (const uid of [childUid, rootUid].filter(Boolean)) {
      const response = await fetch(`${host}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`, {
        method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: uid }),
      });
      assert.equal(response.status, 200);
      await environment.withSecurityRulesDisabled(async context => { await deleteDoc(doc(context.firestore(), 'admins', uid)); });
    }
    await terminate(db);
    await Promise.all([deleteApp(auth.app), deleteApp(secondaryApp)]);
    await environment.cleanup();
  }
});
