// Tam Thien part: the rain of black fire and its splashes/pools (RAIN..ORB+0.4). Port of the draft; Codex details it.
import { smooth, clamp, TAU } from '../../core/index.js';
import { C, TX, END, IGNITE, RAIN, ORB, STARS, FADE, CLIMAX, R, SC, SKY, XC, sm, out3, hsh, orbState } from './_tamthien-common.js';

const N = 90;
const DROPS = Array.from({ length: N }, (_, i) => {
  const tf = RAIN + (ORB - RAIN - 0.3) * Math.sqrt((i + hsh(i, 1)) / N), focus = (tf - RAIN) / (ORB - RAIN);
  const x1 = TX + (hsh(i, 2) - 0.5) * 230 * (1 - focus * 0.88), hitsTarget = Math.abs(x1 - TX) < 10;
  return { i, tf, x0: x1 + 26, x1, y1: hitsTarget ? -14 - 44 * hsh(i, 3) : -1, hitsTarget };
});
const FALL = 0.32;
function rainDrops(p, t) {
  if (t > ORB + 0.05) return;
  for (const d of DROPS) {
    const u = (t - d.tf) / FALL;
    if (u < 0 || u > 1) continue;
    const yTop = SKY + 60, x = d.x0 + (d.x1 - d.x0) * u, y = yTop + (d.y1 - yTop) * u * u, v = Math.max(0, u - 0.25);
    const xa = d.x0 + (d.x1 - d.x0) * v, ya = yTop + (d.y1 - yTop) * v * v;
    for (const o of [-2, 2]) p.line(xa + o * 0.4, ya, x + o * 0.8, y, C[3], 0.9);
    p.line(xa - 1, ya, x - 1, y, C[4], 0.9); p.line(xa, ya, x, y, C[0], 1); p.line(xa + 1, ya, x + 1, y, C[1], 1);
    p.disc(x, y, 2.4, C[4], 1); p.disc(x, y, 1.4, C[0], 1); p.dot(x, y - 2, C[5], 1);
  }
}
function splashes(p, t) {
  if (t > ORB + 0.4) return;
  const pull = sm(clamp((t - ORB) / 0.35));   // pools are sucked into the sphere
  for (const d of DROPS) {
    const τ = t - d.tf - FALL;
    if (τ < 0) continue;
    if (τ < 0.12) for (let j = 0; j < 4; j++) {
      const a = -Math.PI * (0.1 + 0.8 * j / 3) + (d.hitsTarget ? (j - 1.5) * 0.3 : 0), r = 3 + 9 * τ / 0.12;
      p.line(d.x1, d.y1, d.x1 + Math.cos(a) * r, d.y1 + Math.sin(a) * r * 0.8, C[4], 1 - τ / 0.12);
    }
    if (!d.hitsTarget && pull < 1) {   // a small pool of black fire where it landed
      const x = d.x1 + (SC[0] - d.x1) * pull, y = -1 + (SC[1] + 1) * pull, h = (3 + 2 * Math.sin(t * 14 + d.i)) * (1 - pull);
      p.poly([[x - 2, y], [x + 2, y], [x, y - h]], C[3], 1);
      p.dot(x, y - 1, C[0], 1);
    }
  }
}

export function rain(p, t, layer) { if (layer === 'front') { rainDrops(p, t); splashes(p, t); } }
