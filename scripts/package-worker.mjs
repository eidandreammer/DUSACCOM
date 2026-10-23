import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
const temporary = mkdtempSync(path.join(tmpdir(), 'dusaccom-worker-'));
try {
  // Wrangler's dry-run resolves the Node compatibility shims used by Next.js.
  // It does not upload, provision, or deploy anything.
  const bundle = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--dry-run', '--outdir', temporary], { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  if (bundle.status !== 0) process.exit(bundle.status || 1);
  rmSync('dist', { recursive: true, force: true });
  mkdirSync('dist/server', { recursive: true });
  mkdirSync('dist/client', { recursive: true });
  mkdirSync('dist/.openai', { recursive: true });
  cpSync(path.join(temporary, 'worker.js'), 'dist/server/index.js');
  cpSync('.open-next/assets', 'dist/client', { recursive: true });
  cpSync('.openai/hosting.json', 'dist/.openai/hosting.json');
  writeFileSync('dist/server/package.json', JSON.stringify({ type: 'module' }));
  writeFileSync('dist/server/wrangler.json', JSON.stringify({ name: 'dusaccom-local', main: 'index.js', compatibility_date: '2026-10-01', compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'], assets: { directory: '../client', binding: 'ASSETS' }, d1_databases: [{ binding: 'DB', database_name: 'dusaccom-local', database_id: '00000000-0000-0000-0000-000000000000' }] }, null, 2));
  console.log('Packaged the Next.js Worker and local assets for Sites.');
} finally { rmSync(temporary, { recursive: true, force: true }); }
