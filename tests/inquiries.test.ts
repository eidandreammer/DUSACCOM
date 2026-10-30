import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInquiryHandler, ServiceUnavailable, type InquiryStore, type StoredReceipt } from '../src/server/inquiry-handler';
import { inquirySchema, type Inquiry } from '../src/lib/inquiry';
class MemoryStore implements InquiryStore {
  receipts = new Map<string, StoredReceipt>();
  messages = new Map<string, Inquiry>();
  limits = new Map<string, number>();
  failSave = false;
  async find(id: string) { return this.receipts.get(id) || null; }
  async consumeLimit(key: string) { const count = (this.limits.get(key) || 0) + 1; this.limits.set(key, count); return count <= 5; }
  async save(input: Inquiry, receipt: StoredReceipt) { if (this.failSave) throw new Error('database failure with private data'); if (this.receipts.has(input.submissionId)) throw new Error('UNIQUE'); this.receipts.set(input.submissionId, receipt); this.messages.set(input.submissionId, input); }
}
const origin = 'https://dusaccom.example';
const input = (patch: Record<string, unknown> = {}) => ({ kind: 'contact', name: 'María García', email: 'maria+business@example.com', company: 'A & B', interest: 'General inquiry', message: 'I would like to connect with the Chamber.', consent: true, website: '', submissionId: crypto.randomUUID(), ...patch });
function request(body: unknown, headers: Record<string, string> = {}, method = 'POST') { return new Request(`${origin}/api/inquiries`, { method, headers: { 'content-type': 'application/json', origin, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }); }
function setup() { const store = new MemoryStore(); return { store, handle: createInquiryHandler(async () => store, origin) }; }

test('a valid inquiry is persisted before a 201 receipt is returned', async () => {
  const { store, handle } = setup(); const data = input(); const response = await handle(request(data)); const body = await response.json();
  assert.equal(response.status, 201); assert.equal(body.ok, true); assert.match(body.reference, /^DUS-[A-F0-9]{12}$/); assert.ok(body.receivedAt);
  assert.equal(store.messages.get(data.submissionId)?.email, data.email); assert.equal(response.headers.get('cache-control'), 'no-store');
});
test('an identical retry returns the original receipt without a duplicate or new rate use', async () => {
  const { store, handle } = setup(); const data = input(); const first = await (await handle(request(data))).json(); const second = await handle(request(data));
  assert.equal(second.status, 200); assert.equal((await second.json()).reference, first.reference); assert.equal(store.messages.size, 1); assert.deepEqual([...store.limits.values()], [1]);
});
test('a reused submission ID with different contents is rejected', async () => {
  const { handle } = setup(); const data = input(); await handle(request(data));
  assert.equal((await handle(request({ ...data, message: 'An entirely different inquiry.' }))).status, 409);
});
test('server validation rejects missing consent, bad email, short messages, and whitespace names', async () => {
  for (const patch of [{ consent: false }, { email: 'not-an-email' }, { message: 'Hi' }, { name: '  ' }]) {
    const { store, handle } = setup(); const response = await handle(request(input(patch))); assert.equal(response.status, 422); assert.equal(store.messages.size, 0); assert.equal((await response.json()).ok, false);
  }
});
test('honeypot and unknown fields are rejected without saving data', async () => {
  for (const patch of [{ website: 'spam.example' }, { admin: true }]) {
    const { store, handle } = setup(); assert.equal((await handle(request(input(patch)))).status, 422); assert.equal(store.messages.size, 0);
  }
});
test('membership and event options must be real content IDs', async () => {
  const { handle } = setup();
  assert.equal((await handle(request(input({ kind: 'membership', interest: 'invented-tier' })))).status, 422);
  assert.equal((await handle(request(input({ kind: 'event', interest: 'invented-event' })))).status, 422);
  assert.equal((await handle(request(input({ kind: 'membership', interest: 'startup' })))).status, 201);
  assert.equal((await handle(request(input({ kind: 'membership', interest: 'nonprofit' })))).status, 201);
  assert.equal((await handle(request(input({ kind: 'event', interest: 'beyond-borders' })))).status, 201);
});
test('cross-origin and cross-site submissions are rejected', async () => {
  const { handle } = setup();
  assert.equal((await handle(request(input(), { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await handle(request(input(), { 'sec-fetch-site': 'cross-site' }))).status, 403);
});
test('body types, malformed JSON, and declared oversized requests are rejected', async () => {
  const { handle } = setup();
  assert.equal((await handle(request(input(), { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await handle(request('{not json}'))).status, 400);
  assert.equal((await handle(request(input(), { 'content-length': '13000' }))).status, 413);
});
test('oversized bodies without content-length are bounded while reading', async () => {
  const { handle } = setup(); const response = await handle(request('a'.repeat(13000))); assert.equal(response.status, 413);
});
test('a shared network is limited to five new inquiries per window', async () => {
  const { store, handle } = setup();
  for (let count = 0; count < 5; count++) assert.equal((await handle(request(input()))).status, 201);
  const response = await handle(request(input())); assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '600'); assert.equal(store.messages.size, 5);
});
test('unavailable storage never returns a success receipt', async () => {
  const handle = createInquiryHandler(async () => { throw new ServiceUnavailable(); }, origin);
  const response = await handle(request(input())); assert.equal(response.status, 503); assert.equal((await response.json()).ok, false);
});
test('storage errors produce a recoverable 500 without leaking contents in logs or response', async () => {
  const { store, handle } = setup(); store.failSave = true; const entries: string[] = []; const original = console.error; console.error = message => entries.push(String(message));
  try { const response = await handle(request(input())); const body = await response.text(); assert.equal(response.status, 500); assert.ok(!body.includes('private data')); assert.ok(entries.every(entry => !entry.includes('maria') && !entry.includes('database failure'))); }
  finally { console.error = original; }
});
test('concurrent retries converge to one saved inquiry', async () => {
  const { store, handle } = setup(); const data = input(); const results = await Promise.all([handle(request(data)), handle(request(data))]); const bodies = await Promise.all(results.map(result => result.json()));
  assert.equal(store.messages.size, 1); assert.equal(bodies[0].reference, bodies[1].reference); assert.ok(results.every(response => response.ok));
});
test('optional company is normalized and unknown kinds are rejected', () => {
  assert.equal(inquirySchema.parse(input({ company: '   ' })).company, ''); assert.equal(inquirySchema.safeParse(input({ kind: 'administrator' })).success, false);
});
test('a reverse-proxy internal URL accepts the original same-origin Host', async () => {
  const { handle } = setup();
  const proxied = new Request('http://localhost/api/inquiries', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://127.0.0.1:8787', host: '127.0.0.1:8787' }, body: JSON.stringify(input()) });
  assert.equal((await handle(proxied)).status, 201);
});
test('opaque and malformed origins are rejected', async () => {
  const { handle } = setup();
  assert.equal((await handle(request(input(), { origin: 'null' }))).status, 403);
  assert.equal((await handle(request(input(), { origin: 'not-a-url' }))).status, 403);
});
