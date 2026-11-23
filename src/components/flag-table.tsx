'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as T from 'three';
import { FLAGS, finishFabric, flagCanvas } from '@/lib/flag-textures';
import type { Lang } from '@/lib/translations';

// Table flags on gold stands, simulated as real cloth: each flag is a particle grid solved with
// position-based (Verlet) dynamics, pinned along the pole, driven by gravity, a strictly periodic
// noise wind (seamless loop) and per-triangle aerodynamics. The layout is re-randomised on every
// load with collision-aware rejection sampling, and every flag is confined to its own wedge of the
// table so cloth can never pass through another flag or pole. Desktop: the cursor pushes the
// fabric. Everywhere: fast scrolling whips up a gust. three.js is only fetched once the section is
// within a viewport of the screen; set-up runs in idle slices; rendering is capped at 30 fps.
//
// Assets (all CC0 1.0 / public domain, from Poly Haven; resized and re-encoded, see TABLE_FINISHES):
//  - public/assets/table-rosewood-*.webp      ← "Rosewood Veneer1" by Jenelle van Heerden
//    (https://polyhaven.com/a/rosewood_veneer1)
//  - public/assets/table-oak-veneer-*.webp    ← "Oak Veneer 01" by Jenelle van Heerden
//    (https://polyhaven.com/a/oak_veneer_01)
//  - public/assets/table-dark-mahogany-*.webp ← "Dark Wood" by Dimitrios Savva, Rico Cilliers &
//    Dario Barresi (https://polyhaven.com/a/dark_wood)
//  - public/assets/studio-softbox-environment-512.hdr ← "Studio Small 08" by Sergej Majboroda
//    (https://polyhaven.com/a/studio_small_08), downsampled 1k → 512×256 RGBE.

// <cloth-core> — pure maths (no DOM, no three) so it can be exercised offline.
export const FLAG_W = 1.2, FLAG_H = 0.9;   // 4:3 cloth, matching the 4:3 flag artwork
/** Simulation grids (columns along the fly × rows down the hoist): LOD 0 near, LOD 1 far (back rows). */
export const GRIDS = [{ nx: 22, ny: 17 }, { nx: 14, ny: 11 }] as const;
export const HOIST = 0.026;                 // cloth edge sits just off the pole axis (pole radius 0.018)
export const REACH = FLAG_W * 1.07 + HOIST; // furthest any cloth point may get from its pole axis
export const SECTOR = 0.34;                 // half-angle (rad) of the wedge each flag may sweep
const TAN_SECTOR = Math.tan(SECTOR);
const GRAVITY = 3.1, ITERATIONS = 3, AIR_DAMPING = 0.994;
const K_NORMAL = 2.4, K_TANGENT = 0.6, RIPPLE = 0.17;

export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Placement = { code: string; x: number; z: number; yaw: number; top: number; phase: number; lod: 0 | 1 };
type P2 = [number, number];

// Matches three's rotation.y: local (lx, lz) → world.
function toWorld(x: number, z: number, yaw: number, lx: number, lz: number): P2 {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + lx * c + lz * s, z - lx * s + lz * c];
}
/** Convex polygon (x–z) that contains every position the flag's cloth is allowed to reach. */
export function wedge(p: { x: number; z: number; yaw: number }): P2[] {
  const k = 6, r = REACH / Math.cos(SECTOR / k); // circumscribe the arc
  const pts: P2[] = [toWorld(p.x, p.z, p.yaw, -0.03, 0)];
  for (let i = 0; i <= k; i++) {
    const a = -SECTOR + (2 * SECTOR * i) / k;
    pts.push(toWorld(p.x, p.z, p.yaw, Math.cos(a) * r, Math.sin(a) * r));
  }
  return pts;
}
function overlaps(a: P2[], b: P2[]) {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const nx = q[1] - p[1], nz = p[0] - q[0];
      let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
      for (const v of a) { const d = v[0] * nx + v[1] * nz; aMin = Math.min(aMin, d); aMax = Math.max(aMax, d); }
      for (const v of b) { const d = v[0] * nx + v[1] * nz; bMin = Math.min(bMin, d); bMax = Math.max(bMax, d); }
      if (aMax < bMin || bMax < aMin) return false;
    }
  }
  return true;
}
function segmentDistance(p: P2, a: P2, b: P2) {
  const ex = b[0] - a[0], ez = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ez) / (ex * ex + ez * ez || 1)));
  return Math.hypot(p[0] - a[0] - ex * t, p[1] - a[1] - ez * t);
}
export function polygonDistance(a: P2[], b: P2[]) {
  if (overlaps(a, b)) return 0;
  let best = Infinity;
  for (const [from, to] of [[a, b], [b, a]])
    for (const v of from) for (let i = 0; i < to.length; i++) best = Math.min(best, segmentDistance(v, to[i], to[(i + 1) % to.length]));
  return best;
}
export function pointDistance(p: P2, poly: P2[]) {
  let inside = true, sign = 0, best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (cross !== 0) { if (sign === 0) sign = Math.sign(cross); else if (Math.sign(cross) !== sign) inside = false; }
    best = Math.min(best, segmentDistance(p, a, b));
  }
  return inside ? 0 : best;
}

export const TABLE = { x0: -5.7, x1: 4.3, zBack: -3.3, zFront: 0.8 };
const GAP = 0.08, POLE_CLEAR = 0.11, STAND_CLEAR = 0.5, SEAT_CLEAR = 0.3;
/** The empty seat: a stand + short pole with no flag, and a brass placard just in front of it. */
export const SEAT = 'seat', SEAT_TOP = 1.05, PLACARD = { w: 1.0, h: 0.27, z: 0.3 };
export const isSeat = (p: { code: string }) => p.code === SEAT;
/** Everything a placement may ever occupy on the table (x–z): a flag's wedge, or the seat's stand + placard. */
export function footprint(p: Placement): P2[] {
  if (!isSeat(p)) return wedge(p);
  const hw = PLACARD.w / 2 + 0.03;
  return [[p.x - hw, p.z - 0.24], [p.x + hw, p.z - 0.24], [p.x + hw, p.z + PLACARD.z + 0.12], [p.x - hw, p.z + PLACARD.z + 0.12]];
}

type LayoutOptions = { centre: string[]; seat: boolean };
function* tryLayout(codes: string[], rand: () => number, widen: number, options: LayoutOptions): Generator<void, Placement[] | null, void> {
  const x0 = TABLE.x0 * widen, x1 = TABLE.x1 * widen, zFront = TABLE.zFront, zBack = TABLE.zBack * widen;
  const placed: Placement[] = [], shapes: P2[][] = [];
  const make = (code: string, x: number, z: number, yaw: number): Placement => {
    const depth = Math.max(0, Math.min(1, (zFront - z) / (zFront - TABLE.zBack)));
    const top = code === SEAT ? SEAT_TOP : 1.62 + 0.66 * depth + (rand() - 0.5) * 0.2;
    return { code, x, z, yaw, top, phase: rand() * Math.PI * 2, lod: depth > 0.5 ? 1 : 0 };
  };
  const poleClear = (shapeOwner: Placement) => (isSeat(shapeOwner) ? SEAT_CLEAR : POLE_CLEAR);
  const clear = (p: Placement, w: P2[]) => placed.every((q, i) => {
    const d = Math.hypot(p.x - q.x, p.z - q.z);
    return d > REACH * 2 + 0.6 || (d >= STAND_CLEAR &&
      pointDistance([q.x, q.z], w) >= poleClear(p) &&
      pointDistance([p.x, p.z], shapes[i]) >= poleClear(q) &&
      polygonDistance(w, shapes[i]) >= GAP);
  });
  // Rough screen-space centre of a flag (back rows read higher from the elevated camera).
  const centre = (p: Placement) => { const [wx, wz] = toWorld(p.x, p.z, p.yaw, FLAG_W / 2, 0); return [wx, p.top - FLAG_H / 2 - wz * 0.32]; };
  const middle = (x0 + x1 + FLAG_W) / 2 - FLAG_W / 2; // pole x that centres a flag in the frame

  const place = function* (code: string, sample: () => Placement): Generator<void, boolean, void> {
    let best: Placement | null = null, bestShape: P2[] = [], bestScore = -Infinity, found = 0;
    for (let attempt = 0; attempt < 300 && found < 8; attempt++) {
      const p = sample();
      const w = footprint(p);
      if (!clear(p, w)) continue;
      found++;
      const [cx, cy] = centre(p);
      let score = Infinity;
      for (const q of placed) { const [qx, qy] = centre(q); score = Math.min(score, Math.hypot(cx - qx, (cy - qy) * 1.6)); }
      if (score > bestScore) { bestScore = score; best = p; bestShape = w; }
    }
    if (!best) return false;
    placed.push(best); shapes.push(bestShape);
    yield; // one flag per slice keeps every slice to a few ms
    return true;
  };

  const [first, ...rest] = codes;
  const centred = rest.filter(code => options.centre.includes(code));
  const others = rest.filter(code => !options.centre.includes(code));
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
  // The Dominican Republic always lands front and centre.
  const hero = make(first, middle + (rand() - 0.5) * 0.4, zFront + 0.1 + rand() * 0.1, (rand() - 0.5) * 0.4);
  placed.push(hero); shapes.push(footprint(hero));
  // The empty seat: front row, just left of the DR (every flag flies right, so that space is open
  // and the placard stays clear of cloth), close enough to the middle to survive the phone crop.
  if (options.seat && !(yield* place(SEAT, () => make(SEAT, middle + FLAG_W / 2 - (1.25 + rand() * 0.55), zFront - rand() * 0.2, 0)))) return null;
  // US and Puerto Rico stay near the middle.
  for (const code of centred)
    if (!(yield* place(code, () => make(code, middle + (rand() - 0.5) * 3.4, zFront - rand() * 1.8, (rand() + rand() - 1) * 0.7)))) return null;
  for (const code of others)
    // Yaw: mostly facing the camera, up to ±40°.
    if (!(yield* place(code, () => make(code, x0 + (x1 - x0) * rand(), zBack + (zFront - zBack) * rand(), (rand() + rand() - 1) * 0.7)))) return null;
  return placed;
}

