import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { googleTranslator, planEventTranslation } from './event-translation';
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
const handler = createAccountHandler({ store, isEnabled, verify: async token => {
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

// Event auto-translation (see docs/FIREBASE_HOSTING.md, "Event auto-translation").
// Dedicated runtime identity with only Cloud Translation User + Cloud Datastore User
// (+ Eventarc Event Receiver for the trigger). Same email pattern as dusaccom-accounts.
const TRANSLATOR_SERVICE_ACCOUNT = 'dusaccom-translator@dusaccom-community-2026.iam.gserviceaccount.com';
const emulator = process.env.FUNCTIONS_EMULATOR === 'true';
// Emulator-only override so local tests can point at a mock and never reach the paid API.
const emulatorEndpoint = emulator ? process.env.EVENT_TRANSLATION_ENDPOINT : undefined;
const translate = googleTranslator({
  endpoint: emulatorEndpoint,
  getAccessToken: async () => emulatorEndpoint ? 'emulator' : (await applicationDefault().getAccessToken()).access_token,
});

export const translateEvent = onDocumentWritten({
  document: 'events/{id}', region: 'us-east4', retry: false,
  minInstances: 0, maxInstances: 2, timeoutSeconds: 60, memory: '256MiB',
  serviceAccount: TRANSLATOR_SERVICE_ACCOUNT,
}, async event => {
  const after = event.data?.after;
  if (!after?.exists) return;
  if (emulator && !emulatorEndpoint) return; // Never call the real API from emulators.
  try {
    const plan = await planEventTranslation(after.data(), translate, {
      now: FieldValue.serverTimestamp(),
      log: (message, details) => logger.warn(message, { eventId: event.params.id, ...details }),
    });
    if (!plan) return;
    // If an admin saved again meanwhile, skip; their write triggers a fresh run.
    await after.ref.update(plan, { lastUpdateTime: after.updateTime });
    logger.info('Event translations updated.', { eventId: event.params.id, fields: Object.keys(plan).filter(key => key !== 'translation') });
  } catch (error) {
    // retry is off; log and leave the document as-is (the UI falls back to English).
    logger.warn('Event translation was not saved.', { eventId: event.params.id, error: error instanceof Error ? error.message : String(error) });
  }
});
