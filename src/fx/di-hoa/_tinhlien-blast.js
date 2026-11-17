// BOOM..END: opaque stepped earth, a scalloped V plume and ballistic rubble.
import { smooth, clamp, TAU, hex } from '../../core/index.js';
import { L, DUST, TX, END, BOOM, GHOST, LC, out3, hsh, grid } from './_tinhlien-common.js';

const WARM = ['#392a20', '#60462b', '#92703a', '#bc9653', '#d8bb7c'].map(hex);
const EMBER = ['#572b23', '#883c28', '#b75b2e'].map(hex);
const ROCKS = Array.from({ length: 34 }, (_, i) => {
  const vy = -90 - 260 * hsh(i, 9), land = (-vy + Math.sqrt(vy * vy + 4160)) / 520;
  return { vx: (hsh(i, 8) - 0.5) * 180, vy, land, bounce: 0.15 + 0.12 * hsh(i, 12), s: 1.4 + Math.floor(hsh(i, 10) * 3), c: Math.floor(hsh(i, 11) * 3), spin: (hsh(i, 13) - 0.5) * 12 };
});
const SURGE = Array.from({ length: 20 }, (_, i) => ({ vx: (i % 2 ? 1 : -1) * (60 + 200 * hsh(i, 1)), r0: 3 + 3 * hsh(i, 3), r1: 8 + 10 * hsh(i, 4), life: 1.4 + 0.8 * hsh(i, 5), c: 1 + Math.floor(hsh(i, 6) * 3) }));
const FALLOUT = Array.from({ length: 32 }, (_, i) => ({ x: (hsh(i, 21) - 0.5) * 170, y: 22 + 106 * hsh(i, 22), speed: 9 + 13 * hsh(i, 23), end: 2.3 + 0.75 * hsh(i, 24) }));
const RAYS = Array.from({ length: 9 }, (_, i) => { const q = i * TAU / 9; return [Math.cos(q), Math.sin(q), 28 + 18 * hsh(i, 30)]; });
const SHAPE = [[-1, -0.35], [-0.25, -1], [0.8, -0.65], [1, 0.4], [-0.5, 0.8]];

function coneDust(p, t) {
  const a = t - BOOM;
  if (a < 0.02 || a >= 3.02) return;
  const rise = out3(clamp(a / 0.6)), slump = smooth(1.5, 2.9, a), thin = smooth(1.85, 3.02, a);
  const H = (25 + 115 * rise) * (1 - 0.57 * slump), drift = 23 * slump;
  const y0 = Math.floor(-H - 3), rows = -y0 + 2;
  // All height-dependent work is done once per row; the field stays coarse.
  const invW = new Float32Array(rows), center = new Float32Array(rows), height = new Float32Array(rows);
  let wMax = 0;
  for (let i = 0; i < rows; i++) {
    const h = -(y0 + i), v = h / H;
    const w = 8 + h * (0.62 + 0.45 * slump) + Math.sin(h * 0.09 - a * 2.2) * 4 + 18 * (1 - Math.min(1, Math.max(0, h) / 12)) * slump;
    invW[i] = 1 / Math.max(4, w); center[i] = TX + drift * v; height[i] = v;
    wMax = Math.max(wMax, w + drift);
  }
  const x0 = Math.max(-59, Math.floor(TX - wMax - 6)), x1 = Math.min(298, Math.ceil(TX + wMax + 6));
  // A semicircular crown profile gives distinct cauliflower lobes without extra disc passes.
  const tops = new Float32Array(x1 - x0 + 2), capX = new Float32Array(tops.length);
  const crownW = 8 + H * (0.62 + 0.45 * slump), radius = crownW / 6;
  for (let i = 0; i < tops.length; i++) {
    const dx = x0 + i - TX - drift, cell = Math.round(dx / (radius * 1.65));
    const r = radius * (0.65 + 0.7 * hsh(cell + 40, 3)), lift = (hsh(cell + 40, 5) - 0.5) * radius * 1.1 + 1.5 * Math.sin(a * 2.3 + cell * 1.7);   // uneven lobes
    const u = (dx - cell * radius * 1.65 - (hsh(cell + 40, 7) - 0.5) * radius * 0.5) / r;
    tops[i] = H - radius + lift + r * Math.sqrt(Math.max(0, 1 - u * u)); capX[i] = Math.max(-1, Math.min(1, u));
  }
  const N = grid(x0, y0, x1, 0, 4, (x, y) => {
    const h = -y, dx = x - TX - drift * h / H;
    return 0.5 + 0.34 * Math.sin(dx * 0.12 + Math.sin(h * 0.05) * 2 - a * 0.6) * Math.sin(h * 0.14 - a * 2.6) + 0.16 * Math.sin(dx * 0.27 - a) * Math.sin(h * 0.31 + a * 1.3);
  });
  const warm = smooth(GHOST[0] - 0.1, GHOST[0] + 0.2, t) * (1 - smooth(GHOST[1] - 0.15, GHOST[1] + 0.12, t));
  p.shade(x0, y0, x1, 0, (x, y, o) => {
    const row = Math.max(0, Math.min(rows - 1, Math.round(y - y0))), v = height[row];
    const dx = x - center[row], e = Math.abs(dx) * invW[row];
    if (e > 1.25) return;
    const n = N(x, y);
    if (e > 0.88 + n * 0.3) return;   // ragged sides
    const col = Math.max(0, Math.min(tops.length - 1, Math.floor(x - x0))), top = tops[col] + y;
    if (top < 0) return;
    const density = (1 - e * e * 0.4) * (0.65 + n * 0.6) - thin * 1.28;
    if (density < 0.23) return;
    let shade = 0.65 + n * 2.6 + e * 0.65 - dx * invW[row] * 0.55;
    if (top < radius * 1.5) shade += (1 - top / (radius * 1.5)) * (0.9 - capX[col] * 0.55);
    const band = Math.max(0, Math.min(4, Math.floor(shade)));
    o.c = warm > 0.25 && e < 0.65 && n + warm * 0.4 > 0.65 ? WARM[band] : DUST[band];
  });
  // Thin, vertical ejecta streaks exist only during the initial rise.
  if (a < 0.6) for (let i = 0; i < 11; i++) {
    const h = H * (0.25 + 0.58 * hsh(i, 41)), x = TX + (hsh(i, 42) - 0.5) * h * 0.65;
    p.line(x, -h, x + (x - TX) * 0.04, -h + 5 + 9 * (1 - a / 0.6), DUST[0]);
  }
}

