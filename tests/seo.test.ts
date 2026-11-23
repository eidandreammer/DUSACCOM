import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BusinessJsonLd, dusaccomEntity, type BusinessEntity } from '../src/components/business-json-ld';
import { canonicalUrl, pageMetadata, site } from '../src/lib/site';
import sitemap from '../src/app/sitemap';

test('canonical URLs reject queries and other origins and respect export trailing slashes', () => {
  assert.equal(canonicalUrl('/'), `${site.url}/`);
  assert.equal(new URL(canonicalUrl('/contact/')).origin, site.url);
  assert.throws(() => canonicalUrl('//another-site.test'));
  assert.throws(() => canonicalUrl('/\\another-site.test'));
  assert.throws(() => canonicalUrl('/account?token=secret'));
  assert.throws(() => canonicalUrl('/about#mission'));
  const previous = process.env.FIREBASE_HOSTING;
  try {
    process.env.FIREBASE_HOSTING = 'true';
    assert.equal(canonicalUrl('/contact'), `${site.url}/contact/`);
  } finally {
    if (previous === undefined) delete process.env.FIREBASE_HOSTING;
    else process.env.FIREBASE_HOSTING = previous;
  }
});

test('page metadata gives public routes their own canonical and social information', () => {
  const metadata = pageMetadata('Programs', 'Business programs.', '/programs');
  assert.equal(metadata.title, 'Programs');
  assert.equal(metadata.alternates?.canonical, canonicalUrl('/programs'));
  assert.equal(metadata.openGraph?.title, 'Programs | DUSACCOM');
  assert.equal(metadata.twitter?.description, 'Business programs.');
});

test('sitemap includes training and resource routes and excludes member accounts', () => {
  const urls = sitemap().map(entry => entry.url);
  assert.ok(urls.includes(canonicalUrl('/infotep')));
  assert.ok(urls.some(url => url.includes('/resources/')));
  assert.ok(!urls.some(url => /\/account|\/api\//.test(url)));
  assert.equal(new Set(urls).size, urls.length);
});

test('JSON-LD preserves data while preventing a script-tag escape and accepts a CSP nonce', () => {
  const business: BusinessEntity = { ...dusaccomEntity, type: 'Organization', name: '</script><script>alert(1)</script>' };
  const html = renderToStaticMarkup(createElement(BusinessJsonLd, { business, nonce: 'test-nonce' }));
  assert.ok(html.includes('nonce="test-nonce"'));
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  const data = JSON.parse(html.match(/>([\s\S]*)<\/script>/)![1]);
  assert.equal(data['@graph'][0].name, business.name);
  assert.equal(data['@graph'][1].publisher['@id'], data['@graph'][0]['@id']);
});

test('local business schema emits a typed postal address', () => {
  const business: BusinessEntity = {
    ...dusaccomEntity,
    type: 'ProfessionalService',
    address: { streetAddress: '1 Example Street', addressLocality: 'Example City', addressRegion: 'NJ', postalCode: '00000', addressCountry: 'US' },
  };
  const html = renderToStaticMarkup(createElement(BusinessJsonLd, { business }));
  const entity = JSON.parse(html.match(/>([\s\S]*)<\/script>/)![1])['@graph'][0];
  assert.equal(entity['@type'], 'ProfessionalService');
  assert.equal(entity.address['@type'], 'PostalAddress');
  assert.equal(entity.address.streetAddress, business.address.streetAddress);
});
