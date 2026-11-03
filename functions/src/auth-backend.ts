import type { Auth } from 'firebase-admin/auth';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { AuthError, ATTEMPT_WINDOW_MS, MAX_FAILURES, type AuthStore, type IdentityProvider, type Session } from './auth-handler';

export function firebaseAuthBackend(db: Firestore, auth: Auth) {
  const sessions = db.collection('authSessions'); const limits = db.collection('authAttempts');
  const store: AuthStore = {
    async reserve(keys, now) {
      return db.runTransaction(async transaction => {
        const refs = keys.map(key => limits.doc(key)); const snapshots = await transaction.getAll(...refs);
        const counters = snapshots.map(snapshot => { const data = snapshot.data(); return !data || data.windowStart + ATTEMPT_WINDOW_MS <= now ? { count: 0, windowStart: now } : { count: data.count, windowStart: data.windowStart }; });
        if (counters.some(counter => !Number.isInteger(counter.count) || counter.count >= MAX_FAILURES)) return null;
        refs.forEach((ref, index) => transaction.set(ref, { count: counters[index].count + 1, windowStart: counters[index].windowStart, cleanupAt: Timestamp.fromMillis(counters[index].windowStart + 2 * ATTEMPT_WINDOW_MS) }));
        return keys.map((key, index) => ({ key, windowStart: counters[index].windowStart }));
      });
    },
    async release(reservation) {
      await db.runTransaction(async transaction => {
        const refs = reservation.map(item => limits.doc(item.key)); const snapshots = await transaction.getAll(...refs);
        refs.forEach((ref, index) => { const data = snapshots[index].data(); if (data && data.windowStart === reservation[index].windowStart) transaction.update(ref, { count: Math.max(0, data.count - 1) }); });
      });
    },
    async get(id) { return (await sessions.doc(id).get()).data() as Session | undefined; },
    async put(id, session) { await sessions.doc(id).create({ ...session, cleanupAt: Timestamp.fromMillis(session.expiresAt) }); },
    async touch(id, at) { await sessions.doc(id).update({ lastSeen: at }); },
    async remove(id) { await sessions.doc(id).delete(); },
    async removeForUser(uid) {
      // No client-supplied filter or session ID can select another user's sessions.
      while (true) { const page = await sessions.where('uid', '==', uid).limit(400).get(); if (page.empty) break; const batch = db.batch(); page.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); }
    },
  };
  const emulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST && (process.env.GCLOUD_PROJECT || '').startsWith('demo-'));
  const ready = () => emulator || Boolean(process.env.AUTH_SERVER_API_KEY && process.env.AUTH_PUBLIC_KEYS_RESTRICTED === 'true');
  async function call(method: string, body: object, lang?: string) {
    if (!ready()) throw new AuthError('auth/temporarily-unavailable', 503);
    const base = emulator ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1` : 'https://identitytoolkit.googleapis.com/v1';
    const key = emulator ? 'demo-test-key' : process.env.AUTH_SERVER_API_KEY!;
    let response: Response;
    try { response = await fetch(`${base}/accounts:${method}?key=${encodeURIComponent(key)}`, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', ...(lang ? { 'X-Firebase-Locale': lang } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) }); }
    catch { throw new AuthError('auth/temporarily-unavailable', 503); }
    const value = await response.json().catch(() => null) as { localId?: string; idToken?: string; error?: { message?: string } } | null;
    if (!response.ok) {
      if (method === 'sendOobCode' && value?.error?.message === 'EMAIL_NOT_FOUND') return {};
      if (response.status >= 500) throw new AuthError('auth/temporarily-unavailable', 503);
      throw new AuthError('auth/invalid-credential');
    }
    return value || {};
  }
  const provider: IdentityProvider = {
    async password(email, password) {
      const result = await call('signInWithPassword', { email, password, returnSecureToken: true });
      if (!result.localId || !result.idToken) throw new AuthError('auth/invalid-credential');
      return { uid: result.localId, idToken: result.idToken };
    },
    async create(email, password, displayName) {
      try { const user = await auth.createUser({ email, password, displayName }); return { uid: user.uid, email: user.email, displayName: user.displayName }; }
      catch { throw new AuthError('auth/unable-to-create-account', 400); }
    },
    async user(uid) {
      try { const user = await auth.getUser(uid); return { uid: user.uid, email: user.email, displayName: user.displayName, disabled: user.disabled, validAfter: Date.parse(user.tokensValidAfterTime || '') || 0 }; }
      catch { throw new AuthError('auth/sign-in-required'); }
    },
    token: (uid, sessionId) => auth.createCustomToken(uid, { sessionId }),
    async update(uid, value) { await auth.updateUser(uid, value); },
    async reset(email, lang, continueUrl) { await call('sendOobCode', { requestType: 'PASSWORD_RESET', email, continueUrl }, lang); },
    async email(idToken, newEmail, lang) { await call('sendOobCode', { requestType: 'VERIFY_AND_CHANGE_EMAIL', idToken, newEmail, continueUrl: 'https://dusaccom.web.app/account/' }, lang); },
    revoke: uid => auth.revokeRefreshTokens(uid),
    async createDelegate(parentUid, input) {
      const parent = await auth.getUser(parentUid); const role = (await db.doc(`admins/${parentUid}`).get()).data();
      if (role?.enabled !== true || role.parentUid != null || !parent.email || !/^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(parent.email)) throw new AuthError('auth/forbidden', 403);
      const [local, domain] = parent.email.toLowerCase().split('@'); const alias = `${local}+dusaccom-${input.username}`;
      if (alias.length > 64) throw new AuthError('auth/invalid-request', 400);
      const child = await auth.createUser({ email: `${alias}@${domain}`, password: input.password, displayName: input.displayName });
      try {
        await db.runTransaction(async transaction => {
          const current = (await transaction.get(db.doc(`admins/${parentUid}`))).data();
          if (current?.enabled !== true || current.parentUid != null) throw new AuthError('auth/forbidden', 403);
          transaction.create(db.doc(`admins/${child.uid}`), { enabled: true, parentUid, displayName: input.displayName, username: input.username, email: parent.email!.toLowerCase(), createdAt: Timestamp.now() });
        });
      } catch (error) { await auth.deleteUser(child.uid); throw error; }
    },
  };
  return { store, provider, ready };
}
