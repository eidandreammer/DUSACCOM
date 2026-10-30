import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const heroImages = JSON.parse(await readFile(new URL('../src/lib/hero-images.json', import.meta.url), 'utf8'));
const base = process.argv[2] || 'http://127.0.0.1:8787';
const paths = process.argv.length > 3 ? process.argv.slice(3) : ['/', '/about', '/account', '/programs', '/membership', '/contact', '/privacy', '/terms', '/resources/better-business-networking', '/resources/preparing-for-a-new-market', '/resources/a-community-in-your-corner'];
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
  for (const match of html.matchAll(/(?:src|href)="(\/(?:_next\/static|assets|imgs)\/[^"?]+)/g)) assets.add(match[1].replaceAll('&amp;', '&').replaceAll('&#x27;', "'"));
  if (path === '/contact') assert.match(html, /method="post"/, 'No-JavaScript forms never expose fields in a GET URL');
  if (path === '/') {
    const sections = ['about', 'mission', 'membership', 'register', 'infotep', 'events', 'register-form'];
    const positions = sections.map(id => html.indexOf(`<section id="${id}"`));
    assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])), 'Landing sections follow the requested order');
    const anchors = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const match of html.matchAll(/href="\/?#([^"]+)"/g)) assert.ok(anchors.has(match[1]), `Landing link #${match[1]} has a target`);
    assert.match(html, /<section id="register-form"[\s\S]*?<form[^>]*method="post"/, 'Registration form is available on the landing page');
    assert.match(html, /<option value="nonprofit">/, 'Nonprofit registration is available');
    assert.match(html, /href="#register-form"/, 'Membership cards lead to the main-page form');
    assert.match(html, /home-hero/, 'Header visibility hook is preserved');
    for (const { name } of heroImages) assert.match(html, new RegExp(`/assets/hero-${name}-`), `Cultural hero photo ${name} is present`);
    for (const photo of ['culture-carnival', 'culture-dance']) assert.doesNotMatch(html, new RegExp(`/assets/hero-${photo}-`), `Removed cultural hero photo ${photo} is absent`);
    assert.match(html, /id="registration-submenu"/, 'Registration dropdown is preserved');
    assert.match(html, /id="mobile-navigation"/, 'Mobile navigation is preserved');
    assert.match(html, /Switch language to Spanish/, 'Language control is preserved');
    assert.match(html, />DUS<\/span><span[^>]*>AC<\/span><span[^>]*>COM<\/span>/, 'Hero renders the three flag-colored name segments');
    assert.match(html, /INFOTEP logos/, 'Supplied INFOTEP logo is displayed');
    const training = html.match(/<section id="infotep"[\s\S]*?<\/section>/)?.[0] || '';
    assert.match(training, /English Lessons/);
    assert.match(training, /Spanish Lessons/);
    assert.doesNotMatch(training, /Finance &amp; Accounting|Digital Marketing/);
    const membership = html.match(/<section id="membership"[\s\S]*?<\/section>/)?.[0] || '';
    assert.equal((membership.match(/<article\b/g) || []).length, 4, 'All four membership cards are displayed');
    assert.doesNotMatch(membership, /<details\b|<summary\b/, 'Membership content is always visible without a details toggle');
    assert.equal((membership.match(/<ul\b/g) || []).length, 4, 'Every card displays its benefits');
    assert.match(html, /aria-label="Chapter event calendar"/, 'Event calendar is available');
    const events = html.match(/<section id="events"[\s\S]*?<\/section>/)?.[0] || '';
    assert.doesNotMatch(events, /<article\b/, 'No event cards appear while all events are unconfirmed');
    assert.doesNotMatch(html, /href="\/(fotos|enviar-fotos|agendar-cita)"/, 'Removed photo pages are absent from navigation');
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
    assert.ok(footer, 'Footer is present');
    assert.doesNotMatch(footer, /href="\/(fotos|enviar-fotos|agendar-cita)"|href="https:\/\/(instagram|facebook)\.com"/, 'Footer omits extra photo-service links and placeholder social profiles');
  }
  console.log(`PASS ${path}`);
}
for (const asset of assets) assert.equal((await fetch(`${base}${asset}`)).status, 200, `Asset ${asset}`);
assert.equal((await fetch(`${base}/not-a-real-page`)).status, 404);
for (const path of ['/fotos', '/enviar-fotos', '/agendar-cita']) {
  assert.equal((await fetch(`${base}${path}`)).status, 404, `${path}: removed photo page`);
}
assert.equal((await fetch(`${base}/sitemap.xml`)).status, 200);
assert.equal((await fetch(`${base}/robots.txt`)).status, 200);
assert.equal((await (await fetch(`${base}/api/health`)).json()).status, 'ok');
const invalid = await fetch(`${base}/api/inquiries`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
assert.equal(invalid.status, 422);
console.log(`PASS: ${paths.length} pages, ${assets.size} local assets, metadata routes, 404, health, and server validation.`);