/** Random, collision-free layout, one flag per step. `codes[0]` is placed front-centre. */
export function* layoutSteps(codes: string[], rand: () => number, options: LayoutOptions = { centre: [], seat: false }): Generator<void, Placement[], void> {
  for (let attempt = 0; ; attempt++) {
    const result = yield* tryLayout(codes, rand, 1 + Math.floor(attempt / 3) * 0.04, options);
    if (result) return result;
  }
}
export function layoutFlags(codes: string[], rand: () => number, options?: LayoutOptions): Placement[] {
  const steps = layoutSteps(codes, rand, options);
  for (;;) { const r = steps.next(); if (r.done) return r.value; }
}

/** The ambient wind repeats exactly every LOOP seconds: every time term is a whole harmonic of it. */
export const LOOP = 14;
const W1 = (2 * Math.PI) / LOOP;
export type WindState = { time: number; strength: number; gust: number };
export function ambientStrength(t: number) { return 1.5 + 0.35 * Math.sin(W1 * t) * Math.sin(2 * W1 * t + 1.3); }

export class Cloth {
  readonly nx: number;
  readonly ny: number;
  readonly count: number;
  readonly pos: Float32Array;
  readonly prev: Float32Array;
  readonly acc: Float32Array;
  readonly wind: Float32Array;
  private readonly dx: number;
  private readonly dy: number;
  private readonly scratch: Float32Array;
  private readonly weightA: Float32Array;
  private readonly links: Int32Array;
  private readonly rest: Float32Array;
  private readonly stiffness: Float32Array;
  private lastStep = 0;
  /** Constraint hits (debug/verification): [minX, sector, reach, floor]. */
  readonly hits = new Uint32Array(4);

  constructor(readonly lod: 0 | 1, readonly floorY: number, readonly worldX: number, readonly worldZ: number, readonly yaw: number, readonly phase: number) {
    const { nx, ny } = GRIDS[lod];
    this.nx = nx; this.ny = ny; this.count = nx * ny;
    this.dx = FLAG_W / (nx - 1); this.dy = FLAG_H / (ny - 1);
    this.pos = new Float32Array(nx * ny * 3); this.prev = new Float32Array(nx * ny * 3);
    this.acc = new Float32Array(nx * ny * 3); this.wind = new Float32Array(nx * ny * 3);
    this.scratch = new Float32Array(nx * 7);
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      const k = (j * this.nx + i) * 3;
      // Start draped (fly end lower) so the settle is short.
      const droop = (i / (this.nx - 1)) ** 2 * 0.25;
      this.pos[k] = this.prev[k] = HOIST + i * this.dx * (1 - droop * 0.4);
      this.pos[k + 1] = this.prev[k + 1] = -j * this.dy - droop;
      this.pos[k + 2] = this.prev[k + 2] = 0;
    }
    let links: number[] = [], rest: number[] = [], stiff: number[] = [];
    const link = (i0: number, j0: number, i1: number, j1: number, k: number) => {
      if (i1 >= this.nx || j1 >= this.ny || j1 < 0 || (i0 === 0 && i1 === 0)) return; // skip pinned–pinned
      links.push(j0 * this.nx + i0, j1 * this.nx + i1);
      rest.push(Math.hypot((i1 - i0) * this.dx, (j1 - j0) * this.dy)); stiff.push(k);
    };
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) {
      link(i, j, i + 1, j, 1); link(i, j, i, j + 1, 1);                 // structural
      link(i, j, i + 1, j + 1, 0.85); link(i, j, i + 1, j - 1, 0.85);   // shear
      link(i, j, i + 2, j, 0.2); link(i, j, i, j + 2, 0.2);           // light bending
    }
    // Interleave the solve order (fixed stride permutation) so consecutive constraints rarely
    // share a particle: avoids store→load stalls in the Gauss-Seidel loop (~3× faster).
    const count = rest.length, order: number[] = [];
    for (let start = 0; start < 7; start++) for (let e = start; e < count; e += 7) order.push(e);
    links = order.flatMap(e => [links[e * 2], links[e * 2 + 1]]); rest = order.map(e => rest[e]); stiff = order.map(e => stiff[e]);
    this.links = Int32Array.from(links); this.rest = Float32Array.from(rest); this.stiffness = Float32Array.from(stiff);
    // Inverse-mass split per link: the pole column is immovable.
    this.weightA = Float32Array.from(rest.map((_, e) => (links[e * 2] % this.nx === 0 ? 0 : links[e * 2 + 1] % this.nx === 0 ? 1 : 0.5)));
  }

  /** Gravity + noise wind + aerodynamic pressure/drag per triangle → this.acc. */
  applyForces(state: WindState) {
    const { pos, prev, acc, wind, scratch } = this;
    const t = state.time, ph = this.phase, c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    const base = state.strength * (1 + state.gust * 1.5);
    // Smooth spatio-temporal noise built from incommensurate travelling waves, evaluated
    // separably (per column × per row): gust fronts cross the table coherently between
    // neighbours, ripples travel down each flag from hoist to fly.
    const sway = Math.sin(W1 * t + ph + 0.25 * this.worldX) * 0.6 + Math.sin(2 * W1 * t + ph * 2.3) * 0.4;
    const lift = 0.15 + 0.06 * Math.sin(W1 * t + ph * 1.3);
    for (let i = 0; i < this.nx; i++) {
      const x = HOIST + i * this.dx, wx = this.worldX + x * c, wz = this.worldZ - x * s, o = i * 7;
      scratch[o] = base * (1 + 0.3 * Math.sin(0.42 * wx + 0.3 * wz - 2 * W1 * t + 1.7) * Math.sin(W1 * t + 0.7 * wz + ph * 0.3));
      const a1 = 2.3 * x - 6 * W1 * t + ph, a2 = 4.1 * x - 10 * W1 * t + ph * 1.7;
      scratch[o + 1] = Math.sin(a1); scratch[o + 2] = Math.cos(a1);
      scratch[o + 3] = Math.sin(a2); scratch[o + 4] = Math.cos(a2);
      scratch[o + 5] = state.gust * 0.6 * Math.sin(5.3 * x - 16 * W1 * t + ph);
    }
    for (let j = 0, k = 0; j < this.ny; j++) {
      const y = -j * this.dy, sb1 = Math.sin(0.9 * y), cb1 = Math.cos(0.9 * y), sb2 = Math.sin(-1.7 * y), cb2 = Math.cos(-1.7 * y);
      for (let i = 0; i < this.nx; i++, k += 3) {
        const o = i * 7, m = scratch[o];
        const ripple = scratch[o + 1] * cb1 + scratch[o + 2] * sb1 + 0.5 * (scratch[o + 3] * cb2 + scratch[o + 4] * sb2);
        wind[k] = m;
        wind[k + 1] = m * lift;
        wind[k + 2] = m * (RIPPLE * ripple + 0.08 * sway) + scratch[o + 5];
        acc[k] = 0; acc[k + 1] = -GRAVITY; acc[k + 2] = 0;
      }
    }
    const h = Math.max(this.lastStep, 1 / 240), invH = 1 / (3 * h), scale = 1 / (3 * this.dx * this.dy);
    for (let j = 0; j < this.ny - 1; j++) for (let i = 0; i < this.nx - 1; i++) {
      const a = j * this.nx + i, b = a + this.nx, cc = a + 1, d = b + 1;
      this.triangle(a * 3, b * 3, cc * 3, pos, prev, wind, acc, invH, scale);
      this.triangle(b * 3, d * 3, cc * 3, pos, prev, wind, acc, invH, scale);
    }
  }

  private triangle(a: number, b: number, c: number, pos: Float32Array, prev: Float32Array, wind: Float32Array, acc: Float32Array, invH: number, scale: number) {
    const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
    const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
    let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-9) return;
    const area = len * 0.5; nx /= len; ny /= len; nz /= len;
    const rx = (wind[a] + wind[b] + wind[c]) / 3 - (pos[a] - prev[a] + pos[b] - prev[b] + pos[c] - prev[c]) * invH;
    const ry = (wind[a + 1] + wind[b + 1] + wind[c + 1]) / 3 - (pos[a + 1] - prev[a + 1] + pos[b + 1] - prev[b + 1] + pos[c + 1] - prev[c + 1]) * invH;
    const rz = (wind[a + 2] + wind[b + 2] + wind[c + 2]) / 3 - (pos[a + 2] - prev[a + 2] + pos[b + 2] - prev[b + 2] + pos[c + 2] - prev[c + 2]) * invH;
    const dn = rx * nx + ry * ny + rz * nz;
    const f = area * scale, pn = K_NORMAL * dn * Math.abs(dn) * 0.6 + K_NORMAL * dn * 0.4;
    const fx = (pn * nx + K_TANGENT * (rx - dn * nx)) * f;
    const fy = (pn * ny + K_TANGENT * (ry - dn * ny)) * f;
    const fz = (pn * nz + K_TANGENT * (rz - dn * nz)) * f;
    acc[a] += fx; acc[a + 1] += fy; acc[a + 2] += fz;
    acc[b] += fx; acc[b + 1] += fy; acc[b + 2] += fz;
    acc[c] += fx; acc[c + 1] += fy; acc[c + 2] += fz;
  }

  /** Push particles near a ray (local space, unit direction) — the cursor. */
  push(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, radius: number, strength: number) {
    const { pos, acc } = this;
    for (let k = 0; k < this.count * 3; k += 3) {
      const px = pos[k] - ox, py = pos[k + 1] - oy, pz = pos[k + 2] - oz;
      const t = px * dx + py * dy + pz * dz;
      if (t <= 0) continue;
      const qx = px - dx * t, qy = py - dy * t, qz = pz - dz * t;
      const r = Math.hypot(qx, qy, qz);
      if (r >= radius) continue;
      const w = (1 - r / radius) ** 2 * strength, inv = r > 1e-5 ? 0.55 / r : 0;
      acc[k] += w * (dx * 0.85 + qx * inv); acc[k + 1] += w * (dy * 0.85 + qy * inv); acc[k + 2] += w * (dz * 0.85 + qz * inv);
    }
  }

  step(h: number) {
    const { pos, prev, acc, links, rest, stiffness, weightA } = this;
    const ratio = this.lastStep > 0 ? h / this.lastStep : 1; // time-corrected Verlet
    const h2 = h * h;
    for (let k = 0, n = 0; n < this.count; n++, k += 3) {
      if (n % this.nx === 0) continue; // pole column is pinned
      for (let a = 0; a < 3; a++) {
        const p = pos[k + a], v = (p - prev[k + a]) * ratio * AIR_DAMPING;
        prev[k + a] = p; pos[k + a] = p + v + acc[k + a] * h2;
      }
    }
    for (let it = 0; it < ITERATIONS; it++) {
      for (let l = 0, e = 0; e < rest.length; e++, l += 2) {
        const ia = links[l], ib = links[l + 1], a = ia * 3, b = ib * 3;
        const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
        const diff = ((d - rest[e]) / d) * stiffness[e];
        const wa = weightA[e], wb = 1 - wa;
        pos[a] += dx * diff * wa; pos[a + 1] += dy * diff * wa; pos[a + 2] += dz * diff * wa;
        pos[b] -= dx * diff * wb; pos[b + 1] -= dy * diff * wb; pos[b + 2] -= dz * diff * wb;
      }
    }
    // Keep the cloth inside its own wedge of the table (the layout guarantees wedges never
    // overlap each other or any pole), above the stand, and never behind its own pole.
    const minX = HOIST * 0.7, reach2 = REACH * REACH;
    for (let k = 0, n = 0; n < this.count; n++, k += 3) {
      if (n % this.nx === 0) continue;
      let x = pos[k], z = pos[k + 2], hit = false;
      if (x < minX) { x = minX; hit = true; this.hits[0]++; }
      const lim = x * TAN_SECTOR;
      if (z > lim) { z = lim; hit = true; this.hits[1]++; } else if (z < -lim) { z = -lim; hit = true; this.hits[1]++; }
      const r2 = x * x + z * z;
      if (r2 > reach2) { const f = REACH / Math.sqrt(r2); x *= f; z *= f; hit = true; this.hits[2]++; }
      if (pos[k + 1] < this.floorY) { pos[k + 1] = this.floorY; this.hits[3]++; }
      if (hit) { pos[k] = x; pos[k + 2] = z; }
    }
    this.lastStep = h;
  }
}

