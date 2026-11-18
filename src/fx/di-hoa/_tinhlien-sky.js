// Tinh Lien sky: cloud spiral, burning rifts and a hooded beast eye.
import { smooth, hex } from '../../core/index.js';
import { LID, IRIS, PUPIL, VEIN, CLOUD, GATHER, APPEAR, OPENS, LOCK, SHUT, INHALE, EC, EW, EH, hsh, openAt, lockAt, pupilW, grid } from './_tinhlien-common.js';

const LEFT = -60, RIGHT = 300, CEILING = -235;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const FIRE = ['#50182a', '#ad3b16', '#ec7a20', '#ffc344', '#fff0ab'].map(hex);
const VOID = hex('#030106'), WALL = hex('#110a15'), WHITE = hex('#fffaf0');
const WET = hex('#976570'), BLOOD = hex('#b32c0d');
const LID_COLORS = [LID[0], LID[1], hex('#2d1928'), LID[2], hex('#543041'), hex('#704050')];

// Opaque spans can go straight into the painter's clipped color buffer on an
// unrotated frame. The general path preserves rotation and painter fade.
function span(p, x0, x1, y, c, solid) {
  if (!solid) {
    for (let x = x0; x < x1; x++) p.dot(x, y, c);
    return;
  }
  const sy = p.cellY(0, y) - p.oy;
  if (sy < 0 || sy >= p.h) return;
  const a = p.cellX(x0, y) - p.ox, b = p.cellX(x1 - 1, y) - p.ox;
  const lo = Math.max(0, Math.min(a, b)), hi = Math.min(p.w - 1, Math.max(a, b));
  if (lo <= hi) p.C.fill(c, sy * p.w + lo, sy * p.w + hi + 1);
}

function drawRuns(p, runs, solid) {
  if (!solid) {
    for (let i = 0; i < runs.length; i += 4) span(p, runs[i + 1], runs[i + 2], runs[i], runs[i + 3], false);
    return;
  }
  const ox = p.cellX(0, 0) - p.ox, oy = p.cellY(0, 0) - p.oy, flip = p.fx < 0;
  for (let i = 0; i < runs.length; i += 4) {
    const y = oy + runs[i];
    if (y < 0 || y >= p.h) continue;
    const lo = Math.max(0, ox + (flip ? 1 - runs[i + 2] : runs[i + 1]));
    const hi = Math.min(p.w, ox + (flip ? 1 - runs[i + 1] : runs[i + 2]));
    if (lo < hi) p.C.fill(runs[i + 3], y * p.w + lo, y * p.w + hi);
  }
}

const DARK = ['#14111c', '#110e18', '#0e0b15', '#0c0912', '#090710', '#07050d'].map(hex);
const DITHER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const DARK_COLUMNS = (RIGHT - LEFT) / 4;
const DARK_EXPOSURE = new Float32Array(-CEILING * DARK_COLUMNS);
for (let y = CEILING; y < 0; y++) {
  const sky = smooth(-8, 188, -y), falloff = 3 * smooth(0, 84, -y) * (1 - sky);
  for (let i = 0; i < DARK_COLUMNS; i++) {
    const x = LEFT + i * 4, edge = smooth(88, 208, Math.abs(x + 2 - 104));
    const shelter = y > -60 && x >= 0 && x < 200 ? smooth(0, 60, -y) : 1;
    DARK_EXPOSURE[(y - CEILING) * DARK_COLUMNS + i] = (6 * sky + edge * falloff) * shelter;
  }
}
const DARK_MEMO = [];
function darkRuns(level) {
  if (DARK_MEMO[level]) return DARK_MEMO[level];
  const runs = [], strength = level / 16;
  for (let y = CEILING; y < 0; y++) {
    let start = LEFT, previous = 0;
    const row = (y - CEILING) * DARK_COLUMNS, pattern = (y & 3) * 4;
    for (let i = 0; i < DARK_COLUMNS; i++) {
      const x = LEFT + i * 4, value = strength * DARK_EXPOSURE[row + i];
      const dither = (DITHER[pattern + (i & 3)] + 0.5) / 16;
      const index = Math.min(5, Math.floor((value + dither) * 0.85) - 1);
      const color = index >= 0 ? DARK[index] : 0;
      if (color !== previous) {
        if (previous) runs.push(y, start, x, previous);
        start = x;
        previous = color;
      }
    }
    if (previous) runs.push(y, start, RIGHT, previous);
  }
  const out = Int32Array.from(runs);
  DARK_MEMO[level] = out;
  return out;
}

