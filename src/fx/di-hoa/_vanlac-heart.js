// Van Lac Tam Viem: the fire grows inside the target in three heartbeats.
import { smooth, clamp, TAU, mix } from '../../core/index.js';
import { C, RIM, ASH, TX, IN, BEATS, BURN, CHEST } from './_vanlac-common.js';

const hash = (i) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
// Anatomical routes, relative to TX: neck/head, hips/feet, shoulders/arms.
const ROUTES = [
  [[1, -30], [-2, -37], [1, -44], [-1, -51], [1, -58]],
  [[1, -30], [-3, -23], [-2, -17], [-6, -10], [-6, -2]],
  [[1, -30], [4, -24], [3, -17], [6, -10], [7, -2]],
  [[1, -30], [-4, -34], [-8, -36], [-14, -35], [-20, -36]],
  [[1, -30], [5, -35], [9, -36], [14, -37], [20, -36]],
  [[1, -30], [-3, -34], [-5, -41], [-7, -46]],
  [[1, -30], [5, -32], [7, -39], [6, -46]],
];

export function heart(p, t, layer) {
  if (layer !== 'front' || t < IN || t >= BURN + 0.3) return;
  const [cx, cy] = CHEST, fade = 1 - smooth(BURN, BURN + 0.3, t);
  const enter = smooth(IN, IN + 0.08, t);
  let level = 0, pulse = 0, reach = 3;
  for (let i = 0; i < BEATS.length; i++) {
    const dt = t - BEATS[i];
    if (dt < 0) continue;
    level = i + 1;
    // A fast 18 ms expansion followed by a long, quiet contraction.
    pulse = Math.max(pulse, (0.55 + i * 0.225) * smooth(0, 0.018, dt) * Math.exp(-dt * 7));
    const previous = [3, 10, 24][i], next = [10, 24, 38][i];
    reach = previous + (next - previous) * smooth(0, 0.09, dt);
  }
  const strength = enter * fade, count = [0, 4, 8, 14][level];
  const tongues = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    // Interleave the new tongues instead of moving the old ones each beat.
    const y = -8 - ((i * 17 + 9) % 43);
    const arm = i === 6 || i === 7;
    const x = TX + side * (arm ? 19 : 8);
    const flicker = 1 + 0.12 * Math.sin(t * 23 + hash(i) * TAU);
    const h = [0, 6, 10, 14][level] * flicker * (0.94 + 0.06 * pulse) * fade;
    tongues.push({ x, y: arm ? -36 : y, h, side, bend: Math.sin(t * 15 + i * 2) * 1.8 });
  }
  const ripples = BEATS.map((b) => (t - b) / 0.2).filter((u) => u >= 0 && u < 1);
  // One glass pass: empty interiors only brighten the scene underneath.
  p.shade(TX - 32, -75, TX + 33, 2, (x, y, o) => {
    let light = 0;
    for (const q of tongues) {
      const u = (q.y - y) / q.h;
      if (!(u >= 0 && u <= 1)) continue;
      const center = q.x + q.side * (4 * u - Math.sin(u * Math.PI) * 1.8) + q.bend * u * u;
      const width = (1 - u) * (2 + 2 * Math.sin(u * Math.PI));
      const d = Math.abs(x - center);
      if (d > width) continue;
      if (width - d < 0.75 || u > 0.88) {
        o.c = u > 0.82 ? C[4] : RIM; o.a = (0.85 + 0.15 * pulse) * strength; return;
      }
      light = Math.max(light, (0.12 + 0.1 * pulse) * strength);
    }
    const r = ripples.length ? Math.hypot(x - cx, y - cy) : 0;
    for (const u of ripples) {
      const radius = 6 + 24 * u;
      if (Math.abs(r - radius) < 0.6) {
        o.c = RIM; o.a = (1 - smooth(0.7, 1, u)) * strength; return;
      }
      if (r < radius && r > radius - 2.5) light = Math.max(light, 0.16 * (1 - u) * strength);
    }
    if (light > 0) { o.l = RIM; o.k = light; }
  });

  const veinColor = mix(C[2], C[4], clamp(pulse * 1.2));
  for (let i = 0; i < ROUTES.length; i++) {
    const path = ROUTES[i];
    let walked = 0;
    for (let j = 1; j < path.length; j++) {
      const [ax, ay] = path[j - 1], [bx, by] = path[j];
      const length = Math.hypot(bx - ax, by - ay), u = clamp((reach - walked) / length);
      if (u <= 0) break;
      const ex = ax + (bx - ax) * u, ey = ay + (by - ay) * u;
      p.line(TX + ax, ay, TX + ex, ey, veinColor, strength);
      // Fixed hashed forks stay within the body; branches grow behind the front.
      const seed = i * 11 + j, branch = clamp((reach - walked - length * 0.55) / 4);
      if (branch > 0) {
        const mx = ax + (bx - ax) * 0.55, my = ay + (by - ay) * 0.55;
        const sign = hash(seed) < 0.5 ? -1 : 1;
        const fx = Math.max(-8, Math.min(8, mx + sign * (2 + hash(seed + 71) * 2) * branch));
        // Arm forks follow the arm rather than pulling back toward the torso.
        const tipx = Math.abs(mx) > 9 ? mx + sign * 2 * branch : fx;
        p.line(TX + mx, my, TX + tipx, Math.max(-58, Math.min(-2, my - (2 + hash(seed + 39) * 2) * branch)), veinColor, strength);
      }
      walked += length;
    }
  }
  p.glow(cx, cy, 7 + 6 * pulse, C[3], (0.12 + 0.2 * pulse) * strength);
  p.disc(cx, cy, 2.2 + 2.6 * pulse, C[3], strength);
  p.disc(cx - 0.4, cy - 0.4, 0.9 + 1.2 * pulse, C[6], strength);

  // Short rose sparks leave each beat; no mutable particle state.
  for (let b = 0; b < BEATS.length; b++) {
    const age = t - BEATS[b];
    if (age < 0 || age > 0.28) continue;
    for (let i = 0; i < 4 + b * 2; i++) {
      const a = hash(i + b * 19) * TAU, d = 4 + age * (35 + hash(i + 47) * 28);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d - 10 * age;
      p.dot(x, y, age < 0.08 ? C[4] : C[2], strength * (1 - smooth(0.16, 0.28, age)));
    }
  }
  // Ash peels off the outline at increasing rates and drifts gently upward.
  for (let b = 0; b < BEATS.length; b++) for (let i = 0; i < 3 + b * 3; i++) {
    const age = t - BEATS[b] - hash(i + b * 31) * 0.18;
    if (age < 0 || age > 0.85) continue;
    const side = i % 2 ? 1 : -1, x = TX + side * (8 + age * (2 + hash(i + 51) * 5));
    const y = -7 - hash(i + b * 17 + 91) * 43 - age * (8 + hash(i + 18) * 6);
    p.dot(x + Math.sin(age * 6 + i) * 1.2, y, ASH[(i + b) % 3], strength * (1 - smooth(0.55, 0.85, age)));
  }
}