/** Catmull-Rom upsampling tables: sim grid → smoother render grid. */
export function upsampler(factor: number, NX: number, NY: number) {
  const RX = (NX - 1) * factor + 1, RY = (NY - 1) * factor + 1;
  const table = (count: number, size: number) => {
    const idx = new Int32Array(size * 4), w = new Float32Array(size * 4);
    for (let r = 0; r < size; r++) {
      const u = r / factor, i0 = Math.min(Math.floor(u), count - 2), t = u - i0;
      const t2 = t * t, t3 = t2 * t;
      const ws = [(-t3 + 2 * t2 - t) / 2, (3 * t3 - 5 * t2 + 2) / 2, (-3 * t3 + 4 * t2 + t) / 2, (t3 - t2) / 2];
      for (let q = 0; q < 4; q++) { idx[r * 4 + q] = Math.max(0, Math.min(count - 1, i0 - 1 + q)); w[r * 4 + q] = ws[q]; }
    }
    return { idx, w };
  };
  const cols = table(NX, RX), rows = table(NY, RY), tmp = new Float32Array(RX * NY * 3);
  return {
    RX, RY,
    run(src: Float32Array, out: Float32Array) {
      for (let j = 0; j < NY; j++) for (let r = 0; r < RX; r++) {
        let x = 0, y = 0, z = 0;
        for (let q = 0; q < 4; q++) { const s = (j * NX + cols.idx[r * 4 + q]) * 3, w = cols.w[r * 4 + q]; x += src[s] * w; y += src[s + 1] * w; z += src[s + 2] * w; }
        const o = (j * RX + r) * 3; tmp[o] = x; tmp[o + 1] = y; tmp[o + 2] = z;
      }
      for (let v = 0; v < RY; v++) for (let r = 0; r < RX; r++) {
        let x = 0, y = 0, z = 0;
        for (let q = 0; q < 4; q++) { const s = (rows.idx[v * 4 + q] * RX + r) * 3, w = rows.w[v * 4 + q]; x += tmp[s] * w; y += tmp[s + 1] * w; z += tmp[s + 2] * w; }
        const o = (v * RX + r) * 3; out[o] = x; out[o + 1] = y; out[o + 2] = z;
      }
    },
  };
}
// </cloth-core>


const FPS = 30;              // render cap; the simulation keeps its own fixed 1/120 s step
const SIM_STEP = 1 / 120;
const TABLE_THICKNESS = 0.16, TABLE_BEVEL = 0.035;
/** Which tabletop to show. Swap the finish here; everything else follows from TABLE_FINISHES. */
type TableFinish = 'oak' | 'mahogany' | 'rosewood';
const TABLE_FINISH = 'rosewood' as TableFinish;
const UNITS_PER_METRE = 4; // the visible table reads as a ~3 m conference table
type Finish = {
  files: string; metres: number; rotate: boolean; // texture's real-world size; rotate if its grain runs vertically
  tint: number; roughness: number; normal: number; // roughness multiplies the map (map means: rosewood .31, oak .53, mahogany .63)
  clearcoat: number; clearcoatRoughness: number; env: number; reflection: number;
};
const TABLE_FINISHES: Record<TableFinish, Finish> = {
  // Warm red-brown; the tint pulls the photo's orange cast toward claret so the brass reads against it.
  rosewood: { files: 'rosewood', metres: 2.43, rotate: true, tint: 0xd2aaa3, roughness: 1.4, normal: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.2, env: 0.75, reflection: 0.32 },
  oak: { files: 'oak-veneer', metres: 1.83, rotate: true, tint: 0xf4ebe0, roughness: 0.85, normal: 0.4, clearcoat: 0.38, clearcoatRoughness: 0.22, env: 0.6, reflection: 0.24 },
  mahogany: { files: 'dark-mahogany', metres: 2.0, rotate: false, tint: 0xf2dcd2, roughness: 0.72, normal: 0.45, clearcoat: 0.45, clearcoatRoughness: 0.18, env: 0.8, reflection: 0.32 },
};
const FINISH = TABLE_FINISHES[TABLE_FINISH];
const WOOD = ['diffuse', 'roughness', 'normal'].map(map => `/assets/table-${FINISH.files}-${map}.webp`);
const ENVIRONMENT = '/assets/studio-softbox-environment-512.hdr';

