// v4 ending, "Nhan Tang Lien": the eye's light finds the lotus burning inside the dust, the eye breathes everything in
// up a twisting column, snaps shut, ash falls like snow and a lotus is left burnt into the ground, cooling to nothing.
import { smooth, clamp, TAU, hex } from '../../core/index.js';
import { L, DUST, TX, EC, EH, GHOST, INHALE, SHUT, ASH, END, hsh } from './_tinhlien-common.js';
import { reveal } from './_tinhlien-blast.js';

const RED = ['#c0300c', '#7a1a08', '#3a0c06'].map(hex);
const lightLine = (p, x0, y0, x1, y1, c, k) => {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let j = 0; j <= n; j++) { const u = j / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; p.add(p.cellX(x, y), p.cellY(x, y), c, k); }
};
const inh = (t) => smooth(INHALE[0], INHALE[1], t);

// ---- the lotus of light inside the dust: drawn only as light added over the billows (no flat fill)
const PET = Array.from({ length: 9 }, (_, i) => ({ a: (i - 4) * 0.3, len: 0.75 + 0.25 * Math.cos((i - 4) * 0.35), w: 0.2 }));
function lightLotus(p, t) {
  const g = reveal(t) + smooth(INHALE[0], INHALE[0] + 0.2, t) * (1 - smooth(INHALE[0] + 0.7, INHALE[0] + 0.9, t));
  if (g <= 0.02) return;
  const e = inh(t) ** 1.5, size = 48 * (1 - 0.85 * e), cx = TX + Math.sin(t * 6) * 6 * e, by = -36 + (EC[1] + 30 + 36) * e;
  const flick = 0.85 + 0.15 * Math.sin(t * 23);
  p.shade(cx - size, by - size * 1.1, cx + size, by + 4, (x, y, o) => {
    const dx = x - cx, dy = by - y, r = Math.hypot(dx, dy) / size;
    if (r > 1 || dy < -3) return;
    const ang = Math.atan2(dx, Math.max(0.1, dy));
    let best = 9;
    for (const P of PET) {
      const w = P.w * Math.sin(Math.PI * Math.min(1, r / P.len) ** 0.8) * (1 + 0.15 * Math.sin(t * 9 + P.a * 7)), d = Math.abs(ang - P.a) - w;
      if (r < P.len && d < best) best = d;
    }
    if (best > 0.03) return;
    o.l = best > -0.03 ? L[6] : L[4];
    o.k = (best > -0.03 ? 0.85 : 0.3 * (1 - r)) * g * flick;
  });
}
// ---- the eye's light pierces the dust down to the lotus
function shaft(p, t) {
  const g = reveal(t) + (inh(t) > 0 ? 1 - smooth(SHUT[0] - 0.1, SHUT[0], t) : 0);
  if (g <= 0.02) return;
  const y0 = EC[1] + EH * 0.8, y1 = -40, w = 5 + 3 * Math.sin(t * 7);
  for (let j = -Math.ceil(w); j <= Math.ceil(w); j++) {
    const e = Math.abs(j) / w;
    if (e > 1) continue;
    lightLine(p, TX + j, y0, TX + j * 1.6, y1, e < 0.3 ? L[6] : L[4], (e < 0.3 ? 0.55 : 0.25 * (1 - e)) * Math.min(1, g));
  }
}
// ---- the inhale: a twisting column of dust and light from the ground to the pupil
const STRANDS = Array.from({ length: 12 }, (_, i) => ({ ph: i / 12 * TAU, c: i % 3, light: i % 4 === 0 }));
function column(p, t) {
  const g = smooth(INHALE[0], INHALE[0] + 0.25, t) * (1 - smooth(SHUT[0] - 0.08, SHUT[0] + 0.05, t));
  if (g <= 0) return;
  // a solid pixel twister: per row a band of diagonal stripes in stepped dust colours, a dark rim, a lit core;
  // it grows up from the ground and is cut away from the bottom as the eye takes the last of it
  const top = EC[1] + EH * 0.6, yTop = -2 + (top + 2) * g, cut = -2 + (top + 2) * smooth(INHALE[1] - 0.35, SHUT[0], t);
  for (let y = Math.ceil(yTop); y < Math.min(-1, cut); y++) {
    const v = (y - top) / -top, w = 4 + 26 * v * v, cx = TX + Math.sin(y * 0.045 + t * 6) * 5 * v, sy = p.cellY(cx, y + 0.5);
    for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
      const q = (x + 0.5 - cx) / w, e = Math.abs(q);
      if (e > 1) continue;
      const stripe = ((Math.floor(q * 3 + y * 0.22 - t * 14) % 3) + 3) % 3;
      const c = e > 0.88 ? DUST[0] : e < 0.18 ? L[4] : DUST[2 + stripe];
      p.put(p.cellX(x + 0.5, y + 0.5), sy, c, 1);
    }
  }
  for (const S of STRANDS) if (S.light) {   // two bright filaments winding round it
    let px = 0, py = 0;
    for (let y = -2; y > yTop; y -= 3) {
      const v = (y - top) / -top, x = TX + Math.sin(y * 0.09 + t * 12 + S.ph) * (4 + 26 * v * v);
      if (y < -2 && y < cut) lightLine(p, px, py, x, y, L[6], 0.6 * g);
      px = x; py = y;
    }
  }
  for (let i = 0; i < 40; i++) {   // motes spiralling up
    const ph = (t * (0.9 + 0.5 * hsh(i, 1)) + hsh(i, 2)) % 1, y = -2 + (top + 2) * ph, v = (y - top) / -top;
    const x = TX + Math.sin(y * 0.06 + t * 9 + hsh(i, 3) * TAU) * (8 + 34 * v * v);
    if (ph < g) p.dot(x, y, i % 3 ? DUST[4] : L[5], 1);
  }
}
// ---- the gulp: a flat shock ring from the eye as it snaps shut
function gulp(p, t) {
  const a = t - SHUT[1];
  if (a < 0 || a > 0.3) return;
  const u = a / 0.3, rx = 60 + 190 * u, ry = 10 + 22 * u, pts = [];
  for (let i = 0; i <= 48; i++) { const q = i / 48 * TAU; pts.push([EC[0] + Math.cos(q) * rx, EC[1] + Math.sin(q) * ry]); }
  p.polyline(pts, u < 0.4 ? L[6] : u < 0.7 ? L[4] : L[2], 1);
}
// ---- ash like snow
const FLAKES = Array.from({ length: 80 }, (_, i) => ({ x: -55 + 350 * hsh(i, 10), d: 0.9 * hsh(i, 11), v: 26 + 26 * hsh(i, 12), y0: -235 - 60 * hsh(i, 13), end: ASH[1] - 0.7 * hsh(i, 14), s: hsh(i, 15) > 0.7 ? 2 : 1, c: i % 3 }));
function ash(p, t) {
  if (t < ASH[0] || t > ASH[1]) return;
  for (const F of FLAKES) {
    const b = t - ASH[0] - F.d;
    if (b < 0 || t > F.end) continue;
    const y = F.y0 + b * F.v, x = F.x + Math.sin(b * 2.2 + F.x) * 4;
    if (y < -234 || y > -1) continue;
    const c = F.c === 0 ? L[5] : F.c === 1 ? L[4] : DUST[4];
    p.dot(x, y, c, 1);
    if (F.s === 2) p.dot(x + 1, y, c, 1);
  }
}
// ---- the lotus burnt into the ground, seen flat, cooling white -> gold -> red -> gone
const BURN0 = INHALE[0] + 0.45, BURN1 = END - 0.25;
const SCORCH = Array.from({ length: 8 }, (_, i) => {
  const al = i / 8 * TAU + 0.2, len = 40 + 8 * hsh(i, 20), w = 13, pts = [];
  for (let j = 0; j <= 6; j++) { const u = j / 6, h = Math.sin(Math.PI * u ** 0.8) * w * 0.5; pts.push([u * len, -h]); }
  for (let j = 6; j >= 0; j--) { const u = j / 6, h = Math.sin(Math.PI * u ** 0.8) * w * 0.5; pts.push([u * len, h]); }
  return { al, len, pts };
});
function scorch(p, t) {
  if (t < BURN0 || t > BURN1) return;
  const age = (t - BURN0) / (BURN1 - BURN0), grow = clamp((t - BURN0) / 0.35);
  const c = age < 0.12 ? L[6] : age < 0.3 ? L[5] : age < 0.48 ? L[3] : age < 0.66 ? RED[0] : age < 0.84 ? RED[1] : RED[2];
  const proj = (al, u, v) => { const x = u * Math.cos(al) - v * Math.sin(al), z = u * Math.sin(al) + v * Math.cos(al); return [TX + x, -1 + z * 0.2]; };
  for (const S of SCORCH) {
    const pts = S.pts.map(([u, v]) => proj(S.al, u * grow, v * grow));
    p.polyline(pts, c, 1);
    p.line(...proj(S.al, 4, 0), ...proj(S.al, S.len * grow * 0.8, 0), age < 0.3 ? L[4] : c, 1);
  }
  const rr = 10 * grow;   // the seed-pod ring at the centre
  const ring = Array.from({ length: 21 }, (_, i) => { const q = i / 20 * TAU; return [TX + Math.cos(q) * rr, -1 + Math.sin(q) * rr * 0.2]; });
  p.polyline(ring, c, 1);
  if (age < 0.35) p.glow(TX, -2, 30, L[4], 0.25 * (1 - age / 0.35));
}
export function ending(p, t, layer) {
  if (layer === 'back') { scorch(p, t); shaft(p, t); return; }
  column(p, t);
  lightLotus(p, t);
  gulp(p, t);
  ash(p, t);
}
