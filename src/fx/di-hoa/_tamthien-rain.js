// Deterministic black-fire rain, impacts and pools (RAIN..ORB+0.4).
import { clamp, TAU } from '../../core/index.js';
import { C, TX, RAIN, ORB, SC, SKY, sm, hsh } from './_tamthien-common.js';

const N = 90, FALL = 0.32, TOP = SKY + 60;
const DROPS = Array.from({ length: N }, (_, i) => {
  const tf = RAIN + (ORB - RAIN - 0.3) * Math.sqrt((i + hsh(i, 1)) / N);
  const focus = (tf - RAIN) / (ORB - RAIN);
  const x1 = TX + (hsh(i, 2) - 0.5) * 230 * (1 - focus * 0.88);
  const hitsTarget = Math.abs(x1 - TX) < 10;
  const dx = x1 - SC[0];
  return { i, tf, x0: x1 + 26, x1, y1: hitsTarget ? -14 - 44 * hsh(i, 3) : -1,
    hitsTarget, size: i % 6 === 0 ? 1.5 : 1, phase: hsh(i, 4) * TAU,
    dx, twist: (i % 2 ? 1 : -1) * (0.55 + hsh(i, 8) * 0.3),
    sparks: Array.from({ length: 4 + i % 3 }, (_, j) => {
      const a = -Math.PI * (0.08 + 0.84 * j / (3 + i % 3));
      const speed = 35 + 35 * hsh(i * 6 + j, 5);
      return [Math.cos(a) * speed, Math.sin(a) * speed];
    }) };
});

// Scanline ribbons have an opaque dark interior and a one-pixel violet rim.
// Bending the centre of each row makes a tapered, flickering tongue, not parallel trails.
function tongue(p, x, y, height, width, phase, lean = 0) {
  const rows = Math.max(2, Math.ceil(height));
  for (let j = 0; j < rows; j++) {
    const u = j / rows, w = width * (1 - u);
    const cx = x + lean * u + Math.sin(u * 7 + phase) * u * width;
    const yy = y - j;
    const edge = C[u > 0.72 ? 3 : 4], core = C[j % 3 === 0 ? 1 : 0];
    if (w > 0.8) {
      p.line(cx - w, yy, cx + w, yy, v => v * 2 * w < 0.8 || (1 - v) * 2 * w < 0.8 ? edge : core);
    } else p.line(cx - w, yy, cx + w, yy, edge);
  }
}

function rainDrops(p, t) {
  if (t > ORB + 0.05) return;
  for (const d of DROPS) {
    const age = t - d.tf, u = age / FALL;
    if (u < 0 || u > 1) continue;
    const x = d.x0 - 26 * u, y = TOP + (d.y1 - TOP) * u * u;
    const s = d.size, phase = t * 37 + d.phase;
    // Length follows the accelerating fall; avoid extending back above its birth point.
    const length = Math.min(y - TOP + 3, (7 + 21 * u) * s);
    tongue(p, x, y - s, length, 1.7 * s, phase, 3 + 3 * u);
    // Rounded lower belly, narrow upper neck: a water-drop silhouette.
    p.shade(x - 3 * s, y - 5 * s, x + 3 * s, y + 2 * s, (xx, yy, o) => {
      const v = (yy - y) / s;
      const w = v < -1 ? Math.max(0, (v + 5) * 0.58) : 2.3 * Math.sqrt(Math.max(0, 1 - ((v + 0.5) / 2.5) ** 2));
      const dist = Math.abs(xx - x);
      if (dist > w * s) return;
      o.c = dist > w * s - 0.9 ? C[4] : xx < x ? C[0] : C[1];
    });
    p.dot(x - s, y - 2 * s, C[5]);
    // Two or three 30 fps frames at the separation from the burning ceiling.
    if (age < (2 + d.i % 2) / 30) {
      const r = age < 1 / 30 ? 2 : 1;
      p.line(d.x0 - r, TOP, d.x0 + r, TOP, C[5]);
      p.line(d.x0, TOP - r, d.x0, TOP + r, C[5]);
    }
  }
}

