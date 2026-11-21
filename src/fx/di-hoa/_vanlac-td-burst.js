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
  if ((part === 'front' || part === 'back') && age < 0.6) {   // 16 clear flame tongues flung out in 3D
    for (const a of TONGUES) {
      const z = Math.sin(a); if (layerOfZ(z) !== part) continue;
      const key = pk(a), lift = (hash(key, 1, 4) - 0.35) * 0.9, reach = (40 + 26 * hash(key, 2, 4)) * out3(clamp(age / 0.4));
      const tail = Math.max(0, reach - 26 * (1 - smooth(0.25, 0.6, age)) - 4), k = 1 - smooth(0.35, 0.6, age);
      const at = (s) => [cx + Math.cos(a) * s, cy + z * s * SQ - lift * s - 0.5 * 60 * (s / 80) ** 2];
      const n = Math.max(2, Math.ceil(reach - tail));
      for (let i = 0; i <= n; i++) {
        const s = tail + (reach - tail) * (i / n), [x, y] = at(s), w = 1.6 * Math.sin(Math.PI * i / n);
        if (hash(key, i, fr(t)) > k + 0.2) continue;
        const nx = -Math.sin(a), ny = Math.cos(a) * 0.4;
        p.dot(x + nx * w, y + ny * w, RIM); p.dot(x - nx * w, y - ny * w, SHADE);
        if (i > n - 3) p.dot(x, y, i === n ? C[4] : C[3]);
      }
    }
  }
  if (age < 0.6) for (const a of EMBERS) {   // embers: arc out, fall, land with a shadow
    const key = pk(a), sp = 40 + 50 * hash(key, 5, 6), up = 50 + 40 * hash(key, 6, 6), g = 260;
    const tt = Math.min(age, 0.55), r = sp * tt, h = 30 + up * tt - 0.5 * g * tt * tt, z = Math.sin(a);
    const fx = Math.cos(a) * r, fy = z * r * SQ;
    if (part === 'floor') { if (h < 30) p.dot(fx, fy, C[0]); continue; }
    if (layerOfZ(z) !== part) continue;
    if (h <= 0) { if (hash(key, fr(t), 8) < 0.6) p.dot(fx, fy, C[2]); continue; }
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
    if (k > 0.08) for (const m of [1, -1]) {
      const head = (ti) => { const u = clamp((ti - BURN - 0.08) / 0.5); return [m * (4 + 44 * u + 3 * Math.sin(u * 9)), cy - 22 - 46 * u]; };
      const sp = spine(head, t, 46 * k, BURN + 0.08);
      drawSerpentTD(p, sp, t, { L: 46, W: 3, heart: 0.3, layer: 'front', seed: 4, dorsal: -m });
    }
  }
  if (part === 'front' && age < END - BURN - 0.05) {   // the last ember of the heart dies last
    const k = 1 - smooth(0.3, END - BURN - 0.05, age);
    if (k > 0.05) { p.dot(-1, cy, C[k > 0.5 ? 3 : 2]); p.dot(0, cy, C[k > 0.5 ? 3 : 2]); }
  }
}
