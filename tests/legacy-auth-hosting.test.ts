import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('main site lets cached legacy Auth redirects load only the public SDK configuration across origins', async () => {
  const { hosting } = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'));
  const bootstrap = hosting.headers.find((rule: { source?: string }) => rule.source === '/__/firebase/init.json');
  assert.ok(bootstrap, 'The destination of the old cached redirect needs its own headers.');
  const headers = Object.fromEntries(bootstrap.headers.map(({ key, value }: { key: string; value: string }) => [key, value]));
  assert.equal(headers['Access-Control-Allow-Origin'], '*');
  assert.equal(headers['Access-Control-Allow-Methods'], 'GET, HEAD, OPTIONS');
  assert.equal(headers['Access-Control-Allow-Headers'], 'Content-Type');
  assert.equal(headers['Cache-Control'], 'no-store');
  assert.equal(headers['Access-Control-Allow-Credentials'], undefined);
  assert.equal(hosting.headers.some((rule: { source?: string; headers: { key: string }[] }) => rule.source !== '/__/firebase/init.json' && rule.headers.some(header => header.key.toLowerCase().startsWith('access-control-'))), false, 'CORS must not be broadened for account APIs or other resources.');
});

test('legacy site redirects public pages and leaves Firebase Auth dependencies on the same origin', async () => {
  const { hosting } = JSON.parse(await readFile(new URL('../firebase.legacy.json', import.meta.url), 'utf8'));
  const redirects = hosting.redirects.map((rule: { source?: string; regex?: string; destination: string }) => ({
    ...rule, pattern: rule.regex ? new RegExp(rule.regex.replace('?P<', '?<')) : /^\/$/,
  }));
  for (const path of ['/__/firebase/init.json', '/__/firebase/init.js', '/__/auth/action', '/__/auth/handler', '/__/auth/experiments.js', '/__reset-password/']) {
    assert.equal(redirects.some((rule: { pattern: RegExp }) => rule.pattern.test(path)), false, `${path} must not redirect across origins`);
  }
  for (const path of ['/', '/account/', '/membership', '/resources/a-community-in-your-corner/', '/_next/static/example.js']) {
    const rule = redirects.find((rule: { pattern: RegExp }) => rule.pattern.test(path));
    assert.ok(rule, `${path} must redirect to the active site`);
    const match = rule.pattern.exec(path);
    assert.equal(rule.destination.replace(':path', match?.groups?.path || ''), `https://dusaccom.web.app${path}`);
  }
});
