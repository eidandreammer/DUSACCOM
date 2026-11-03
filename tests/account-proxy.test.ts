import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAccountProxy } from '../src/server/account-proxy';

function request(action = 'availability', options: RequestInit = {}, origin = 'http://127.0.0.1:3000') {
  return new Request(`${origin}/api/account-management/${action}`, {
    method: 'POST', body: '{}', ...options,
    headers: { Origin: origin, Authorization: 'Bearer parent-token', 'Content-Type': 'application/json', ...options.headers },
  });
}

test('local availability and deletion reach the trusted service with the caller token and body', async () => {
  const calls: Request[] = [];
  const proxy = createAccountProxy(async (url, options) => {
    const forwarded = new Request(url, options);
    calls.push(forwarded);
    assert.equal(forwarded.headers.get('origin'), 'https://dusaccom.web.app');
    assert.equal(forwarded.headers.get('authorization'), 'Bearer parent-token');
    assert.equal(forwarded.headers.get('cookie'), null);
    return Response.json(calls.length === 1 ? { enabled: true } : { status: 'deleted' });
  });
  const availability = await proxy(request());
  assert.deepEqual(await availability.json(), { enabled: true });
  assert.equal(availability.headers.get('cache-control'), 'no-store');
  assert.equal(calls[0].url, 'https://dusaccom.web.app/api/account-management/availability');
  const result = await proxy(request('delete-delegate', { body: JSON.stringify({ targetUid: 'delegate' }), headers: { Cookie: 'private-session' } }));
  assert.deepEqual(await result.json(), { status: 'deleted' });
  assert.equal(calls[1].url, 'https://dusaccom.web.app/api/account-management/delete-delegate');
  assert.deepEqual(await calls[1].json(), { targetUid: 'delegate' });
});

test('the proxy preserves authentication, parent ownership, retry, and availability failures', async () => {
  for (const [status, error] of [[401, 'account/sign-in-required'], [403, 'account/not-your-delegate'], [409, 'account/delegates-remain'], [503, 'account/temporarily-unavailable']] as const) {
    const proxy = createAccountProxy(async () => Response.json({ error }, { status }));
    const result = await proxy(request('delete-delegate'));
    assert.equal(result.status, status);
    assert.deepEqual(await result.json(), { error });
  }
});

test('cross-origin, missing authentication, unsupported actions, and oversized requests never reach Firebase', async () => {
  let calls = 0;
  const proxy = createAccountProxy(async () => { calls++; return Response.json({ enabled: true }); });
  assert.equal((await proxy(request('delete-delegate', { headers: { Origin: 'https://attacker.example' } }))).status, 403);
  assert.equal((await proxy(request('delete-delegate', { headers: { Origin: '' } }))).status, 403);
  assert.equal((await proxy(request('delete-delegate', { headers: { 'Sec-Fetch-Site': 'cross-site' } }))).status, 403);
  assert.equal((await proxy(request('delete-delegate', { headers: { Authorization: '' } }))).status, 401);
  assert.equal((await proxy(request('unsupported'))).status, 404);
  assert.equal((await proxy(request('availability', { method: 'GET', body: undefined }))).status, 405);
  assert.equal((await proxy(request('delete-delegate', { headers: { 'Content-Type': 'text/plain' } }))).status, 415);
  assert.equal((await proxy(request('delete-delegate', { headers: { 'Content-Length': '2049' } }))).status, 413);
  assert.equal((await proxy(request('delete-delegate', { body: 'é'.repeat(1025) }))).status, 413);
  assert.equal(calls, 0);
});

test('localhost and standalone public hosts can use the same route when adapters normalize the URL', async () => {
  const proxy = createAccountProxy(async () => Response.json({ enabled: true }));
  assert.equal((await proxy(request('availability', {}, 'http://localhost:3000'))).status, 200);
  assert.equal((await proxy(request('availability', {}, 'https://dusaccom.example'))).status, 200);
  assert.equal((await proxy(request('availability', { headers: { Origin: 'http://127.0.0.1:3000', Host: '127.0.0.1:3000' } }, 'http://localhost:3000'))).status, 200);
});

test('network failures and non-JSON upstream responses return an unavailable error', async () => {
  for (const send of [async () => { throw new Error('Network failure'); }, async () => new Response('<html>Not found</html>', { status: 404 })]) {
    const result = await createAccountProxy(send)(request());
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), { error: 'account/temporarily-unavailable' });
  }
});