function darkness(p, t, op, solid) {
  const release = 1 - smooth(SHUT[1] + 0.07, SHUT[1] + 0.8, t);
  const level = Math.round(16 * Math.min(1, 0.12 * smooth(APPEAR, OPENS[0], t) + op * 0.88) * release);
  if (level) drawRuns(p, darkRuns(level), solid);
}

// A 10 fps spiral with bilinear noise on a coarse grid. Only the visible
// cloud rows are rasterized, in two-pixel steps, and stored as same-color runs.
const CLOUD_BOTTOM = -94;
const CLOUD_MEMO = [];
const CLOUD_DIM = [hex('#100c17'), hex('#191322'), hex('#231929'), hex('#342233')];
function cloudRuns(step) {
  if (CLOUD_MEMO[step]) return CLOUD_MEMO[step];
  const t = step / 10, op = openAt(Math.min(t, SHUT[0]));
  const fade = smooth(GATHER, APPEAR, t) * (1 - smooth(6, 7, t));
  const pull = op * (1 - smooth(SHUT[0], SHUT[1] + 0.3, t));
  const turn = t * (0.6 + pull * 0.2);
  const noise = grid(LEFT, CEILING, RIGHT, CLOUD_BOTTOM, 8, (x, y) => {
    const dx = (x - EC[0]) / 124, dy = (y - EC[1]) / 45;
    const r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
    const spiral = a * 2 + (2.3 + 1.5 * pull) * Math.log(r + 0.42) + turn;
    const billow = Math.sin(x * 0.047 + y * 0.061 - t * 0.85) * 0.38 + Math.sin(x * 0.093 - y * 0.124 + t * 1.26) * 0.16;
    return Math.cos(spiral + billow) * 0.57 + Math.cos(spiral * 2 - r * 2.2) * 0.16
      + billow * 0.58 - smooth(1.15, 2.05, r) * 0.18 - smooth(0.28, 0.7, 1 - r) * 0.53;
  });
  const runs = [], pal = pull >= 0.55 ? CLOUD_DIM : CLOUD;
  const cutoff = 0.07 + (1 - fade) * 0.9;
  for (let y = CEILING; y < CLOUD_BOTTOM; y++) {
    const lower = smooth(-170, CLOUD_BOTTOM, y) * 0.53;
    let previous = 0, start = LEFT;
    for (let x = LEFT; x < RIGHT; x += 2) {
      const n = noise(x + 0.5, y + 0.5) - lower - cutoff;
      const color = n <= 0 ? 0 : pal[n < 0.14 ? 0 : n < 0.31 ? 1 : n < 0.49 ? 2 : 3];
      if (color !== previous) {
        if (previous) runs.push(y, start, x, previous);
        start = x;
        previous = color;
      }
    }
    if (previous) runs.push(y, start, RIGHT, previous);
  }
  const out = Int32Array.from(runs);
  CLOUD_MEMO[step] = out;
  return out;
}

// The left corner rolls into the tear, the right corner hooks up. The brow
// stays in front of the top quarter of the iris even at the widest opening.
const EYE_LEFT = -Math.round(EW * 1.55), EYE_RIGHT = Math.round(EW * 1.37);
const PROFILE = Array.from({ length: EYE_RIGHT - EYE_LEFT + 1 }, (_, i) => {
  const u = i / (EYE_RIGHT - EYE_LEFT), arch = Math.sin(Math.PI * u);
  const axis = 4 - 8 * u - 17 * u ** 6 + 2 * arch;
  const upper = EH * 0.47 * arch ** (0.43 + u * 0.61) * (1 - u * 0.16);
  const lower = EH * 0.78 * arch ** (0.48 + u * 0.68) * (1 - u * 0.22);
  const brow = 1 + (23 + 7 * u) * arch ** 0.72;
  const lip = 1 + 3.4 * arch;
  const scales = Math.sin(i * 0.16 + 1.6 * Math.sin(i * 0.051)) + 0.48 * Math.sin(i * 0.43);
  return { axis, upper, lower, brow, lip, scales };
});

