// BOOM..INHALE: rolling earth and ash, pulled back up into the eye.
import { smooth, clamp, TAU, hex, mix } from '../../core/index.js';
import { L, DUST, TX, BOOM, GHOST, INHALE, LC, EC, out3, hsh } from './_tinhlien-common.js';

const EARTH = [DUST[0], DUST[1], DUST[2], hex('#907456')];
const ASH = [hex('#3b3437'), hex('#555052'), DUST[3], DUST[4]];
const WARM = ['#584337', '#75543d', '#9e7852', '#c09a69'].map(hex);
const DUST_TONES = Array.from({ length: 9 }, (_, ash) =>
  Array.from({ length: 9 }, (_, light) =>
    EARTH.map((color, band) => mix(mix(color, ASH[band], ash / 8), WARM[band], light / 8))));
const EMBER = ['#572b23', '#883c28', '#b75b2e'].map(hex);
const FPS = 24;
const LEFT = -59, RIGHT = 298, TOP = -184, WIDTH = RIGHT - LEFT + 1;
const FRAME_COUNT = Math.ceil((INHALE[1] - BOOM) * FPS);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const ordered = (x, y) => BAYER[((y & 3) << 2) | (x & 3)] / 16;

const CROWN = [
  [-65, 126, 26], [-40, 143, 29], [-12, 128, 32], [22, 138, 28],
  [56, 136, 31], [-44, 106, 24], [37, 104, 25],
];
const BILLOWS = CROWN.map(([x, h, r]) => ({ x, h, r, crown: true }));
for (let i = 0; i < 18; i++) {
  const h = 36 + hsh(i, 4) * 105;
  const x = (hsh(i, 5) * 2 - 1) * h * 0.42;
  BILLOWS.push({ x, h, r: 7 + hsh(i, 6) * 9 });
}
for (let i = 0; i < 16; i++) {
  const h = 26 + hsh(i, 7) * 127;
  const x = (i % 2 ? 1 : -1) * h * (0.44 + hsh(i, 8) * 0.14);
  BILLOWS.push({ x, h, r: 3 + hsh(i, 9) * 5 });
}
BILLOWS.forEach((B, i) => {
  B.phase = hsh(i, 34) * TAU;
  B.delay = (1 - B.h / 172) * 0.33 + 0.08 * hsh(i, 35);
  B.aspect = 0.69 + 0.27 * hsh(i, 36);
});

// Retain the v4 internal light envelope, also consumed by the ending.
export const reveal = (t) => smooth(GHOST[0], GHOST[0] + 0.35, t) * (1 - smooth(INHALE[0] + 0.25, INHALE[0] + 0.6, t));

function inhale(t, x, y, r, phase, delay) {
  const k = clamp((t - INHALE[0] - delay) / 0.67);
  if (k <= 0) return [x, y, r];
  if (k >= 1) return null;
  const e = k * k, a = phase + k * 9 + y * 0.025;
  const orbit = Math.sin(a) * (12 + 0.13 * Math.abs(x - TX)) * Math.sin(Math.PI * k);
  return [x + (EC[0] - x) * out3(k) + orbit, y + (EC[1] - y) * e, r * (1 - e * 0.88)];
}

function dustColor(x, y, tone, g) {
  const light = g * Math.max(0, 1 - ((x - TX) / 55) ** 2 - ((y + 57) / 56) ** 2);
  const ash = clamp((-y - 41) / 76);
  return DUST_TONES[Math.round(ash * 8)][Math.round(light * 8)][tone];
}

function billowPose(B, t, a, rise) {
  const side = Math.sign(B.x), roll = a * (B.crown ? 2.8 : 1.6);
  const x = TX + B.x * (0.19 + 0.81 * rise);
  const y = -B.h * rise;
  // The outer crown turns outwards and then down. Inner billows travel shorter arcs.
  const turn = B.crown ? 6 : 2.5;
  const q = inhale(t,
    x + side * turn * (Math.sin(roll - 0.8) + 0.6) * rise + Math.sin(roll + B.phase) * 2,
    y + (turn * (1 - Math.cos(roll - 0.8)) * 0.66 + Math.cos(roll + B.phase) * 2) * rise,
    B.r * (0.2 + 0.8 * rise), B.phase, B.delay);
  return q && { B, x: q[0], y: q[1], r: q[2] };
}

