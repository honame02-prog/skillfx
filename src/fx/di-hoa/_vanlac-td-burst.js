// Van Lac Tam Viem (top-down), burst part: the heart flares and bursts outward (no column).
import { clamp, smooth, TAU } from '../../core/index.js';
import { spine } from './_serpent-lib.js';
import { drawSerpentTD } from './_serpent-td-lib.js';
import { C, RIM, SHADE, ASH } from './_vanlac-common.js';
import { hash } from './_cold-lib.js';
import { END, BURN, SQ, CHEST, out3, pk, fr, layerOfZ } from './_vanlac-td-common.js';

const TONGUES = Array.from({ length: 16 }, (_, k) => (k + 0.5) / 16 * TAU);           // closed under a -> PI - a
const EMBERS = Array.from({ length: 20 }, (_, k) => (k + 0.5) / 20 * TAU / 2 - Math.PI / 2)   // half set, mirrored below
  .flatMap((a) => [a, Math.PI - a]);
export function burst(p, t, part) {
  const age = t - BURN;
  if (age < 0 || t > END) return;
  const [cx, cy] = CHEST;
  if (part === 'front' && age < 0.08) {   // rose flash, white core
    const r = 7 + 13 * (age / 0.08);   // flattened (ry 0.62 r) so it reads as a burst, never a column (K9)
    p.shade(-r, -r * 0.62 + cy, r, r * 0.62 + cy, (x, y, o) => {
      const d = Math.hypot(x / r, (y - cy) / (r * 0.62)); if (d > 1) return;
      o.c = d < 0.3 ? C[6] : d < 0.6 ? C[4] : C[3];
    });
    for (let i = 0; i < 8; i++) {   // eight short, single-pixel glints, flattened with the flash
      const a = (i + 0.5) / 8 * TAU, d = r + 2;
      p.line(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.5,
        cx + Math.cos(a) * (d + 3), cy + Math.sin(a) * (d + 3) * 0.5, RIM);
    }
  }
  if (part === 'floor' && age < 0.5) {    // glass shock ring on the floor
    const u = out3(age / 0.5), rx = 10 + 90 * u, k = 1 - smooth(0.3, 0.5, age);
    p.shade(-rx - 3, -rx * SQ - 3, rx + 3, rx * SQ + 3, (x, y, o) => {
      const r = Math.hypot(Math.abs(x) / rx, y / (rx * SQ)), d = (1 - r) * rx;
      if (d < 0 || d > 4) return;
      if (hash(Math.floor(Math.abs(x)), Math.floor(y), fr(t)) > k) return;
      if (d < 1.2) { o.c = RIM; o.a = 1; return; }
      if (d < 2.4 && age < 0.25) { o.c = C[4]; o.a = 1; return; }
      o.l = 0xffd8d0e0; o.k = 0.25 * k;
    });
  }
  if ((part === 'front' || part === 'back') && age < 0.35) {   // air ring round the chest, split by depth
    const u = out3(age / 0.35), rx = 8 + 52 * u, k = 1 - smooth(0.2, 0.35, age);
    for (let i = 0; i < 64; i++) {
      const a = (i + 0.5) / 64 * TAU, z = Math.sin(a);
      if (layerOfZ(z) !== part || hash(pk(a), fr(t), 9) > k) continue;
      p.dot(cx + Math.cos(a) * rx, cy + z * rx * SQ * 0.6, i % 4 ? RIM : C[4]);
    }
  }
  if ((part === 'front' || part === 'back') && age < 0.6) {   // open, hooked glass ribbons; no stippled dissolve
    for (const a of TONGUES) {
      const z = Math.sin(a); if (layerOfZ(z) !== part) continue;
      const key = pk(a), side = Math.sign(Math.cos(a)), dx = Math.cos(a), dy = z * SQ;
      const lift = (hash(key, 1, 4) - 0.35) * 0.9;
      const reach = (40 + 26 * hash(key, 2, 4)) * out3(clamp(age / 0.4));
      const len = (19 + 15 * hash(key, 3, 4)) * smooth(0, 0.09, age);
      const root = Math.max(0, reach - len), from = smooth(0.27, 0.59, age);
      if (len < 1 || from > 0.995) continue;
      // Screen-space normal, mirrored with the radial direction. End bends back like drawFins.
      const tl = Math.hypot(dx, dy - lift) || 1, nx = -(dy - lift) / tl * side, ny = dx / tl * side;
      const phase = hash(key, 4, 4) * TAU, freq = 8 + 2 * hash(key, 7, 4);
      const whip = Math.sin(age * TAU * freq + phase);
      const at = (u) => {
        const v = 1 - u;
        const along = len * (3 * v * v * u * 0.35 + 3 * v * u * u * 1.26 + u * u * u * 0.82);
        const curl = len * (3 * v * u * u * 0.12 + u * u * u * 0.39) + 2.8 * u ** 3 * whip;
        const r = root + along;
        return [cx + dx * r + nx * curl, cy + (dy - lift) * r - 30 * (r / 80) ** 2 + ny * curl];
      };
      const leading = [], trailing = [];
      const n = Math.max(3, Math.ceil(len * (1 - from) * 1.7));
      for (let i = 0; i <= n; i++) {
        const u = from + (1 - from) * i / n, q = at(u), b = at(Math.max(0, u - 0.012)), e = at(Math.min(1, u + 0.012));
        const vx = e[0] - b[0], vy = e[1] - b[1], vl = Math.hypot(vx, vy) || 1;
        const w = (2.2 + 1.1 * hash(key, 8, 4)) * Math.sin(Math.PI * u) * (1 - 0.65 * smooth(0.32, 0.59, age));
        leading.push([q[0] - vy / vl * w * side, q[1] + vx / vl * w * side]);
        trailing.push([q[0] + vy / vl * w * side, q[1] - vx / vl * w * side]);
      }
      p.polyline(trailing, SHADE);
      const tip = Math.max(1, Math.floor(n * clamp((0.77 - from) / (1 - from))));
      p.polyline(leading.slice(0, tip + 1), RIM);
      p.polyline(leading.slice(tip), C[4]);
      p.polyline(leading.slice(Math.max(tip, n - 2)), C[3]);
    }
  }
  if (age < 0.6) for (const a of EMBERS) {   // forty curved flights; land before 2.9, then cool on the floor
    const key = pk(a), side = Math.sign(Math.cos(a)), sp = 48 + 60 * hash(key, 5, 6);
    const up = 15 + 45 * hash(key, 6, 6), g = 680 + 160 * hash(key, 7, 6);
    const land = (up + Math.sqrt(up * up + 60 * g)) / g;
    const flight = (tt) => {
      const r = sp * tt, bend = side * (0.6 + hash(key, 9, 6)) * tt;
      const aa = a + bend;
      return [Math.cos(aa) * r, Math.sin(aa) * r * SQ, Math.max(0, 30 + up * tt - 0.5 * g * tt * tt)];
    };
    const [fx, fy, h] = flight(Math.min(age, land));
    const z = Math.sin(a + side * (0.6 + hash(key, 9, 6)) * Math.min(age, land));
    if (part === 'floor') {
      if (age < land) { if (h < 24) p.line(fx - 1, fy, fx + 1, fy, C[0]); }
      else {
        const cool = (age - land) / (0.59 - land);
        if (cool < 1) p.line(fx - 0.7 * (1 - cool), fy, fx + 0.7 * (1 - cool), fy, C[cool < 0.22 ? 3 : cool < 0.58 ? 2 : 1]);
      }
      continue;
    }
    if (age >= land || layerOfZ(z) !== part) continue;
    if (hash(key, 10, 6) < 0.4 && age > 0.025) {
      const [bx, by, bh] = flight(age - 0.025), vx = bx - fx, vy = by - bh - (fy - h), vl = Math.hypot(vx, vy) || 1;
      const tail = 2 + hash(key, 11, 6);
      p.line(fx, fy - h, fx + vx / vl * tail, fy - h + vy / vl * tail, C[2]);
    }
    p.dot(fx, fy - h, age < 0.25 ? C[4] : C[3]);
  }
  if (part === 'front' && age > 0.05) for (let i = 0; i < 8; i++) {   // ash flakes rising (mirror pairs)
    const a2 = age - 0.05 - hash(i, 21, 2) * 0.1; if (a2 < 0) continue;
    const x = 4 + 10 * hash(i, 22, 2) + 6 * a2, y = cy - 6 - 40 * a2 + 3 * Math.sin(a2 * 9 + i), c = ASH[i % 3];
    if (hash(i, fr(t), 3) < smooth(0.35, 0.6, age)) continue;
    p.dot(x, y, c); p.dot(-x - 1e-6, y, c);
  }
  if (part === 'front' && age > 0.08) {   // two soul serpents rise from the head in a V and fade
    const k = 1 - smooth(0.30, 0.55, age);   // fades by shrinking from the tail, never by stipple (K12)
    if (k > 0.002) for (const m of [1, -1]) {
      const head = (ti) => { const u = clamp((ti - BURN - 0.08) / 0.5); return [m * (4 + 44 * u + 3 * Math.sin(u * 9)), cy - 22 - 46 * u]; };
      const L = 46 * k, sp = spine(head, t, L, BURN + 0.08);
      // Shorten the library's own length too: its taper and fins follow the retreating tail.
      const w = 3 * Math.min(1, k / 0.5), scale = Math.min(1, k / 0.35);
      // Once the tail has gone, contract the remaining head around its snout too.
      // Transform the library's geometry, with opaque marks throughout (no clipping or white stipple).
      const q = Object.create(p), [hx, hy] = head(t);
      const X = (x) => hx + (x - hx) * scale, Y = (y) => hy + (y - hy) * scale;
      q.cellX = (x, y) => p.cellX(X(x), Y(y));
      q.cellY = (x, y) => p.cellY(X(x), Y(y));
      q.shade = (x0, y0, x1, y1, fn) => p.shade(X(x0), Y(y0), X(x1), Y(y1),
        (x, y, o) => fn(hx + (x - hx) / scale, hy + (y - hy) / scale, o));
      drawSerpentTD(q, sp, t, { L, W: w, heart: 0.3 * k, layer: 'front', seed: 4, dorsal: -m });
    }
  }
  if (part === 'front' && age < END - BURN - 0.05) {   // the last ember of the heart dies last
    const k = 1 - smooth(0.3, END - BURN - 0.05, age);
    if (k > 0.05) { p.dot(-1, cy, C[k > 0.5 ? 3 : 2]); p.dot(0, cy, C[k > 0.5 ? 3 : 2]); }
  }
}
