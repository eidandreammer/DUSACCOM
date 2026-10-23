import sharp from 'sharp';
for (const name of ['new-york', 'networking']) {
  for (const width of [96, 160, 256, 384, 480, 768, 1200, 1600]) {
    await sharp(`public/assets/${name}.jpg`).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(`public/assets/${name}-${width}.webp`);
  }
}
console.log('Generated local responsive WebP assets.');
