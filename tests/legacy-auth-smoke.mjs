import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { hosting } = JSON.parse(await readFile(new URL('../firebase.legacy.json', import.meta.url), 'utf8'));
for (const hostname of [`${hosting.site}.firebaseapp.com`, `${hosting.site}.web.app`]) {
  const origin = `https://${hostname}`;
  // A 200 HTML auth shell alone does not prove the reset page can initialize.
  // Its config must be JSON on the same origin, without a cross-origin redirect.
  const config = await fetch(`${origin}/__/firebase/init.json`, { redirect: 'manual' });
  assert.equal(config.status, 200, `${hostname}: same-origin Firebase config`);
  assert.match(config.headers.get('content-type'), /json/);
  assert.equal(config.headers.get('cache-control'), 'no-store', `${hostname}: do not retain old bootstrap configuration`);
  const sdk = await config.json();
  assert.ok(sdk.apiKey && sdk.projectId && sdk.appId);
  const action = await fetch(`${origin}/__/auth/action`, { redirect: 'manual' });
  assert.equal(action.status, 200, `${hostname}: auth handler`);
  const html = await action.text();
  for (const [, src] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    const script = await fetch(new URL(src, `${origin}/__/auth/action`));
    assert.equal(script.status, 200, `${hostname}: ${src}`);
    assert.match(script.headers.get('content-type'), /javascript/);
  }
  const refresh = await fetch(`${origin}/__reset-password/`, { redirect: 'manual' });
  assert.equal(refresh.status, 200, `${hostname}: cache refresh must not redirect`);
  assert.equal(refresh.headers.get('clear-site-data'), '"cache"', `${hostname}: refresh cached files only`);
  assert.equal(refresh.headers.get('cache-control'), 'no-store');
  const page = await fetch(`${origin}/account/?mode=reset`, { redirect: 'manual' });
  assert.equal(page.status, 301);
  assert.equal(page.headers.get('location'), 'https://dusaccom.web.app/account/?mode=reset');
  console.log(`PASS ${hostname}: auth config, handler scripts, cache refresh, and public-page redirect`);
}
