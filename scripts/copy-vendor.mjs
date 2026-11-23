// Copies the MapLibre tile worker into public/ under a versioned name.
// MapLibre 6 locates its worker relative to import.meta.url, which the bundler
// rewrites to a path where no worker exists; the location map points
// setWorkerUrl at this copy instead (see src/components/location-map).
import { copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const { version } = JSON.parse(await readFile(join(root, 'node_modules/maplibre-gl/package.json'), 'utf8'));
const target = join(root, 'public/assets/vendor');
const name = `maplibre-gl-worker-${version}.js`;

await mkdir(target, { recursive: true });
for (const file of await readdir(target)) {
  if (file.startsWith('maplibre-gl-worker-') && file !== name) await rm(join(target, file));
}
await copyFile(join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs'), join(target, name));
console.log(`copy-vendor: public/assets/vendor/${name}`);