function stampBillow(pixels, pose, a, g) {
  const { B, x, y, r } = pose;
  const ry = r * B.aspect, skew = Math.sin(a * 1.9 + B.phase) * 0.24;
  for (let py = Math.max(TOP + 1, Math.floor(y - ry * 1.2)); py <= Math.min(-1, y + ry * 1.2); py++) {
    const v = (py - y) / ry;
    const offset = (py - TOP) * WIDTH - LEFT;
    for (let px = Math.max(LEFT + 1, Math.floor(x - r * 1.35)); px <= Math.min(RIGHT - 1, x + r * 1.35); px++) {
      const u = (px - x) / r - v * skew, d = u * u + v * v;
      if (d > 1.35) continue;
      const angle = Math.atan2(v, u);
      const edge = 0.98 + 0.13 * Math.sin(angle * 3 + B.phase) + 0.07 * Math.sin(angle * 7 - B.phase);
      if (d > edge) continue;
      const fold = (u + 0.29) ** 2 + (v + 0.53) ** 2;
      const contour = v + u * 0.58 + 0.14 * Math.sin(u * 6 + B.phase);
      let tone = contour > 0.29 ? 1 : 2;
      if (fold < 0.72 && contour < -0.21) tone = 3;
      if (r > 9 && u > -0.64 && fold > 0.70 && fold < 0.82 && contour > -0.23) tone = 1;
      // Grit appears in small clumps on the lee side of each fold.
      if (r > 12 && tone < 3 && (px & 3) < 2 && (py & 3) < 2 &&
          hsh((px >> 2) * 57 + (py >> 2) * 113, B.h) > 0.94) tone = (px & 1) ? 0 : 2;
      pixels[offset + px] = dustColor(px, py, tone, g);
    }
  }
}

function stem(pixels, a, rise, g) {
  const gather = smooth(INHALE[0] - BOOM, INHALE[0] - BOOM + 0.43, a);
  const height = 148 * rise;
  for (let y = -1 - Math.floor(78 * gather); y >= -height; y--) {
    const v = -y / height;
    const mid = TX + Math.sin(v * 5 + a * 2) * v * 5;
    const w = (6 + 64 * v ** 1.1) * (0.34 + 0.66 * rise) * (1 - gather * 0.78);
    const offset = (y - TOP) * WIDTH - LEFT;
    for (let x = Math.ceil(mid - w); x < mid + w; x++) {
      const u = (x - mid) / w;
      const flutes = Math.sin(u * 17 + v * 3 + Math.sin(v * 11 - a * 5) * 0.5);
      const tone = flutes > 0.64 && u < 0.45 ? 3 : flutes < -0.6 || u > 0.67 ? 1 : 2;
      pixels[offset + x] = dustColor(x, y, tone, g);
    }
  }
}

