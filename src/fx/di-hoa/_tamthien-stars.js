// Tam Thien part: the STARS ricocheting inside the sphere (STARS..END): simulated paths, speed-up to the climax, trails,
// bounce flashes and cracks on the shell, the white flare at CLIMAX, the slow dying. Port of the draft; Codex details it.
import { smooth, clamp, TAU } from '../../core/index.js';
import { C, TX, END, IGNITE, RAIN, ORB, STARS, FADE, CLIMAX, R, SC, SKY, XC, sm, out3, hsh, orbState } from './_tamthien-common.js';

const M = 100, DT = 1 / 240, SIM = 3.2, RS = R - 4;
const PATHS = Array.from({ length: M }, (_, i) => {
  const a = hsh(i, 4) * TAU, r = RS * Math.sqrt(hsh(i, 5)) * 0.8;
  let x = Math.cos(a) * r, y = Math.sin(a) * r;
  const sp = 200 + 150 * hsh(i, 6), b = hsh(i, 7) * TAU;
  let vx = Math.cos(b) * sp, vy = Math.sin(b) * sp;
  const pts = [], bounces = [];
  for (let s = 0; s * DT < SIM; s++) {
    x += vx * DT; y += vy * DT;
    const d = Math.hypot(x, y);
    if (d > RS) {   // reflect off the wall, a little scatter
      const nx = x / d, ny = y / d, dot = vx * nx + vy * ny;
      vx -= 2 * dot * nx; vy -= 2 * dot * ny;
      const j = (hsh(i * 31 + s, 8) - 0.5) * 0.5, c = Math.cos(j), sn = Math.sin(j);
      [vx, vy] = [vx * c - vy * sn, vx * sn + vy * c];
      x = nx * RS; y = ny * RS; bounces.push({ s, a: Math.atan2(ny, nx) });
    }
    pts.push(x, y);
  }
  return { pts, bounces, big: i % 4 === 0, born: STARS + 0.006 * i, dies: FADE + 0.15 + 0.9 * hsh(i, 9) };
});
const KACC = 1.6 / (FADE - STARS), ramp = (d) => d + 0.5 * KACC * d * d;   // the stars speed up to the climax
const clock = (t) => t < FADE ? ramp(t - STARS) : ramp(FADE - STARS) + 2.6 * (1 - Math.exp(-2.2 * (t - FADE))) / 2.2;   // then slow
const at = (P, τ) => { const s = Math.max(0, Math.min(P.pts.length / 2 - 1, Math.floor(τ / DT))); return [P.pts[s * 2], P.pts[s * 2 + 1]]; };
export function stars(p, t, layer) {
  if (layer !== 'front' || t < STARS || t > END - 0.05) return;
  const { squeeze, Rr } = orbState(t);
  const flare = Math.exp(-(((t - CLIMAX) / 0.06) ** 2));
  for (const P of PATHS) {
    if (t < P.born || t > P.dies) continue;
    const τ = clock(t) - ramp(P.born - STARS) * 0.5, k = 1 - smooth(P.dies - 0.2, P.dies, t);
    if (τ < 0) continue;
    const TL = P.big ? 16 : 10;
    for (let j = TL; j >= 1; j--) { const [x, y] = at(P, τ - j * 0.006); p.dot(SC[0] + x * squeeze, SC[1] + y * squeeze, j > TL * 0.66 ? C[2] : j > TL * 0.33 ? C[3] : C[4], k); }
    const [x, y] = at(P, τ), X = SC[0] + x * squeeze, Y = SC[1] + y * squeeze;
    p.dot(X, Y, C[6], k);
    if (P.big || flare > 0.3) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.dot(X + ox, Y + oy, flare > 0.3 ? C[6] : C[5], k);
    if (P.big) for (const [ox, oy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) p.dot(X + ox, Y + oy, C[4], k * (0.6 + 0.4 * Math.sin(t * 30 + P.born * 50)));
    for (let bi = P.bounces.length - 1; bi >= 0; bi--) {
      const b = P.bounces[bi], age = τ - b.s * DT;
      if (age < 0) continue;
      if (age > 0.25) break;
      const f = 1 - age / 0.25;
      if (age < 0.1) for (let j = -3; j <= 3; j++) { const a2 = b.a + j * 0.04; p.dot(SC[0] + Math.cos(a2) * Rr, SC[1] + Math.sin(a2) * Rr, C[6], (1 - age / 0.1) * k); }
      if (P.big) {   // a crack on the shell, branching inward
        const cx = SC[0] + Math.cos(b.a) * Rr, cy = SC[1] + Math.sin(b.a) * Rr, l = 6 + 4 * hsh(b.s, 3);
        p.line(cx, cy, cx - Math.cos(b.a + 0.4) * l, cy - Math.sin(b.a + 0.4) * l, C[5], f * k);
        p.line(cx, cy, cx - Math.cos(b.a - 0.5) * l * 0.7, cy - Math.sin(b.a - 0.5) * l * 0.7, C[4], f * k);
      }
    }
  }
}