// Points are [relative x, relative y, upper bank width, lower bank width].
// The banks splinter away from the hood and uncover different depths.
const RIFTS = [
  { at: 0, points: [[-141, 0, 3, 6], [-155, 4, 5, 4], [-166, -2, 8, 3], [-178, 3, 4, 6], [-185, -7, 6, 3], [-194, -9, 3, 4], [-204, -24, 2, 4], [-219, -27, 1, 1]] },
  { at: 0, points: [[116, -13, 10, 4], [133, -21, 4, 6], [144, -26, 7, 2], [154, -23, 4, 7], [163, -38, 4, 4], [177, -44, 2, 4]] },
  { at: 0.19, points: [[-166, -3, 2, 4], [-172, -14, 4, 2], [-179, -31, 2, 3], [-190, -39, 2, 2], [-194, -55, 1, 1]] },
  { at: 0.32, points: [[-178, 5, 2, 4], [-184, 19, 4, 4], [-195, 24, 3, 2], [-201, 40, 1, 3], [-216, 45, 1, 1]] },
  { at: 0.51, points: [[-185, -7, 3, 2], [-197, 3, 2, 3], [-206, 1, 2, 2], [-218, 13, 1, 1]] },
  { at: 0.2, points: [[122, -16, 3, 4], [129, -32, 4, 3], [126, -43, 2, 4], [140, -59, 1, 2]] },
  { at: 0.34, points: [[133, -19, 3, 5], [141, -9, 3, 3], [138, 7, 2, 4], [147, 21, 3, 2], [157, 38, 1, 1]] },
  { at: 0.58, points: [[-141, 2, 2, 4], [-149, 16, 3, 3], [-144, 27, 4, 2], [-164, 41, 1, 2]] },
];
function rift(p, t, op, shut) {
  const growth = (0.11 * smooth(APPEAR, OPENS[0], t) + 0.89 * op) * (1 - shut);
  for (const { at, points } of RIFTS) {
    const length = clamp01((growth - at) / (1 - at)) * (points.length - 1);
    for (let j = 0; j < length; j++) {
      const [ax, ay, ah, al] = points[j], [bx, by, bh, bl] = points[j + 1];
      const fraction = Math.min(1, length - j), dx = Math.abs(bx - ax), direction = Math.sign(bx - ax);
      const steps = Math.ceil(dx * fraction);
      const width = (0.55 + 0.62 * growth) * (1 - shut), hot = Math.sin(t * 11 + j * 2.4 + ax * 0.08);
      let oldTop = 0, oldBottom = 0;
      for (let k = 0; k < steps; k++) {
        const u = k / dx, x = EC[0] + ax + direction * k;
        const y = EC[1] + ay + (by - ay) * u;
        const neck = fraction < 1 ? Math.min(1, (fraction - u) * 7) : 1;
        const top = y - (ah + (bh - ah) * u) * width * neck;
        const bottom = y + (al + (bl - al) * u) * width * neck;
        p.line(x, k ? Math.min(top, oldTop + 1) : top, x, k ? Math.max(bottom, oldBottom - 1) : bottom, VOID);
        if (bottom - top > 5) p.dot(x, bottom - 1, WALL);
        const upper = FIRE[hot + Math.sin(k * 0.45) * 0.32 > 0.65 ? 3 : 2];
        if (k && Math.abs(top - oldTop) > 1) p.line(x - direction, oldTop, x, top, upper);
        else p.dot(x, top, upper);
        if (bottom - top > 1 && (hot > 0.25 || k % 8 < 4)) p.dot(x, bottom, FIRE[hot > 0.48 ? 2 : 1]);
        oldTop = top;
        oldBottom = bottom;
      }
    }
  }
}

