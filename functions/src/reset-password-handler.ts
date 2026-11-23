import { createHash } from 'node:crypto';
import { z } from 'zod';

export class ResetPasswordError extends Error {
  constructor(readonly code: 'invalid-code' | 'invalid-password' | 'try-again') { super(code); }
}
export function createResetPasswordHandler(deps: {
  enabled(): boolean;
  reserve(keys: string[]): Promise<boolean>;
  complete(code: string, password: string, lang: 'en' | 'es', operationId: string): Promise<void>;
}) {
  const schema = z.object({ code: z.string().regex(/^[A-Za-z0-9_-]{16,256}$/), password: z.string().min(8).max(128), lang: z.enum(['en', 'es']), operationId: z.uuid() }).strict();
  return async (request: Request, network: string) => {
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if (!['https://dusaccnj.org', 'https://dusaccom.web.app', 'https://dusaccom.firebaseapp.com'].includes(request.headers.get('origin') || '') || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'account/forbidden-origin' }, 403);
    if (request.method !== 'POST') return reply({ error: 'account/method-not-allowed' }, 405);
    if (!deps.enabled()) return reply({ error: 'account/temporarily-unavailable' }, 503);
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({ error: 'account/invalid-request' }, 415);
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 2048) return reply({ error: 'account/invalid-request' }, 413);
      const input = schema.parse(JSON.parse(text));
      const digest = (value: string) => createHash('sha256').update(value).digest('hex');
      if (!await deps.reserve([digest(`reset-complete:network:${network}`), digest(`reset-complete:code:${input.code}`)])) return reply({ error: 'account/try-again' }, 429);
      await deps.complete(input.code, input.password, input.lang, input.operationId);
      return reply({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) return reply({ error: 'account/invalid-request' }, 400);
      if (error instanceof ResetPasswordError) return reply({ error: `account/${error.code}` }, error.code === 'try-again' ? 429 : 400);
      return reply({ error: 'account/temporarily-unavailable' }, 503);
    }
  };
}

// Only a valid Firebase reset code chooses the recipient. Stage before changing
// the password, then release the notice only after Firebase confirms success.
export function createResetPasswordCompletion(deps: {
  verify(code: string): Promise<{ email: string }>;
  stage(email: string, lang: 'en' | 'es', id: string): Promise<void>;
  reset(code: string, password: string): Promise<void>;
  ready(id: string): Promise<void>;
  cancel(id: string): Promise<void>;
}) {
  return async (code: string, password: string, lang: 'en' | 'es', operationId: string) => {
    const { email } = await deps.verify(code);
    const id = createHash('sha256').update(`password-reset:${code}:${operationId}`).digest('hex');
    await deps.stage(email, lang, id);
    try { await deps.reset(code, password); }
    catch (error) { await deps.cancel(id); throw error; }
    await deps.ready(id);
  };
}

export async function firebasePasswordReset(apiKey: string, code: string, password?: string, transport: typeof fetch = fetch) {
  if (!apiKey) throw new Error('Reset provider unavailable.');
  const response = await transport(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oobCode: code, ...(password === undefined ? {} : { newPassword: password }) }), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json() as { email?: string; requestType?: string; error?: { message?: string } };
  if (!response.ok) {
    const message = data.error?.message || '';
    if (/^(INVALID_OOB_CODE|EXPIRED_OOB_CODE|USER_DISABLED|EMAIL_NOT_FOUND)/.test(message)) throw new ResetPasswordError('invalid-code');
    if (/^(WEAK_PASSWORD|PASSWORD_DOES_NOT_MEET_REQUIREMENTS)/.test(message)) throw new ResetPasswordError('invalid-password');
    throw new Error('Reset provider unavailable.');
  }
  if (!data.email || data.requestType !== 'PASSWORD_RESET') throw new ResetPasswordError('invalid-code');
  return { email: data.email };
}
