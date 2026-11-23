// End-to-end check of the translateEvent trigger in the emulators, against a local mock
// of Cloud Translation (never the paid API). Skipped unless EVENT_TRANSLATION_ENDPOINT is set:
//   npm --prefix functions run build && EVENT_TRANSLATION_ENDPOINT=http://127.0.0.1:5999/translate \
//   npx --yes --package=firebase-tools@latest -- firebase emulators:exec --only firestore,functions --project demo-dusaccom \
//   "node --test tests/firebase/event-translation-trigger.test.mjs"
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const endpoint = process.env.EVENT_TRANSLATION_ENDPOINT;
let environment, server, fail = false;
const calls = [];
before(async () => {
  if (!endpoint) return;
  server = createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const request = JSON.parse(body);
      calls.push(request);
      if (fail) { res.writeHead(500).end('{}'); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ data: { translations: request.q.map(text => ({ translatedText: `[${request.target}] ${text}` })) } }));
    });
  });
  await new Promise(resolve => server.listen(Number(new URL(endpoint).port), '127.0.0.1', resolve));
  environment = await initializeTestEnvironment({ projectId: 'demo-dusaccom', firestore: { host: '127.0.0.1', port: 8080 } });
});
after(async () => { await environment?.cleanup(); server?.close(); });

const until = async (read, check, ms = 15000) => {
  const end = Date.now() + ms;
  for (;;) { const value = await read(); if (check(value)) return value; if (Date.now() > end) return value; await new Promise(r => setTimeout(r, 250)); }
};

test('translateEvent fills es/pt, keeps manual text, re-translates on English edits and does not loop', { skip: !endpoint && 'EVENT_TRANSLATION_ENDPOINT not set' }, async () => {
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const ref = doc(db, 'events', 'live-trigger');
    const read = async () => (await getDoc(ref)).data();
    await setDoc(ref, { title: 'Business mixer', titleEs: 'Encuentro de negocios', description: 'Meet local owners.', descriptionEs: '', titlePt: '', descriptionPt: '',
      location: 'Hackensack, NJ', category: 'Networking', startsAt: '2027-01-15T23:00:00.000Z', timeZone: 'America/New_York', status: 'confirmed', registration: 'open', createdBy: 'admin', createdAt: serverTimestamp() });
    let data = await until(read, value => value?.translation);
    assert.equal(data.titleEs, 'Encuentro de negocios');
    assert.equal(data.descriptionEs, '[es] Meet local owners.');
    assert.equal(data.titlePt, '[pt-BR] Business mixer');
    assert.equal(data.translation.es, 'mixed');
    assert.equal(data.location, 'Hackensack, NJ');
    const settled = calls.length;
    await new Promise(r => setTimeout(r, 3000));
    assert.equal(calls.length, settled, 'own write must not cause more API calls');

    await updateDoc(ref, { title: 'Holiday mixer' });
    data = await until(read, value => value?.titlePt === '[pt-BR] Holiday mixer');
    assert.equal(data.titlePt, '[pt-BR] Holiday mixer');
    assert.equal(data.titleEs, 'Encuentro de negocios');

    fail = true;
    const before = await read();
    await updateDoc(ref, { description: 'Changed while the API is down.' });
    await new Promise(r => setTimeout(r, 3000));
    const failed = await read();
    assert.equal(failed.descriptionPt, before.descriptionPt);
    assert.equal(failed.translation.sourceHash, before.translation.sourceHash);
  });
});
