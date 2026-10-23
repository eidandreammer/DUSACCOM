import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:8787';
const submissions = [ ['contact', 'General inquiry'], ['membership', 'startup'], ['event', 'beyond-borders'] ];
for (const [kind, interest] of submissions) {
  const data = { kind, interest, name: 'Local QA Test', email: 'qa@example.test', company: 'Local verification only', message: 'This is a synthetic local persistence test. No email should be sent.', consent: true, website: '', submissionId: crypto.randomUUID() };
  const send = () => fetch(`${base}/api/inquiries`, { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify(data) });
  const response = await send();
  const body = await response.json();
  assert.equal(response.status, 201, JSON.stringify(body));
  assert.equal(body.ok, true); assert.match(body.reference, /^DUS-/);
  const retry = await send(); assert.equal(retry.status, 200); assert.equal((await retry.json()).reference, body.reference);
  console.log(`PASS: persisted ${kind} inquiry and idempotent retry.`);
}
