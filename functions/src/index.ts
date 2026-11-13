import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { createAccountHandler, type AccountStore, type Challenge, type DeletionRequest, type Role } from './account-handler';

initializeApp();
const db = getFirestore();
const auth = getAuth();
const store: AccountStore = {
  async role(uid) { return (await db.doc(`admins/${uid}`).get()).data() as Role | undefined; },
  async disable(uid) { await db.doc(`admins/${uid}`).update({ enabled: false }); },
  async removeRole(uid) {
    await db.batch().delete(db.doc(`admins/${uid}`)).delete(db.doc(`membershipProfiles/${uid}`)).commit();
  },
  async hasDelegates(uid) { return !(await db.collection('admins').where('parentUid', '==', uid).limit(1).get()).empty; },
  async request(uid) { return (await db.doc(`accountDeletionRequests/${uid}`).get()).data() as DeletionRequest | undefined; },
  async saveRequest(uid, request) { await db.doc(`accountDeletionRequests/${uid}`).set(request); },
  async challenge(uid) { return (await db.doc(`accountDeletionChallenges/${uid}`).get()).data() as Challenge | undefined; },
  async saveChallenge(uid, challenge) { await db.doc(`accountDeletionChallenges/${uid}`).set(challenge); },
  async removeChallenge(uid) { await db.doc(`accountDeletionChallenges/${uid}`).delete(); },
  async authUser(uid) {
    try { const user = await auth.getUser(uid); return { email: user.email, createdAt: Date.parse(user.metadata.creationTime) }; }
    catch (error) { if ((error as { code?: string }).code === 'auth/user-not-found') return undefined; throw error; }
  },
  async deleteAuthUser(uid) {
    try { await auth.deleteUser(uid); }
    catch (error) { if ((error as { code?: string }).code !== 'auth/user-not-found') throw error; }
  },
};
// Fail closed until standard Firebase client deletion is blocked project-wide.
// Otherwise a delegate could bypass the parent's approval with accounts:delete.
async function isEnabled() {
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST && project?.startsWith('demo-')) return true;
  if (!project) return false;
  const token = await applicationDefault().getAccessToken();
  const response = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${encodeURIComponent(project)}/config`, {
    headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return false;
  const config = await response.json() as { client?: { permissions?: { disabledUserDeletion?: boolean } } };
  return config.client?.permissions?.disabledUserDeletion === true;
}
const handler = createAccountHandler({ store, isEnabled, origins: ['https://dusaccnj.org', 'https://dusaccom.web.app', 'https://dusaccom.firebaseapp.com'], verify: async token => {
  const decoded = await auth.verifyIdToken(token, true);
  return { uid: decoded.uid, email: decoded.email, authTime: decoded.auth_time * 1000 };
} });

export const accountApi = onRequest({
  region: 'us-east4', minInstances: 0, maxInstances: 1, concurrency: 10,
  timeoutSeconds: 60, memory: '256MiB', invoker: 'public',
  serviceAccount: 'dusaccom-accounts@969342544667.iam.gserviceaccount.com',
}, async (req, res) => {
  const rawBody = req.rawBody || Buffer.alloc(0);
  if (rawBody.length > 2048) { res.status(413).json({ error: 'account/invalid-request' }); return; }
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) if (value != null) headers.set(name, Array.isArray(value) ? value.join(',') : value);
  const response = await handler(new Request(`https://dusaccom.web.app${req.originalUrl}`, {
    method: req.method, headers, ...(req.method === 'GET' || req.method === 'HEAD' ? {} : { body: rawBody.toString('utf8') }),
  }));
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
});

// Auth action emails (reset, verification, address changes) use Resend SMTP in
// Identity Platform. These handlers add the account lifecycle/security notices.
import { region } from 'firebase-functions/v1';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { deliverAccountEmail, type AccountEmailKind } from './account-email';
import { createPasswordHandler } from './password-handler';

