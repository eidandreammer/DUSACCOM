// Firebase Hosting supplies this rewrite in production. Next dev and standalone
// servers need the same route to reach the deployed, trusted account service.
const accountOrigin = 'https://dusaccom.web.app';
const actions = new Set([
  'availability', 'deletion-request', 'delete-delegate', 'decline-request',
  'begin-self-deletion', 'delete-self', 'discard-unassigned-delegate',
]);
const maxBytes = 2048;

export function createAccountProxy(send: typeof fetch = fetch) {
  return async function handle(request: Request): Promise<Response> {
    const reply = (body: unknown, status = 200) => Response.json(body, {
      status, headers: { 'Cache-Control': 'no-store' },
    });
    const reject = (error: string, status: number) => reply({ error }, status);
    if (request.method !== 'POST') return reject('account/method-not-allowed', 405);
    const url = new URL(request.url);
    const action = url.pathname.match(/^\/api\/account-management\/([a-z-]+)\/?$/)?.[1];
    if (!action || !actions.has(action)) return reject('account/not-found', 404);
    let sameOrigin = false;
    try {
      const origin = new URL(request.headers.get('origin') || '');
      // Next adapters may normalize request.url; Host retains the public host.
      sameOrigin = origin.origin === url.origin ||
        (origin.host === request.headers.get('host') && origin.protocol === url.protocol);
    } catch { /* Missing or invalid origins are rejected. */ }
    if (!sameOrigin || request.headers.get('sec-fetch-site') === 'cross-site') return reject('account/forbidden-origin', 403);
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ') || authorization.length > 17000) return reject('account/sign-in-required', 401);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reject('account/invalid-request', 415);
    if (Number(request.headers.get('content-length')) > maxBytes) return reject('account/invalid-request', 413);

    try {
      if (!request.body) return reject('account/invalid-request', 400);
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > maxBytes) { await reader.cancel(); return reject('account/invalid-request', 413); }
        chunks.push(part.value);
      }
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
      const response = await send(`${accountOrigin}/api/account-management/${action}`, {
        method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store',
        // Validate the browser origin above before forwarding with the service's
        // canonical origin. Firebase still verifies the token and parent ownership.
        headers: { Origin: accountOrigin, Authorization: authorization, 'Content-Type': 'application/json' },
        body, signal: AbortSignal.timeout(55000),
      });
      return reply(await response.json(), response.status);
    } catch {
      return reject('account/temporarily-unavailable', 503);
    }
  };
}
