import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldHash, fit, googleTranslator, planEventTranslation, type TargetLang, type Translate } from '../functions/src/event-translation';

const base = { title: 'Business mixer', titleEs: '', description: 'Meet local owners.', descriptionEs: '', location: 'Hackensack, NJ', category: 'Networking', status: 'confirmed' };
const NOW = { serverTimestamp: true };

// Fake translator: deterministic output per target, records every call.
function fakeTranslator() {
  const calls: Array<{ texts: string[]; target: TargetLang }> = [];
  const translate: Translate = async (texts, target) => { calls.push({ texts, target }); return texts.map(text => `[${target}] ${text}`); };
  return { calls, translate };
}
// Simulate Firestore applying the update (server timestamp resolves to a value).
type Doc = Record<string, unknown>;
const apply = (doc: Doc, plan: Doc): Doc =>
  ({ ...doc, ...plan, translation: { ...(plan.translation as object), translatedAt: 'resolved-timestamp' } });

test('a new event gets Spanish and Brazilian Portuguese copies in one call per language', async () => {
  const { calls, translate } = fakeTranslator();
  const plan = await planEventTranslation(base, translate, { now: NOW });
  assert.ok(plan);
  assert.deepEqual(calls, [
    { texts: ['Business mixer', 'Meet local owners.'], target: 'es' },
    { texts: ['Business mixer', 'Meet local owners.'], target: 'pt-BR' },
  ]);
  assert.equal(plan.titleEs, '[es] Business mixer');
  assert.equal(plan.descriptionPt, '[pt-BR] Meet local owners.');
  assert.equal(plan.translation.es, 'auto');
  assert.equal(plan.translation.pt, 'auto');
  assert.equal(plan.translation.translatedAt, NOW);
  assert.equal(plan.translation.fields.titlePt, fieldHash('[pt-BR] Business mixer'));
  assert.equal('location' in plan || 'category' in plan, false);
});

test('the function\'s own write is a no-op on the next trigger (hash skip, no loop)', async () => {
  const { calls, translate } = fakeTranslator();
  const once = apply(base, (await planEventTranslation(base, translate, { now: NOW }))!);
  calls.length = 0;
  assert.equal(await planEventTranslation(once, translate, { now: NOW }), null);
  assert.equal(calls.length, 0);
  // Unrelated admin edits (location, registration) and CRLF/whitespace round trips do not re-translate.
  const edited = { ...once, location: 'Paterson, NJ', titleEs: ` ${once.titleEs}\r\n` };
  assert.equal(await planEventTranslation(edited, translate, { now: NOW }), null);
  assert.equal(calls.length, 0);
});

test('admin-written Spanish is never overwritten; only blank fields are filled', async () => {
  const { calls, translate } = fakeTranslator();
  const legacy = { ...base, titleEs: 'Encuentro de negocios', descriptionEs: 'Conoce a empresarios locales.' };
  const plan = await planEventTranslation(legacy, translate, { now: NOW });
  assert.deepEqual(calls.map(call => call.target), ['pt-BR']);
  assert.equal('titleEs' in plan! || 'descriptionEs' in plan!, false);
  assert.equal(plan!.translation.es, 'manual');
  assert.equal(plan!.translation.pt, 'auto');

  calls.length = 0;
  const partial = await planEventTranslation({ ...base, titleEs: 'Encuentro de negocios', titlePt: 'Encontro de negócios' }, translate, { now: NOW });
  assert.deepEqual(calls, [
    { texts: ['Meet local owners.'], target: 'es' },
    { texts: ['Meet local owners.'], target: 'pt-BR' },
  ]);
  assert.equal(partial!.titleEs, undefined);
  assert.equal(partial!.descriptionEs, '[es] Meet local owners.');
  assert.equal(partial!.translation.es, 'mixed');
  assert.equal(partial!.translation.pt, 'mixed');
});