const resendApiKey = defineSecret('RESEND_API_KEY');
const emailEnabled = () => process.env.ACCOUNT_EMAILS_ENABLED === 'true' && !process.env.FUNCTIONS_EMULATOR && !process.env.FIREBASE_AUTH_EMULATOR_HOST;
const outbox = db.collection('accountEmailOutbox');
async function queueLifecycle(kind: AccountEmailKind, user: { uid: string; email?: string; displayName?: string }, eventId: string) {
  if (!emailEnabled() || !user.email) return;
  const id = createHash('sha256').update(eventId).digest('hex');
  try { await outbox.doc(id).create({ kind, to: user.email, name: user.displayName || '', status: 'ready', createdAt: Date.now() }); }
  catch (error) { if ((error as { code?: number }).code !== 6) throw error; }
}
const lifecycle = region('us-east4').runWith({ failurePolicy: true, serviceAccount: 'dusaccom-accounts@969342544667.iam.gserviceaccount.com' }).auth.user();
export const accountCreatedEmail = lifecycle.onCreate((user, context) => queueLifecycle('welcome', user, context.eventId));
export const accountDeletedEmail = lifecycle.onDelete((user, context) => queueLifecycle('account-deleted', user, context.eventId));

export const deliverAccountEmailOutbox = onDocumentWritten({
  document: 'accountEmailOutbox/{emailId}', region: 'us-east4',
  secrets: [resendApiKey], retry: true, maxInstances: 2, concurrency: 1,
  serviceAccount: 'dusaccom-accounts@969342544667.iam.gserviceaccount.com',
}, async event => {
  const snapshot = event.data?.after;
  if (!snapshot) return;
  const message = (await snapshot.ref.get()).data();
  if (!message || message.status !== 'ready') return;
  // Resend retains idempotency keys for 24 hours. Stop before that boundary
  // instead of risking a duplicate when infrastructure retries an old event.
  if (!emailEnabled() || Date.now() - message.createdAt > 23 * 60 * 60_000) {
    await snapshot.ref.set({ status: 'expired', finishedAt: FieldValue.serverTimestamp() });
    return;
  }
  const receipt = await deliverAccountEmail({ id: snapshot.id, kind: message.kind, to: message.to, name: message.name, lang: message.lang }, resendApiKey.value());
  // Remove personal content after acceptance; retain the provider receipt.
  await snapshot.ref.set({ status: 'sent', receipt, finishedAt: FieldValue.serverTimestamp() });
});

const passwordHandler = createPasswordHandler({
  enabled: emailEnabled,
  verify: async token => {
    const decoded = await auth.verifyIdToken(token, true);
    return { uid: decoded.uid, email: decoded.email, authTime: decoded.auth_time * 1000 };
  },
  async reserve(uid) {
    const ref = db.doc(`accountEmailLimits/${uid}`);
    return db.runTransaction(async transaction => {
      const value = (await transaction.get(ref)).data();
      if (value && value.at > Date.now() - 60_000) return false;
      transaction.set(ref, { at: Date.now() });
      return true;
    });
  },
  async change(uid, password, lang, operationId) {
    const user = await auth.getUser(uid);
    if (!user.email || user.disabled) throw new Error('Account unavailable.');
    // Bind the operation ID to the authenticated user. Never persist passwords.
    const id = createHash('sha256').update(`${uid}:${operationId}`).digest('hex');
    const ref = outbox.doc(id);
    const previous = (await ref.get()).data();
    if (previous && ['ready', 'sent'].includes(previous.status)) return;
    if (previous) throw new Error('Password operation needs a new request.');
    await ref.create({ kind: 'password-changed', to: user.email, name: user.displayName || '', lang, status: 'staged', createdAt: Date.now() });
    try { await auth.updateUser(uid, { password }); }
    catch (error) { await ref.set({ status: 'cancelled', finishedAt: FieldValue.serverTimestamp() }); throw error; }
    await ref.update({ status: 'ready' });
  },
});
export const accountPasswordApi = onRequest({
  region: 'us-east4', minInstances: 0, maxInstances: 2, concurrency: 10,
  timeoutSeconds: 60, memory: '256MiB', invoker: 'public',
  serviceAccount: 'dusaccom-accounts@969342544667.iam.gserviceaccount.com',
}, async (req, res) => {
  const raw = req.rawBody || Buffer.alloc(0);
  if (raw.length > 2048) { res.status(413).json({ error: 'account/invalid-request' }); return; }
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) if (value != null) headers.set(name, Array.isArray(value) ? value.join(',') : value);
  const response = await passwordHandler(new Request(`https://dusaccnj.org${req.originalUrl}`, {
    method: req.method, headers, ...(req.method === 'GET' || req.method === 'HEAD' ? {} : { body: raw.toString('utf8') }),
  }));
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
});

