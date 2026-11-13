import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountEmail, deliverAccountEmail } from '../functions/src/account-email';
import { createPasswordHandler } from '../functions/src/password-handler';

test('account mail escapes profile data, provides text, and uses the owned domain', () => {
  for (const kind of ['welcome', 'password-changed', 'account-deleted'] as const) {
    for (const lang of ['en', 'es'] as const) {
      const mail = accountEmail(kind, '<script>alert("x")</script>', lang);
      assert.ok(mail.subject.includes('DUSACCOM'));
      assert.ok(mail.text.includes('https://dusaccnj.org/account/'));
      assert.ok(mail.html.includes('&lt;script&gt;'));
      assert.ok(!mail.html.includes('<script>'));
    }
  }
});
test('Resend delivery uses a stable idempotency key and rejects missing receipts', async () => {
  const transport = (async (url: string | URL | Request, options: RequestInit) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal((options.headers as Record<string, string>)['Idempotency-Key'], 'dusaccom-account/test-id');
    const body = JSON.parse(String(options.body));
    assert.equal(body.from, 'DUSACCOM <noreply@dusaccnj.org>');
    assert.deepEqual(body.to, ['qa@example.com']);
    return Response.json({ id: 'receipt' });
  }) as typeof fetch;
  assert.equal(await deliverAccountEmail({ kind: 'password-changed', to: 'qa@example.com', id: 'test-id' }, 'secret', transport), 'receipt');
  await assert.rejects(deliverAccountEmail({ kind: 'welcome', to: 'qa@example.com', id: 'test-id' }, 'secret', (async () => Response.json({})) as typeof fetch));
  await assert.rejects(deliverAccountEmail({ kind: 'welcome', to: 'qa@example.com', id: 'test-id' }, 'secret', (async () => new Response('private error', { status: 429 })) as typeof fetch), /429/);
});
function fixture() {
  let enabled = true, allowed = true, changed = 0;
  const handle = createPasswordHandler({
    now: () => 1_000_000,
    enabled: () => enabled,
    reserve: async uid => { assert.equal(uid, 'member'); return allowed; },
    verify: async token => { if (token === 'bad') throw new Error('Bad token'); return { uid: 'member', authTime: token === 'stale' ? 0 : 1_000_000 }; },
    change: async (uid, password, lang) => { assert.equal(uid, 'member'); assert.equal(password, 'password-for-test'); assert.equal(lang, 'es'); changed++; },
  });
  const call = (token = 'good', input: unknown = { password: 'password-for-test', lang: 'es', operationId: 'fdab8e41-5d83-4e92-a582-2c1c0c624046' }, origin = 'https://dusaccnj.org') => handle(new Request('https://dusaccnj.org/api/account-password', {
    method: 'POST', headers: { Origin: origin, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
  return { call, changed: () => changed, disable: () => { enabled = false; }, limit: () => { allowed = false; } };
}
test('password mail endpoint requires trusted origin, verified token, recent login and strict input', async () => {
  const f = fixture();
  assert.equal((await f.call('good', {}, 'https://attacker.example')).status, 403);
  assert.equal((await f.call('bad')).status, 401);
  assert.equal((await f.call('stale')).status, 401);
  assert.equal((await f.call('good', { password: 'short' })).status, 400);
  assert.equal((await f.call('good', { to: 'attacker@example.com' })).status, 400);
  assert.equal(f.changed(), 0);
  assert.equal((await f.call()).status, 200);
  assert.equal(f.changed(), 1);
});
test('inactive sender and rate limits never mutate a password', async () => {
  const f = fixture(); f.disable();
  assert.equal((await f.call()).status, 503); assert.equal(f.changed(), 0);
  const g = fixture(); g.limit();
  assert.equal((await g.call()).status, 429); assert.equal(g.changed(), 0);
});
