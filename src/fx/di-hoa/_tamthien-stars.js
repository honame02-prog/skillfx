// Deterministic ricochets: immutable flight segments, sampled without allocating.
import { smooth, TAU } from '../../core/index.js';
import { C, END, STARS, CLIMAX, R, SC, hsh, orbState } from './_tamthien-common.js';

const M = 100, RS = R - 4, SIM = 4.2;
const KACC = 1.6 / (CLIMAX - STARS);
const ramp = d => d + 0.5 * KACC * d * d;
const clock = t => t <= CLIMAX ? ramp(Math.max(0, t - STARS))
  : ramp(CLIMAX - STARS) + 2.6 * (1 - Math.exp(-2.6 * (t - CLIMAX))) / 2.6;
const PATHS = Array.from({ length: M }, (_, i) => {
  const a = hsh(i, 4) * TAU, r = RS * Math.sqrt(hsh(i, 5)) * 0.8;
  let x = Math.cos(a) * r, y = Math.sin(a) * r;
  const speed = 200 + 150 * hsh(i, 6), heading = hsh(i, 7) * TAU;
  let vx = Math.cos(heading) * speed, vy = Math.sin(heading) * speed, time = 0;
  const flights = [], bounces = [];
  while (time < SIM) {
    const v2 = vx * vx + vy * vy, dot = x * vx + y * vy;
    const dt = (-dot + Math.sqrt(dot * dot + v2 * (RS * RS - x * x - y * y))) / v2;
    flights.push({ time, x, y, vx, vy });
    time += dt; x += vx * dt; y += vy * dt;
    const nx = x / RS, ny = y / RS, vn = vx * nx + vy * ny;
    vx -= 2 * vn * nx; vy -= 2 * vn * ny;
    const j = (hsh(i * 31 + flights.length, 8) - 0.5) * 0.22;
    const c = Math.cos(j), s = Math.sin(j), oldVx = vx;
    vx = vx * c - vy * s; vy = oldVx * s + vy * c;
    // Scatter must still point into the sphere, even for grazing hits.
    const outward = vx * nx + vy * ny;
    if (outward > 0) { vx -= 2 * outward * nx; vy -= 2 * outward * ny; }
    const angle = Math.atan2(ny, nx), bend = hsh(i * 37 + flights.length, 3);
    bounces.push({ time, x, y, nx, ny, angle, bend,
      length: 5 + 5 * bend, sparks: 2 + (i % 2) });
  }
  const born = STARS + 0.006 * i;
  return { flights, bounces, big: i % 4 === 0, born, offset: clock(born),
    dies: i === 96 ? END - 0.2 : CLIMAX + 0.3 + 0.57 * hsh(i, 9), phase: hsh(i, 12) * TAU };
});
const head = new Float64Array(3), samples = new Float64Array(15);
function at(P, time, out, offset = 0) {
  time = Math.max(0, time);
  let lo = 0, hi = P.flights.length;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (P.flights[mid].time <= time) lo = mid; else hi = mid;
  }
  const f = P.flights[lo], dt = time - f.time;
  out[offset] = f.x + f.vx * dt; out[offset + 1] = f.y + f.vy * dt; out[offset + 2] = lo;
}
// Clip each crack branch, including branches crossing the moving peel edge.
function shellLine(p, x0, y0, x1, y1, color, alpha, peel) {
  if (y0 < peel && y1 < peel) return;
  if (y0 < peel) { x0 += (x1 - x0) * (peel - y0) / (y1 - y0); y0 = peel; }
  if (y1 < peel) { x1 = x0 + (x1 - x0) * (peel - y0) / (y1 - y0); y1 = peel; }
  p.line(x0, y0, x1, y1, color, alpha);
}
const TRAIL = [C[6], C[4], C[3], C[2]];
export function stars(p, t, layer) {
  if (layer !== 'front' || t < STARS || t >= END) return;
  const { Rr, squeeze, peel, flare } = orbState(t);
  const scale = Rr / R, now = clock(t), climax = Math.abs(t - CLIMAX) <= 0.06;
  for (const P of PATHS) {
    if (t < P.born) continue;
    const tau = now - P.offset;
    // Persistent shell damage is independent of whether its star has died.
    for (let bi = 0; bi < P.bounces.length; bi++) {
      const b = P.bounces[bi], age = tau - b.time;
      if (age < 0) break;
      const cx = SC[0] + b.nx * Rr, cy = SC[1] + b.ny * Rr;
      if (P.big) {
        const l = b.length, turn = (b.bend - 0.5) * 1.2;
        const mx = cx - b.nx * l * 0.55 - b.ny * turn * 3;
        const my = cy - b.ny * l * 0.55 + b.nx * turn * 3;
        const ex = cx - b.nx * l + b.ny * turn * 3;
        const ey = cy - b.ny * l - b.nx * turn * 3;
        const fade = (1 - smooth(END - 0.5, END, t)) / (1 + age * 0.18);
        shellLine(p, cx, cy, mx, my, C[4], fade, peel);
        shellLine(p, mx, my, ex, ey, C[5], fade, peel);
        shellLine(p, mx, my, mx - b.nx * 3 - b.ny * 3,
          my - b.ny * 3 + b.nx * 3, C[4], fade, peel);
      }
      if (age > 0.2 || t >= P.dies || cy < peel) continue;
      const flash = 1 - age / 0.2, spread = 0.035 + age * 0.14;
      let ax = SC[0] + Math.cos(b.angle - spread) * Rr;
      let ay = SC[1] + Math.sin(b.angle - spread) * Rr;
      for (let j = 1; j <= 3; j++) {
        const angle = b.angle - spread + j * spread * 2 / 3;
        const bx = SC[0] + Math.cos(angle) * Rr, by = SC[1] + Math.sin(angle) * Rr;
        shellLine(p, ax, ay, bx, by, flare > 0.3 ? C[6] : C[5], flash, peel);
        ax = bx; ay = by;
      }
      for (let j = 0; j < b.sparks; j++) {
        const angle = b.angle + Math.PI + (j - (b.sparks - 1) / 2) * 0.55;
        const dx = Math.cos(angle), dy = Math.sin(angle), distance = age * (35 + 10 * j);
        shellLine(p, cx + dx * distance, cy + dy * distance,
          cx + dx * (distance + 2), cy + dy * (distance + 2), C[4 + (j % 2)], flash, peel);
      }
    }
    if (t >= P.dies) continue;
    const dying = smooth(P.dies - 0.12, P.dies, t);
    const k = 1 - smooth(P.dies - 0.035, P.dies, t);
    const duration = (P.big ? 0.038 : 0.026) * (0.8 + 0.2 * squeeze);
    // Sample each boundary once; split colour bands exactly at wall collisions.
    for (let j = 0; j <= 4; j++) {
      const past = Math.max(P.born, t - duration * j / 4);
      at(P, clock(past) - P.offset, samples, j * 3);
    }
    for (let j = 3; j >= 0; j--) {
      const newer = j * 3, older = newer + 3;
      let x = samples[older], y = samples[older + 1];
      for (let b = samples[older + 2]; b < samples[newer + 2]; b++) {
        const hit = P.bounces[b];
        p.line(SC[0] + x * scale, SC[1] + y * scale,
          SC[0] + hit.x * scale, SC[1] + hit.y * scale, TRAIL[j], k);
        x = hit.x; y = hit.y;
      }
      p.line(SC[0] + x * scale, SC[1] + y * scale,
        SC[0] + samples[newer] * scale, SC[1] + samples[newer + 1] * scale, TRAIL[j], k);
    }
    at(P, tau, head);
    const X = SC[0] + head[0] * scale, Y = SC[1] + head[1] * scale;
    if (P.big || climax || dying > 0) {
      const twinkle = 2 + Math.floor(1.99 * (0.5 + 0.5 * Math.sin(t * 31 + P.phase)));
      const arm = dying > 0 ? 1 + 1.5 * Math.sin(dying * Math.PI) : (P.big ? twinkle : 1) + (climax ? 1 : 0);
      const color = climax || dying > 0 ? C[6] : C[4];
      p.line(X - arm, Y, X + arm, Y, color, k);
      p.line(X, Y - arm, X, Y + arm, color, k);
      if (P.big) {
        p.line(X - 1, Y, X + 1, Y, climax ? C[6] : C[5], k);
        p.line(X, Y - 1, X, Y + 1, climax ? C[6] : C[5], k);
      }
    } else p.dot(X + 1, Y, C[5], k);
    if (climax) {
      const length = Math.hypot(head[0], head[1]) || 1;
      const dx = head[0] / length, dy = head[1] / length;
      p.line(X + dx * 2, Y + dy * 2, X + dx * (4 + 2 * flare), Y + dy * (4 + 2 * flare), C[6]);
    }
    p.dot(X, Y, C[6], k);
  }
}
