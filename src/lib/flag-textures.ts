// Simplified national flags drawn on canvas for the waving-flags scene.
// Emblems are stylized (small, simple shapes) so they read at table-flag size.

export type FlagSpec = { code: string; en: string; es: string; pt: string; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void };

const C = {
  white: '#ffffff', red: '#ce1126', navy: '#002d62', blue: '#0038a8', sky: '#74acdf', yellow: '#fcd116',
  green: '#007a3d', gold: '#f2b632', brown: '#8a5a2b',
};

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, points = 5, inner = 0.4) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const rr = i % 2 === 0 ? r : r * inner;
    c.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  c.closePath(); c.fillStyle = fill; c.fill();
}
function hBands(c: CanvasRenderingContext2D, w: number, h: number, colors: string[], weights?: number[]) {
  const total = (weights ?? colors.map(() => 1)).reduce((a, b) => a + b, 0);
  let y = 0;
  colors.forEach((color, i) => { const bh = (h * (weights?.[i] ?? 1)) / total; c.fillStyle = color; c.fillRect(0, y, w, bh + 1); y += bh; });
}
function vBands(c: CanvasRenderingContext2D, w: number, h: number, colors: string[]) {
  colors.forEach((color, i) => { c.fillStyle = color; c.fillRect((w / colors.length) * i, 0, w / colors.length + 1, h); });
}
function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (stroke) { c.lineWidth = r * 0.18; c.strokeStyle = stroke; c.stroke(); }
}
function sun(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  c.save(); c.translate(x, y); c.fillStyle = fill;
  for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.beginPath(); c.moveTo(-r * 0.18, 0); c.lineTo(0, -r * 1.7); c.lineTo(r * 0.18, 0); c.fill(); }
  c.restore(); disc(c, x, y, r, fill);
}
function wreath(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  c.lineWidth = r * 0.28; c.strokeStyle = color; c.lineCap = 'round';
  c.beginPath(); c.arc(x, y, r, Math.PI * 0.6, Math.PI * 1.35); c.stroke();
  c.beginPath(); c.arc(x, y, r, -Math.PI * 0.35, Math.PI * 0.4); c.stroke();
}

function leaves(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  // Two leafy branches curving up around the bottom of an emblem.
  c.fillStyle = color;
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const a = Math.PI / 2 + side * (0.35 + i * 0.27);
    c.save(); c.translate(x + Math.cos(a) * r, y + Math.sin(a) * r); c.rotate(a + side * 1.1);
    c.beginPath(); c.ellipse(0, 0, r * 0.2, r * 0.085, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
}
function shield(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Heater-shield path centred on (x, y).
  c.beginPath(); c.moveTo(x - w / 2, y - h / 2); c.lineTo(x + w / 2, y - h / 2); c.lineTo(x + w / 2, y + h * 0.1);
  c.quadraticCurveTo(x + w / 2, y + h / 2, x, y + h / 2); c.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h * 0.1); c.closePath();
}

