// Approved draft motion with cold fire and cut-ice materials.
import { smooth, clamp, TAU, READY, poseAt } from '../../core/index.js';
import { coldRamp, coldFlame, hash, curve, tipCapped, bakeIceFlame } from './_cold-lib.js';

const TX = 150, END = 4.4, POUR = 0.6, SWEEP = 0.75, ARRIVE = 1.5, FREEZE = 2.1, FROZEN = 2.35, SHATTER = 3.2;
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };
export const meta = {
  name: 'Cot Linh Lanh Hoa',
  desc: 'Cold fire pours down, rolls along the ground and climbs into curved ribs, freezes mid-flame, then shatters beneath a clenched hand.',
  tags: ['di-hoa', 'ice', 'fire', 'control', 'one-shot'],
  size: [360, 260], origin: [60, 235], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const PALM = { ...READY, crouch: 2, lean: -2, fx: 14, fy: -24, bx: 4, by: -20 };
const LOW = { ...READY, crouch: 9, lean: 8, fx: 22, fy: -11, bx: -6, by: -18 };
const REACH = { ...READY, crouch: 4, lean: 3, fx: 22, fy: -26, bx: -4, by: -19 };
const GRIP = { ...REACH, fx: 20, fy: -27 };
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.35, PALM], [POUR, { ...PALM, fy: -22 }], [SWEEP, LOW, 'snap'], [1.1, { ...LOW, crouch: 7 }], [1.5, REACH],
    [FREEZE, REACH], [FREEZE + 0.05, GRIP, 'snap'], [SHATTER - 0.05, { ...GRIP, crouch: 5 }],
    [SHATTER, { ...READY, crouch: 3, lean: -5, fx: 8, fy: -22, bx: -6, by: -20 }, 'snap'], [END, READY]],
  hits: [
    { t: SWEEP, stop: 0.03, shake: 0.08, amp: 1, target: false },
    { t: ARRIVE, shake: 0.15, amp: 1, push: 0.3, straw: 3 },
    { t: FREEZE + 0.12, stop: 0.1, shake: 0.25, amp: 2, push: 0, flash: 0.06, skin: 'ice' },
    { t: SHATTER, stop: 0.1, shake: 0.5, amp: 4, push: 2.6, straw: 24, flash: 0.08 },
    { t: END - 0.35, push: 0, straw: 0, skin: null },
  ],
};
const hand = (t) => { const q = poseAt(act.poses, t); return [q.fx ?? 11, q.fy ?? -21]; };

// the low tide's front position along the ground
const front = (t) => 18 + (TX + 26 - 18) * sm(clamp((t - SWEEP) / (ARRIVE - SWEEP)));
const tail = (t) => 10 + (TX - 34 - 10) * sm(clamp((t - ARRIVE + 0.1) / 0.45));

// the flame tongues round the target: base on the climbing helix, curving out like ribs. Frozen ones keep their pose at freeze time.
const TONGUES = Array.from({ length: 16 }, (_, i) => ({ i, h: 4 + (i / 15) * 66, side: i % 2 ? 1 : -1, ph: hsh(i) * TAU, len: 20 + hsh(i, 1) * 14 - i * 0.5 }));
function tongue(q, t) {
  const climb = clamp((t - ARRIVE) / (FREEZE - ARRIVE)), on = clamp((climb * 74 - q.h) / 10);
  if (on <= 0) return null;
  const tt = Math.min(t, FREEZE + 0.25 * (q.h / 74)), fl = Math.sin(tt * 9 + q.ph);
  const bx = TX + q.side * (7 - q.h * 0.04), by = -q.h;
  const ang = q.side * (0.7 + 0.25 * fl) + (q.h / 60) * q.side * -0.35, L = q.len * on * (0.9 + 0.1 * fl);
  // rib curve: out and then up
  const mx = bx + Math.sin(ang) * L * 0.6, my = by - Math.cos(ang) * L * 0.25, tx = mx + q.side * L * 0.35, ty = my - L * 0.55;
  return { bx, by, mx, my, tx, ty, w: 3.8 * on };
}
const frozenAt = (q, t) => t >= FREEZE + 0.25 * (q.h / 74);

