import { z } from 'zod';

export const SESSION_COOKIE = '__Host-dusaccom-session';
export const SESSION_MS = 15 * 60_000;
export const IDLE_MS = 10 * 60_000;
export const ATTEMPT_WINDOW_MS = 15 * 60_000;
export const MAX_FAILURES = 5;
export type Session = { uid: string; createdAt: number; authTime: number; lastSeen: number; expiresAt: number };
export type PublicUser = { uid: string; email?: string; displayName?: string; disabled?: boolean; validAfter?: number };
export type Reservation = { key: string; windowStart: number }[];
export interface AuthStore {
  reserve(keys: string[], now: number): Promise<Reservation | null>;
  release(reservation: Reservation): Promise<void>;
  get(id: string): Promise<Session | undefined>;
  put(id: string, value: Session): Promise<void>;
  touch(id: string, at: number): Promise<void>;
  remove(id: string): Promise<void>;
  removeForUser(uid: string): Promise<void>;
}
export interface IdentityProvider {
  password(email: string, password: string): Promise<{ uid: string; idToken: string }>;
  create(email: string, password: string, displayName: string): Promise<PublicUser>;
  user(uid: string): Promise<PublicUser>;
  token(uid: string, sessionId: string): Promise<string>;
  update(uid: string, value: { password?: string; displayName?: string }): Promise<void>;
  reset(email: string, lang: string, continueUrl: string): Promise<void>;
  email(idToken: string, newEmail: string, lang: string): Promise<void>;
  revoke(uid: string): Promise<void>;
  createDelegate(parentUid: string, input: { displayName: string; username: string; password: string }): Promise<void>;
}
export class AuthError extends Error {
  constructor(readonly code: string, readonly status = 401) { super(code); }
}
export const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
const password = z.string().min(1).max(128);
const newPassword = z.string().min(15).max(128);
const email = z.email().max(254).transform(value => value.trim().toLowerCase());
const empty = z.object({}).strip();
const schemas = {
  signin: z.object({ email, password }).strip(),
  signup: z.object({ email, password: newPassword, name: z.string().trim().min(2).max(100) }).strip(),
  'reset-password': z.object({ email, lang: z.enum(['en', 'es']), continueUrl: z.string().max(1024) }).strip(),
  session: empty, logout: empty,
  reauthenticate: z.object({ password }).strip(),
  password: z.object({ currentPassword: password, newPassword }).strip(),
  email: z.object({ currentPassword: password, newEmail: email, lang: z.enum(['en', 'es']) }).strip(),
  profile: z.object({ displayName: z.string().trim().min(2).max(100) }).strip(),
  'create-delegate': z.object({ displayName: z.string().trim().min(2).max(100), username: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_-]{2,23}$/), password: newPassword }).strip(),
};
export async function boundedJson(request: Request, maximum = 8192): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new AuthError('auth/invalid-request', 415);
  if (Number(request.headers.get('content-length')) > maximum) throw new AuthError('auth/invalid-request', 413);
  if (!request.body) throw new AuthError('auth/invalid-request', 400);
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > maximum) { await reader.cancel(); throw new AuthError('auth/invalid-request', 413); } chunks.push(part.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new AuthError('auth/invalid-request', 400); }
}
export function sessionCookie(value: string, seconds = SESSION_MS / 1000) {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Strict`;
}
export async function sessionId(request: Request) {
  const matches = (request.headers.get('cookie') || '').split(';').map(value => value.trim()).filter(value => value.startsWith(`${SESSION_COOKIE}=`));
  if (matches.length !== 1) throw new AuthError('auth/sign-in-required');
  const value = matches[0].slice(SESSION_COOKIE.length + 1);
  if (!/^[a-f0-9]{64}$/.test(value)) throw new AuthError('auth/sign-in-required');
  return digest(value);
}
export function createAuthService({ store, provider, now = Date.now, origin = 'https://dusaccom.web.app', ready = () => true }: { store: AuthStore; provider: IdentityProvider; now?: () => number; origin?: string; ready?: () => boolean }) {
  async function verify(request: Request) {
    if (!ready()) throw new AuthError('auth/temporarily-unavailable', 503);
    const id = await sessionId(request); const session = await store.get(id); const at = now();
    if (!session || session.expiresAt <= at || session.lastSeen + IDLE_MS <= at || session.createdAt + SESSION_MS <= at || session.authTime > at + 60_000) throw new AuthError('auth/session-expired');
    const user = await provider.user(session.uid);
    if (user.disabled || (user.validAfter || 0) > session.authTime) throw new AuthError('auth/session-expired');
    await store.touch(id, at);
    return { id, session, user };
  }
  async function open(request: Request, uid: string, authTime: number) {
    try { await store.remove(await sessionId(request)); } catch (error) { if (!(error instanceof AuthError)) throw error; }
    const raw = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
    const id = await digest(raw); const at = now();
    const session = { uid, authTime, createdAt: at, lastSeen: at, expiresAt: at + SESSION_MS };
    await store.put(id, session);
    const customToken = await provider.token(uid, id); const user = await provider.user(uid);
    return { raw, customToken, expiresAt: session.expiresAt, user: { uid: user.uid, email: user.email, displayName: user.displayName } };
  }
  const handle = async (request: Request, trustedNetwork: string): Promise<Response> => {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' });
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
    let reservation: Reservation | null = null;
    try {
      if (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new AuthError('auth/forbidden-origin', 403);
      if (request.method !== 'POST') throw new AuthError('auth/method-not-allowed', 405);
      if (!ready()) throw new AuthError('auth/temporarily-unavailable', 503);
      const url = new URL(request.url); if (url.search) throw new AuthError('auth/invalid-request', 400);
      const action = url.pathname.match(/^\/api\/auth\/([a-z-]+)\/?$/)?.[1] as keyof typeof schemas;
      if (!Object.hasOwn(schemas, action || '')) throw new AuthError('auth/not-found', 404);
      // Reserve before validation/provider work; failed/pending concurrent requests
      // consume slots. Success releases its own slots atomically, never a newer window.
      const input = await boundedJson(request);
      let identifier = typeof input === 'object' && input !== null && 'email' in input && typeof input.email === 'string' ? input.email.trim().toLowerCase().slice(0, 254) : '';
      if (!identifier) {
        try { const session = await store.get(await sessionId(request)); if (session) identifier = (await provider.user(session.uid)).email?.toLowerCase() || session.uid; }
        catch (error) { if (!(error instanceof AuthError)) throw error; }
      }
      const group = action === 'reset-password' ? 'reset' : 'credentials';
      const keys = [await digest(`${group}:network:${trustedNetwork}`), ...(identifier ? [await digest(`${group}:account:${identifier}`)] : [])];
      reservation = await store.reserve(keys, now());
      if (!reservation) { headers.set('Retry-After', '900'); throw new AuthError('auth/too-many-requests', 429); }
      const values = schemas[action].parse(input) as Record<string, string>;
      let result: unknown = { ok: true };
      let opened: Awaited<ReturnType<typeof open>> | undefined;
      if (action === 'signin') {
        const identity = await provider.password(values.email, values.password);
        opened = await open(request, identity.uid, now());
      } else if (action === 'signup') {
        const user = await provider.create(values.email, values.password, values.name);
        opened = await open(request, user.uid, now());
      } else if (action === 'reset-password') {
        const destination = new URL(values.continueUrl);
        if (destination.origin !== origin || destination.pathname !== '/account/' || destination.username || destination.password) throw new AuthError('auth/invalid-request', 400);
        // Do not accept arbitrary state, redirect targets, or action codes.
        const safe = new URL('/account/', origin);
        for (const [key, allowed] of Object.entries({ intent: ['events', 'create-event', 'event-registration'], settings: ['profile', 'password', 'email', 'team', 'delete'] })) {
          const value = destination.searchParams.get(key); if (value && allowed.includes(value)) safe.searchParams.set(key, value);
        }
        const event = destination.searchParams.get('event');
        if (safe.searchParams.get('intent') === 'event-registration' && event && /^[A-Za-z0-9_-]{1,128}$/.test(event)) safe.searchParams.set('event', event);
        await provider.reset(values.email, values.lang, safe.href);
      } else if (action === 'logout') {
        try { await store.remove(await sessionId(request)); } catch (error) { if (!(error instanceof AuthError)) throw error; }
        headers.set('Set-Cookie', sessionCookie('', 0));
      } else if (action === 'session' && !(request.headers.get('cookie') || '').includes(`${SESSION_COOKIE}=`)) result = { signedIn: false };
      else {
        const { id, session, user } = await verify(request);
        if (action === 'session') result = { customToken: await provider.token(user.uid, id), expiresAt: session.expiresAt, user: { uid: user.uid, email: user.email, displayName: user.displayName } };
        else if (action === 'profile') await provider.update(user.uid, { displayName: values.displayName });
        else if (action === 'create-delegate') {
          if (session.authTime < now() - 300_000) throw new AuthError('auth/recent-login-required');
          await provider.createDelegate(user.uid, values as { displayName: string; username: string; password: string });
        } else {
          if (!user.email) throw new AuthError('auth/invalid-credential');
          const identity = await provider.password(user.email, values.password || values.currentPassword);
          if (identity.uid !== user.uid) throw new AuthError('auth/invalid-credential');
          if (action === 'password') {
            await provider.update(user.uid, { password: values.newPassword }); await provider.revoke(user.uid); await store.removeForUser(user.uid);
          } else if (action === 'email') await provider.email(identity.idToken, values.newEmail, values.lang);
          opened = await open(request, user.uid, now());
        }
      }
      if (opened) { const { raw, ...publicResult } = opened; headers.set('Set-Cookie', sessionCookie(raw)); result = publicResult; }
      // Reset email delivery also has a five-per-window cap, including successes.
      if (action !== 'reset-password') await store.release(reservation);
      return reply(result);
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof TypeError) return reply({ error: 'auth/invalid-request' }, 400);
      if (error instanceof AuthError) {
        if (['auth/sign-in-required', 'auth/session-expired'].includes(error.code)) headers.set('Set-Cookie', sessionCookie('', 0));
        return reply({ error: error.code }, error.status);
      }
      if (reservation) await store.release(reservation).catch(() => {});
      return reply({ error: 'auth/temporarily-unavailable' }, 503);
    }
  };
  return { handle, verify };
}
