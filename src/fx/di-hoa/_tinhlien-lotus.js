// Tinh Lien part: the LOTUS of flickering white flame on the target (APPEAR..BOOM) and its ghost inside the dust cone. Port of the draft.
import { smooth, clamp, TAU } from '../../core/index.js';
import { L, LID, IRIS, PUPIL, VEIN, DUST, CLOUD, TX, END, GATHER, APPEAR, OPENS, LEVEL, LOCK, BOOM, SHUT, GHOST, LC, EC, EW, EH, IR, sm, out3, hsh, openAt, eyeK, lockAt, pupilW, pulses, grid } from './_tinhlien-common.js';

const RINGS = [
  { n: 6, len: 30, w: 17, spread: 1.25 },
  { n: 5, len: 27, w: 15, spread: 0.8 },
  { n: 3, len: 21, w: 12, spread: 0.3 },
];
function flamePetal(p, bx, by, ang, len, w, t, seed, col, edge, k) {
  const c = Math.cos(ang), s = Math.sin(ang), left = [], right = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8, wob = 1 + 0.25 * Math.sin(t * 11 + seed * 5 + u * 6) + 0.12 * Math.sin(t * 23 + seed + u * 11);
    const half = w * Math.sin(Math.PI * Math.pow(u, 0.75)) * 0.5 * wob, bend = 2.2 * Math.sin(t * 6 + seed * 3) * u * u;
    left.push([u * len, -half + bend]); right.push([u * len, half + bend]);
  }
  const tl = len * (1.08 + 0.12 * Math.sin(t * 17 + seed * 7)), tb = 2 * Math.sin(t * 9 + seed * 2);
  const pts = [...left, [tl, tb], ...right.reverse()].map(([a, b]) => [bx + a * c - b * s, by + a * s + b * c]);
  if (col) p.poly(pts, col, k);
  p.polyline([...pts, pts[0]], edge, k);
  p.line(bx + c * len * 0.1, by + s * len * 0.1, bx + c * len * 0.6, by + s * len * 0.6, L[3], k);
}
function lotusShape(p, t, layer, cx, cy, size, white, k, petalCol) {
  const sway = 0.12 * Math.sin(t * 3.1) + 0.05 * Math.sin(t * 8.3), crush = white;
  const ring = (R, ri) => {
    for (let j = 0; j < R.n; j++) {
      const f = j / (R.n - 1) - 0.5, ang = -Math.PI / 2 + sway + f * 2 * R.spread * (1 - 0.6 * crush);
      flamePetal(p, cx + f * 6 * size, cy + 6 * size, ang, R.len * size, R.w * size, t, ri * 10 + j, petalCol ?? (crush > 0.6 ? L[6] : L[ri === 0 ? 4 : 5]), crush > 0.6 ? L[4] : L[ri === 0 ? 2 : 3], k);
    }
  };
  if (layer === 'back') { ring(RINGS[0], 0); return; }
  ring(RINGS[1], 1); ring(RINGS[2], 2);
  for (let i = -3; i <= 3; i++) flamePetal(p, cx + i * 3 * size, cy + 7 * size, Math.PI / 2 + i * 0.35 + sway, 6 * size, 4 * size, t, 40 + i, petalCol ?? L[4], L[2], k);
}
function liveLotus(p, t, layer) {
  if (t < APPEAR - 0.05 || t > BOOM + 0.02) return;
  const born = out3(clamp((t - APPEAR + 0.05) / 0.25)), crush = sm(clamp((t - LOCK) / (BOOM - LOCK))), stare = smooth(OPENS[2], LOCK, t);
  const breathe = 1 + (0.08 + 0.08 * stare) * Math.sin(t * (7 + 6 * stare)) + 0.04 * Math.sin(t * 17);
  const size = born * breathe * (1 - 0.7 * crush) * (1 + 0.1 * Math.sin(t * 40) * crush);
  lotusShape(p, t, layer, LC[0], LC[1], size, crush, 1);
  if (layer !== 'front') return;
  p.disc(LC[0], LC[1] + 3 * size, 2.5 * size, crush > 0.6 ? L[6] : L[3], 1);
  if (crush > 0.3) p.glow(LC[0], LC[1], 8 + 20 * crush, L[6], 0.3 * crush);
  for (let i = 0; i < 8; i++) {
    const s = (t * 1.3 + hsh(i, 6)) % 1, a = -Math.PI / 2 + (hsh(i, 7) - 0.5) * 2.2;
    p.dot(LC[0] + Math.cos(a) * (10 + 16 * s) * size, LC[1] + Math.sin(a) * (10 + 16 * s) * size, L[5 - (i % 3)], 1 - s);
  }
}

// the ghost lotus burning inside the dust cone (drawn after the blast so it shows through the dust)
function ghost(p, t) {
  const g = smooth(GHOST[0], GHOST[0] + 0.3, t) * (1 - smooth(GHOST[1] - 0.4, GHOST[1], t));
  if (g <= 0.05) return;
  if (g > 0.3 && Math.sin(t * 23) > -0.8) {
    lotusShape(p, t, 'back', TX, -62, 2.1, 0, 1, L[1]);
    lotusShape(p, t, 'front', TX, -62, 2.1, 0, 1, L[2]);
  }
  p.glow(TX, -60, 40, L[5], 0.25 * g);
}
export function lotus(p, t, layer) { liveLotus(p, t, layer); if (layer === 'front') ghost(p, t); }
