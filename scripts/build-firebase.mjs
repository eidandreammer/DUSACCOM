import { cp, mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(root, false);
const project = JSON.parse(await readFile(join(root, '.firebaserc'), 'utf8')).projects.default;
for (const key of ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'APP_ID']) {
  if (!process.env[`NEXT_PUBLIC_FIREBASE_${key}`]) throw new Error(`Missing NEXT_PUBLIC_FIREBASE_${key}.`);
}
if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== project) throw new Error('Firebase web configuration does not match .firebaserc.');
const hosting = JSON.parse(await readFile(join(root, 'firebase.json'), 'utf8')).hosting;
const siteUrl = new URL(process.env.FIREBASE_SITE_URL || `https://${hosting.site}.web.app`);
if (siteUrl.protocol !== 'https:' || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) throw new Error('FIREBASE_SITE_URL must be an HTTPS origin.');
const staging = await mkdtemp(join(tmpdir(), 'dusaccom-firebase-'));
try {
  // Hosting on Spark serves static files. API routes stay in the original
  // checkout for the legacy server build; Firebase forms use Firestore instead.
  for (const name of ['src', 'public', 'package.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.ts', 'postcss.config.mjs']) {
    await cp(join(root, name), join(staging, name), { recursive: true });
  }
  await rm(join(staging, 'src/app/api'), { recursive: true, force: true });
  await symlink(join(root, 'node_modules'), join(staging, 'node_modules'), 'dir');
  const result = spawnSync(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
    cwd: staging,
    env: { ...process.env, FIREBASE_HOSTING: 'true', NEXT_PUBLIC_INQUIRY_BACKEND: 'firestore', NEXT_PUBLIC_SITE_URL: siteUrl.origin },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Firebase static build failed (${result.status}).`);
  await rm(join(root, 'out'), { recursive: true, force: true });
  await cp(join(staging, 'out'), join(root, 'out'), { recursive: true });
  console.log(`Firebase Hosting export ready in out/ for ${siteUrl.origin}.`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