const liveFlame = (p, C, pts, ...args) => coldFlame(tipCapped(p, pts), C, pts, ...args);
let iceKey = '', iceTiles = [];
function frozenTiles(C) {
  const key = C.join(',');
  if (key !== iceKey) {
    iceKey = key;
    iceTiles = TONGUES.map((q) => {
      const g = tongue(q, FROZEN);
      return bakeIceFlame(C, points(g), g.w, q.i, { dim: q.i % 3 === 0 ? 0.3 : 0 });
    });
  }
  return iceTiles;
}
const points = (g) => [[g.bx, g.by], [g.mx, g.my], [g.tx, g.ty]];
// Each rib breaks into two or three pieces cut from its frozen centreline.
const SHARDS = TONGUES.flatMap((q) => {
  const g = tongue(q, FROZEN), n = 2 + q.i % 2, path = curve(points(g), n * 2);
  return Array.from({ length: n }, (_, j) => {
    const pts = path.slice(j * 2, j * 2 + 3), [cx, cy] = pts[1], s = q.i * 3 + j;
    const vx = q.side * (26 + hash(s, 1) * 65), vy = -24 - hash(s, 2) * 65;
    const land = (-vy + Math.sqrt(vy * vy - 560 * (cy + 2))) / 280;
    return { pts: pts.map(([x, y]) => [x - cx, y - cy]), cx, cy, vx, vy, land,
      bounce: (vy + 280 * land) * 0.23, spin: (hash(s, 3) - 0.5) * 12,
      w: Math.max(0.8, g.w * (1 - j / n) * 0.8), s, back: q.i % 3 === 0 };
  });
});

