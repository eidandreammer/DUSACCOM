import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const culturalImages = JSON.parse(await readFile(new URL('../src/lib/hero-images.json', import.meta.url), 'utf8'));
for (const { name, file } of culturalImages) {
  await sharp(`public/imgs/Imágenes culturales dominicanas_files/${file}`).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(`public/assets/hero-${name}.jpg`);
}
for (const name of ['new-york', 'networking', ...culturalImages.map(({ name }) => `hero-${name}`)]) {
  for (const width of [96, 160, 256, 384, 480, 768, 1200, 1600]) {
    await sharp(`public/assets/${name}.jpg`).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(`public/assets/${name}-${width}.webp`);
  }
}
console.log('Generated local responsive WebP assets.');