export const FLAGS: FlagSpec[] = [
  { code: 'do', en: 'Dominican Republic', es: 'República Dominicana', pt: 'República Dominicana', draw: (c, w, h) => {
    const b = h * 0.13; c.fillStyle = C.white; c.fillRect(0, 0, w, h);
    c.fillStyle = C.navy; c.fillRect(0, 0, w / 2 - b / 2, h / 2 - b / 2); c.fillRect(w / 2 + b / 2, h / 2 + b / 2, w, h);
    c.fillStyle = C.red; c.fillRect(w / 2 + b / 2, 0, w, h / 2 - b / 2); c.fillRect(0, h / 2 + b / 2, w / 2 - b / 2, h);
    const x = w / 2, y = h / 2, s = h * 0.1;
    leaves(c, x, y + s * 0.1, s * 1.05, '#2f7d3a');
    c.lineWidth = s * 0.16; c.lineCap = 'round';
    c.strokeStyle = C.navy; c.beginPath(); c.arc(x, y + s * 0.2, s * 1.05, Math.PI * 1.28, Math.PI * 1.72); c.stroke();
    c.strokeStyle = C.red; c.beginPath(); c.arc(x, y - s * 0.55, s * 1.25, Math.PI * 0.32, Math.PI * 0.68); c.stroke();
    shield(c, x, y, s * 0.95, s * 1.15); c.save(); c.clip();
    c.fillStyle = C.navy; c.fillRect(x - s, y - s, s, s); c.fillRect(x, y, s, s);
    c.fillStyle = C.red; c.fillRect(x, y - s, s, s); c.fillRect(x - s, y, s, s);
    c.fillStyle = C.white; c.fillRect(x - s * 0.09, y - s, s * 0.18, s * 2); c.fillRect(x - s, y - s * 0.09, s * 2, s * 0.18);
    c.restore(); shield(c, x, y, s * 0.95, s * 1.15); c.lineWidth = s * 0.07; c.strokeStyle = '#c9a43a'; c.stroke();
  } },
  { code: 'us', en: 'United States', es: 'Estados Unidos', pt: 'Estados Unidos', draw: (c, w, h) => {
    for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? C.white : '#b22234'; c.fillRect(0, (h / 13) * i, w, h / 13 + 1); }
    const cw = w * 0.4, ch = (h / 13) * 7; c.fillStyle = '#3c3b6e'; c.fillRect(0, 0, cw, ch);
    for (let r = 0; r < 9; r++) for (let k = 0; k < (r % 2 ? 5 : 6); k++) star(c, cw * (0.083 + (k * 2 + (r % 2)) * 0.083), ch * (0.1 + r * 0.1), ch * 0.04, C.white);
  } },
  { code: 'pr', en: 'Puerto Rico', es: 'Puerto Rico', pt: 'Porto Rico', draw: (c, w, h) => {
    hBands(c, w, h, ['#ed0000', C.white, '#ed0000', C.white, '#ed0000']);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.43, h / 2); c.lineTo(0, h); c.closePath(); c.fillStyle = '#0050f0'; c.fill();
    star(c, w * 0.15, h / 2, h * 0.13, C.white);
  } },
  { code: 'mx', en: 'Mexico', es: 'México', pt: 'México', draw: (c, w, h) => {
    vBands(c, w, h, ['#006847', C.white, C.red]);
    const x = w / 2, y = h * 0.5, s = h * 0.17;
    leaves(c, x, y, s * 0.95, '#2e7d32');
    c.fillStyle = '#3f8f3f'; // nopal cactus
    c.beginPath(); c.ellipse(x, y + s * 0.42, s * 0.2, s * 0.13, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x - s * 0.2, y + s * 0.3, s * 0.12, s * 0.09, -0.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(x + s * 0.2, y + s * 0.3, s * 0.12, s * 0.09, 0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7a4a1e'; // eagle: body, raised wing, head
    c.beginPath(); c.ellipse(x + s * 0.02, y, s * 0.17, s * 0.3, -0.35, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(x - s * 0.08, y - s * 0.1); c.quadraticCurveTo(x - s * 0.55, y - s * 0.35, x - s * 0.4, y - s * 0.62);
    c.quadraticCurveTo(x - s * 0.2, y - s * 0.4, x + s * 0.02, y - s * 0.25); c.closePath(); c.fill();
    disc(c, x + s * 0.16, y - s * 0.3, s * 0.1, '#7a4a1e');
    c.fillStyle = '#e0a526'; c.beginPath(); c.moveTo(x + s * 0.24, y - s * 0.32); c.lineTo(x + s * 0.34, y - s * 0.27); c.lineTo(x + s * 0.24, y - s * 0.25); c.fill();
    c.strokeStyle = '#3f8f3f'; c.lineWidth = s * 0.05; c.lineCap = 'round'; // serpent
    c.beginPath(); c.moveTo(x + s * 0.3, y - s * 0.2); c.bezierCurveTo(x + s * 0.45, y - s * 0.05, x + s * 0.1, y + s * 0.05, x + s * 0.32, y + s * 0.18); c.stroke();
  } },
  { code: 'co', en: 'Colombia', es: 'Colombia', pt: 'Colômbia', draw: (c, w, h) => hBands(c, w, h, [C.yellow, '#003893', C.red], [2, 1, 1]) },
  { code: 've', en: 'Venezuela', es: 'Venezuela', pt: 'Venezuela', draw: (c, w, h) => {
    hBands(c, w, h, ['#ffcc00', '#00247d', '#cf142b']);
    for (let i = 0; i < 8; i++) { const a = Math.PI * (1.18 + (i * 0.64) / 7); star(c, w / 2 + Math.cos(a) * h * 0.3, h * 0.62 + Math.sin(a) * h * 0.3, h * 0.04, C.white); }
  } },
  { code: 'ec', en: 'Ecuador', es: 'Ecuador', pt: 'Equador', draw: (c, w, h) => {
    hBands(c, w, h, ['#ffdd00', '#034ea2', '#ed1c24'], [2, 1, 1]);
    c.beginPath(); c.ellipse(w / 2, h / 2, h * 0.11, h * 0.14, 0, 0, Math.PI * 2); c.fillStyle = '#6fa8dc'; c.fill(); c.lineWidth = 4; c.strokeStyle = C.gold; c.stroke();
  } },
  { code: 'pe', en: 'Peru', es: 'Perú', pt: 'Peru', draw: (c, w, h) => { vBands(c, w, h, ['#d91023', C.white, '#d91023']); wreath(c, w / 2, h / 2, h * 0.14, '#2e7d32'); } },
  { code: 'bo', en: 'Bolivia', es: 'Bolivia', pt: 'Bolívia', draw: (c, w, h) => hBands(c, w, h, ['#d52b1e', '#f9e300', '#007934']) },
  { code: 'cl', en: 'Chile', es: 'Chile', pt: 'Chile', draw: (c, w, h) => {
    c.fillStyle = C.white; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#d52b1e'; c.fillRect(0, h / 2, w, h / 2);
    c.fillStyle = '#0039a6'; c.fillRect(0, 0, h / 2, h / 2); star(c, h / 4, h / 4, h * 0.11, C.white);
  } },
  { code: 'ar', en: 'Argentina', es: 'Argentina', pt: 'Argentina', draw: (c, w, h) => { hBands(c, w, h, [C.sky, C.white, C.sky]); sun(c, w / 2, h / 2, h * 0.07, C.gold); } },
  { code: 'uy', en: 'Uruguay', es: 'Uruguay', pt: 'Uruguai', draw: (c, w, h) => {
    for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#0038a8' : C.white; c.fillRect(0, (h / 9) * i, w, h / 9 + 1); }
    c.fillStyle = C.white; c.fillRect(0, 0, w * 0.37, (h / 9) * 5); sun(c, w * 0.185, (h / 9) * 2.5, h * 0.07, C.gold);
  } },
  { code: 'py', en: 'Paraguay', es: 'Paraguay', pt: 'Paraguai', draw: (c, w, h) => { hBands(c, w, h, ['#d52b1e', C.white, '#0038a8']); disc(c, w / 2, h / 2, h * 0.1, C.white, '#2e7d32'); star(c, w / 2, h / 2, h * 0.05, C.gold); } },
  { code: 'br', en: 'Brazil', es: 'Brasil', pt: 'Brasil', draw: (c, w, h) => {
    c.fillStyle = '#009c3b'; c.fillRect(0, 0, w, h);
    c.beginPath(); c.moveTo(w / 2, h * 0.1); c.lineTo(w * 0.92, h / 2); c.lineTo(w / 2, h * 0.9); c.lineTo(w * 0.08, h / 2); c.closePath(); c.fillStyle = '#ffdf00'; c.fill();
    const R = h * 0.21, x = w / 2, y = h / 2;
    disc(c, x, y, R, '#002776');
    c.save(); c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.clip();
    c.beginPath(); c.arc(x - R * 0.45, y + R * 2.25, R * 2.35, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = R * 0.2; c.strokeStyle = C.white; c.stroke();
    [[0.2, 0.35], [-0.35, 0.3], [0.45, 0.05], [-0.1, 0.6], [0.05, 0.25], [0.35, 0.55], [-0.55, 0.05]].forEach(([dx, dy]) => disc(c, x + dx * R, y + dy * R, R * 0.045, C.white));
    c.restore();
  } },
  { code: 'cu', en: 'Cuba', es: 'Cuba', pt: 'Cuba', draw: (c, w, h) => {
    hBands(c, w, h, ['#002a8f', C.white, '#002a8f', C.white, '#002a8f']);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w * 0.43, h / 2); c.lineTo(0, h); c.closePath(); c.fillStyle = '#cf142b'; c.fill();
    star(c, w * 0.15, h / 2, h * 0.13, C.white);
  } },
  { code: 'gt', en: 'Guatemala', es: 'Guatemala', pt: 'Guatemala', draw: (c, w, h) => { vBands(c, w, h, ['#4997d0', C.white, '#4997d0']); wreath(c, w / 2, h / 2, h * 0.13, '#2e7d32'); } },
  { code: 'hn', en: 'Honduras', es: 'Honduras', pt: 'Honduras', draw: (c, w, h) => {
    hBands(c, w, h, ['#0073cf', C.white, '#0073cf']);
    [[0, 0], [-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]].forEach(([dx, dy]) => star(c, w / 2 + dx * h * 0.17, h / 2 + dy * h * 0.08, h * 0.04, '#0073cf'));
  } },
  { code: 'sv', en: 'El Salvador', es: 'El Salvador', pt: 'El Salvador', draw: (c, w, h) => {
    hBands(c, w, h, ['#0047ab', C.white, '#0047ab']);
    c.beginPath(); c.moveTo(w / 2, h * 0.39); c.lineTo(w / 2 + h * 0.08, h * 0.56); c.lineTo(w / 2 - h * 0.08, h * 0.56); c.closePath(); c.fillStyle = C.gold; c.fill();
    wreath(c, w / 2, h / 2, h * 0.12, '#2e7d32');
  } },
  { code: 'ni', en: 'Nicaragua', es: 'Nicaragua', pt: 'Nicarágua', draw: (c, w, h) => {
    hBands(c, w, h, ['#0067c6', C.white, '#0067c6']);
    c.beginPath(); c.moveTo(w / 2, h * 0.39); c.lineTo(w / 2 + h * 0.1, h * 0.58); c.lineTo(w / 2 - h * 0.1, h * 0.58); c.closePath(); c.lineWidth = 4; c.strokeStyle = C.gold; c.stroke();
  } },
  { code: 'cr', en: 'Costa Rica', es: 'Costa Rica', pt: 'Costa Rica', draw: (c, w, h) => hBands(c, w, h, ['#002b7f', C.white, '#ce1126', C.white, '#002b7f'], [1, 1, 2, 1, 1]) },
  { code: 'pa', en: 'Panama', es: 'Panamá', pt: 'Panamá', draw: (c, w, h) => {
    c.fillStyle = C.white; c.fillRect(0, 0, w, h);
    c.fillStyle = '#da121a'; c.fillRect(w / 2, 0, w / 2, h / 2); c.fillStyle = '#072357'; c.fillRect(0, h / 2, w / 2, h / 2);
    star(c, w / 4, h / 4, h * 0.11, '#072357'); star(c, (w * 3) / 4, (h * 3) / 4, h * 0.11, '#da121a');
  } },
  { code: 'ht', en: 'Haiti', es: 'Haití', pt: 'Haiti', draw: (c, w, h) => {
    hBands(c, w, h, ['#00209f', '#d21034']);
    const x = w / 2, y = h / 2, pw = h * 0.36, phh = h * 0.3;
    c.fillStyle = C.white; c.fillRect(x - pw / 2, y - phh / 2, pw, phh);
    c.fillStyle = '#3f8f3f'; c.fillRect(x - pw / 2, y + phh * 0.3, pw, phh * 0.2); // lawn
    c.fillStyle = '#00209f'; c.beginPath(); c.moveTo(x - pw * 0.42, y + phh * 0.3); c.lineTo(x - pw * 0.08, y - phh * 0.05); c.lineTo(x - pw * 0.08, y + phh * 0.3); c.fill();
    c.fillStyle = '#d21034'; c.beginPath(); c.moveTo(x + pw * 0.42, y + phh * 0.3); c.lineTo(x + pw * 0.08, y - phh * 0.05); c.lineTo(x + pw * 0.08, y + phh * 0.3); c.fill();
    c.fillStyle = '#8a5a2b'; c.fillRect(x - phh * 0.025, y - phh * 0.25, phh * 0.05, phh * 0.55); // palm
    c.strokeStyle = '#2e7d32'; c.lineWidth = phh * 0.06; c.lineCap = 'round';
    for (const a of [-2.6, -2.0, -1.57, -1.1, -0.5]) { c.beginPath(); c.moveTo(x, y - phh * 0.25); c.quadraticCurveTo(x + Math.cos(a) * phh * 0.2, y - phh * 0.25 + Math.sin(a) * phh * 0.2 - phh * 0.04, x + Math.cos(a) * phh * 0.3, y - phh * 0.25 + Math.sin(a) * phh * 0.22 + phh * 0.08); c.stroke(); }
  } },
  { code: 'es', en: 'Spain', es: 'España', pt: 'Espanha', draw: (c, w, h) => {
    hBands(c, w, h, ['#aa151b', '#f1bf00', '#aa151b'], [1, 2, 1]);
    const x = w * 0.3, y = h * 0.5, s = h * 0.2;
    c.fillStyle = '#b8b2a7'; c.fillRect(x - s * 0.62, y - s * 0.35, s * 0.1, s * 0.75); c.fillRect(x + s * 0.52, y - s * 0.35, s * 0.1, s * 0.75); // pillars
    shield(c, x, y, s * 0.82, s * 0.95); c.save(); c.clip();
    c.fillStyle = '#c8102e'; c.fillRect(x - s, y - s, s * 2, s * 2);
    c.fillStyle = '#f4f0e6'; c.fillRect(x, y - s, s, s * 0.47); c.fillRect(x - s, y - s * 0.02, s, s);
    c.restore(); shield(c, x, y, s * 0.82, s * 0.95); c.lineWidth = s * 0.06; c.strokeStyle = '#c99a2e'; c.stroke();
    c.fillStyle = '#d9a520'; c.fillRect(x - s * 0.34, y - s * 0.68, s * 0.68, s * 0.14); // crown
    [-0.28, 0, 0.28].forEach(dx => disc(c, x + dx * s, y - s * 0.72, s * 0.07, '#d9a520'));
  } },
];

let tile: HTMLCanvasElement | null = null;
function noiseTile() {
  if (tile) return tile;
  tile = document.createElement('canvas'); tile.width = tile.height = 128;
  const c = tile.getContext('2d')!, image = c.createImageData(128, 128);
  let seed = 1234567;
  for (let i = 0; i < image.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = 128 + ((seed >>> 24) - 128) * 0.5; image.data[i + 3] = 255;
  }
  c.putImageData(image, 0, 0);
  return tile;
}

/** Fabric finish shared by every flag texture: faint noise (never moirés) and a sewn hem. */
export function finishFabric(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.09;
  ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat')!; ctx.fillRect(0, 0, width, height);
  ctx.restore();
  const hem = Math.max(2, Math.round(width / 128));
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = hem; ctx.strokeRect(hem / 2, hem / 2, width - hem, height - hem);
}

/** Hand-drawn fallback artwork (used only if a flag's SVG can't be fetched). */
export function flagCanvas(spec: FlagSpec, width = 768, height = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  spec.draw(ctx, width, height);
  finishFabric(ctx, width, height);
  return canvas;
}
