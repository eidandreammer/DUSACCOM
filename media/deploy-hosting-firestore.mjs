// One-off: same as scripts/deploy-firebase.mjs default mode, but WITHOUT the `auth` target,
// so the declarative auth config in firebase.json can't disable the console-enabled Google provider.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const root = process.argv[2];
const { staticSecurityHeaders } = await import(join(root, 'scripts/security-headers.mjs'));
createRequire(join(root, 'package.json'))('@next/env').loadEnvConfig(root, false);
const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const filename = join(root, `.firebase-deploy.${randomUUID()}.json`);
const config = JSON.parse(await readFile(join(root, 'firebase.json'), 'utf8'));
config.hosting.headers.push(...await staticSecurityHeaders(join(root, 'out')));
try {
  await writeFile(filename, JSON.stringify(config, null, 2));
  const result = spawnSync('npx', ['--yes', '--package=firebase-tools@latest', '--', 'firebase', 'deploy', '--only', 'hosting,firestore', '--project', project, '--config', filename], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Firebase deployment failed (${result.status}).`);
} finally { await rm(filename, { force: true }); }