function palmFire(p, C, t) {
  if (t < 0.05 || t > SWEEP + 0.05) return;
  const [hx, hy] = hand(t), k = smooth(0.05, 0.25, t) * (1 - smooth(SWEEP, SWEEP + 0.05, t));
  p.glow(hx, hy + 4, 10, C[4], 0.18 * k);
  for (let i = 0; i < 5; i++) {
    const x = hx - 5 + i * 2.5, sway = Math.sin(t * 7 + i * 1.9) * 2;
    const L = Math.min(-hy + 1, 13 + 3 * Math.sin(t * 11 + i * 2) + 6 * smooth(POUR, SWEEP, t));
    liveFlame(p, C, [[x, hy + 1], [x + sway * 0.4, hy + L * 0.6], [x + sway, hy + L]],
      2.5 + hash(i, 1), t, i * 7, { k, mist: 0.7 });
  }
  for (let i = 0; i < 7; i++) {
    const u = (t * 0.75 + i / 7) % 1;
    p.dot(hx - 5 + hash(i, 2) * 10, hy + 8 + u * Math.max(0, -hy - 8), C[5], k * (1 - u) * 0.7);
  }
}
function frost(p, C, t) {
  if (t < 0.12 || t >= END - 0.2) return;
  const k = 1 - smooth(END - 1, END - 0.2, t), [hx] = hand(Math.min(t, SWEEP));
  p.ellipse(hx, 1, 8, 2.5, C[4], 0.25 * smooth(0.12, POUR, t) * k);
  if (t < SWEEP) return;
  const xf = front(t);
  for (let i = 0; i < 23; i++) {
    const x = 16 + i * 7, y = (hash(i, 2) - 0.5) * 7;
    const grow = smooth(x, x + 10, xf), l = (5 + hash(i, 3) * 7) * grow;
    if (l < 0.3) continue;
    const mx = x + l * 0.55, my = y + (hash(i, 4) - 0.5) * 2;
    p.polyline([[x, y], [mx, my], [x + l, y - 0.5]], C[5], 0.8 * k);
    for (let b = 0; b < 2; b++) {
      const s = b ? 1 : -1, bx = mx + 2.5 * grow, by = my + s * (2 + hash(i, b + 6) * 3) * grow;
      p.line(mx, my, bx, by, C[4], 0.75 * k);
      p.line(bx, by, bx + 2 * grow, by + s * grow, C[5], 0.65 * k);
    }
    p.circle(mx, my, 1, C[5], 0.9 * k);
  }
}
function tide(p, C, t) {
  if (t < SWEEP || t >= FREEZE + 0.1) return;
  const xf = front(t), xs = tail(t), k = 1 - smooth(FREEZE - 0.15, FREEZE + 0.1, t), span = xf - xs;
  if (span < 2) return;
  const height = (x) => {
    const u = clamp((x - xs) / span);
    return 6 + 12 * smooth(0.6, 0.95, u) * (1 - smooth(0.95, 1, u)) + 1.5 * Math.sin(x * 0.2 - t * 9);
  };
  // A single fill for the whole low tide; the upper edge dissolves into trailing mist.
  p.shade(xs, -23, xf + 4, 3, (x, y, o) => {
    const z = (2 - y) / height(x);
    if (x > xf + 3 * clamp(1 - z) || z < 0 || z > 1.22) return;
    const edge = smooth(0.68, 1.22, z), n = hash(Math.floor(x + t * 12), Math.floor(y), 31);
    if (n < edge * 0.9) return;
    const flow = Math.sin(x * 0.34 + y * 0.9 - t * 12) * Math.sin(y * 0.7 + x * 0.08 - t * 3);
    o.c = C[clamp(Math.round(5.5 - z * 2.7 + flow * 0.9), 2, 6)]; o.a = k * (1 - edge * 0.5);
  });
  for (let i = 0; i < 4; i++) {
    const x = xf - 5 - i * 3, y = -height(x) + 3;
    liveFlame(p, C, [[x, y], [x + 5, y - 3 + i], [x + 9 + Math.sin(t * 8 + i) * 2, y + 2]],
      2.2, t, 40 + i, { k, mist: 0.8 });
  }
  for (let i = 0; i < 14; i++) {
    const u = (t * 0.7 + i / 14) % 1, x = xs + hash(i, 9) * span - u * 9;
    p.dot(x, -height(x) - u * 3, C[4], k * (1 - u) * 0.35);
  }
}
function glintAt(t) {
  for (const start of [FROZEN + 0.2, FROZEN + 0.6]) {
    const u = (t - start) / 0.3;
    if (u >= 0 && u < 1) return TX - 88 + u * 132;
  }
  return -1;
}
function iceFoot(p, C, t) {
  if (t < FROZEN || t >= SHATTER) return;
  const k = smooth(FROZEN, FROZEN + 0.08, t), glint = glintAt(t);
  p.shade(TX - 15, -7, TX + 16, 4, (x, y, o) => {
    const dx = x - TX, rim = 3 - 8 * Math.sqrt(Math.max(0, 1 - dx * dx / 225));
    if (Math.abs(dx) > 15 || y < rim || y > 3 - Math.abs(dx) * 0.12) return;
    let tone = y < rim + 1 ? 6 : dx < -3 ? 4 : dx > 7 ? 1 : 3;
    if (Math.abs(x + y * 0.6 - glint) < 1) tone = 6;
    if (Math.abs(dx + y * 1.7) < 0.6) tone = 5;
    o.c = C[tone]; o.a = k;
  });
}
function sculpture(p, C, t, back) {
  if (t < ARRIVE || t >= SHATTER) return;
  // Split the approved three helices at front/back crossings.
  if (t < FROZEN) for (let s = 0; s < 3; s++) {
    const top = 74 * clamp((t - ARRIVE) / (FREEZE - ARRIVE));
    let pts = [];
    const flush = () => {
      if (pts.length > 2) liveFlame(p, C, pts, 2.3, t, 60 + s, { k: 1 - smooth(FREEZE, FROZEN, t), dim: back ? 0.5 : 0, mist: 0.5 });
      pts = [];
    };
    for (let h = 0; h <= top; h += 3) {
      const a = h * 0.16 + s * TAU / 3 + t * 3;
      if ((Math.sin(a) <= 0) === back) pts.push([TX + Math.cos(a) * 9, -h]);
      else flush();
    }
    flush();
  }
  const glint = glintAt(t), crack = smooth(SHATTER - 0.25, SHATTER, t);
  for (const q of TONGUES) {
    if ((q.i % 3 === 0) !== back) continue;
    const g = tongue(q, t);
    if (!g) continue;
    if (frozenAt(q, t)) frozenTiles(C)[q.i](p, { glint, crack });
    else liveFlame(p, C, points(g), g.w, t, q.i, { mist: 0.8, dim: back ? 0.3 : 0 });
  }
  if (back) return;
  if (t > FREEZE && t < FROZEN) {
    const h = 76 * clamp((t - FREEZE) / 0.25), w = 15 + 4 * Math.sin(h * 0.3);
    p.line(TX - w, -h, TX + w, -h, C[6], 0.9);
    for (let i = 0; i < 5; i++) {
      const x = TX - w + i * w * 0.5;
      p.line(x, -h, x + (i - 2) * 1.2, -h - 3 - hash(i, Math.floor(h / 6)) * 3, C[5], 0.75);
    }
  }
  if (t >= FROZEN) for (let i = 0; i < 24; i++) {
    const u = (t * (0.22 + hash(i, 8) * 0.15) + hash(i, 9)) % 1;
    const x = TX - 24 + hash(i, 10) * 48 + Math.sin(t * 2 + i) * 1.5, y = -75 + u * 80;
    p.dot(x, y, C[i % 3 ? 4 : 5], 0.28 * Math.sin(u * Math.PI));
    if (i % 3 === 0) p.line(x, y, x - 0.5, y + 3, C[4], 0.12);
  }
}
function shatter(p, C, t, back) {
  const dt = t - SHATTER;
  if (dt < 0 || t >= END - 0.08) return;
  if (!back && dt < 0.085) {
    p.ellipse(TX, -33, 14 * (1 - dt / 0.085), 29 * (1 - dt / 0.085), C[6], 1 - dt / 0.085);
    p.glow(TX, -32, 20, C[5], 0.25 * (1 - dt / 0.085));
  }
  const k = 1 - smooth(0.55, END - SHATTER - 0.3, dt);
  if (k > 0) for (const q of SHARDS) {
    if (q.back !== back) continue;
    let x, y, spin;
    if (dt <= q.land) {
      x = q.cx + q.vx * dt; y = q.cy + q.vy * dt + 140 * dt * dt; spin = dt * q.spin;
    } else {
      const u = dt - q.land, air = Math.min(u, 2 * q.bounce / 280);
      x = q.cx + q.vx * q.land + q.vx * 0.3 * (1 - Math.exp(-u * 4)) / 4;
      y = -2 - q.bounce * air + 140 * air * air; spin = q.land * q.spin + air * q.spin * 0.6;
    }
    const melt = 1 - 0.5 * smooth(0.45, 0.9, dt);
    const cs = Math.cos(spin) * melt, sn = Math.sin(spin) * melt, pts = q.pts.map(([a, b]) => [x + a * cs - b * sn, y + a * sn + b * cs]);
    const [a, m, b] = pts, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len * q.w * melt, ny = dx / len * q.w * melt;
    p.poly([[a[0] - nx, a[1] - ny], m, b, [a[0] + nx, a[1] + ny]], C[2], k);
    p.poly([a, [m[0] + nx * 0.65, m[1] + ny * 0.65], b], C[q.s % 2 ? 5 : 4], k);
    p.line(a[0], a[1], b[0], b[1], C[6], k * 0.7);
    if (dt > 0.45) p.dot(x - 2 * Math.sin(q.s), y - (dt - 0.45) * 8, C[4], k * 0.25);
  }
  if (back) {
    const r = 10 + 86 * out3(clamp(dt / 0.85)), fade = smooth(0, 0.08, dt) * (1 - smooth(0.35, 1.05, dt));
    p.shade(TX - r - 3, -r * 0.17 - 3, TX + r + 3, r * 0.17 + 1, (x, y, o) => {
      const d = Math.hypot((x - TX) / r, (y + 1) / (r * 0.17)), edge = Math.abs(d - 0.94) / 0.13;
      if (edge > 1) return;
      o.c = C[4]; o.a = fade * (1 - edge) * 0.35 * (0.5 + hash(Math.floor(x), Math.floor(y), 91) * 0.5);
    });
  } else for (let i = 0; i < 5; i++) {
    const fade = 1 - smooth(0.35, 1.05, dt), x = TX - 16 + i * 8 + Math.sin(t * 5 + i) * 2;
    const lift = 10 * Math.sin(Math.PI * clamp(dt / 0.3)), sink = 40 * smooth(0.15, 1, dt);
    const y = -26 - lift + sink, L = 12 * (1 - smooth(0.45, 1.05, dt));
    liveFlame(p, C, [[x, y], [x + Math.sin(i) * 4, y + L * 0.45 - lift * 0.4], [x - 2, y + L]],
      2.8 * fade, t, 90 + i, { k: fade * 0.75 });
  }
}
export function drawBack(p, t, o) {
  if (t < 0 || t >= END) return;
  const C = coldRamp(o);
  frost(p, C, t); iceFoot(p, C, t); sculpture(p, C, t, true); shatter(p, C, t, true);
}
export function draw(p, t, o) {
  if (t < 0 || t >= END) return;
  const C = coldRamp(o);
  palmFire(p, C, t); tide(p, C, t); sculpture(p, C, t, false); shatter(p, C, t, false);
}

