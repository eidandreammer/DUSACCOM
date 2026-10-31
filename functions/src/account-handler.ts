import { z } from 'zod';

export type Identity = { uid: string; email?: string; authTime: number };
export type Role = { enabled?: boolean; parentUid?: string | null; email?: string; username?: string };
export type DeletionRequest = { targetUid: string; parentUid: string; status: 'pending' | 'approved' | 'declined' | 'deleted'; requestedAt: number; resolvedAt?: number };
export type Challenge = { hash: string; createdAt: number; expiresAt: number };
export interface AccountStore {
  role(uid: string): Promise<Role | undefined>;
  disable(uid: string): Promise<void>;
  removeRole(uid: string): Promise<void>;
  hasDelegates(uid: string): Promise<boolean>;
  request(uid: string): Promise<DeletionRequest | undefined>;
  saveRequest(uid: string, request: DeletionRequest): Promise<void>;
  challenge(uid: string): Promise<Challenge | undefined>;
  saveChallenge(uid: string, challenge: Challenge): Promise<void>;
  removeChallenge(uid: string): Promise<void>;
  authUser(uid: string): Promise<{ email?: string; createdAt: number } | undefined>;
  deleteAuthUser(uid: string): Promise<void>;
}

class ApiError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}
const uidSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const targetSchema = z.object({ targetUid: uidSchema }).strict();
const noFields = z.object({}).strict();
const tokenSchema = z.object({ confirmation: z.string().min(32).max(128) }).strict();
const orphanSchema = targetSchema.extend({ username: z.string().regex(/^[a-z][a-z0-9_-]{2,23}$/) });
const isRoot = (role: Role | undefined) => role?.enabled === true && role.parentUid == null;
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(byte => byte.toString(16).padStart(2, '0')).join('');

