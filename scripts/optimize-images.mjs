import sharp from 'sharp';
import { access, readFile } from 'node:fs/promises';
const culturalImages = JSON.parse(await readFile(new URL('../src/lib/hero-images.json', import.meta.url), 'utf8'));
for (const { name, file } of culturalImages) {
  const original = `public/imgs/Imágenes culturales dominicanas_files/${file}`;
  try { await access(original); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // Retain the committed normalized photograph when its original is absent.
    await access(`public/assets/hero-${name}.jpg`);
    continue;
  }
  await sharp(original).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(`public/assets/hero-${name}.jpg`);
}
for (const name of ['new-york', 'networking', ...culturalImages.map(({ name }) => `hero-${name}`)]) {
  for (const width of [96, 160, 256, 384, 480, 768, 1200, 1600]) {
    await sharp(`public/assets/${name}.jpg`).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(`public/assets/${name}-${width}.webp`);
  }
}
await sharp('public/imgs/Heidy portrait.png').rotate().resize({ width: 384, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile('public/assets/heidy-portrait.webp');
console.log('Generated local responsive WebP assets.');
