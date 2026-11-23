import sharp from 'sharp';
import { access, readFile } from 'node:fs/promises';
// The header/footer emblem is the vector public/assets/dominican-usa-chamber-of-commerce-nj-logo.svg
// (rebuilt from the round flag emblem with an NJ medallion; generator in media/build-nj-logo.py).
// INFOTEP partner logo: the PNG source lives in media/sources (not deployed); every width the image loader
// can request is written as WebP (src/lib/image-loader.ts maps "/imgs/INFOTEP logos's.png" to these files).
const infotepLogo = "media/sources/INFOTEP logos's.png";
for (const width of [96, 160, 256, 384, 480, 768, 1200, 1600]) {
  await sharp(infotepLogo).resize({ width, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(`public/imgs/infotep-logo-${width}.webp`);
}
const heroImages = JSON.parse(await readFile(new URL('../src/lib/hero-images.json', import.meta.url), 'utf8'));
for (const { name, file } of heroImages) {
  const original = `media/hero-photos/${file}`;
  try { await access(original); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // Retain the committed normalized photograph when its original is absent.
    await access(`public/assets/hero-${name}.jpg`);
    continue;
  }
  await sharp(original).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(`public/assets/hero-${name}.jpg`);
}
// President's portrait (high-resolution source kept in media/portraits).
const portrait = 'heidy-hernandez-president-dominican-usa-chamber-of-commerce';
try {
  await access(`media/portraits/${portrait}.jpg`);
  await sharp(`media/portraits/${portrait}.jpg`).rotate().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 88 }).toFile(`public/assets/${portrait}.jpg`);
} catch (error) { if (error.code !== 'ENOENT') throw error; }
// Paterson Dominican Parade gallery photos (sources in media/hero-photos).
const galleryImages = JSON.parse(await readFile(new URL('../src/lib/gallery-images.json', import.meta.url), 'utf8'));
for (const { name } of galleryImages) {
  try {
    await access(`media/hero-photos/${name}.jpg`);
    await sharp(`media/hero-photos/${name}.jpg`).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 86 }).toFile(`public/assets/${name}.jpg`);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
for (const name of ['new-york', 'networking', portrait, ...galleryImages.map(({ name }) => name), ...heroImages.map(({ name }) => `hero-${name}`)]) {
  for (const width of [96, 160, 256, 384, 480, 768, 1200, 1600]) {
    await sharp(`public/assets/${name}.jpg`).resize({ width, withoutEnlargement: true }).webp({ quality: 76, effort: 6 }).toFile(`public/assets/${name}-${width}.webp`);
  }
}
console.log('Generated local responsive WebP assets.');
