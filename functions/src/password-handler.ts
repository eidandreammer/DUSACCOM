import { z } from 'zod';
import type { Identity } from './account-handler';

export function createPasswordHandler(dependencies: {
  verify(token: string): Promise<Identity>;
  change(uid: string, password: string, lang: 'en' | 'es', operationId: string): Promise<void>;
  reserve(uid: string): Promise<boolean>;
  enabled(): boolean;
  now?: () => number;
}) {
  const schema = z.object({ password: z.string().min(8).max(128), lang: z.enum(['en', 'es']), operationId: z.uuid() }).strict();
  const origins = new Set(['https://dusaccnj.org', 'https://dusaccom.web.app', 'https://dusaccom.firebaseapp.com']);
  return async (request: Request) => {
    const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
    const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
    if (!origins.has(request.headers.get('origin') || '') || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'account/forbidden-origin' }, 403);
    if (request.method !== 'POST') return reply({ error: 'account/method-not-allowed' }, 405);
    if (!dependencies.enabled()) return reply({ error: 'account/temporarily-unavailable' }, 503);
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({ error: 'account/invalid-request' }, 415);
    try {
      const token = request.headers.get('authorization')?.match(/^Bearer (.{1,17000})$/)?.[1];
      if (!token) return reply({ error: 'account/sign-in-required' }, 401);
      let caller: Identity;
      try { caller = await dependencies.verify(token); } catch { return reply({ error: 'account/sign-in-required' }, 401); }
      const at = (dependencies.now || Date.now)();
      if (!Number.isFinite(caller.authTime) || caller.authTime < at - 300000 || caller.authTime > at + 60000) return reply({ error: 'account/recent-login-required' }, 401);
      // The HTTPS adapter rejects large bodies before constructing this request.
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 2048) return reply({ error: 'account/invalid-request' }, 413);
      const input = schema.parse(JSON.parse(text));
      if (!await dependencies.reserve(caller.uid)) return reply({ error: 'account/try-again' }, 429);
      await dependencies.change(caller.uid, input.password, input.lang, input.operationId);
      return reply({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) return reply({ error: 'account/invalid-request' }, 400);
      return reply({ error: 'account/temporarily-unavailable' }, 503);
    }
  };
}