// Flags. Artwork: public/assets/flags/<code>.svg — 4:3 SVGs from flag-icons by Panayiotis
// Lipiridis (https://github.com/lipis/flag-icons), MIT licence (see public/assets/flags/LICENSE),
// minified with svgo. Only the flags shown on a given load are fetched.
const FLAG_DIR = '/assets/flags';
/** Always on the table: the Americas, the Caribbean and Iberia. The first (DR) sits front-centre. */
const CORE = ['do', 'us', 'pr', 'mx', 'co', 've', 'ec', 'pe', 'bo', 'cl', 'ar', 'uy', 'py', 'br', 'cu', 'gt', 'hn', 'sv', 'ni', 'cr', 'pa', 'ht', 'es', 'pt', 'bz', 'gy', 'sr', 'jm', 'tt'];
const CENTRE = ['us', 'pr'];
/** Rotating world pool (190): UN members and observers plus common territories, minus the core. */
const POOL = ('ad ae af ag ai al am ao at au aw az ba bb bd be bf bg bh bi bj bm bn bq bs bt bw by ca cd cf cg ch ci ck cm cn cv cw cy cz de dj dk dm dz ee eg er et fi fj fm fo fr ga gb gd ge gh gi gl gm gn gq gr gu gw hk hr hu id ie il im in iq ir is it jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mk ml mm mn mo mq mr ms mt mu mv mw my mz na nc ne ng nl no np nr nu nz om pf pg ph pk pl ps pw qa ro rs ru rw sa sb sc sd se sg si sk sl sm sn so ss st sx sy sz tc td tg th tj tl tm tn to tr tv tz ua ug uz va vc vg vi vn vu ws ye za zm zw').split(' ');
const NJ_COMMUNITIES = ['in', 'ph', 'it', 'ie', 'kr', 'cn', 'pl', 'eg', 'ng', 'gh', 'tr', 'pk', 'gb', 'de', 'fr', 'ca', 'jp', 'ua', 'bd', 'gr'];
const PLACARD_TEXT: Record<Lang, string> = { en: 'Your flag here', es: 'Tu bandera aquí', pt: 'Sua bandeira aqui' };

/** Brushed brass plate with bevelled edge and engraved (inset) lettering. */
function engravePlacard(canvas: HTMLCanvasElement, text: string) {
  const c = canvas.getContext('2d')!, w = canvas.width, h = canvas.height;
  const base = c.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, '#f3d58b'); base.addColorStop(0.5, '#d9ad55'); base.addColorStop(1, '#b8873a');
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  c.globalAlpha = 0.08; // brushed grain
  for (let y = 0; y < h; y += 2) { c.fillStyle = (y * 7919) % 3 ? '#fff' : '#5a3a10'; c.fillRect(0, y, w, 1); }
  c.globalAlpha = 1;
  c.lineWidth = 10; c.strokeStyle = 'rgba(90,58,16,0.45)'; c.strokeRect(14, 14, w - 28, h - 28);
  c.lineWidth = 3; c.strokeStyle = 'rgba(255,240,200,0.6)'; c.strokeRect(24, 24, w - 48, h - 48);
  let size = 118;
  const font = (px: number) => `600 ${px}px Georgia, 'Times New Roman', serif`;
  c.font = font(size);
  while (c.measureText(text).width > w - 120 && size > 40) c.font = font(size -= 4);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(255,244,214,0.7)'; c.fillText(text, w / 2 + 2, h / 2 + 5);  // lower lip catches light
  c.fillStyle = '#3e2708'; c.fillText(text, w / 2, h / 2 + 2);                      // the cut
}
const ENV_ROTATION = 0.2;  // radians about +y. Measured: in 0–0.4 the softboxes' grazing reflections fall evenly (right/left table luminance ≈ 1.0); at π/2 one sat on the right side (≈ 1.33)
const REFLECTION_SCALE = 0.35;     // planar reflection resolution vs the drawing buffer
const REFLECTION_FADE = 1.3;       // world units above the tabletop over which reflections fade out (~0.33 m)

/** Smooth grid normals from central differences (front face = +z at rest). */
function gridNormals(p: Float32Array, n: Float32Array, RX: number, RY: number) {
  for (let v = 0; v < RY; v++) for (let r = 0; r < RX; r++) {
    const l = (v * RX + Math.max(r - 1, 0)) * 3, rr = (v * RX + Math.min(r + 1, RX - 1)) * 3;
    const u = (Math.max(v - 1, 0) * RX + r) * 3, d = (Math.min(v + 1, RY - 1) * RX + r) * 3;
    const ax = p[rr] - p[l], ay = p[rr + 1] - p[l + 1], az = p[rr + 2] - p[l + 2];   // along the fly
    const bx = p[d] - p[u], by = p[d + 1] - p[u + 1], bz = p[d + 2] - p[u + 2];       // down the hoist
    const nx = by * az - bz * ay, ny = bz * ax - bx * az, nz = bx * ay - by * ax;      // b × a
    const len = Math.hypot(nx, ny, nz) || 1, o = (v * RX + r) * 3;
    n[o] = nx / len; n[o + 1] = ny / len; n[o + 2] = nz / len;
  }
}

type Deadline = { timeRemaining(): number };
function whenIdle(): Promise<Deadline> {
  return new Promise(resolve => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(resolve, { timeout: 60 });
    else window.setTimeout(() => { const end = performance.now() + 8; resolve({ timeRemaining: () => Math.max(0, end - performance.now()) }); }, 16);
  });
}
/** Run `work` in idle slices (≤ ~12 ms each) until it returns true. False if aborted. */
async function idleLoop(work: () => boolean, alive: () => boolean): Promise<boolean> {
  for (;;) {
    const deadline = await whenIdle();
    if (!alive()) return false;
    const start = performance.now();
    do { if (work()) return true; } while (deadline.timeRemaining() > 3 && performance.now() - start < 12);
  }
}
const idleTask = (work: () => void, alive: () => boolean) => idleLoop(() => { work(); return true; }, alive);

function alphaCanvas(width: number, height: number, alpha: (u: number, v: number) => number) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const c = canvas.getContext('2d')!, image = c.createImageData(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = Math.round(255 * alpha(x / (width - 1), y / (height - 1))), i = (y * width + x) * 4;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = a; image.data[i + 3] = 255;
  }
  c.putImageData(image, 0, 0);
  return canvas;
}
const smooth = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/**
 * Builds and runs the scene. Everything heavy happens in idle slices; returns a teardown, or null
 * if the component unmounted part-way (in which case it has already cleaned up).
 */