import { createActionEmailHandler, generateResetActionLink } from './action-email-handler';
import { firebaseAuthBackend } from './auth-backend';
import { createResetPasswordHandler, createResetPasswordCompletion, firebasePasswordReset } from './reset-password-handler';
const mailRateStore = firebaseAuthBackend(db, auth).store;
const resetCompletion = createResetPasswordCompletion({
  verify: code => firebasePasswordReset(process.env.ACCOUNT_RESET_WEB_API_KEY || '', code),
  async stage(email, lang, id) {
    const user = await auth.getUserByEmail(email);
    if (user.disabled || !user.email) throw new Error('Account unavailable.');
    await outbox.doc(id).create({ kind: 'password-changed', to: user.email, name: user.displayName || '', lang, status: 'staged', createdAt: Date.now() });
  },
  reset: async (code, password) => { await firebasePasswordReset(process.env.ACCOUNT_RESET_WEB_API_KEY || '', code, password); },
  ready: async id => { await outbox.doc(id).update({ status: 'ready' }); },
  cancel: async id => { await outbox.doc(id).set({ status: 'cancelled', finishedAt: FieldValue.serverTimestamp() }); },
});
const resetCompletionHandler = createResetPasswordHandler({
  enabled: () => emailEnabled() && Boolean(process.env.ACCOUNT_RESET_WEB_API_KEY),
  reserve: async keys => Boolean(await mailRateStore.reserve(keys, Date.now())),
  complete: resetCompletion,
});
const actionEmailHandler = createActionEmailHandler({
  enabled: emailEnabled,
  verify: async token => {
    const decoded = await auth.verifyIdToken(token, true);
    return { uid: decoded.uid, email: decoded.email, authTime: decoded.auth_time * 1000 };
  },
  async user(uid) {
    const user = await auth.getUser(uid);
    const role = (await db.doc(`admins/${uid}`).get()).data();
    return { uid: user.uid, email: user.email, displayName: user.displayName, disabled: user.disabled, delegate: Boolean(role?.parentUid) };
  },
  reserve: async keys => Boolean(await mailRateStore.reserve(keys, Date.now())),
  async link(kind, email, continueUrl, newEmail) {
    const settings = { url: continueUrl };
    if (kind === 'verify-email') return auth.generateEmailVerificationLink(email, settings);
    if (kind === 'change-email') return auth.generateVerifyAndChangeEmailLink(email, newEmail!, settings);
    return generateResetActionLink(auth, email, continueUrl);
  },
  send: input => deliverAccountEmail(input, resendApiKey.value()),
});
export const accountEmailApi = onRequest({
  region: 'us-east4', minInstances: 0, maxInstances: 2, concurrency: 10,
  timeoutSeconds: 60, memory: '256MiB', invoker: 'public', secrets: [resendApiKey],
  serviceAccount: 'dusaccom-accounts@969342544667.iam.gserviceaccount.com',
}, async (req, res) => {
  const raw = req.rawBody || Buffer.alloc(0);
  if (raw.length > 2048) { res.status(413).json({ error: 'account/invalid-request' }); return; }
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) if (value != null) headers.set(name, Array.isArray(value) ? value.join(',') : value);
  const handle = req.path.replace(/\/$/, '') === '/api/account-email/complete-password-reset' ? resetCompletionHandler : actionEmailHandler;
  const response = await handle(new Request(`https://dusaccnj.org${req.originalUrl}`, {
    method: req.method, headers, ...(req.method === 'GET' || req.method === 'HEAD' ? {} : { body: raw.toString('utf8') }),
  }), req.ip || req.socket.remoteAddress || 'unknown');
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).send(await response.text());
});
