import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, deleteUser, getAuth, sendPasswordResetEmail, signInAnonymously, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';

test('member sign-in, profile, password-reset request and guest identity stay separate', async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'This test may only run against the local Auth emulator.');
  const config = { projectId: 'demo-dusaccom', apiKey: 'demo-test-key' };
  const memberApp = initializeApp(config, 'auth-test-member');
  const guestApp = initializeApp(config, 'auth-test-guest');
  const member = getAuth(memberApp);
  const guest = getAuth(guestApp);
  const host = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
  connectAuthEmulator(member, host, { disableWarnings: true });
  connectAuthEmulator(guest, host, { disableWarnings: true });
  const email = `qa-${crypto.randomUUID()}@example.invalid`;
  const password = `${crypto.randomUUID()}-Aa9!`;
  try {
    const created = await createUserWithEmailAndPassword(member, email, password);
    await updateProfile(created.user, { displayName: 'Deployment verification' });
    const uid = created.user.uid;
    assert.equal(member.currentUser.displayName, 'Deployment verification');
    await signInAnonymously(guest);
    assert.equal(guest.currentUser.isAnonymous, true);
    assert.equal(member.currentUser.uid, uid);
    assert.notEqual(guest.currentUser.uid, uid);
    await signOut(member);
    assert.equal(member.currentUser, null);
    assert.ok(guest.currentUser);
    assert.equal((await signInWithEmailAndPassword(member, email, password)).user.uid, uid);
    // The emulator records the reset link locally and sends no email.
    await sendPasswordResetEmail(member, email);
    const response = await fetch(`${host}/emulator/v1/projects/demo-dusaccom/oobCodes`);
    const body = await response.json();
    assert.ok(body.oobCodes.some(code => code.email === email && code.requestType === 'PASSWORD_RESET'));
  } finally {
    if (member.currentUser) await deleteUser(member.currentUser);
    if (guest.currentUser) await deleteUser(guest.currentUser);
    await Promise.all([deleteApp(memberApp), deleteApp(guestApp)]);
  }
});