type Controller = { stop(): void; setLang(lang: Lang): void };
async function start(element: HTMLDivElement, alive: () => boolean, codes: string[], initialLang: Lang): Promise<Controller | null> {
  performance.mark('flag-table:init-start');
  const cleanups: Array<() => void> = [];
  const disposables: { dispose(): void }[] = [];
  const teardown = () => { cleanups.splice(0).reverse().forEach(f => f()); disposables.splice(0).forEach(d => d.dispose()); };
  const abort = () => { teardown(); return null; };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = mulberry32((Math.random() * 2 ** 32) >>> 0);
  const modules = Promise.all([import('three'), import('three/examples/jsm/loaders/HDRLoader.js')]);

  // 1. Layout (pure maths), one flag per idle slice. codes[0] (DR) is front-centre.
  const steps = layoutSteps(codes, rand, { centre: CENTRE, seat: true });
  let layout: Placement[] = [];
  if (!await idleLoop(() => { const r = steps.next(); if (r.done) layout = r.value; return !!r.done; }, alive)) return abort();
  const seat = layout.find(isSeat)!;
  const flagPlaces = layout.filter(p => !isSeat(p));
  // 2. Settle the cloth (pure maths) while three.js downloads. Far flags (LOD 1: coarser grid)
  // are stepped at half rate with their own accumulator.
  const wind: WindState = { time: rand() * LOOP, strength: 1.5, gust: 0 };
  const cloths = flagPlaces.map(p => new Cloth(p.lod, -(p.top - 0.3), p.x, p.z, p.yaw, p.phase));
  const lag = new Float32Array(cloths.length);
  let warm = reduced ? 2 : 1, stepCount = 0;
  if (!await idleLoop(() => {
    wind.time = (wind.time + SIM_STEP) % LOOP; wind.strength = ambientStrength(wind.time);
    const refresh = stepCount++ % 2 === 0;
    cloths.forEach((cloth, i) => {
      lag[i] += SIM_STEP;
      if (cloth.lod === 1 && lag[i] < 2 * SIM_STEP - 1e-6) return;
      if (refresh || cloth.lod === 1) cloth.applyForces(wind);
      cloth.step(lag[i]); lag[i] = 0;
    });
    return (warm -= SIM_STEP) <= 0;
  }, alive)) return abort();
  performance.mark('flag-table:settled');
  const [THREE, { HDRLoader }] = await modules;
  if (!alive()) return abort();
  performance.mark('flag-table:three-ready');
  const hdr = new HDRLoader().loadAsync(ENVIRONMENT).catch(() => null);
  // Wood maps decode off the main thread (ImageBitmap); a failed fetch falls back to plain wood colour.
  const woodMaps = Promise.all(WOOD.map(url => new THREE.ImageBitmapLoader().setOptions({ imageOrientation: 'none' }).loadAsync(url))).catch(() => null);

  // 3. Renderer + environment. The canvas stays invisible until the first settled frame.
  let renderer!: T.WebGLRenderer;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  if (!await idleTask(() => {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;opacity:0;transition:opacity .9s ease;';
    element.appendChild(renderer.domElement);
    cleanups.push(() => { renderer.dispose(); renderer.domElement.remove(); });
  }, alive)) return abort();
  // Image-based lighting from a real (CC0) soft studio HDRI, prefiltered with PMREM. Only
  // scene.environment is set: the background stays transparent. The environment is a render
  // target, so it is rebuilt if the WebGL context is ever restored.
  const equirect = await hdr;
  if (!alive()) return abort();
  let environment: T.Texture | null = null;
  const makeEnvironment = () => {
    if (!equirect) return;
    environment?.dispose();
    equirect.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromEquirectangular(equirect).texture;
    pmrem.dispose();
    scene.environment = environment; scene.environmentIntensity = 0.75;
    scene.environmentRotation.set(0, ENV_ROTATION, 0);
  };
  if (!await idleTask(makeEnvironment, alive)) return abort();
  disposables.push({ dispose: () => { environment?.dispose(); equirect?.dispose(); } });

  performance.mark('flag-table:renderer-ready');
  const xs = layout.map(p => p.x), zs = layout.map(p => p.z);
  const bounds = { x0: Math.min(...xs), x1: Math.max(...xs) + REACH, zBack: Math.min(...zs), zFront: Math.max(...zs) };
  const centre = new THREE.Vector3((bounds.x0 + bounds.x1) / 2, 0, (bounds.zBack + bounds.zFront) / 2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8a98f, equirect ? 0.35 : 0.75));
  const key = new THREE.DirectionalLight(0xfff8ee, 1.8);
  key.position.set(centre.x + 3.5, 8.5, centre.z + 6.5); key.target.position.copy(centre);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 7, bottom: -7, near: 1, far: 25 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025; key.shadow.radius = 4;
  scene.add(key, key.target);
  // No back/rim light: its mirror image was the bright patch on the tabletop. The key light sits
  // in front, so its specular lobe on the table points away from the camera.

  // Planar-reflection hook: during the mirror pass (uReflectPass = 1) every reflected material
  // outputs its colour premultiplied by a height falloff, alpha = falloff, so reflections are
  // strongest where objects meet the table and gone ~REFLECTION_FADE above it.
  const reflectPass = { value: 0 }, reflectFade = { value: REFLECTION_FADE };
  const reflectable = <M extends T.Material>(material: M) => {
    material.onBeforeCompile = shader => {
      shader.uniforms.uReflectPass = reflectPass; shader.uniforms.uReflectFade = reflectFade;
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', 'varying float vReflectY;\nvoid main() {')
        .replace('#include <project_vertex>', '#include <project_vertex>\n  vec4 reflectWorld = vec4(transformed, 1.0);\n  #ifdef USE_INSTANCING\n  reflectWorld = instanceMatrix * reflectWorld;\n  #endif\n  vReflectY = (modelMatrix * reflectWorld).y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform float uReflectPass;\nuniform float uReflectFade;\nvarying float vReflectY;\nvoid main() {')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  if (uReflectPass > 0.5) { float w = 1.0 - smoothstep(0.0, uReflectFade, vReflectY); w *= w; gl_FragColor = vec4(gl_FragColor.rgb * w, w); }');
    };
    return material;
  };

  // 4. Shared props, then one flag per idle slice (canvas drawing + texture upload).
  const gold = reflectable(new THREE.MeshStandardMaterial({ color: 0xe2b452, metalness: 1, roughness: 0.24, envMapIntensity: 1.5 }));
  const poleMaterial = reflectable(new THREE.MeshStandardMaterial({ color: 0xf6f4ef, metalness: 0, roughness: 0.32 }));
  const standProfile = [[0, 0], [0.2, 0], [0.2, 0.03], [0.16, 0.045], [0.16, 0.07], [0.12, 0.085], [0.12, 0.11], [0.07, 0.13], [0.05, 0.2], [0, 0.2]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const standGeometry = new THREE.LatheGeometry(standProfile, 48);
  const finialGeometry = new THREE.SphereGeometry(0.042, 24, 18);
  const poleGeometry = new THREE.CylinderGeometry(0.018, 0.018, 1, 16); poleGeometry.translate(0, 0.5, 0);
  const blobCanvas = document.createElement('canvas'); blobCanvas.width = blobCanvas.height = 128;
  { const c = blobCanvas.getContext('2d')!, g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.45, 'rgba(0,0,0,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }
  const blobTexture = new THREE.CanvasTexture(blobCanvas);
  const blobMaterial = new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, depthWrite: false });
  const blobGeometry = new THREE.PlaneGeometry(0.8, 0.8); blobGeometry.rotateX(-Math.PI / 2);
  disposables.push(gold, poleMaterial, standGeometry, finialGeometry, poleGeometry, blobTexture, blobMaterial, blobGeometry);

  // Stands, poles, finials and contact shadows: one InstancedMesh each (4 draw calls for all seats).
  const instanced = (geometry: T.BufferGeometry, material: T.Material, shadow: boolean) => {
    const mesh = new THREE.InstancedMesh(geometry, material, layout.length);
    mesh.castShadow = shadow; scene.add(mesh); disposables.push(mesh);
    return mesh;
  };
  const stands = instanced(standGeometry, gold, true), poles = instanced(poleGeometry, poleMaterial, true);
  const finials = instanced(finialGeometry, gold, true), blobs = instanced(blobGeometry, blobMaterial, false);
  blobs.renderOrder = 2; blobs.layers.set(1);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  layout.forEach((place, i) => {
    q4.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, place.yaw);
    stands.setMatrixAt(i, m4.compose(v3.set(place.x, 0, place.z), q4, s3.set(1, 1, 1)));
    poles.setMatrixAt(i, m4.compose(v3.set(place.x, 0.18, place.z), q4, s3.set(1, place.top - 0.18, 1)));
    finials.setMatrixAt(i, m4.compose(v3.set(place.x, place.top + 0.03, place.z), q4, s3.set(1, 1, 1)));
    blobs.setMatrixAt(i, m4.compose(v3.set(place.x, 0.003, place.z), q4, s3.set(1, 1, 1)));
  });
  for (const mesh of [stands, poles, finials, blobs]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }

  // The empty seat's engraved brass placard (text follows the site language; only its texture is redrawn).
  const placardCanvas = document.createElement('canvas'); placardCanvas.width = 1024; placardCanvas.height = 276;
  const placardTexture = new THREE.CanvasTexture(placardCanvas);
  placardTexture.colorSpace = THREE.SRGBColorSpace;
  const drawPlacard = (lang: Lang) => { engravePlacard(placardCanvas, PLACARD_TEXT[lang]); placardTexture.needsUpdate = true; };
  drawPlacard(initialLang);
  const placardMaterial = reflectable(new THREE.MeshStandardMaterial({ map: placardTexture, metalness: 0.85, roughness: 0.32, envMapIntensity: 1.3 }));
  const placardGeometry = new THREE.BoxGeometry(PLACARD.w, PLACARD.h, 0.018);
  const placardEdgeMaterial = reflectable(new THREE.MeshStandardMaterial({ color: 0xc9973c, metalness: 1, roughness: 0.3, envMapIntensity: 1.3 }));
  // Box faces: +z (index 4) carries the engraving; the rest are plain brass.
  const placard = new THREE.Mesh(placardGeometry, [placardEdgeMaterial, placardEdgeMaterial, placardEdgeMaterial, placardEdgeMaterial, placardMaterial, placardEdgeMaterial]);
  placard.position.set(seat.x, PLACARD.h / 2 * Math.cos(0.32) + 0.004, seat.z + PLACARD.z);
  placard.rotation.x = -0.32; // leaning back, like a desk name plate
  placard.castShadow = true; placard.receiveShadow = true;
  scene.add(placard);
  disposables.push(placardTexture, placardMaterial, placardEdgeMaterial, placardGeometry);

  // Two cloth LODs share index/uv buffers and upsamplers.
  const lods = GRIDS.map(({ nx, ny }) => {
    const sampler = upsampler(2, nx, ny), { RX, RY } = sampler;
    const index: number[] = [];
    for (let v = 0; v < RY - 1; v++) for (let r = 0; r < RX - 1; r++) { const a = v * RX + r, b = a + RX; index.push(a, b, a + 1, b, b + 1, a + 1); }
    const uv = new Float32Array(RX * RY * 2);
    for (let v = 0; v < RY; v++) for (let r = 0; r < RX; r++) { uv[(v * RX + r) * 2] = r / (RX - 1); uv[(v * RX + r) * 2 + 1] = 1 - v / (RY - 1); }
    return { sampler, RX, RY, index: new THREE.Uint16BufferAttribute(index, 1), uv: new THREE.BufferAttribute(uv, 2) };
  });
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  type Flag = {
    code: string; cloth: Cloth; mesh: T.Mesh; material: T.MeshPhysicalMaterial; positions: T.BufferAttribute; normals: T.BufferAttribute;
    inverse: T.Matrix4; bounds: T.Vector3[]; onScreen: boolean; texture: 'none' | 'loading' | 'ready' | 'failed';
  };
  const flags: Flag[] = [];
  const fitPoints: T.Vector3[] = [];
  let heroCentreX = centre.x;
  let built = 0;
  if (!await idleLoop(() => {
    const place = flagPlaces[built], cloth = cloths[built]; built++;
    const lod = lods[place.lod];
    const material = reflectable(new THREE.MeshPhysicalMaterial({
      side: THREE.DoubleSide, roughness: 0.68, metalness: 0,
      sheen: 0.35, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffffff), envMapIntensity: 0.5,
    }));
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.BufferAttribute(new Float32Array(lod.RX * lod.RY * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const normals = new THREE.BufferAttribute(new Float32Array(lod.RX * lod.RY * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', positions); geometry.setAttribute('normal', normals);
    geometry.setAttribute('uv', lod.uv); geometry.setIndex(lod.index);
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(FLAG_W / 2, -FLAG_H / 2, 0), REACH + 0.4);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(place.x, place.top - 0.035, place.z); mesh.rotation.y = place.yaw;
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.visible = false; // shown once its texture is ready
    scene.add(mesh);
    disposables.push(material, geometry);
    mesh.updateMatrixWorld(true);
    // Framing points: stand, finial and the cloth's typical draped extents in the breeze
    // (measured from the sim: fly corners average x≈0.9–1.0, peaking at ≈1.18 in strong gusts,
    // which the framing margin absorbs).
    const points = [[0.22, -place.top, 0.22], [-0.22, -place.top, -0.22], [-0.22, -place.top, 0.22], [0.22, -place.top, -0.22], [0, 0.11, 0],
      [1.04, -0.6, 0.12], [1.04, -0.6, -0.12], [0.98, -1.25, 0], [0.05, -FLAG_H - 0.05, 0]].map(([lx, ly, lz]) => new THREE.Vector3(lx, ly, lz).applyMatrix4(mesh.matrixWorld));
    fitPoints.push(...points);
    flags.push({ code: place.code, cloth, mesh, material, positions, normals, inverse: mesh.matrixWorld.clone().invert(), bounds: [...points, new THREE.Vector3(REACH, 0, 0).applyMatrix4(mesh.matrixWorld)], onScreen: true, texture: 'none' });
    if (place.code === codes[0]) heroCentreX = new THREE.Vector3(FLAG_W / 2, 0, 0).applyMatrix4(mesh.matrixWorld).x;
    return built === flagPlaces.length;
  }, alive)) return abort();
  for (const [dx, dz] of [[-PLACARD.w / 2, PLACARD.z + 0.08], [PLACARD.w / 2, PLACARD.z + 0.08], [0, -0.22]]) fitPoints.push(new THREE.Vector3(seat.x + dx, 0, seat.z + dz));
  fitPoints.push(new THREE.Vector3(seat.x, SEAT_TOP + 0.08, seat.z));

  // Flag artwork: accurate SVGs (flag-icons, MIT), fetched only for flags actually in view,
  // rasterised one per idle slice at a size matched to the cloth's LOD, uploaded, then shown.
  const loadTexture = async (flag: Flag) => {
    flag.texture = 'loading';
    const [w, h] = flag.cloth.lod === 0 ? [512, 384] : [256, 192];
    let canvas: HTMLCanvasElement | null = null;
    try {
      const image = new Image(); image.decoding = 'async'; image.src = `${FLAG_DIR}/${flag.code}.svg`;
      await image.decode();
      if (!alive()) return;
      await idleTask(() => { canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const c = canvas.getContext('2d')!; c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.drawImage(image, 0, 0, w, h); finishFabric(c, w, h); }, alive); // white cloth behind non-rectangular flags (Nepal)
    } catch {
      const spec = FLAGS.find(f => f.code === flag.code); // offline fallback: the hand-drawn version
      if (spec) canvas = flagCanvas(spec, w, h);
    }
    if (!alive()) return;
    if (!canvas) { flag.texture = 'failed'; return; }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = anisotropy;
    await idleTask(() => renderer.initTexture(texture), alive);
    if (!alive()) { texture.dispose(); return; }
    disposables.push(texture);
    flag.material.map = texture; flag.material.needsUpdate = true;
    flag.texture = 'ready';
    flag.mesh.visible = flag.onScreen;
  };
  // Up to 6 in flight; returns once every on-screen flag has its texture (or failed).
  const loadVisibleTextures = async () => {
    const queue = flags.filter(f => f.onScreen && f.texture === 'none');
    const worker = async () => { for (let f = queue.shift(); f; f = queue.shift()) await loadTexture(f); };
    await Promise.all(Array.from({ length: 6 }, worker));
  };

  performance.mark('flag-table:flags-built');
  // 5. The wooden tabletop: one strip extruded along x through a profile (top → rounded nose →
  // front edge) so the grain wraps over the edge; alpha fades it into the page at sides and back.
  const front = bounds.zFront + 0.62, back = bounds.zBack - 1.9, tx0 = bounds.x0 - 7, tx1 = bounds.x1 + 7;
  const width = tx1 - tx0, topDepth = front - TABLE_BEVEL - back;
  const profile: Array<[number, number, number, number]> = [[0, back, 1, 0], [0, front - TABLE_BEVEL, 1, 0]]; // y, z, ny, nz
  for (let k = 1; k <= 6; k++) { const a = (k / 6) * Math.PI / 2; profile.push([-TABLE_BEVEL + TABLE_BEVEL * Math.cos(a), front - TABLE_BEVEL + TABLE_BEVEL * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  profile.push([-TABLE_THICKNESS, front, 0, 1]);
  const tPos: number[] = [], tNor: number[] = [], tUv: number[] = [], tIdx: number[] = [];
  let along = 0;
  profile.forEach(([y, z, ny, nz], i) => {
    if (i > 1) along += Math.hypot(y - profile[i - 1][0], z - profile[i - 1][1]);
    const v = i <= 1 ? (front - TABLE_BEVEL - z) / topDepth : -along / topDepth; // 0 at the nose, 1 at the back
    for (const x of [tx0, tx1]) { tPos.push(x, y, z); tNor.push(0, ny, nz); tUv.push((x - tx0) / width, v); }
    if (i > 0) { const a = (i - 1) * 2, c = i * 2; tIdx.push(a, c, a + 1, a + 1, c, c + 1); }
  });
  const tableGeometry = new THREE.BufferGeometry();
  tableGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3));
  tableGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(tNor, 3));
  tableGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(tUv, 2));
  tableGeometry.setIndex(tIdx);
  const fade = new THREE.CanvasTexture(alphaCanvas(256, 128, (u, y) => smooth(0.02, 0.55, 1 - y)));
  fade.flipY = false; // canvas row 0 ↔ v = 0 (the front edge); the back (v → 1) fades out
  const tableMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x5a2a1c, roughness: 0.45, metalness: 0, clearcoat: FINISH.clearcoat, clearcoatRoughness: FINISH.clearcoatRoughness,
    envMapIntensity: FINISH.env, alphaMap: fade, transparent: true,
  });
  const maps = await woodMaps;
  if (!alive()) return abort();
  if (maps) {
    const tile = FINISH.metres * UNITS_PER_METRE; // world units per texture repeat (true scale)
    const [diffuse, rough, normal] = maps.map((bitmap, i) => {
      const t = new THREE.Texture(bitmap as unknown as HTMLImageElement);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.flipY = false; t.anisotropy = anisotropy;
      if (i === 0) t.colorSpace = THREE.SRGBColorSpace;
      t.center.set(0.5, 0.5); // grain runs along the table
      if (FINISH.rotate) { t.rotation = Math.PI / 2; t.repeat.set(topDepth / tile, width / tile); } else t.repeat.set(width / tile, topDepth / tile);
      t.needsUpdate = true; disposables.push(t);
      return t;
    });
    for (const t of [diffuse, rough, normal]) if (!await idleTask(() => renderer.initTexture(t), alive)) return abort();
    Object.assign(tableMaterial, { map: diffuse, roughnessMap: rough, normalMap: normal, color: new THREE.Color(FINISH.tint), roughness: FINISH.roughness });
    tableMaterial.normalScale.set(FINISH.normal, -FINISH.normal);
    disposables.push({ dispose: () => maps.forEach(m => (m as ImageBitmap).close?.()) });
  }
  // Planar reflection: a mirrored camera renders the flags/stands into a low-res target, which is
  // blurred (separable gaussian) and blended into the varnish with Fresnel, a height falloff (sharp
  // and strong at the contact, blurred and faint higher up) and a wood-coloured tint.
  const reflectSharp = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true });
  const blurA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const blurB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const blurMaterial = new THREE.ShaderMaterial({
    uniforms: { tInput: { value: null }, uStep: { value: new THREE.Vector2() } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tInput; uniform vec2 uStep; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tInput, vUv) * 0.2270270270;
        c += (texture2D(tInput, vUv + uStep * 1.3846153846) + texture2D(tInput, vUv - uStep * 1.3846153846)) * 0.3162162162;
        c += (texture2D(tInput, vUv + uStep * 3.2307692308) + texture2D(tInput, vUv - uStep * 3.2307692308)) * 0.0702702703;
        gl_FragColor = c;
      }`,
    depthTest: false, depthWrite: false,
  });
  const fullscreen = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMaterial);
  const fullscreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const virtualCamera = new THREE.PerspectiveCamera();
  const reflectMatrix = { value: new THREE.Matrix4() };
  const reflectStrength = { value: 0 };
  disposables.push(reflectSharp, blurA, blurB, blurMaterial, fullscreen.geometry);

  // The table runs past the frame; a screen-space vignette dissolves it at the left/right edges.
  const tableViewport = { value: new THREE.Vector2(1, 1) };
  tableMaterial.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, {
      uTableViewport: tableViewport, uReflectMatrix: reflectMatrix, uReflectStrength: reflectStrength,
      tReflectSharp: { value: reflectSharp.texture }, tReflectBlur: { value: blurB.texture },
    });
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform mat4 uReflectMatrix;\nvarying vec4 vReflectUv;\nvarying float vTop;\nvoid main() {')
      .replace('#include <project_vertex>', '#include <project_vertex>\n  vReflectUv = uReflectMatrix * modelMatrix * vec4(transformed, 1.0);\n  vTop = smoothstep(0.9, 1.0, objectNormal.y);');
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `uniform vec2 uTableViewport;
uniform float uReflectStrength;
uniform sampler2D tReflectSharp;
uniform sampler2D tReflectBlur;
varying vec4 vReflectUv;
varying float vTop;
void main() {`)
      .replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\n  float edgeX = gl_FragCoord.x / uTableViewport.x;\n  diffuseColor.a *= smoothstep(0.0, 0.06, edgeX) * smoothstep(0.0, 0.06, 1.0 - edgeX);')
      .replace('#include <opaque_fragment>', `if (uReflectStrength > 0.0) {
    vec4 rUv = vReflectUv;
    rUv.xy += (normal.xy - nonPerturbedNormal.xy) * 0.03 * rUv.w; // grain ripples the reflection
    vec4 sharp = texture2DProj(tReflectSharp, rUv);
    vec4 soft = texture2DProj(tReflectBlur, rUv);
    float near = clamp(sharp.a, 0.0, 1.0);
    vec3 reflected = mix(soft.rgb, sharp.rgb, near * near);
    float NoV = clamp(dot(nonPerturbedNormal, normalize(vViewPosition)), 0.0, 1.0);
    float fresnel = 0.04 + 0.96 * pow(1.0 - NoV, 5.0);
    // strongest right at the contact (near → 1), never above ~0.25 of the reflected radiance
    float k = min(uReflectStrength * (0.55 + 0.45 * fresnel) * (0.6 + 0.4 * near), 0.25) * vTop;
    vec3 wood = diffuseColor.rgb / max(max(diffuseColor.r, diffuseColor.g), 1e-3);
    outgoingLight += reflected * mix(vec3(1.0), wood, 0.45) * k;
  }
  #include <opaque_fragment>`);
  };
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.receiveShadow = true; table.renderOrder = 1; table.layers.set(1); // layer 1: hidden from the mirror pass
  camera.layers.enable(1);
  scene.add(table);
  disposables.push(tableGeometry, fade, tableMaterial);
  for (const x of [bounds.x0, bounds.x1 - 0.4]) fitPoints.push(new THREE.Vector3(x, -TABLE_THICKNESS, front));

  // 6. Camera framing (desktop: the whole cluster; phones: crop to the hero flag).
  const tmp = new THREE.Vector3();
  const viewDir = new THREE.Vector3(0, 0.3, 1).normalize();
  function project(distance: number, x: number) {
    const look = new THREE.Vector3(x, 1.2, centre.z);
    camera.position.copy(look).addScaledVector(viewDir, distance); camera.lookAt(look);
    camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of fitPoints) { tmp.copy(p).project(camera); x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y); }
    return { x0, x1, y0, y1 };
  }
  let size = '', settled = false, narrow = false, slow = false;
  function resize() {
    const width = element.clientWidth, height = element.clientHeight;
    if (!width || !height || `${width}x${height}` === size) return; // setSize clears the canvas: only when it really changed
    size = `${width}x${height}`;
    renderer.setSize(width, height, false);
    renderer.getDrawingBufferSize(tableViewport.value);
    const rw = Math.max(1, Math.round(tableViewport.value.x * REFLECTION_SCALE)), rh = Math.max(1, Math.round(tableViewport.value.y * REFLECTION_SCALE));
    for (const target of [reflectSharp, blurA, blurB]) target.setSize(rw, rh);
    narrow = width < 700;
    camera.aspect = width / height; camera.clearViewOffset();
    let box;
    if (width < 700) {
      const distance = 2.35 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
      box = project(Math.max(distance, 6), heroCentreX);
      box.x0 = box.x1 = 0;
    } else {
      let lo = 3, hi = 120;
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2, b = project(mid, centre.x);
        if (b.x1 - b.x0 <= 1.78 && b.y1 - b.y0 <= 1.8) hi = mid; else lo = mid;
      }
      box = project(hi, centre.x);
    }
    camera.setViewOffset(width, height, ((box.x0 + box.x1) / 2) * width / 2, -((box.y0 + box.y1) / 2) * height / 2, width, height);
    camera.updateProjectionMatrix();
    // Flags cropped out of view (phones) are neither simulated nor drawn.
    // Their artwork isn't even fetched; if a resize brings one into view, it loads then.
    for (const flag of flags) {
      flag.onScreen = flag.bounds.some(p => Math.abs(tmp.copy(p).project(camera).x) < 1.08);
      flag.mesh.visible = flag.onScreen && flag.texture === 'ready';
    }
    if (settled && flags.some(f => f.onScreen && f.texture === 'none')) void loadVisibleTextures();
    // Repaint synchronously: the buffer was just cleared and this runs before the browser paints,
    // so the page never shows an empty (white) canvas — the old cause of the "flash".
    if (settled) draw();
  }

  // 7. Frame the camera (decides which flags are in view), fetch those flags' artwork, then
  // compile shaders without blocking (parallel compile where supported).
  resize();
  await loadVisibleTextures();
  if (!alive()) return abort();
  performance.mark('flag-table:textures-ready');
  await renderer.compileAsync(scene, camera).catch(() => undefined);
  if (!alive()) return abort();
  { // compileAsync skips the shadow pass's depth programs; compile matching ones in parallel too
    // (plain front-sided, double-sided cloth, and instanced) so they aren't linked mid-frame.
    const depth = new THREE.Scene(), box = new THREE.BoxGeometry();
    const front = new THREE.MeshDepthMaterial(), double = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });
    depth.add(new THREE.Mesh(box, front), new THREE.Mesh(box, double), new THREE.InstancedMesh(box, front, 1), new THREE.InstancedMesh(box, double, 1));
    await renderer.compileAsync(depth, camera).catch(() => undefined);
    box.dispose(); front.dispose(); double.dispose();
    if (!alive()) return abort();
  }
  if (!narrow) { // the mirror pass renders to a target (no tone mapping): a separate shader variant
    renderer.setRenderTarget(reflectSharp);
    await renderer.compileAsync(scene, camera).catch(() => undefined);
    renderer.setRenderTarget(null);
    if (!alive()) return abort();
  }
  performance.mark('flag-table:compiled');

  const raycaster = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  const rayOrigin = new THREE.Vector3(), rayDir = new THREE.Vector3(), localO = new THREE.Vector3(), localD = new THREE.Vector3();
  let hovering = false, lastPointer = 0, pointerSpeed = 0, px = 0, py = 0, pointerForce = 0, gustTarget = 0;
  /** One fixed step. Wind/aerodynamic forces are refreshed every other step (every 1/60 s): they
   *  change slowly, and it halves their cost; constraints and integration run every step. */
  // Far flags (LOD 1) step at half rate, catching up with their own accumulated time.
  function simulate(h: number, refresh: boolean) {
    wind.time = (wind.time + h) % LOOP;
    wind.strength = ambientStrength(wind.time);
    flags.forEach((flag, i) => {
      if (!flag.onScreen) return;
      const cloth = flag.cloth;
      lag[i] += h;
      if (cloth.lod === 1 && lag[i] < 2 * SIM_STEP - 1e-6) return;
      const fresh = refresh || cloth.lod === 1;
      if (fresh) cloth.applyForces(wind);
      if (fresh && pointerForce > 0.01) {
        localO.copy(rayOrigin).applyMatrix4(flag.inverse); localD.copy(rayDir).transformDirection(flag.inverse);
        cloth.push(localO.x, localO.y, localO.z, localD.x, localD.y, localD.z, 0.34, pointerForce);
      }
      cloth.step(lag[i]); lag[i] = 0;
    });
  }
  // Mirror camera about the tabletop plane (y = 0), as three's Reflector does.
  const mirrorPos = new THREE.Vector3(), mirrorTarget = new THREE.Vector3(), camPos = new THREE.Vector3(), rotation = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0), bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  function renderReflection() {
    camPos.setFromMatrixPosition(camera.matrixWorld);
    rotation.extractRotation(camera.matrixWorld);
    mirrorTarget.set(0, 0, -1).applyMatrix4(rotation).add(camPos);
    virtualCamera.position.set(camPos.x, -camPos.y, camPos.z);
    virtualCamera.up.set(0, 1, 0).applyMatrix4(rotation).multiply(new THREE.Vector3(1, -1, 1));
    virtualCamera.lookAt(mirrorPos.set(mirrorTarget.x, -mirrorTarget.y, mirrorTarget.z));
    virtualCamera.far = camera.far; virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
    virtualCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    reflectMatrix.value.copy(bias).multiply(virtualCamera.projectionMatrix).multiply(virtualCamera.matrixWorldInverse);
    reflectPass.value = 1;
    renderer.setRenderTarget(reflectSharp); renderer.clear(); renderer.render(scene, virtualCamera);
    reflectPass.value = 0;
    blurMaterial.uniforms.tInput.value = reflectSharp.texture; blurMaterial.uniforms.uStep.value.set(1.6 / reflectSharp.width, 0);
    renderer.setRenderTarget(blurA); renderer.render(fullscreen, fullscreenCamera);
    blurMaterial.uniforms.tInput.value = blurA.texture; blurMaterial.uniforms.uStep.value.set(0, 1.6 / reflectSharp.height);
    renderer.setRenderTarget(blurB); renderer.render(fullscreen, fullscreenCamera);
    renderer.setRenderTarget(null);
  }
  function draw() {
    for (const flag of flags) {
      if (!flag.onScreen) continue;
      const lod = lods[flag.cloth.lod];
      lod.sampler.run(flag.cloth.pos, flag.positions.array as Float32Array);
      gridNormals(flag.positions.array as Float32Array, flag.normals.array as Float32Array, lod.RX, lod.RY);
      flag.positions.needsUpdate = true; flag.normals.needsUpdate = true;
    }
    // Shadow maps are drawn once per frame (by whichever pass renders first), not once per pass.
    renderer.shadowMap.needsUpdate = true;
    const mirror = !narrow && !slow;
    reflectStrength.value = mirror ? FINISH.reflection : 0;
    if (mirror) renderReflection();
    renderer.render(scene, camera);
  }

  // 8. Interaction.
  function point(event: PointerEvent) {
    if (event.pointerType === 'touch') return; // touch scrolls the page; the scroll gust covers it
    const box = element.getBoundingClientRect();
    ndc.set(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    rayOrigin.copy(raycaster.ray.origin); rayDir.copy(raycaster.ray.direction);
    const now = performance.now(), dt = Math.max(now - lastPointer, 1);
    const speed = Math.min(Math.hypot(event.clientX - px, event.clientY - py) / dt, 4);
    pointerSpeed = hovering ? Math.max(pointerSpeed, speed) : 0;
    px = event.clientX; py = event.clientY; lastPointer = now; hovering = true;
  }
  const onLeave = () => { hovering = false; };
  let lastY = window.scrollY, lastScroll = performance.now();
  const onScroll = () => {
    const now = performance.now(), dt = Math.max(now - lastScroll, 8);
    gustTarget = Math.min(gustTarget + (Math.abs(window.scrollY - lastY) / dt) * 0.3, 1.4);
    lastY = window.scrollY; lastScroll = now;
  };
  element.addEventListener('pointermove', point, { passive: true });
  element.addEventListener('pointerdown', point, { passive: true });
  element.addEventListener('pointerleave', onLeave);
  element.addEventListener('pointercancel', onLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => {
    element.removeEventListener('pointermove', point); element.removeEventListener('pointerdown', point);
    element.removeEventListener('pointerleave', onLeave); element.removeEventListener('pointercancel', onLeave);
    window.removeEventListener('scroll', onScroll);
  });

  // 9. Loop: rAF-driven, rendering at most FPS times a second; the sim catches up in fixed steps
  // so motion speed is independent of the render rate. Paused off-screen (the last frame stays).
  let visible = false, frame = 0, last = 0, renderAcc = 0, simAcc = 0, lost = false;
  let slowFor = 0;
  function tick(now: number) {
    const started = performance.now();
    frame = visible && !reduced && !lost ? requestAnimationFrame(tick) : 0;
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    renderAcc += dt;
    if (renderAcc < 1 / FPS - 0.002) return;
    const elapsed = Math.min(renderAcc, 0.1);
    renderAcc = renderAcc > 2 / FPS ? 0 : renderAcc - 1 / FPS;
    gustTarget *= Math.pow(0.1, elapsed);
    wind.gust += (gustTarget - wind.gust) * Math.min(elapsed * (gustTarget > wind.gust ? 10 : 2.4), 1);
    pointerSpeed *= Math.pow(0.02, elapsed);
    const goal = hovering ? 4 + pointerSpeed * 16 : 0;
    pointerForce += (goal - pointerForce) * Math.min(elapsed * 10, 1);
    simAcc += elapsed;
    let n = 0;
    for (; simAcc >= SIM_STEP && n < 12; n++) { simulate(SIM_STEP, n % 2 === 0); simAcc -= SIM_STEP; }
    if (n === 12) simAcc = 0;
    draw();
    // Slow device: if a frame keeps costing > 22 ms (or we can't hold the cap) for 2 s, drop the
    // planar reflection for good and fall back to environment-only reflections.
    if (!slow && !narrow) {
      const busy = performance.now() - started > 22 || elapsed > 1.8 / FPS;
      slowFor = busy ? slowFor + elapsed : 0;
      if (slowFor > 2) slow = true;
    }
  }
  function play() { if (!frame && settled && visible && !reduced && !lost) { last = 0; renderAcc = 1 / FPS; frame = requestAnimationFrame(tick); } }
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; play(); }, { rootMargin: '100px 0px' });
  io.observe(element);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
  // WebGL context loss (GPU reset / memory pressure): three restores its own state; repaint at once.
  const onLost = () => { lost = true; cancelAnimationFrame(frame); frame = 0; };
  const onRestored = () => { lost = false; makeEnvironment(); draw(); play(); };
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  renderer.domElement.addEventListener('webglcontextrestored', onRestored);
  cleanups.push(() => {
    cancelAnimationFrame(frame); frame = 0; io.disconnect(); resizeObserver.disconnect();
    renderer.domElement.removeEventListener('webglcontextlost', onLost);
    renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
  });

  // Warm-up, in idle slices, before the canvas is revealed. Even with programs compiled, three's
  // first use of each program (uniform lookups: synchronous GPU round-trips) and of each object
  // costs tens of ms, so every visible object is introduced alone — mirror pass, then main pass —
  // and no single slice has to pay for more than one new program.
  const renderables: T.Object3D[] = [];
  scene.traverse(o => { if ((o as T.Mesh).isMesh && o.visible) renderables.push(o); });
  let unit = 0;
  if (!await idleLoop(() => {
    const object = renderables[unit >> 1];
    for (const o of renderables) o.visible = o === object;
    renderer.shadowMap.needsUpdate = true;
    if (unit % 2 === 0) { if (!narrow) renderReflection(); } else renderer.render(scene, camera);
    unit++;
    const done = unit === renderables.length * 2;
    if (done) for (const o of renderables) o.visible = true;
    return done;
  }, alive)) return abort();
  if (!await idleTask(draw, alive)) return abort();
  await new Promise(resolve => window.setTimeout(resolve, 32));
  if (!alive()) return abort();
  // First frame only once everything is settled, then fade the canvas in.
  await new Promise(requestAnimationFrame);
  if (!alive()) return abort();
  settled = true;
  const drawStart = performance.now();
  draw();
  performance.measure('flag-table:first-draw', { start: drawStart });
  performance.mark('flag-table:first-frame');
  renderer.domElement.style.opacity = '1';
  play();
  return {
    stop: teardown,
    // Language switch: redraw only the placard's texture, then repaint if the loop is paused.
    setLang(lang: Lang) { drawPlacard(lang); if (!frame) draw(); },
  };
}

