import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:8787';
const paths = ['/', '/about', '/programs', '/membership', '/contact', '/privacy', '/terms', '/resources/better-business-networking', '/resources/preparing-for-a-new-market', '/resources/a-community-in-your-corner'];
const assets = new Set();
for (const path of paths) {
  const response = await fetch(`${base}${path}`);
  const html = await response.text();
  assert.equal(response.status, 200, `${path}: HTTP status`);
  assert.match(html, /<html[^>]+lang="en"/, `${path}: language`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${path}: one H1`);
  assert.match(html, /<main[^>]+id="main"/, `${path}: main landmark`);
  assert.match(html, /rel="canonical"/, `${path}: canonical`);
  assert.match(html, /dusaccom1@gmail.com/, `${path}: official contact`);
  assert.doesNotMatch(html, /<script[^>]+src="https:\/\/www.googletagmanager.com/, `${path}: no analytics before consent`);
  for (const match of html.matchAll(/(?:src|href)="(\/(?:_next\/static|assets)\/[^"?]+)/g)) assets.add(match[1].replaceAll('&amp;', '&'));
  if (path === '/contact') assert.match(html, /method="post"/, 'No-JavaScript forms never expose fields in a GET URL');
  console.log(`PASS ${path}`);
}
for (const asset of assets) assert.equal((await fetch(`${base}${asset}`)).status, 200, `Asset ${asset}`);
assert.equal((await fetch(`${base}/not-a-real-page`)).status, 404);
assert.equal((await fetch(`${base}/sitemap.xml`)).status, 200);
assert.equal((await fetch(`${base}/robots.txt`)).status, 200);
assert.equal((await (await fetch(`${base}/api/health`)).json()).status, 'ok');
const invalid = await fetch(`${base}/api/inquiries`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
assert.equal(invalid.status, 422);
console.log(`PASS: ${paths.length} pages, ${assets.size} local assets, metadata routes, 404, health, and server validation.`);
