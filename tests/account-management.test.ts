import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAccountHandler, type AccountStore, type Challenge, type DeletionRequest, type Role } from '../functions/src/account-handler';
import { createHoldConfirmation } from '../src/lib/hold-confirmation';

function fixture() {
  let clock = 1000000;
  const roles = new Map<string, Role>([
    ['parent', { enabled: true }], ['other-parent', { enabled: true }],
    ['delegate', { enabled: true, parentUid: 'parent', email: 'parent@gmail.com', username: 'admin1' }],
    ['sibling', { enabled: true, parentUid: 'other-parent' }],
  ]);
  const requests = new Map<string, DeletionRequest>();
  const challenges = new Map<string, Challenge>();
  const users = new Map<string, { email?: string; createdAt: number }>([
    ['parent', { email: 'parent@gmail.com', createdAt: 0 }], ['delegate', { email: 'parent+dusaccom-admin1@gmail.com', createdAt: 0 }],
    ['person', { email: 'person@gmail.com', createdAt: 0 }], ['person2', { email: 'person2@gmail.com', createdAt: 0 }],
  ]);
  let failDeletion = false;
  const store: AccountStore = {
    async role(uid) { return roles.get(uid); },
    async disable(uid) { roles.set(uid, { ...roles.get(uid), enabled: false }); },
    async removeRole(uid) { roles.delete(uid); },
    async hasDelegates(uid) { return [...roles.values()].some(role => role.parentUid === uid); },
    async request(uid) { return requests.get(uid); },
    async saveRequest(uid, request) { requests.set(uid, structuredClone(request)); },
    async challenge(uid) { return challenges.get(uid); },
    async saveChallenge(uid, challenge) { challenges.set(uid, challenge); },
    async removeChallenge(uid) { challenges.delete(uid); },
    async authUser(uid) { return users.get(uid); },
    async deleteAuthUser(uid) { if (failDeletion) { failDeletion = false; throw new Error('Temporary service error'); } users.delete(uid); },
  };
  const handler = createAccountHandler({ store, now: () => clock, verify: async token => {
    if (token === 'invalid') throw new Error('Invalid token');
    return { uid: token === 'stale' ? 'person' : token, email: `${token}@gmail.com`, authTime: token === 'stale' ? clock - 301000 : clock };
  } });
  const call = (path: string, actor: string, body: unknown = {}, origin = 'https://dusaccom.web.app') => handler(new Request(`https://dusaccom.web.app/api/account-management/${path}`, {
    method: 'POST', headers: { Origin: origin, Authorization: `Bearer ${actor}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
  return { call, roles, requests, users, challenges, advance: (time: number) => { clock += time; }, failNextDeletion: () => { failDeletion = true; } };
}

test('delegates request deletion but cannot delete themselves or approve requests', async () => {
  const f = fixture();
  assert.equal((await f.call('deletion-request', 'delegate')).status, 200);
  assert.equal(f.requests.get('delegate')?.parentUid, 'parent');
  assert.equal(f.requests.get('delegate')?.status, 'pending');
  assert.equal((await f.call('deletion-request', 'delegate', { status: 'approved' })).status, 400);
  assert.equal((await f.call('begin-self-deletion', 'delegate')).status, 403);
  assert.equal((await f.call('delete-self', 'delegate', { confirmation: 'a'.repeat(72) })).status, 403);
  assert.equal((await f.call('delete-delegate', 'delegate', { targetUid: 'delegate' })).status, 403);
  assert.equal((await f.call('decline-request', 'delegate', { targetUid: 'delegate' })).status, 403);
  assert.ok(f.users.has('delegate'));
});

test('the API fails closed until bypassing parent approval through Firebase client deletion is disabled', async () => {
  const handler = createAccountHandler({ store: {} as AccountStore, verify: async () => ({ uid: 'parent', authTime: Date.now() }), isEnabled: async () => false });
  const call = (path: string) => handler(new Request(`https://dusaccom.web.app/api/account-management/${path}`, { method: 'POST', headers: { Origin: 'https://dusaccom.web.app', Authorization: 'Bearer token', 'Content-Type': 'application/json' }, body: '{}' }));
  const availability = await call('availability');
  assert.deepEqual(await availability.json(), { enabled: false });
  assert.equal((await call('begin-self-deletion')).status, 503);
});

test('only the enabled parent can permanently delete its own delegates', async () => {
  const f = fixture();
  for (const actor of ['person', 'other-parent', 'delegate']) assert.equal((await f.call('delete-delegate', actor, { targetUid: 'delegate' })).status, 403);
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'parent' })).status, 403);
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'sibling' })).status, 403);
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: '../other-parent' })).status, 400);
  f.roles.set('parent', { enabled: false });
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'delegate' })).status, 403);
  f.roles.set('parent', { enabled: true });
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'delegate' })).status, 200);
  assert.equal(f.users.has('delegate'), false);
  assert.equal(f.roles.has('delegate'), false);
  assert.equal(f.requests.get('delegate')?.status, 'deleted');
  assert.ok(f.users.has('parent'));
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'delegate' })).status, 200);
});