export function createAccountHandler({ store, verify, isEnabled = async () => true, now = Date.now, origin = 'https://dusaccom.web.app' }: {
  store: AccountStore; verify: (token: string) => Promise<Identity>; isEnabled?: () => Promise<boolean>; now?: () => number; origin?: string;
}) {
  return async (request: Request): Promise<Response> => {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json', 'Vary': 'Origin' });
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.headers.get('origin') !== origin) return reply({ error: 'account/forbidden-origin' }, 403);
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply({ error: 'account/method-not-allowed' }, 405);
    try {
      const authorization = request.headers.get('authorization') || '';
      if (!authorization.startsWith('Bearer ') || authorization.length > 17000) throw new ApiError(401, 'account/sign-in-required');
      let caller: Identity;
      try { caller = await verify(authorization.slice(7)); }
      catch { throw new ApiError(401, 'account/sign-in-required'); }
      if (!uidSchema.safeParse(caller.uid).success) throw new ApiError(401, 'account/sign-in-required');
      if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'account/invalid-request');
      if (Number(request.headers.get('content-length')) > 2048) throw new ApiError(413, 'account/invalid-request');
      // The HTTPS adapter caps the incoming body before constructing this Request.
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 2048) throw new ApiError(413, 'account/invalid-request');
      let body: unknown;
      try { body = JSON.parse(text); } catch { throw new ApiError(400, 'account/invalid-request'); }
      const path = new URL(request.url).pathname.replace(/^\/api\/account-management/, '').replace(/\/$/, '');
      const enabled = await isEnabled();
      if (path === '/availability') { noFields.parse(body); return reply({ enabled }); }
      if (!enabled) throw new ApiError(503, 'account/temporarily-unavailable');
      const role = await store.role(caller.uid);
      const fresh = () => {
        if (!Number.isFinite(caller.authTime) || caller.authTime < now() - 300000 || caller.authTime > now() + 60000) throw new ApiError(401, 'account/recent-login-required');
      };
      const parentOnly = () => { if (!isRoot(role)) throw new ApiError(403, 'account/parent-required'); };

      if (path === '/deletion-request') {
        noFields.parse(body);
        if (!role?.parentUid) throw new ApiError(403, 'account/delegate-required');
        const existing = await store.request(caller.uid);
        if (existing?.status === 'pending' || existing?.status === 'approved') return reply({ status: existing.status });
        await store.saveRequest(caller.uid, { targetUid: caller.uid, parentUid: role.parentUid, status: 'pending', requestedAt: now() });
        return reply({ status: 'pending' });
      }
      if (path === '/delete-delegate' || path === '/decline-request') {
        parentOnly();
        const { targetUid } = targetSchema.parse(body);
        if (targetUid === caller.uid) throw new ApiError(403, 'account/parent-required');
        const target = await store.role(targetUid);
        const pending = await store.request(targetUid);
        const retry = !target && pending?.parentUid === caller.uid && ['approved', 'deleted'].includes(pending.status);
        if (target?.parentUid !== caller.uid && !retry) throw new ApiError(403, 'account/not-your-delegate');
        if (path === '/decline-request') {
          if (pending?.status !== 'pending') throw new ApiError(409, 'account/request-not-pending');
          await store.saveRequest(targetUid, { ...pending, status: 'declined', resolvedAt: now() });
          return reply({ status: 'declined' });
        }
        // Revoke event access before deleting Authentication. An approved record
        // preserves ownership proof for retries if a later cleanup call fails.
        if (target) await store.disable(targetUid);
        const approved: DeletionRequest = { targetUid, parentUid: caller.uid, status: 'approved', requestedAt: pending?.requestedAt ?? now(), resolvedAt: now() };
        await store.saveRequest(targetUid, approved);
        await store.deleteAuthUser(targetUid);
        await store.removeRole(targetUid);
        await store.saveRequest(targetUid, { ...approved, status: 'deleted', resolvedAt: now() });
        return reply({ status: 'deleted' });
      }
      if (path === '/begin-self-deletion' || path === '/delete-self') {
        fresh();
        if (role?.parentUid) throw new ApiError(403, 'account/parent-approval-required');
        if (await store.hasDelegates(caller.uid)) throw new ApiError(409, 'account/delegates-remain');
        if (path === '/begin-self-deletion') {
          noFields.parse(body);
          const existing = await store.challenge(caller.uid);
          if (existing && now() - existing.createdAt < 2000) throw new ApiError(429, 'account/try-again');
          const confirmation = `${crypto.randomUUID()}${crypto.randomUUID()}`;
          await store.saveChallenge(caller.uid, { hash: await hash(confirmation), createdAt: now(), expiresAt: now() + 600000 });
          return reply({ confirmation, holdMilliseconds: 5000 });
        }
        const { confirmation } = tokenSchema.parse(body);
        const challenge = await store.challenge(caller.uid);
        if (!challenge || challenge.hash !== await hash(confirmation) || challenge.expiresAt < now()) throw new ApiError(409, 'account/confirmation-expired');
        if (now() - challenge.createdAt < 5000) throw new ApiError(409, 'account/hold-required');
        if (role) await store.disable(caller.uid);
        await store.deleteAuthUser(caller.uid);
        await store.removeRole(caller.uid);
        await store.removeChallenge(caller.uid);
        return reply({ status: 'deleted' });
      }
      if (path === '/discard-unassigned-delegate') {
        parentOnly();
        const { targetUid, username } = orphanSchema.parse(body);
        const targetRole = await store.role(targetUid);
        const target = await store.authUser(targetUid);
        if (!target) return reply({ status: 'deleted' });
        const [local, domain] = (caller.email || '').toLowerCase().split('@');
        const alias = `${local}+dusaccom-${username}@${domain}`;
        if (targetUid === caller.uid || targetRole || !['gmail.com', 'googlemail.com'].includes(domain)
          || target.email?.toLowerCase() !== alias || !Number.isFinite(target.createdAt)
          || target.createdAt < now() - 300000 || target.createdAt > now() + 60000) throw new ApiError(403, 'account/not-your-delegate');
        await store.deleteAuthUser(targetUid);
        return reply({ status: 'deleted' });
      }
      throw new ApiError(404, 'account/not-found');
    } catch (error) {
      if (error instanceof z.ZodError) return reply({ error: 'account/invalid-request' }, 400);
      if (error instanceof ApiError) return reply({ error: error.code }, error.status);
      return reply({ error: 'account/temporarily-unavailable' }, 503);
    }
  };
}