const IRX = ['#3b170e', '#54200c', '#863408', '#bd5812', '#eb851f', '#ffb830', '#ffd860', '#ffed9a'].map(hex);
const ECHO = [hex('#65200b'), hex('#8c2b0d'), BLOOD];
const RX = Math.round(EW * 1.08), RY = 29, DIAMETER = 2 * RY + 1;
const COLLARETTE = 9, RIM = 10;
const IRIS_MAP = new Uint8Array((2 * RX + 1) * DIAMETER);
const PUPIL_CURVE = new Float32Array(DIAMETER);
for (let j = -RY; j <= RY; j++) {
  const ey = j / RY;
  PUPIL_CURVE[j + RY] = Math.max(0, 1 - ey * ey) ** 0.65;
  for (let i = -RX; i <= RX; i++) {
    const ex = i / RX, r = Math.sqrt(ex * ex + ey * ey);
    if (r > 1) continue;
    const a = Math.atan2(ey, ex);
    const cr = 0.27 + 0.05 * Math.sin(a * 11 + 1.9 * Math.sin(a * 3));
    const fiber = Math.sin(a * 41 + 1.2 * Math.sin(a * 17) + r * 4) + 0.6 * Math.sin(a * 67 - r * 5);
    let shade = r < cr ? 4 : r < 0.55 ? 5 : r < 0.78 ? 4 : 3;
    shade += fiber > 0.48 ? 1 : fiber < -0.48 ? -1 : 0;
    if (r > 0.45 && r < 0.92 && Math.sin(r * 59 + a * 17) + fiber < -1.4) shade -= 2;
    IRIS_MAP[(i + RX) * DIAMETER + j + RY] = r >= 0.955 ? RIM
      : Math.abs(r - cr) < 0.035 ? COLLARETTE : shade;
  }
}
const SCLERA = hex('#281016');
const CORNEA = Array.from({ length: 4 }, (_, mode) => Array.from({ length: 3 }, (_, shadow) => {
  const colors = [shadow === 2 ? WALL : SCLERA];
  for (let i = 0; i < IRX.length; i++) {
    const normal = IRX[Math.max(0, Math.min(7, i + mode - shadow))];
    colors.push(mode === 3 && i >= 2 ? (i + mode - shadow > 7 && i % 2 ? IRX[7] : IRIS[4]) : normal);
  }
  colors[COLLARETTE] = mode === 3 ? FIRE[2] : ECHO[2 - shadow];
  colors[RIM] = mode === 3 ? IRIS[4] : IRX[0];
  return colors;
}));

const TONGUES = Array.from({ length: 27 }, (_, i) => {
  const u = hsh(i, 50), bottom = i % 4 === 1;
  const x = i % 3 === 0 ? 58 + 72 * u : -149 + 267 * u;
  const size = (9 + 18 * smooth(30, 129, Math.abs(x)) + 9 * smooth(38, 125, x)) * (0.48 + 0.72 * hsh(i, 51));
  return { x, size: bottom ? size * 0.66 : size, bottom, phase: hsh(i, 52), curl: 0.8 + hsh(i, 53) };
});
const EMBERS = Array.from({ length: 37 }, (_, i) => ({
  period: 0.55 + hsh(i, 70) * 0.95,
  phase: hsh(i, 71), angle: hsh(i, 72) * 6.28318530718,
  stretch: 0.62 + hsh(i, 73) * 0.6,
}));

function flames(p, t, amount, heat, pull, upper, lower, solid) {
  for (const { x, size, bottom, phase, curl } of TONGUES) {
    const cycle = (t * (2.1 + phase * 2.4) + phase * 9) % 1;
    const pulse = smooth(0, 0.26, cycle) * (1 - smooth(0.5, 1, cycle));
    const root = Math.round(x * (1 - cycle * 0.16 * pull));
    const i = root - EYE_LEFT, side = bottom ? 1 : -1;
    const height = size * amount * (0.28 + 0.72 * pulse) * (1 + 0.18 * heat);
    const width = (1.6 + size * 0.18) * (0.58 + pulse * 0.42);
    const y0 = (bottom ? lower[i] : upper[i]) - side * 3;
    const lean = -Math.sign(x) * (0.28 + pull * 0.52);
    for (let d = 0; d < height; d++) {
      const f = d / height, y = y0 + side * d;
      if (y < CEILING) continue;
      const turn = f * (0.3 + f * 0.92);
      const mid = EC[0] + root + lean * height * turn * curl + f * (phase - 0.52) * height;
      const w = width * (1 - f) * (0.52 + f * 1.8);
      const k = f < 0.17 ? 1 : f < 0.39 ? 3 : f < 0.76 ? 2 : 1;
      span(p, Math.floor(mid - w), Math.floor(mid + w) + 1, y, FIRE[k], solid);
      if (f > 0.16 && f < 0.48 && w > 1.5) span(p, Math.floor(mid - w * 0.35), Math.floor(mid) + 1, y, FIRE[4], solid);
    }
  }
}

