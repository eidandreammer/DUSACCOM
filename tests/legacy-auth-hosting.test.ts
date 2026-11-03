import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

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