function groundDust(pixels, t, a) {
  const b = a - 0.055;
  if (b <= 0) return;
  const pull = smooth(INHALE[0], INHALE[0] + 0.5, t);
  const spread = out3(clamp(b / 0.82));
  const width = (15 + 182 * spread) * (1 - pull);
  if (width < 2) return;
  const height = (8 + 45 * smooth(0, 0.42, b)) * (1 - 0.87 * smooth(0.54, 1.23, b));
  for (let x = Math.max(LEFT + 1, Math.ceil(TX - width)); x <= Math.min(RIGHT - 1, TX + width); x++) {
    const u = Math.abs(x - TX) / width, dir = x < TX ? -1 : 1;
    const phase = u * 14 - b * 10 + dir * 0.7 + Math.sin(u * 6 + dir);
    const wave = Math.sin(phase);
    const cap = 0.64 + 0.19 * wave + 0.09 * Math.sin(phase * 1.7 + dir);
    const reach = clamp((1 - u) * 7);
    const h = height * cap * reach * (1 - pull);
    const lift = pull * (18 + (1 - u) * 36);
    for (let y = Math.ceil(-h - lift); y <= Math.min(0, -lift + 1); y++) {
      const v = (-y - lift) / Math.max(1, h);
      const curl = Math.sin(phase + 4 * v + Math.sin(v * 5) * 0.65);
      const ridge = v + 0.23 * curl;
      if (v > 0.66 && curl < -0.57 - v * 0.32) continue;
      if ((v < 0.09 || reach < 0.35) && ordered(x, y) > 0.54 + ridge * 2) continue;
      const tone = ridge > 0.76 && curl > -0.25 ? 3 : ridge < 0.18 || curl < -0.39 ? 1 : 2;
      pixels[(y - TOP) * WIDTH + x - LEFT] = EARTH[tone];
    }
  }
}

function vortex(pixels, t) {
  const draw = smooth(INHALE[0], INHALE[0] + 0.26, t);
  const clear = smooth(INHALE[1] - 0.38, INHALE[1] - 0.02, t);
  if (draw <= 0 || clear >= 1) return;
  const top = EC[1] + 13;
  const edge = 1 - smooth(INHALE[1] - 0.22, INHALE[1], t);
  const foot = top * clear;
  for (let y = Math.ceil(top * draw); y < Math.min(-1, foot + 12); y++) {
    const v = 1 - y / top;
    const turn = y * 0.076 - (t - INHALE[0]) * 17;
    const mid = EC[0] + Math.sin(turn) * (4 + 14 * v) * draw;
    const w = (11 + 46 * v ** 0.8) * draw * edge;
    const offset = (y - TOP) * WIDTH - LEFT;
    for (let x = Math.ceil(mid - w); x < mid + w; x++) {
      const u = (x - mid) / w, d = Math.abs(u);
      const fold = Math.sin(turn + u * 4.7);
      const boundary = 0.86 + 0.12 * Math.sin(turn - Math.sign(u));
      const tail = foot + 8 * fold - 18 * d * clear;
      if (y > tail && ordered(x, y) > clamp(1 - (y - tail) / 4)) continue;
      if (d > boundary && ordered(x, y) > (1 - d) * 4) continue;
      if (d > 0.55 && fold < -0.68 && Math.sin(y * 0.17 + u * 7 - t * 11) > 0.2) continue;
      const tone = d > boundary ? 0 : fold > 0.38 ? 3 : fold < -0.44 ? 1 : 2;
      pixels[offset + x] = dustColor(x, y, tone, 0);
    }
  }
}

function dustFrame(t) {
  const a = t - BOOM, rise = out3(clamp(a / 0.6)), g = reveal(t);
  const pixels = new Uint32Array(WIDTH * (1 - TOP));
  const poses = BILLOWS.map(B => billowPose(B, t, a, rise)).filter(P => P && P.r >= 1);
  stem(pixels, a, rise, g);
  poses.sort((a, b) => a.y - b.y);
  for (const P of poses) stampBillow(pixels, P, a, g);
  groundDust(pixels, t, a);
  vortex(pixels, t);

  // Outline the union. Only trace outside the combined silhouette, with breakup along exposed edges.
  const rows = [];
  for (let y = TOP; y <= 0; y++) {
    const row = new Uint32Array(WIDTH);
    const offset = (y - TOP) * WIDTH;
    let first = WIDTH, last = -1;
    for (let i = 1; i < WIDTH - 1; i++) {
      const j = offset + i;
      let color = pixels[j];
      if (!color) {
        const topEdge = pixels[j + WIDTH];
        const sideEdge = pixels[j + 1] || pixels[j - 1];
        if (topEdge || sideEdge || pixels[j - WIDTH]) {
          const threshold = ordered(i, y);
          if (threshold < 0.88) color = dustColor(i + LEFT, y, topEdge ? 1 : 0, g);
        } else if (((i + y) & 3) === 0 && (pixels[j + WIDTH * 2] || pixels[j + 2] || pixels[j - 2])) {
          color = dustColor(i + LEFT, y, 1, 0);
        }
      }
      if (!color) continue;
      row[i] = color;
      first = Math.min(first, i);
      last = i;
    }
    if (last >= 0) rows.push({ x: LEFT + first, y, colors: row.slice(first, last + 1) });
  }
  return rows;
}

