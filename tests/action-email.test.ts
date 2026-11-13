import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createActionEmailHandler, ownedActionLink, accountContinuation, generateResetActionLink } from '../functions/src/action-email-handler';
import { accountEmail } from '../functions/src/account-email';

const generated = 'https://original-project.firebaseapp.com/__/auth/action?mode=resetPassword&apiKey=public-key&oobCode=one-time-code';
const operationId = 'fdab8e41-5d83-4e92-a582-2c1c0c624046';
function fixture() {
  const sent: { to: string; actionUrl: string; kind: string }[] = [];
  let missing = false, enabled = true, reserve = true, delegate = false;
  const handle = createActionEmailHandler({
    enabled: () => enabled, now: () => 1_000_000,
    verify: async token => { if (token === 'bad') throw new Error(); return { uid: 'member', authTime: token === 'stale' ? 0 : 1_000_000 }; },
    user: async () => ({ uid: 'member', email: 'current@example.com', delegate }),
    reserve: async keys => { assert.equal(keys.length, 2); assert.ok(keys.every(key => /^[a-f0-9]{64}$/.test(key))); return reserve; },
    link: async (kind, email, continuation, newEmail) => {
      assert.ok(continuation.startsWith('https://dusaccnj.org/account/'));
      if (kind === 'change-email') { assert.equal(email, 'current@example.com'); assert.equal(newEmail, 'new@example.com'); }
      return missing ? null : generated;
    },
    send: async input => { sent.push(input); },
  });
  const call = (kind: string, body: object, token = 'good', origin = 'https://dusaccnj.org') => handle(new Request(`https://dusaccnj.org/api/account-email/${kind}`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ lang: 'es', operationId, ...body }),
  }), 'trusted-network');
  return { call, sent, missing: () => { missing = true; }, disable: () => { enabled = false; }, limited: () => { reserve = false; }, delegate: () => { delegate = true; } };
}
test('reset mail is generic for missing accounts and uses the owned secure action origin', async () => {
  const f = fixture();
  const input = { email: 'qa@example.com', continueUrl: 'https://dusaccnj.org/account/?intent=event-registration&event=approved&redirect=https://attacker.example' };
  const response = await f.call('password-reset', input, '');
  assert.equal(response.status, 200);
  assert.equal(f.sent[0].to, 'qa@example.com');
  const url = new URL(f.sent[0].actionUrl);
  assert.equal(url.pathname, '/account/reset-password/');
  assert.equal(url.origin, 'https://dusaccnj.org'); assert.equal(url.searchParams.get('oobCode'), 'one-time-code'); assert.equal(url.searchParams.get('lang'), 'es');
  f.missing(); const missing = await f.call('password-reset', input, '');
  assert.deepEqual(await missing.json(), await response.json()); assert.equal(f.sent.length, 1);
});
test('verification chooses the server account, and email changes require recent login', async () => {
  const f = fixture();
  assert.equal((await f.call('verify-email', {}, 'bad')).status, 401);
  assert.equal((await f.call('verify-email', {})).status, 200);
  assert.equal(f.sent[0].to, 'current@example.com');
  assert.equal((await f.call('verify-email', { email: 'attacker@example.com' })).status, 400);
  assert.equal((await f.call('change-email', { email: 'new@example.com' }, 'stale')).status, 401);
  assert.equal((await f.call('change-email', { email: 'new@example.com' })).status, 200);
  assert.equal(f.sent[1].to, 'new@example.com');
  f.delegate(); assert.equal((await f.call('change-email', { email: 'new@example.com' })).status, 403);
});
test('mail rejects forged origins, external return destinations, throttled and inactive requests', async () => {
  const f = fixture();
  assert.equal((await f.call('verify-email', {}, 'good', 'https://attacker.example')).status, 403);
  assert.equal((await f.call('password-reset', { email: 'qa@example.com', continueUrl: 'https://attacker.example/account/' }, '')).status, 400);
  f.limited(); assert.equal((await f.call('verify-email', {})).status, 429); assert.equal(f.sent.length, 0);
  f.disable(); assert.equal((await f.call('verify-email', {})).status, 503);
});
test('account continuations strip arbitrary state; email templates escape action links', () => {
  assert.equal(accountContinuation('https://dusaccom.web.app/account/?settings=email&redirect=https://attacker.example'), 'https://dusaccnj.org/account/?settings=email');
  assert.throws(() => ownedActionLink('https://attacker.example/?mode=resetPassword', 'en'));
  const link = ownedActionLink(generated, 'en');
  assert.equal(new URL(link).pathname, '/account/reset-password/');
  for (const mode of ['verifyEmail', 'verifyAndChangeEmail']) {
    const generatedAction = new URL(generated);
    generatedAction.searchParams.set('mode', mode);
    assert.equal(new URL(ownedActionLink(generatedAction.href, 'es')).pathname, '/__/auth/action');
  }
  for (const kind of ['password-reset', 'verify-email', 'change-email'] as const) {
    const mail = accountEmail(kind, '<script>', 'en', link);
    assert.ok(mail.subject.includes('DUSACCOM'));
    assert.ok(mail.text.includes(link)); assert.ok(mail.html.includes('&amp;oobCode='));
    assert.ok(!mail.html.includes('<script>'));
  }
  assert.throws(() => accountEmail('password-reset', '', 'en', 'https://attacker.example/'));
});


test('missing reset accounts bypass the provider link assertion without hiding real failures', async () => {
  let generatedCount = 0;
  const provider = {
    async getUserByEmail() { throw Object.assign(new Error('Missing'), { code: 'auth/user-not-found' }); },
    async generatePasswordResetLink() { generatedCount++; throw new Error('Internal link assertion for missing account'); },
  };
  assert.equal(await generateResetActionLink(provider, 'missing@example.com', 'https://dusaccnj.org/account/'), null);
  assert.equal(generatedCount, 0);
  await assert.rejects(generateResetActionLink({ ...provider, async getUserByEmail() { throw new Error('Permission failure'); } }, 'qa@example.com', 'https://dusaccnj.org/account/'), /Permission failure/);
  assert.equal(await generateResetActionLink({ async getUserByEmail() { return {}; }, async generatePasswordResetLink() { return generated; } }, 'qa@example.com', 'https://dusaccnj.org/account/'), generated);
});