export function blast(p, t, layer) {
  const a = t - BOOM;
  if (a < 0 || t >= END) return;
  if (layer === 'back') {
    const k = 1 - smooth(2.25, 3.08, a), hot = 1 - smooth(0.2, 1.8, a);
    if (k <= 0) return;
    const rx = 34 * k, ry = 3.5 * k;
    p.shade(TX - rx, -5, TX + rx, 2, (x, y, o) => {
      const e = ((x - TX) / rx) ** 2 + ((y + 1) / ry) ** 2;
      if (e > 1) return;
      o.c = e > 0.65 ? (y < -1 ? DUST[3] : DUST[1]) : e < 0.27 && hot > 0.05 ? EMBER[Math.min(2, Math.floor(hot * 3))] : DUST[0];
    });
    return;
  }
  // Ground veil shrinks in height and width instead of fading through dither.
  if (a > 0.12 && a < 3.05) {
    const k = 1 - smooth(1.7, 3.05, a), r = (35 + 85 * out3(clamp(a))) * k;
    p.shade(TX - r, -6 * k, TX + r, 1, (x, y, o) => {
      if (Math.abs(x - TX) < 29 * k && y > -4 * k) return;
      if (((x - TX) / r) ** 2 + ((y + 1) / (4 * k + 0.1)) ** 2 < 1) o.c = y < -2 ? DUST[2] : DUST[1];
    });
  }
  if (a < 0.25) {
    const f = 1 - a / 0.25;
    p.glow(LC[0], LC[1], 44, L[6], 0.35 * f);
    p.disc(LC[0], LC[1], 16 * f, L[6], 1);
    for (let ring = 0; ring < 2; ring++) {
      const r = 14 + (ring ? 108 : 132) * out3(clamp(a / 0.25)), pts = [];
      for (let i = 0; i <= 40; i++) { const q = i * TAU / 40; pts.push([TX + Math.cos(q) * r, -2 + Math.sin(q) * r * 0.1]); }
      p.polyline(pts, ring ? L[3] : L[5]);
      if (!ring && a < 0.15) p.polyline(pts.map(([x, y]) => [x, y - 1]), L[4]);
    }
  }
  for (const P of SURGE) {
    const b = a - 0.05;
    if (b < 0 || b > P.life) continue;
    const x = TX + P.vx * (1 - Math.exp(-2.4 * b)) / 2.4, f = b / P.life;
    const r = (P.r0 + (P.r1 - P.r0) * out3(Math.min(1, b / 0.6))) * (1 - smooth(0.5, 1, f));
    if (r < 0.5) continue;
    // Two solid lobes, with a raised upper-left lip.
    p.shade(x - r, -r * 1.2, x + r, 0, (xx, yy, o) => {
      const dx = (xx - x) / r, dy = (yy + r * 0.45) / (r * 0.65);
      if (dx * dx + dy * dy > 1) return;
      o.c = dy < -0.25 && dx < 0.4 ? DUST[Math.min(4, P.c + 1)] : DUST[P.c];
    });
  }
  coneDust(p, t);
  // Keep the two-to-three-frame flash rays in front of the rising earth.
    if (a < 0.095) for (const [dx, dy, len] of RAYS) {
      const r = len * (0.75 + a * 3);
      p.poly([[TX + dx * 10 - dy * 2, LC[1] + dy * 10 + dx * 2], [TX + dx * r, LC[1] + dy * r], [TX + dx * 10 + dy * 2, LC[1] + dy * 10 - dx * 2]], L[5]);
    }
  if (a < 0.095) p.disc(LC[0], LC[1], 12 * (1 - a / 0.095), L[6], 1);
  for (const R of ROCKS) {
    if (a > 2.3 + 0.65 * R.c / 3) continue;
    const b = Math.min(a, R.land), after = Math.max(0, a - R.land), hop = Math.min(after, R.bounce);
    const x = TX + R.vx * (b + hop * 0.25), y = a < R.land ? -4 + R.vy * b + 260 * b * b : -260 * hop * (R.bounce - hop);
    const angle = R.spin * (b + hop), cs = Math.cos(angle), sn = Math.sin(angle);
    const pts = SHAPE.map(([u, v]) => [x + (u * cs - v * sn) * R.s, y - R.s + (u * sn + v * cs) * R.s]);
    if (R.s > 3 && a < R.land) {
      const vy = R.vy + 520 * b;
      p.line(x - R.vx * 0.055, y - R.s - vy * 0.055, x - R.vx * 0.015, y - R.s - vy * 0.015, DUST[2]);
    }
    p.poly(pts, DUST[R.c]);
    p.poly([pts[0], pts[1], pts[2], [x, y - R.s]], DUST[R.c + 1]);
  }
  if (a > 1.6) for (const P of FALLOUT) {
    if (a >= P.end) continue;
    const b = a - 1.6, y = -P.y + b * P.speed;
    if (y < -3) p.dot(TX + P.x + b * 8, y, DUST[2]);
  }
}