// Pose data depends only on time. Rasterize once, so playback only writes visible dust pixels.
const DUST_FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => dustFrame(BOOM + (i + 0.5) / FPS));

function drawDust(p, a) {
  const rows = DUST_FRAMES[Math.floor(a * FPS)];
  if (!rows) return;
  if (p.sn === 0 && p.cs === 1) {
    for (const { x, y, colors } of rows) {
      const sx = p.cellX(x, y), sy = p.cellY(x, y);
      for (let i = 0; i < colors.length; i++) p.put(sx + i * p.fx, sy, colors[i]);
    }
    return;
  }
  for (const { x, y, colors } of rows) {
    for (let i = 0; i < colors.length; i++) {
      if (colors[i]) p.dot(x + i, y, colors[i]);
    }
  }
}

const ROCKS = Array.from({ length: 18 }, (_, i) => {
  const vy = -78 - 230 * hsh(i, 9), base = -1 - 6 * hsh(i, 15), gravity = 310;
  const land = (-vy + Math.sqrt(vy * vy + 16 * gravity)) / (2 * gravity);
  return {
    vx: (i % 2 ? 1 : -1) * (22 + 125 * hsh(i, 8)), vy, base, land, gravity,
    bounce: 0.11 + 0.14 * hsh(i, 12), size: 1 + 2 * hsh(i, 10),
    tone: i % 2, spin: (hsh(i, 13) - 0.5) * 16, phase: hsh(i, 16) * TAU,
    delay: 0.24 + 0.25 * hsh(i, 14),
  };
});
const SHAPE = [[-1, -0.35], [-0.45, -1], [0.6, -0.7], [0.95, 0.15], [0.1, 0.9], [-0.74, 0.62]];

function rubble(p, t, a) {
  for (const R of ROCKS) {
    const b = Math.min(a, R.land), after = Math.max(0, a - R.land);
    const hop = Math.min(after, R.bounce);
    const x = TX + R.vx * (b + hop * 0.32);
    const y = R.base - 4 + R.vy * b + R.gravity * b * b - R.gravity * hop * (R.bounce - hop);
    const q = inhale(t, x, y, R.size, R.phase, R.delay);
    if (!q || q[2] < 0.65) continue;
    const [cx, ground, size] = q, cy = ground - size;
    const angle = R.phase + R.spin * (b + hop) + Math.max(0, t - INHALE[0] - R.delay) * 9;
    const cs = Math.cos(angle), sn = Math.sin(angle);
    const pts = SHAPE.map(([u, v]) => [cx + (u * cs - v * sn) * size, cy + (u * sn + v * cs) * size]);
    if (size >= 1.7 && a < R.land && a < 0.48) {
      const speed = R.vy + 2 * R.gravity * b;
      p.line(cx - R.vx * 0.045, cy - speed * 0.045, cx - R.vx * 0.019, cy - speed * 0.019, DUST[2]);
    }
    if (after > 0 && after < 0.23) {
      const hitX = TX + R.vx * R.land, d = 2 + after * 24;
      const lift = after * 18, side = Math.sign(R.vx);
      p.poly([[hitX - d, R.base - lift], [hitX + side * d * 0.4, R.base - lift - 3],
        [hitX + d, R.base - lift - 1], [hitX + d * 0.3, R.base - lift + 1]], DUST[2]);
      p.dot(hitX + side * d * 0.7, R.base - 2 - lift, DUST[3]);
    }
    p.poly(pts, DUST[R.tone + 1]);
    const light = Math.floor(((angle + TAU * 4) / TAU % 1) * pts.length);
    p.poly([pts[light], pts[(light + 1) % 6], pts[(light + 2) % 6], [cx, cy]], DUST[R.tone + 3]);
  }
}

