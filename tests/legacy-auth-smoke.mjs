import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { hosting } = JSON.parse(await readFile(new URL('../firebase.legacy.json', import.meta.url), 'utf8'));
const canonicalConfig = await fetch('https://dusaccom.web.app/__/firebase/init.json', {
  redirect: 'manual', headers: { Origin: `https://${hosting.site}.firebaseapp.com` },
});
assert.equal(canonicalConfig.status, 200, 'Current host serves the destination of old cached bootstrap redirects');
assert.equal(canonicalConfig.headers.get('access-control-allow-origin'), '*', 'Old auth widgets may read the public configuration after a cached cross-origin redirect');
assert.equal(canonicalConfig.headers.get('cache-control'), 'no-store');
const canonicalSdk = await canonicalConfig.json();
// The Firebase widget sets Content-Type: application/json even on its GET,
// so a cached cross-origin redirect also requires a successful CORS preflight.
for (const origin of [`https://${hosting.site}.firebaseapp.com`, `https://${hosting.site}.web.app`, 'null']) {
  const preflight = await fetch('https://dusaccom.web.app/__/firebase/init.json', {
    method: 'OPTIONS', redirect: 'manual', headers: {
      Origin: origin, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.ok(preflight.ok, `${origin}: bootstrap preflight`);
  assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
  assert.match(preflight.headers.get('access-control-allow-methods') || '', /\bGET\b/);
  assert.match(preflight.headers.get('access-control-allow-headers') || '', /\bcontent-type\b/i);
}
console.log('PASS current host: public Auth configuration, cross-origin preflight, and no-store');
for (const hostname of [`${hosting.site}.firebaseapp.com`, `${hosting.site}.web.app`]) {
  const origin = `https://${hostname}`;
  // A 200 HTML auth shell alone does not prove the reset page can initialize.
  // Fresh requests must still serve JSON on the same origin; cached historical
  // redirects are supported by the current host's separate CORS check above.
  const config = await fetch(`${origin}/__/firebase/init.json`, { redirect: 'manual' });
  assert.equal(config.status, 200, `${hostname}: same-origin Firebase config`);
  assert.match(config.headers.get('content-type'), /json/);
  assert.equal(config.headers.get('cache-control'), 'no-store', `${hostname}: do not retain old bootstrap configuration`);
  const sdk = await config.json();
  assert.ok(sdk.apiKey && sdk.projectId && sdk.appId);
  for (const key of ['apiKey', 'projectId', 'appId']) assert.equal(sdk[key], canonicalSdk[key], `${hostname}: the redirect destination must initialize the same Firebase app`);
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
