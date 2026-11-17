// Tinh Lien part: the BLAST (BOOM..END) — white flash, ground shockwave, low dust surge, the towering dust cone,
// flying earth, the scorched crater. Port of the draft.
import { smooth, clamp, TAU } from '../../core/index.js';
import { L, LID, IRIS, PUPIL, VEIN, DUST, CLOUD, TX, END, GATHER, APPEAR, OPENS, LEVEL, LOCK, BOOM, SHUT, GHOST, LC, EC, EW, EH, IR, sm, out3, hsh, openAt, eyeK, lockAt, pupilW, pulses, grid } from './_tinhlien-common.js';

const ROCKS = Array.from({ length: 34 }, (_, i) => ({ vx: (hsh(i, 8) - 0.5) * 300, vy: -90 - 260 * hsh(i, 9), s: 1 + Math.floor(hsh(i, 10) * 3), c: Math.floor(hsh(i, 11) * 3) }));
const SURGE = Array.from({ length: 30 }, (_, i) => ({ vx: (i % 2 ? 1 : -1) * (60 + 200 * hsh(i, 1)), r0: 3 + 3 * hsh(i, 3), r1: 8 + 10 * hsh(i, 4), life: 1.4 + 0.8 * hsh(i, 5), c: 1 + Math.floor(hsh(i, 6) * 3) }));
function coneDust(p, t) {
  const a = t - BOOM;
  if (a < 0.02 || a > END - BOOM) return;
  const rise = out3(clamp(a / 0.6)), H = 25 + 115 * rise;                         // height of the cone
  const slump = smooth(1.5, 2.6, a), thin = smooth(1.8, 2.9, a);                    // it sags, spreads, thins
  const Htop = H * (1 - 0.45 * slump), drift = 30 * slump, y0 = Math.floor(-Htop - 22);
  const W = new Float32Array(-y0 + 2);   // half width of the cone per row
  for (let i = 0; i < W.length; i++) { const h = -(y0 + i); W[i] = 8 + h * (0.62 + 0.5 * slump) + Math.sin(h * 0.09 - a * 2.2) * 6 + Math.sin(h * 0.21 + a * 3.1) * 3 + 22 * (1 - Math.min(1, Math.max(0, h) / 12)) * slump; }
  const wMax = Math.min(180, Math.max(...W) * 1.15 + drift);
  const N = grid(TX - wMax, y0, TX + wMax, 0, 3, (x, y) => {   // billows rolling upward inside the cone
    const h = -y, dx = x - TX - drift * h / Htop;
    return 0.5 + 0.32 * Math.sin(dx * 0.12 + Math.sin(h * 0.05) * 2 - a * 0.6) * Math.sin(h * 0.14 - a * 2.6) + 0.18 * Math.sin(dx * 0.27 - a) * Math.sin(h * 0.31 + a * 1.3);
  });
  p.shade(TX - wMax, y0, TX + wMax, 0, (x, y, o) => {
    const h = -y, v = h / Htop, w = W[Math.max(0, Math.min(W.length - 1, Math.round(y - y0)))], dx = x - TX - drift * v, e = Math.abs(dx) / w;
    if (e > 1.15 || v > 1.12) return;
    const n = N(x, y), edge = 1 - smooth(0.7, 1.1, e + (n - 0.5) * 0.3), top = 1 - smooth(0.85, 1.1, v + (n - 0.5) * 0.25);
    const dens = edge * top * (0.75 + 0.5 * n) - thin * (1.6 - 0.4 * (1 - v));
    if (dens <= 0.2) return;   // a hard, ragged edge instead of a stippled one
    const shade = e * 0.6 + n * 0.8 - v * 0.2 - 0.15 * dx / w;   // lit from the upper left, darker core
    o.c = DUST[Math.max(0, Math.min(4, Math.round(shade * 3.2)))];
  });
}
export function blast(p, t, layer) {
  const a = t - BOOM;
  if (a < 0) return;
  if (layer === 'back') {   // a scorched crater, cooling
    const k = 1 - smooth(2.2, 2.9, a), hot = 1 - smooth(0.2, 1.6, a);
    p.shade(TX - 32, -3, TX + 32, 1, (x, y, o) => { const e = ((x - TX) / 32) ** 2 + ((y + 1) / 2.5) ** 2; if (e < 1) { o.c = e < 0.3 && hot > 0.3 ? L[2] : DUST[0]; o.a = k; } });
    return;
  }
  if (a < 0.25) {   // white flash + flat shockwave along the ground
    const f = 1 - a / 0.25;
    p.glow(LC[0], LC[1], 44, L[6], 0.35 * f);
    p.disc(LC[0], LC[1], 16 * f, L[6], 1);
    const r = 20 + 240 * out3(a / 0.25), pts = [];
    for (let i = 0; i <= 48; i++) { const q = (i / 48) * TAU; pts.push([TX + Math.cos(q) * r, -2 + Math.sin(q) * r * 0.12]); }
    p.polyline(pts, L[5], f);
  }
  for (let i = 0; i < SURGE.length; i++) {   // a low surge of dust rolling out along the ground
    const P = SURGE[i], b = a - 0.05;
    if (b < 0 || b > P.life) continue;
    const drag = (1 - Math.exp(-2.4 * b)) / 2.4, x = TX + P.vx * drag, f = b / P.life;
    const r = (P.r0 + (P.r1 - P.r0) * out3(Math.min(1, b / 0.6))) * (1 - smooth(0.5, 1, f));
    p.disc(x, -r * 0.6, r, DUST[P.c], 1);
  }
  coneDust(p, t);
  for (const R of ROCKS) {   // flying earth on parabolas, landing and lying still
    const tl = (2 * -R.vy) / 520, b = Math.min(a, tl), x = TX + R.vx * b, y = Math.min(0, -4 + R.vy * b + 260 * b * b);
    if (a > 2.2 + 0.5 * (R.c + R.s) / 5) continue;
    p.disc(x, y - R.s * 0.5, R.s * 0.7, DUST[R.c], 1);
    if (a < tl) p.dot(x - R.vx * 0.01, y - (R.vy + 520 * b) * 0.01, DUST[R.c + 1], 1);
  }
}

