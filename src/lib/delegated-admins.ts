import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, deleteUser, inMemoryPersistence, initializeAuth, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { adminAccess } from './admin-access';
import { getFirebase } from './firebase';
import { delegatedAdminInput, teamLoginEmail } from './team-login';
import { accountRequest } from './account-management';

export async function createDelegatedAdmin(input: unknown) {
  const values = delegatedAdminInput.parse(input);
  const { auth, db } = getFirebase();
  const parent = auth.currentUser;
  if (!parent?.email || !adminAccess((await getDoc(doc(db, 'admins', parent.uid))).data()).canManageAdmins) {
    throw new Error('team/permission-denied');
  }
  const email = parent.email.trim().toLowerCase();
  const loginEmail = teamLoginEmail(email, values.username);
  const app = initializeApp(auth.app.options, `team-create-${crypto.randomUUID()}`);
  const secondary = initializeAuth(app, { persistence: inMemoryPersistence });
  if (auth.emulatorConfig) {
    const { protocol, host, port } = auth.emulatorConfig;
    connectAuthEmulator(secondary, `${protocol}://${host}:${port}`, { disableWarnings: true });
  }
  let created: Awaited<ReturnType<typeof createUserWithEmailAndPassword>> | undefined;
  let assigned = false;
  try {
    created = await createUserWithEmailAndPassword(secondary, loginEmail, values.password);
    await updateProfile(created.user, { displayName: values.displayName });
    if (auth.currentUser?.uid !== parent.uid) throw new Error('team/permission-denied');
    // This write uses the parent's session; the secondary login never replaces it.
    await setDoc(doc(db, 'admins', created.user.uid), {
      enabled: true, parentUid: parent.uid, displayName: values.displayName,
      email, username: values.username, createdAt: serverTimestamp(),
    });
    assigned = true;
  } catch (error) {
    if (created && !assigned) {
      try { await deleteUser(created.user); }
      catch {
        try { await accountRequest('discard-unassigned-delegate', { targetUid: created.user.uid, username: values.username }); }
        catch { throw new Error('team/cleanup-required'); }
      }
    }
    throw error;
  } finally {
    try { await signOut(secondary); } finally { await deleteApp(app); }
  }
}

export async function setDelegatedAdminEnabled(uid: string, enabled: boolean) {
  await updateDoc(doc(getFirebase().db, 'admins', uid), { enabled });
}
