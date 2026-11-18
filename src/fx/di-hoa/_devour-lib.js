// Devouring white-hole library (Opus, aesthetic design 18/11, after the user found the vortex crude).
// The hole is seen slightly from above, so it has DEPTH:
//   accretion(..., 'back')  — the far half of a tilted disk of ivory fire (above the core), drawn first;
//   core()                  — white core, 1–2 px dark event ring, a thin photon ring, and the disk's far side LENSED
//                              into a bright arc over the top of the core;
//   accretion(..., 'front') — the near half of the disk passing in front of the core.
// The disk turns (bands stream round it, the approaching left side brighter), its outer rim is ragged fire.
// ribbon(): something being devoured, stretched into a spiral ribbon that winds onto the disk (spaghettified).
// Solid tiers, stateless.
import { clamp, hex, TAU } from '../../core/index.js';
import { L, DUST, CLOUD } from './_tinhlien-common.js';

const h1 = (x) => { const s = Math.sin(x * 91.7 + 13.1) * 43758.5453; return s - Math.floor(s); };
const DISK = [DUST[2], DUST[4], hex('#d9d0bd'), L[4], L[5], L[6]];
export const TILT = 0.3;   // disk thickness on screen (ry / rx)

/** half of the tilted disk. R core radius, k presence (0..1), flat (0..1: the disk squashes to a line at the end). */
export function accretion(p, cx, cy, R, t, k, half, flat = 0) {
  if (k <= 0 || R < 1) return;
  const Ri = R * 1.3, Ro = R * (1.5 + 1.7 * k), ty = TILT * (1 - 0.92 * flat);
  const H = Ro * ty + 6;
  p.shade(cx - Ro - 6, cy - H, cx + Ro + 6, cy + H, (x, y, out) => {
    const dx = x - cx, dy = y - cy;
    if (half === 'back' ? dy > 0 : dy <= 0) return;
    const ey = dy / ty, rr = Math.hypot(dx, ey);
    const a = Math.atan2(ey, dx), ragged = 3 * h1(Math.floor(((a / TAU) + 1) * 40) * 1.7 + Math.floor(t * 18) * 3.1);
    if (rr < Ri || rr > Ro + ragged) return;
    const f = (rr - Ri) / (Ro - Ri);                                   // 0 inner .. 1 outer
    const band = Math.sin(a * 5 - t * 13 + rr * 0.32) * 0.5 + Math.sin(a * 11 + t * 7 - rr * 0.6) * 0.3;
    const doppler = -Math.cos(a) * 0.9;                                // left side comes toward us: brighter
    if (band < -0.35 && f > 0.25 && rr <= Ro) return;                  // dark gaps between streams: it reads as swirling fire
    let v = 4.6 - f * 3.6 + band + doppler * (1 - f);
    if (rr > Ro) v = 3.2;                                               // the ragged fire rim
    if (half === 'back') v -= 0.6;                                      // far half a touch dimmer
    out.c = DISK[clamp(Math.round(v), 0, 5)]; out.a = 1;
    if (v > 4.5) { out.l = L[5]; out.k = 0.08; }
  });
}

/** core + event ring + photon ring + the lensed arc of the disk's far side over the top of the core */
export function core(p, cx, cy, R, t, k = 1) {
  if (R < 0.6) return;
  const RL = R * 1.55;
  p.shade(cx - RL - 3, cy - RL - 3, cx + RL + 3, cy + R + 4, (x, y, out) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d < R) { out.c = d < R * 0.55 ? L[6] : d < R * 0.82 ? L[5] : L[4]; out.a = 1; out.l = L[6]; out.k = 0.15 * k; return; }
    if (d < R + 1.4) { out.c = CLOUD[0]; out.a = 1; return; }
    if (d < R + 2.4) { out.c = L[6]; out.a = 1; return; }                                  // photon ring
    // lensed far side of the disk: a bright band hugging the top of the core, thinning toward its ends
    if (dy < 0) {
      const a = Math.atan2(-dy, Math.abs(dx)) / (Math.PI / 2);   // 0 at the sides .. 1 at the top
      const w = 1.5 + 4 * a, d0 = R + 3.5;
      if (d > d0 && d < d0 + w) {
        const band = Math.sin(Math.atan2(dy, dx) * 9 - t * 13);
        out.c = (d - d0) / w < 0.4 ? L[6] : band > 0 ? L[5] : L[4]; out.a = 1;
      }
    }
  });
}

/**
 * A ribbon of matter being devoured: from (sx,sy) it winds `turns` rad round (cx,cy) onto the disk.
 * u (0..1): how far it has been drawn in (its head reaches the core at 1; its tail follows); w: start half-width;
 * cols: [dark, mid, light] colours of the thing being eaten.
 */
export function ribbon(p, cx, cy, sx, sy, u, w, turns, cols, t, seed = 0) {
  if (u <= 0) return;
  const r0 = Math.hypot(sx - cx, sy - cy), a0 = Math.atan2(sy - cy, sx - cx);   // screen space; flattens onto the disk as it nears
  const head = clamp(u * 1.25), tail = clamp(u * 1.25 - 0.45);
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const s = tail + (head - tail) * (i / n);
    const r = r0 * (1 - s) ** 1.6, a = a0 + turns * s * s;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * (TILT + (1 - TILT) * (1 - s) ** 2);
    const ww = Math.max(0.6, w * (1 - s) * (0.8 + 0.2 * Math.sin(t * 20 + i + seed)));
    p.disc(x, y, ww, cols[0], 1);
    if (ww > 1.2) p.disc(x, y - ww * 0.3, ww * 0.55, cols[1], 1);
    if (ww > 2) p.dot(x, y - ww * 0.6, cols[2]);
  }
}
