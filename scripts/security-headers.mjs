import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { contentSecurityPolicy } from '../security/browser-policy.mjs';
export async function buildSecurityHeaders(directory) {
  const entries = [];
  async function scan(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const filename = join(path, entry.name);
      if (entry.isDirectory()) { if (entry.name !== '_next' && entry.name !== 'assets' && entry.name !== 'imgs') await scan(filename); continue; }
      if (!entry.name.endsWith('.html')) continue;
      const html = await readFile(filename, 'utf8');
      const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
        .filter(([, attrs]) => !/\bsrc\s*=/i.test(attrs)).map(([, , body]) => createHash('sha256').update(body).digest('base64'));
      const file = relative(directory, filename).replaceAll('\\', '/');
      const path = file === 'index.html' ? '/' : file.endsWith('/index.html') ? `/${file.slice(0, -11)}` : `/${file.slice(0, -5)}`;
      entries.push({ path, file, digest: createHash('sha256').update(html).digest('hex'), policy: contentSecurityPolicy({ hashes: [...new Set(hashes)] }) });
    }
  }
  await scan(directory);
  if (!entries.some(entry => entry.path === '/') || !entries.some(entry => entry.path === '/404')) throw new Error('Incomplete static export.');
  await writeFile(join(directory, '.security-headers.json'), JSON.stringify(entries));
  return entries;
}
export async function staticSecurityHeaders(directory) {
  const entries = JSON.parse(await readFile(join(directory, '.security-headers.json'), 'utf8'));
  for (const entry of entries) {
    if (createHash('sha256').update(await readFile(join(directory, entry.file))).digest('hex') !== entry.digest) throw new Error('HTML changed after CSP generation. Rebuild before deployment.');
  }
  const fallback = entries.find(entry => entry.path === '/404').policy;
  // Preserve Firebase's reserved auth widgets, whose HTML is managed by Firebase.
  const headers = [{ regex: '^/([^_].*|_[^_].*|_)$', headers: [{ key: 'Content-Security-Policy', value: fallback }] }];
  for (const { path, policy } of entries) {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    headers.push({ regex: path === '/' ? '^/$' : `^${escaped}(/|[.]html)?$`, headers: [{ key: 'Content-Security-Policy', value: policy }] });
  }
  return headers;
}