test('failed Authentication deletion leaves access disabled and supports a safe retry', async () => {
  const f = fixture(); f.failNextDeletion();
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'delegate' })).status, 503);
  assert.equal(f.roles.get('delegate')?.enabled, false);
  assert.equal(f.requests.get('delegate')?.status, 'approved');
  assert.equal((await f.call('deletion-request', 'delegate')).status, 200);
  assert.equal(f.requests.get('delegate')?.status, 'approved');
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'delegate' })).status, 200);
  assert.equal(f.users.has('delegate'), false);
});

test('parent can decline a request without deleting the login, and delegate can resubmit', async () => {
  const f = fixture();
  await f.call('deletion-request', 'delegate');
  assert.equal((await f.call('decline-request', 'other-parent', { targetUid: 'delegate' })).status, 403);
  assert.equal((await f.call('decline-request', 'parent', { targetUid: 'delegate' })).status, 200);
  assert.equal(f.requests.get('delegate')?.status, 'declined');
  assert.ok(f.users.has('delegate'));
  await f.call('deletion-request', 'delegate');
  assert.equal(f.requests.get('delegate')?.status, 'pending');
});

test('self deletion requires recent login, a UID-bound challenge, and five seconds', async () => {
  const f = fixture();
  assert.equal((await f.call('begin-self-deletion', 'stale')).status, 401);
  assert.equal((await f.call('begin-self-deletion', 'parent')).status, 409);
  const { confirmation } = await (await f.call('begin-self-deletion', 'person')).json();
  await f.call('begin-self-deletion', 'person2');
  assert.equal((await f.call('delete-self', 'person2', { confirmation })).status, 409);
  f.advance(4999);
  assert.equal((await f.call('delete-self', 'person', { confirmation })).status, 409);
  assert.ok(f.users.has('person'));
  f.advance(1);
  assert.equal((await f.call('delete-self', 'person', { confirmation })).status, 200);
  assert.equal(f.users.has('person'), false);
  assert.equal(f.challenges.has('person'), false);
  assert.ok(f.users.has('person2'));
});

test('expired challenges, wrong origins, invalid tokens, and oversized payloads cannot mutate accounts', async () => {
  const f = fixture();
  const { confirmation } = await (await f.call('begin-self-deletion', 'person')).json();
  f.advance(600001);
  assert.equal((await f.call('delete-self', 'person', { confirmation })).status, 409);
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'delegate' }, 'https://attacker.example')).status, 403);
  assert.equal((await f.call('delete-delegate', 'invalid', { targetUid: 'delegate' })).status, 401);
  assert.equal((await f.call('delete-delegate', 'parent', { targetUid: 'x'.repeat(3000) })).status, 413);
  assert.ok(f.users.has('delegate'));
  assert.ok(f.users.has('person'));
});

test('creation cleanup cannot remove an assigned, old, unrelated, or parent account', async () => {
  const f = fixture();
  f.users.set('orphan', { email: 'parent+dusaccom-admin2@gmail.com', createdAt: 1000000 });
  assert.equal((await f.call('discard-unassigned-delegate', 'parent', { targetUid: 'orphan', username: 'admin2' })).status, 200);
  assert.equal(f.users.has('orphan'), false);
  assert.equal((await f.call('discard-unassigned-delegate', 'parent', { targetUid: 'delegate', username: 'admin1' })).status, 403);
  assert.equal((await f.call('discard-unassigned-delegate', 'parent', { targetUid: 'person', username: 'admin2' })).status, 403);
  assert.equal((await f.call('discard-unassigned-delegate', 'delegate', { targetUid: 'parent', username: 'admin2' })).status, 403);
});

test('hold confirmation cancels on release and requires a new full five-second hold', () => {
  let current = 0; let count = 0; let next = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const advance = (milliseconds: number) => { current += milliseconds; for (const [id, timer] of timers) if (timer.at <= current) { timers.delete(id); timer.callback(); } };
  const hold = createHoldConfirmation({ complete: () => { count++; },
    schedule: (callback, delay) => { const id = ++next; timers.set(id, { at: current + delay, callback }); return id as unknown as ReturnType<typeof setTimeout>; },
    clear: timer => { timers.delete(timer as unknown as number); },
  });
  hold.start(); advance(4999); hold.cancel(); advance(1); assert.equal(count, 0);
  hold.start(); hold.start(); advance(4999); assert.equal(count, 0); advance(1); assert.equal(count, 1);
  hold.cancel(); advance(10000); assert.equal(count, 1);
});
