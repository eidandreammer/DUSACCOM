import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { passwordResetRecoveryHref } from '../src/lib/password-reset';

async function recoveryDestination(continuation: string) {
  const html = await readFile(new URL('../hosting-legacy/__reset-password/index.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  let destination: string | undefined;
  runInNewContext(script, { URL, URLSearchParams, window: { location: {
    search: `?${new URLSearchParams({ continueUrl: continuation })}`,
    replace: (value: string) => { destination = value; },
  } } });
  return destination;
}

test('reset requests refresh the email-link origin and return with the original event context', async () => {
  const link = new URL(passwordResetRecoveryHref('demo-dusaccom', '?mode=reset&intent=event-registration&event=live-one&oobCode=secret&returnTo=https://evil.example'));
  assert.equal(link.origin, 'https://demo-dusaccom.firebaseapp.com');
  assert.equal(link.pathname, '/__reset-password/');
  assert.equal(link.href.includes('secret'), false);
  const destination = new URL((await recoveryDestination(link.searchParams.get('continueUrl')!))!);
  assert.equal(destination.origin, 'https://dusaccom.web.app');
  assert.equal(destination.pathname, '/account/');
  assert.equal(destination.searchParams.get('mode'), 'reset');
  assert.equal(destination.searchParams.get('resetSent'), '1');
  assert.equal(destination.searchParams.get('intent'), 'event-registration');
  assert.equal(destination.searchParams.get('event'), 'live-one');
  assert.equal(destination.searchParams.has('returnTo'), false);
});

test('cache recovery cannot redirect outside the account page or forward action codes', async () => {
  for (const target of ['https://evil.example/account/', '//evil.example/account/', 'javascript:alert(1)', 'https://dusaccom.web.app.evil.example/account/', 'https://dusaccom.web.app/contact/', 'https://user:password@dusaccom.web.app/account/']) {
    assert.equal(await recoveryDestination(target), undefined, target);
  }
  const target = new URL((await recoveryDestination('https://dusaccom.web.app/account/?settings=password&intent=evil&event=../account&oobCode=secret&continueUrl=https://evil.example/'))!);
  assert.equal(target.searchParams.get('settings'), 'password');
  assert.equal(target.searchParams.has('intent'), false);
  assert.equal(target.searchParams.has('event'), false);
  assert.equal(target.searchParams.has('oobCode'), false);
  assert.equal(target.searchParams.has('continueUrl'), false);
  for (const project of ['https://evil.example', 'example.com/path', '../auth', 'bad project']) assert.throws(() => passwordResetRecoveryHref(project, ''));
});

test('legacy recovery evicts only HTTP cache and cannot be cached itself', async () => {
  const { hosting } = JSON.parse(await readFile(new URL('../firebase.legacy.json', import.meta.url), 'utf8'));
  const headers = hosting.headers.find((rule: { regex?: string }) => rule.regex && new RegExp(rule.regex).test('/__reset-password/')).headers;
  assert.deepEqual(headers.find((header: { key: string }) => header.key === 'Clear-Site-Data'), { key: 'Clear-Site-Data', value: '"cache"' });
  assert.deepEqual(headers.find((header: { key: string }) => header.key === 'Cache-Control'), { key: 'Cache-Control', value: 'no-store' });
});
