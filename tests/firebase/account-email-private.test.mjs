import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

test('members, administrators, and guests cannot read or forge account mail or its throttles', async () => {
  const environment = await initializeTestEnvironment({ projectId: 'demo-dusaccom', firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  try {
    await environment.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'admins', 'mail-admin'), { enabled: true });
      await setDoc(doc(context.firestore(), 'accountEmailOutbox', 'private-mail'), { to: 'private@example.invalid', status: 'ready' });
      await setDoc(doc(context.firestore(), 'accountEmailLimits', 'mail-member'), { at: Date.now() });
    });
    for (const context of [environment.authenticatedContext('mail-member'), environment.authenticatedContext('mail-admin'), environment.unauthenticatedContext()]) {
      for (const [name, id] of [['accountEmailOutbox', 'private-mail'], ['accountEmailLimits', 'mail-member'], ['authAttempts', 'private-attempt']]) {
        const db = context.firestore(), record = doc(db, name, id);
        await assertFails(getDoc(record));
        await assertFails(getDocs(collection(db, name)));
        await assertFails(setDoc(doc(db, name, 'forged'), { to: 'attacker@example.invalid', status: 'ready' }));
        await assertFails(updateDoc(record, { status: 'ready', at: 0 }));
        await assertFails(deleteDoc(record));
      }
    }
  } finally { await environment.cleanup(); }
});