const SPARKS = Array.from({ length: 27 }, (_, i) => ({
  phase: hsh(i, 64), rad: 18 + 39 * hsh(i, 65), speed: 0.9 + 0.7 * hsh(i, 66), color: i % 5 ? EMBER[2] : L[2],
}));

function embers(p, t) {
  if (t < INHALE[0] || t >= INHALE[1]) return;
  const a = t - INHALE[0], clear = smooth(INHALE[0] + 0.46, INHALE[1], t);
  for (const S of SPARKS) {
    const k = (S.phase + a * S.speed) % 1;
    if (k < clear || k > a * 5) continue;
    const y = EC[1] * k, phase = k * 13 - a * 13 + S.phase * TAU;
    const x = EC[0] + Math.sin(phase) * S.rad * (1 - 0.9 * k);
    p.dot(x, y, S.color);
    if (S.color === L[2]) p.dot(x - Math.cos(phase), y + 2, EMBER[1]);
  }
}

const RAYS = Array.from({ length: 9 }, (_, i) => {
  const q = i * TAU / 9;
  return [Math.cos(q), Math.sin(q), 28 + 18 * hsh(i, 30)];
});
const RING = Array.from({ length: 41 }, (_, i) => [Math.cos(i * TAU / 40), Math.sin(i * TAU / 40)]);

export function blast(p, t, layer) {
  const a = t - BOOM;
  if (a < 0 || t > INHALE[1] + 0.6) return;
  if (layer === 'back') {
    const k = 1 - smooth(INHALE[1] - 0.2, INHALE[1] + 0.5, t), hot = 1 - smooth(0.2, 1.8, a);
    if (k <= 0) return;
    const rx = 34 * k, ry = 3.5 * k;
    p.shade(TX - rx, -5, TX + rx, 2, (x, y, o) => {
      const e = ((x - TX) / rx) ** 2 + ((y + 1) / ry) ** 2;
      if (e > 1) return;
      o.c = e > 0.65 ? (y < -1 ? DUST[3] : DUST[1]) : e < 0.27 && hot > 0.05 ? EMBER[Math.min(2, Math.floor(hot * 3))] : DUST[0];
    });
    return;
  }
  if (a < 0.25) {
    const f = 1 - a / 0.25;
    p.glow(LC[0], LC[1], 44, L[6], 0.35 * f);
    p.disc(LC[0], LC[1], 16 * f, L[6], 1);
    for (let ring = 0; ring < 2; ring++) {
      const r = 14 + (ring ? 108 : 132) * out3(clamp(a / 0.25));
      const pts = RING.map(([x, y]) => [TX + x * r, -2 + y * r * 0.1]);
      p.polyline(pts, ring ? L[3] : L[5]);
      if (!ring && a < 0.15) p.polyline(pts.map(([x, y]) => [x, y - 1]), L[4]);
    }
  }
  drawDust(p, a);
  if (a < 0.095) {
    for (const [dx, dy, len] of RAYS) {
      const r = len * (0.75 + a * 3);
      p.poly([[TX + dx * 10 - dy * 2, LC[1] + dy * 10 + dx * 2], [TX + dx * r, LC[1] + dy * r], [TX + dx * 10 + dy * 2, LC[1] + dy * 10 - dx * 2]], L[5]);
    }
    p.disc(LC[0], LC[1], 12 * (1 - a / 0.095), L[6], 1);
  }
  rubble(p, t, a);
  embers(p, t);
}