function impact(p, d, age) {
  const x = d.x1, y = d.y1;
  if (age < 0.1) {
    const u = age / 0.1, w = 2 + 8 * u, h = (3 + 4 * u) * (1 - u * 0.6);
    p.polyline([[x - w, y - h], [x - w * 0.65, y - 1], [x - w * 0.4, y - h * 1.2],
      [x, y - 1], [x + w * 0.35, y - h], [x + w * 0.65, y - 1], [x + w, y - h * 0.8]], C[u < 0.35 ? 5 : 4]);
  }
  if (age < 0.23) {
    for (const [vx, vy] of d.sparks) {
      const a = Math.max(0, age - 0.025);
      const sx = x + vx * age, sy = y + vy * age + 130 * age * age;
      p.line(x + vx * a, y + vy * a + 130 * a * a, sx, sy, C[age < 0.12 ? 4 : 3]);
      p.dot(sx, sy, C[5], 1 - age / 0.27);
    }
  }
  if (age < 0.16) {
    const r = 2 + age * 42, pts = [];
    for (let j = 0; j <= 12; j++) {
      const a = j * TAU / 12;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.25]);
    }
    p.polyline(pts, C[age < 0.07 ? 4 : 2]);
  }
}

function poolPosition(d, pull) {
  const a = pull * TAU * d.twist, r = 1 - pull;
  // An elliptical spiral lifts immediately; the entire stream stays above the soil.
  return [SC[0] + r * (d.dx * Math.cos(a) - 35 * Math.sin(a)),
    SC[1] + r * (70 * Math.cos(a) - Math.abs(d.dx) * 0.2 * Math.abs(Math.sin(a)))];
}

function remnants(p, t, layer) {
  const pull = sm(clamp((t - ORB) / 0.35));
  for (const d of DROPS) {
    const age = t - d.tf - FALL;
    if (age < 0) continue;
    if (layer === 'back') {
      if (!d.hitsTarget && pull < 1) {
        const r = (3.5 + d.size) * (0.5 + 0.5 * Math.exp(-age * 1.6)) * (1 - pull);
        p.shade(d.x1 - r, -2, d.x1 + r, 1, (x, y, o) => {
          if (((x - d.x1) / r) ** 2 + ((y + 0.5) / 1.4) ** 2 < 1) o.c = C[1];
        });
      }
      continue;
    }
    impact(p, d, age);
    if (d.hitsTarget) {
      const fade = (1 - clamp(age / 0.85)) * (1 - pull);
      if (fade > 0) for (let j = 0; j < 3; j++)
        p.dot(d.x1 + j - 1, d.y1 + (j % 2), C[1], fade);
    } else if (pull < 1) {
      const [x, y] = poolPosition(d, pull);
      const ember = (0.48 + 0.52 * Math.exp(-age * 1.7)) * (1 - pull);
      if (pull > 0) {
        let prev = poolPosition(d, Math.max(0, pull - 0.1));
        for (let j = 1; j <= 4; j++) {
          const q = Math.max(0, pull - 0.1 + j * 0.025), next = poolPosition(d, q);
          p.line(prev[0], prev[1], next[0], next[1], C[j < 3 ? 2 : 4]);
          prev = next;
        }
      }
      for (let j = 0; j < 2 + d.i % 2; j++) {
        const phase = t * 19 + d.phase + j * 2.3;
        const h = (4.5 + 1.5 * Math.sin(phase)) * ember;
        tongue(p, x + (j - 0.7) * 2 * ember, y, h, 1.3 * ember, phase);
      }
    }
  }
}

export function rain(p, t, layer) {
  if (t < RAIN || t > ORB + 0.4) return;
  if (layer === 'front') rainDrops(p, t);
  remnants(p, t, layer);
}