/** Five rotating world flags per load, lightly weighted toward communities large in New Jersey. */
function pickRotating(count: number): string[] {
  const picked: string[] = [], pool = [...POOL];
  for (let n = 0; n < count && pool.length; n++) {
    const weights = pool.map(code => (NJ_COMMUNITIES.includes(code) ? 3 : 1));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), i = 0;
    while ((r -= weights[i]) > 0) i++;
    picked.push(...pool.splice(i, 1));
  }
  return picked;
}
const REGION_LOCALE: Record<Lang, string> = { en: 'en', es: 'es', pt: 'pt-BR' };

export default function FlagTable({ label, lang }: { label: string; lang: Lang }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<Controller | null>(null);
  const langRef = useRef(lang);
  const [codes] = useState(() => [...CORE, ...pickRotating(5)]);
  const names = useMemo(() => {
    const display = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([REGION_LOCALE[lang]], { type: 'region' }) : null;
    return codes.map(code => display?.of(code.toUpperCase()) ?? code.toUpperCase());
  }, [codes, lang]);

  useEffect(() => {
    langRef.current = lang;
    controller.current?.setLang(lang);
  }, [lang]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    const alive = () => !disposed;
    // Nothing (not even three.js) loads until the section is within ~1 viewport of the screen.
    const near = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      near.disconnect();
      start(element, alive, codes, langRef.current)
        .then(ctrl => { if (disposed) ctrl?.stop(); else { controller.current = ctrl; ctrl?.setLang(langRef.current); } })
        .catch(error => console.error('[flag-table]', error));
    }, { rootMargin: '100% 0px' });
    near.observe(element);
    return () => { disposed = true; near.disconnect(); controller.current?.stop(); controller.current = null; };
  }, [codes]);

  return <div ref={host} role="img" aria-label={`${label} ${names.join(', ')}.`} style={{ position: 'relative', width: '100%', height: '100%', touchAction: 'pan-y' }} />;
}
