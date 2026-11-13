import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Identity } from './account-handler';

export type ActionEmailKind = 'password-reset' | 'verify-email' | 'change-email';
export type MailUser = { uid: string; email?: string; displayName?: string; disabled?: boolean; delegate?: boolean };
const origins = new Set(['https://dusaccnj.org', 'https://dusaccom.web.app', 'https://dusaccom.firebaseapp.com']);
const common = { lang: z.enum(['en', 'es']), operationId: z.uuid() };
const schemas = {
  'password-reset': z.object({ ...common, email: z.email().max(254).transform(value => value.toLowerCase()), continueUrl: z.string().max(1024) }).strict(),
  'verify-email': z.object(common).strict(),
  'change-email': z.object({ ...common, email: z.email().max(254).transform(value => value.toLowerCase()) }).strict(),
};
export function accountContinuation(value = 'https://dusaccnj.org/account/') {
  const input = new URL(value);
  if (!origins.has(input.origin) || input.pathname !== '/account/' || input.username || input.password || input.hash) throw new Error('Invalid account continuation.');
  const safe = new URL('/account/', 'https://dusaccnj.org');
  for (const [key, allowed] of Object.entries({ intent: ['events', 'create-event', 'event-registration'], settings: ['profile', 'password', 'email', 'team', 'delete'] })) {
    const value = input.searchParams.get(key); if (value && allowed.includes(value)) safe.searchParams.set(key, value);
  }
  const event = input.searchParams.get('event');
  if (safe.searchParams.get('intent') === 'event-registration' && event && /^[A-Za-z0-9_-]{1,128}$/.test(event)) safe.searchParams.set('event', event);
  return safe.href;
}
export function ownedActionLink(generated: string, lang: 'en' | 'es') {
  const url = new URL(generated);
  if (url.protocol !== 'https:' || !url.searchParams.get('oobCode') || !url.searchParams.get('apiKey') || !['resetPassword', 'verifyEmail', 'verifyAndChangeEmail'].includes(url.searchParams.get('mode') || '')) throw new Error('Invalid generated action link.');
  url.host = 'dusaccnj.org'; url.pathname = '/__/auth/action'; url.hash = '';
  url.searchParams.set('lang', lang);
  return url.href;
}
export function createActionEmailHandler(deps: {
  enabled(): boolean;
  verify(token: string): Promise<Identity>;
  user(uid: string): Promise<MailUser>;
  reserve(keys: string[]): Promise<boolean>;
  link(kind: ActionEmailKind, email: string, continueUrl: string, newEmail?: string): Promise<string | null>;
  send(input: { kind: ActionEmailKind; to: string; name?: string; lang: 'en' | 'es'; id: string; actionUrl: string }): Promise<unknown>;
  now?: () => number;
}) {
  return async (request: Request, trustedNetwork: string): Promise<Response> => {
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if (!origins.has(request.headers.get('origin') || '') || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'account/forbidden-origin' }, 403);
    if (request.method !== 'POST') return reply({ error: 'account/method-not-allowed' }, 405);
    if (!deps.enabled()) return reply({ error: 'account/temporarily-unavailable' }, 503);
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({ error: 'account/invalid-request' }, 415);
    try {
      const kind = new URL(request.url).pathname.match(/\/api\/account-email\/([a-z-]+)\/?$/)?.[1] as ActionEmailKind;
      if (!Object.hasOwn(schemas, kind || '')) return reply({ error: 'account/not-found' }, 404);
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 2048) return reply({ error: 'account/invalid-request' }, 413);
      const input = schemas[kind].parse(JSON.parse(text)) as { lang: 'en' | 'es'; operationId: string; email?: string; continueUrl?: string };
      let user: MailUser | undefined;
      if (kind !== 'password-reset') {
        const token = request.headers.get('authorization')?.match(/^Bearer (.{1,17000})$/)?.[1];
        if (!token) return reply({ error: 'account/sign-in-required' }, 401);
        let identity: Identity;
        try { identity = await deps.verify(token); } catch { return reply({ error: 'account/sign-in-required' }, 401); }
        const at = (deps.now || Date.now)();
        if (kind === 'change-email' && (!Number.isFinite(identity.authTime) || identity.authTime < at - 300000 || identity.authTime > at + 60000)) return reply({ error: 'account/recent-login-required' }, 401);
        user = await deps.user(identity.uid);
        if (!user.email || user.disabled || (user.delegate && kind === 'change-email')) return reply({ error: 'account/forbidden' }, 403);
      }
      const email = user?.email || input.email || '';
      const digest = (value: string) => createHash('sha256').update(value).digest('hex');
      if (!await deps.reserve([digest(`account-mail:${kind}:network:${trustedNetwork}`), digest(`account-mail:${kind}:account:${email.toLowerCase()}`)])) return reply({ error: 'account/try-again' }, 429);
      let continueUrl: string;
      try { continueUrl = accountContinuation(input.continueUrl); }
      catch { return reply({ error: 'account/invalid-request' }, 400); }
      const newEmail = kind === 'change-email' ? input.email : undefined;
      const generated = await deps.link(kind, email, continueUrl, newEmail);
      // Missing reset accounts receive the same generic success response.
      if (generated) await deps.send({ kind, to: newEmail || email, name: user?.displayName, lang: input.lang, id: digest(`${kind}:${email}:${input.operationId}`), actionUrl: ownedActionLink(generated, input.lang) });
      return reply({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) return reply({ error: 'account/invalid-request' }, 400);
      return reply({ error: 'account/temporarily-unavailable' }, 503);
    }
  };
}
