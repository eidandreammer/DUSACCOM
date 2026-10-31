import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteApp } from 'firebase/app';
import { connectAuthEmulator, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, deleteDoc, doc, getDocFromServer, terminate } from 'firebase/firestore';

test('explicit account consent, new signup, existing-email sign-in and membership profile persistence work together', async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Use local emulators only.');
  const projectId = 'demo-dusaccom';
  Object.assign(process.env, { NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-test-key', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost', NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId, NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:membership-test' });
  const { getFirebase } = await import('../../src/lib/firebase.ts');
  const { createMembershipAccount, signInForMembership } = await import('../../src/lib/membership-account.ts');
  const { submitFirebaseInquiry } = await import('../../src/lib/firestore-inquiries.ts');
  const environment = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  const { auth, db } = getFirebase();
  const host = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
  connectAuthEmulator(auth, host, { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const email = `membership-${crypto.randomUUID()}@example.invalid`;
  const password = `${crypto.randomUUID()}-Aa9!`;
  const values = { agreeToCreateAccount: true, email, password, confirmation: password, name: 'Membership Applicant' };
  const input = { kind: 'membership', name: values.name, email, company: 'Applicant Organization', interest: 'nonprofit', message: 'Please consider our membership application.', consent: true, website: '', submissionId: crypto.randomUUID() };
  let uid;
  try {
    await assert.rejects(submitFirebaseInquiry(input), /membership\/sign-in-required/);
    await assert.rejects(createMembershipAccount({ ...values, agreeToCreateAccount: false }));
    assert.equal(auth.currentUser, null, 'Declining account creation must not create or sign into a login.');
    await assert.rejects(createMembershipAccount({ ...values, confirmation: 'different-password' }));
    assert.equal(auth.currentUser, null);
    uid = (await createMembershipAccount(values)).uid;
    assert.equal(auth.currentUser.displayName, values.name);
    await assert.rejects(submitFirebaseInquiry({ ...input, email: 'another@example.com' }), /membership\/email-mismatch/);
    const receipt = await submitFirebaseInquiry(input);
    assert.equal(receipt.ok, true);
    const profile = (await getDocFromServer(doc(db, 'membershipProfiles', uid))).data();
    assert.equal(profile.company, input.company);
    assert.equal(profile.membershipTier, input.interest);
    assert.equal(profile.status, 'submitted');
    await signOut(auth);
    await assert.rejects(createMembershipAccount(values), { code: 'auth/email-already-in-use' });
    assert.equal((await signInForMembership(email, password)).uid, uid);
    assert.equal((await getDocFromServer(doc(db, 'membershipProfiles', uid))).data().company, input.company);
    assert.deepEqual(await submitFirebaseInquiry(input), receipt);
  } finally {
    if (uid) {
      await fetch(`${host}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`, { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: uid }) });
      await environment.withSecurityRulesDisabled(async context => {
        for (const [collection, id] of [['membershipProfiles', uid], ['inquiryLimits', uid], ['inquiries', input.submissionId]]) await deleteDoc(doc(context.firestore(), collection, id));
      });
    }
    await terminate(db); await deleteApp(auth.app); await environment.cleanup();
  }
});
