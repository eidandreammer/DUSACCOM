import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createResetPasswordCompletion, createResetPasswordHandler, firebasePasswordReset, ResetPasswordError } from '../functions/src/reset-password-handler';

const operationId = 'fdab8e41-5d83-4e92-a582-2c1c0c624046';
const code = 'one-time-reset-code-for-test';
test('reset completion verifies the code, uses its recipient, and releases mail only after success', async () => {
  const calls: string[] = [];
  const complete = createResetPasswordCompletion({
    verify: async received => { assert.equal(received, code); calls.push('verify'); return { email: 'owner@example.com' }; },
    stage: async (email, lang, id) => { assert.equal(email, 'owner@example.com'); assert.equal(lang, 'es'); assert.match(id, /^[a-f0-9]{64}$/); calls.push('stage'); },
    reset: async (received, password) => { assert.equal(received, code); assert.equal(password, 'secret-new-password'); calls.push('reset'); },
    ready: async () => { calls.push('ready'); }, cancel: async () => { calls.push('cancel'); },
  });
  await complete(code, 'secret-new-password', 'es', operationId);
  assert.deepEqual(calls, ['verify', 'stage', 'reset', 'ready']);
});
test('invalid codes never queue mail; failed or raced resets cancel staged notices', async () => {
  for (const failure of ['verify', 'stage', 'reset']) {
    const calls: string[] = [];
    const step = (name: string) => { calls.push(name); if (failure === name) throw new ResetPasswordError('invalid-code'); };
    const complete = createResetPasswordCompletion({
      verify: async () => { step('verify'); return { email: 'owner@example.com' }; },
      stage: async () => { step('stage'); }, reset: async () => { step('reset'); },
      ready: async () => { step('ready'); }, cancel: async () => { step('cancel'); },
    });
    await assert.rejects(complete(code, 'new-password', 'en', operationId));
    assert.ok(!calls.includes('ready'));
    assert.equal(calls.includes('cancel'), failure === 'reset');
  }
});
test('reset endpoint rejects recipient injection, bad origin, missing proof, and throttling', async () => {
  let completed = 0, permitted = true;
  const handler = createResetPasswordHandler({ enabled: () => true, reserve: async keys => { assert.ok(keys.every(key => /^[a-f0-9]{64}$/.test(key))); return permitted; }, complete: async () => { completed++; } });
  const valid = { code, password: 'new-password', lang: 'en', operationId };
  const call = (input: object, origin = 'https://dusaccnj.org') => handler(new Request('https://dusaccnj.org/api/account-email/complete-password-reset', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(input) }), 'trusted-network');
  assert.equal((await call(valid, 'https://attacker.example')).status, 403);
  assert.equal((await call({ ...valid, email: 'attacker@example.com' })).status, 400);
  assert.equal((await call({ ...valid, code: '' })).status, 400);
  assert.equal((await call({ ...valid, password: 'short' })).status, 400);
  assert.equal(completed, 0);
  permitted = false; assert.equal((await call(valid)).status, 429); assert.equal(completed, 0);
  permitted = true; const response = await call(valid); assert.equal(response.status, 200); assert.equal(completed, 1); assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('Firebase reset adapter validates reset type and preserves safe errors without leaking provider content', async () => {
  const transport = (data: object, status = 200) => (async (_url: unknown, options: RequestInit) => {
    assert.deepEqual(JSON.parse(String(options.body)), { oobCode: code, newPassword: 'new-password' });
    return Response.json(data, { status });
  }) as typeof fetch;
  assert.deepEqual(await firebasePasswordReset('public-key', code, 'new-password', transport({ email: 'owner@example.com', requestType: 'PASSWORD_RESET' })), { email: 'owner@example.com' });
  await assert.rejects(firebasePasswordReset('public-key', code, 'new-password', transport({ email: 'owner@example.com', requestType: 'VERIFY_EMAIL' })), /invalid-code/);
  await assert.rejects(firebasePasswordReset('public-key', code, 'new-password', transport({ error: { message: 'EXPIRED_OOB_CODE private-code' } }, 400)), /invalid-code/);
  await assert.rejects(firebasePasswordReset('public-key', code, 'new-password', transport({ error: { message: 'WEAK_PASSWORD private-password' } }, 400)), /invalid-password/);
  await assert.rejects(firebasePasswordReset('public-key', code, 'new-password', transport({ error: { message: 'PRIVATE DATA' } }, 500)), /^Error: Reset provider unavailable\.$/);
});