const TOP = new Int16Array(PROFILE.length), BOTTOM = new Int16Array(PROFILE.length);
const BROW = new Int16Array(PROFILE.length), LIP = new Int16Array(PROFILE.length);
const PUPIL_HALF = new Float32Array(DIAMETER);

function eye(p, t, op, shut, solid) {
  if (t < APPEAR || t >= SHUT[1] + 0.15) return;
  const birth = smooth(APPEAR, APPEAR + 0.12, t), lock = lockAt(t);
  const inhale = smooth(INHALE[0], INHALE[0] + 0.65, t);
  const seamWidth = 1 - smooth(SHUT[1] + 0.02, SHUT[1] + 0.15, t);
  if (shut >= 0.98) {
    const color = t < SHUT[1] + 0.035 ? FIRE[4] : FIRE[seamWidth > 0.54 ? 2 : 1];
    const reach = Math.floor(PROFILE.length * 0.51 * seamWidth);
    for (let i = 1; i < PROFILE.length; i++) {
      if (Math.abs(i - PROFILE.length * 0.5) >= reach) continue;
      const x = EC[0] + EYE_LEFT + i;
      p.line(x - 1, EC[1] + PROFILE[i - 1].axis, x, EC[1] + PROFILE[i].axis, color);
    }
    return;
  }

  let tremor = 0, flash = 0;
  for (const at of OPENS) {
    const age = t - at;
    if (age >= 0 && age < 0.2) {
      tremor += Math.sin(age * 82) * (1 - age / 0.2) * 1.1;
      flash = Math.max(flash, 1 - age / 0.2);
    }
  }
  const lockTime = t - LOCK, flare = lockTime >= 0 && lockTime <= 0.12;
  const snap = smooth(0, 2 / 30, lockTime);
  const width = pupilW(t) * (1 - 0.52 * snap * (1 - smooth(0.09, 0.24, lockTime))) * (1 + 0.43 * inhale);
  const colors = CORNEA[flare ? 3 : flash > 0.2 || inhale > 0.5 ? 2 : lock > 0.6 ? 1 : 0];
  const live = 1 - shut;
  const xIris = Math.round(Math.sin(t * 2) * 2 * (1 - lock)), yIris = 4;
  for (let j = 0; j < DIAMETER; j++) PUPIL_HALF[j] = width * PUPIL_CURVE[j];

  for (let i = 0; i < PROFILE.length; i++) {
    const { axis, upper, lower, brow, lip, scales } = PROFILE[i];
    const close = lower * Math.min(1, op + shut) * shut * live;
    const top = axis - upper * op + close * 2.4 + (tremor + 1.6 * lock) * upper / EH * live;
    const bottom = axis + lower * op + close;
    TOP[i] = Math.round(EC[1] + Math.min(top, bottom));
    BOTTOM[i] = Math.round(EC[1] + bottom);
    BROW[i] = Math.round(TOP[i] - brow * birth * (1 - shut * 0.75) + scales);
    LIP[i] = Math.round(BOTTOM[i] + lip * birth);
  }
  flames(p, t, birth * live, lock + flash + inhale, 0.6 + lock * 0.4 + inhale * 0.5, BROW, LIP, solid);

  const ox = solid ? p.cellX(0, 0) - p.ox : 0, oy = solid ? p.cellY(0, 0) - p.oy : 0;
  for (let i = 0; i < PROFILE.length; i++) {
    const dx = EYE_LEFT + i, x = EC[0] + dx;
    const top = TOP[i], bottom = BOTTOM[i];
    const from = Math.max(CEILING, BROW[i]), to = LIP[i];
    const sx = ox + x * p.fx;
    if (solid && (sx < 0 || sx >= p.w)) continue;
    const firstY = solid ? Math.max(from, -oy) : from, lastY = solid ? Math.min(to, p.h - oy - 1) : to;
    const du = dx - xIris, irisX = du < 0 ? Math.round(du * 0.82) : du;
    const irisOffset = (irisX + RX) * DIAMETER, inIris = Math.abs(irisX) <= RX;
    const radiusX = Math.abs(du);
    const mass = top - from, sc = PROFILE[i].scales;
    const fold = Math.round(mass * (0.33 + sc * 0.048)), ridge = Math.round(mass * (0.61 + sc * 0.08));
    for (let y = firstY; y <= lastY; y++) {
      let color;
      if (y < top) {
        const d = top - y;
        const index = d <= 2 || d === mass ? 0 : d === fold && sc > -0.7 ? 1
          : d === ridge && sc > -0.55 ? 4 : d < fold ? 3 : d < ridge ? 2 : sc > 0.45 ? 3 : 1;
        color = LID_COLORS[index];
        if (d === 3 && sc > 0.55) color = LID_COLORS[5];
      } else if (y > bottom) {
        color = y === bottom + 1 ? (sc > 0.65 ? WET : LID_COLORS[3]) : y === to ? LID[0] : LID[1];
      } else if (bottom - top < 2) {
        color = sc > -0.2 ? FIRE[2] : FIRE[1];
      } else {
        const j = y - EC[1] - yIris + RY;
        const shadow = y - top < 3 ? 2 : y - top < 6 ? 1 : 0;
        const code = inIris && j >= 0 && j < DIAMETER ? IRIS_MAP[irisOffset + j] : 0;
        const half = PUPIL_HALF[j];
        color = code && radiusX < half ? PUPIL : code && radiusX < half + 1.6 ? VEIN : colors[shadow][code];
      }
      if (solid) p.C[(oy + y) * p.w + sx] = color;
      else p.dot(x, y, color);
    }
  }

  if (op > 0.2 && live > 0.62) {
    const x = EC[0] + xIris - 27, y = Math.max(TOP[x - EC[0] - EYE_LEFT] + 3, EC[1] - 4);
    p.rect(x, y, 4, 2, WHITE);
    p.dot(x - 1, y + 1, WHITE);
    p.dot(x, y + 2, WHITE);
    const gx = EC[0] + xIris + 36, gy = Math.min(EC[1] + 12, BOTTOM[gx - EC[0] - EYE_LEFT] - 1);
    p.rect(gx, gy, 2, 1, WHITE);
    if (op > 0.75) p.dot(x + 7, y + 2, WHITE);
  }

  for (let i = 0; i < EMBERS.length; i++) {
    const { period, phase, angle, stretch } = EMBERS[i];
    const f = (t / period + phase) % 1;
    if (birth * live < phase * 0.8 || f > 0.92) continue;
    const a = angle + f * (2.7 + lock), radius = (1 - f ** 1.4) * stretch;
    const x = EC[0] + xIris + Math.cos(a) * (EW + 47) * radius;
    const y = EC[1] + yIris + Math.sin(a) * (39 + 20 * op) * radius;
    if (y < CEILING) continue;
    const color = FIRE[f < 0.25 ? 1 : f < 0.62 ? 2 : f < 0.82 ? 4 : 3];
    p.dot(x, y, color);
    if (i % 5 === 0 && f > 0.25 && f < 0.75) p.dot(x + Math.sin(a) * 2, y - Math.cos(a) * 2, FIRE[1]);
  }
}

export function sky(p, t, layer) {
  if (layer !== 'back') return;
  const solid = p.sn === 0 && p.cs === 1 && p.fade === 1;
  const op = Math.min(1, openAt(Math.min(t, SHUT[0])));
  const progress = smooth(SHUT[0], SHUT[1], t);
  const shut = 1 - (1 - progress) ** 2;
  darkness(p, t, op, solid);
  if (t > GATHER && t < 7) drawRuns(p, cloudRuns(Math.floor(t * 10)), solid);
  if (t >= APPEAR && shut < 1) rift(p, t, op, shut);
  eye(p, t, op * (1 - shut), shut, solid);
}