test('changing the English text re-translates machine fields only', async () => {
  const { calls, translate } = fakeTranslator();
  let doc = apply(base, (await planEventTranslation(base, translate, { now: NOW }))!);
  // An admin corrects the machine Spanish title: it becomes manual without any API call.
  doc = { ...doc, titleEs: 'Encuentro empresarial' };
  calls.length = 0;
  const marked = await planEventTranslation(doc, translate, { now: NOW });
  assert.equal(calls.length, 0);
  assert.equal(marked!.translation.es, 'mixed');
  assert.equal(marked!.translation.fields.titleEs, undefined);
  assert.equal(marked!.translation.translatedAt, 'resolved-timestamp');
  doc = apply(doc, marked!);
  assert.equal(await planEventTranslation(doc, translate, { now: NOW }), null);

  // Now the English changes: auto fields refresh, the manual Spanish title stays.
  doc = { ...doc, title: 'Holiday business mixer', description: 'Meet local owners in December.' };
  const plan = await planEventTranslation(doc, translate, { now: NOW });
  assert.deepEqual(calls, [
    { texts: ['Meet local owners in December.'], target: 'es' },
    { texts: ['Holiday business mixer', 'Meet local owners in December.'], target: 'pt-BR' },
  ]);
  assert.equal(plan!.titleEs, undefined);
  assert.equal(plan!.descriptionEs, '[es] Meet local owners in December.');
  assert.equal(plan!.titlePt, '[pt-BR] Holiday business mixer');
  doc = apply(doc, plan!);
  assert.equal(doc.titleEs, 'Encuentro empresarial');
  assert.equal(await planEventTranslation(doc, translate, { now: NOW }), null);

  // Clearing a field hands it back to the translator.
  calls.length = 0;
  const cleared = await planEventTranslation({ ...doc, titleEs: '' }, translate, { now: NOW });
  assert.equal(cleared!.titleEs, '[es] Holiday business mixer');
  assert.equal(cleared!.translation.es, 'auto');
});

test('an API failure leaves the document unchanged and does not throw', async () => {
  const logs: string[] = [];
  const failing: Translate = async () => { throw new Error('Cloud Translation responded 403'); };
  const plan = await planEventTranslation(base, failing, { now: NOW, log: message => logs.push(message) });
  assert.equal(plan, null);
  assert.equal(logs.length, 1);
  // Missing/blank English source is ignored entirely.
  const { translate, calls } = fakeTranslator();
  assert.equal(await planEventTranslation({ ...base, title: ' ' }, translate, { now: NOW }), null);
  assert.equal(await planEventTranslation(undefined, translate, { now: NOW }), null);
  assert.equal(calls.length, 0);
});

test('machine text is kept inside the rules and schema limits', async () => {
  assert.equal(fit('short', 160), 'short');
  const long = fit('palabra '.repeat(40), 160);
  assert.ok(long.length <= 160 && long.endsWith('…'));
  const wordy: Translate = async texts => texts.map(() => 'x'.repeat(5000));
  const plan = await planEventTranslation(base, wordy, { now: NOW });
  assert.ok(plan!.titleEs!.length <= 160 && plan!.descriptionPt!.length <= 2000);
  // Empty machine output leaves the field blank (English fallback) and converges.
  const empty: Translate = async texts => texts.map(() => '  ');
  const blank = await planEventTranslation(base, empty, { now: NOW });
  assert.equal(blank!.titleEs, undefined);
  assert.equal(await planEventTranslation(apply(base, blank!), empty, { now: NOW }), null);
});

test('googleTranslator posts a Basic v2 text request with a bearer token', async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ data: { translations: [{ translatedText: 'Hola & adiós' }, { translatedText: 'Mundo' }] } }), { status: 200 });
  }) as unknown as typeof fetch;
  const translate = googleTranslator({ getAccessToken: async () => 'token-123', fetchImpl });
  assert.deepEqual(await translate(['Hello & goodbye', 'World'], 'es'), ['Hola & adiós', 'Mundo']);
  assert.equal(requests[0].url, 'https://translation.googleapis.com/language/translate/v2');
  assert.equal((requests[0].init.headers as Record<string, string>).Authorization, 'Bearer token-123');
  assert.deepEqual(JSON.parse(String(requests[0].init.body)), { q: ['Hello & goodbye', 'World'], source: 'en', target: 'es', format: 'text' });

  const denied = googleTranslator({ getAccessToken: async () => 't', fetchImpl: (async () => new Response('{}', { status: 403 })) as unknown as typeof fetch });
  await assert.rejects(denied(['x'], 'pt-BR'), /403/);
  const malformed = googleTranslator({ getAccessToken: async () => 't', fetchImpl: (async () => new Response('{"data":{"translations":[]}}', { status: 200 })) as unknown as typeof fetch });
  await assert.rejects(malformed(['x'], 'pt-BR'), /unexpected/);
});
