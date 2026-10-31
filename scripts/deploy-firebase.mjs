import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// The --hosting-only fallback omits the missing account function rewrite.
// The client checks availability and leaves destructive controls unavailable.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
createRequire(import.meta.url)('@next/env').loadEnvConfig(root, false);
// Rules APIs require the canonical project ID, even when the CLI alias points
// to a project number. Resolve it from the existing public SDK configuration.
const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const configured = JSON.parse(await readFile(join(root, '.firebaserc'), 'utf8')).projects.default;
if (!project || ![project, process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.split(':')[1]].includes(configured)) throw new Error('Firebase web configuration does not match .firebaserc.');
const mode = process.argv[2];
if (mode && !['--hosting-only', '--accounts'].includes(mode)) throw new Error('Unknown deployment mode.');
const filename = join(root, `.firebase-hosting-only.${randomUUID()}.json`);
const config = JSON.parse(await readFile(join(root, 'firebase.json'), 'utf8'));
if (mode === '--hosting-only') {
  delete config.functions;
  config.hosting.rewrites = config.hosting.rewrites.filter(rule => rule.function?.functionId !== 'accountApi');
}
try {
  if (mode === '--hosting-only') await writeFile(filename, JSON.stringify(config, null, 2));
  const result = spawnSync('npx', ['--yes', '--package=firebase-tools@latest', '--', 'firebase', 'deploy', '--only', mode === '--accounts' ? 'functions:account-management' : 'hosting,auth,firestore', '--project', project, '--config', mode === '--hosting-only' ? filename : join(root, 'firebase.json')], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Firebase deployment failed (${result.status}).`);
} finally { await rm(filename, { force: true }); }
