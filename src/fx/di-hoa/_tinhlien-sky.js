// Tinh Lien sky: cloud spiral, burning rifts and a hooded beast eye.
import { smooth, hex } from '../../core/index.js';
import { L, LID, IRIS, PUPIL, VEIN, CLOUD, GATHER, APPEAR, OPENS, LOCK, BOOM, SHUT, INHALE, EC, EW, EH, hsh, openAt, lockAt, pupilW, grid } from './_tinhlien-common.js';

const LEFT = -60, RIGHT = 300, CEILING = -235;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const iSparks = (phase) => phase > 0.58;   // only some tongues throw a spark off their tip
const FIRE = ['#50182a', '#ad3b16', '#ec7a20', '#ffc344', '#fff0ab'].map(hex);
const VOID = hex('#030106'), WALL = hex('#110a15'), WHITE = hex('#fffaf0');
const WET = hex('#976570'), BLOOD = hex('#b32c0d'), WATERLINE = hex('#ae795e');
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

const DARK = ['#14111c', '#110e18', '#0e0b15', '#0c0912', '#090710', '#060408'].map(hex);
const EDGE_DITHER = [0.125, 0.625, 0.375, 0.875, 0.25, 0.75, 0, 0.5];
const DARK_MEMO = [];
function darkRuns(level) {
  if (DARK_MEMO[level]) return DARK_MEMO[level];
  const runs = [], radius = 1.69 - 0.97 * level / 16;
  const cx = EC[0] - 29, cy = EC[1] + 80;
  for (let y = CEILING; y < -3; y++) {
    const dy = (y + 0.5 - cy) / 119;
    const shelter = 0.22 * smooth(-62, -3, y);
    let left = LEFT, right = RIGHT;
    // Dither only the two subpixel crossings of each solid ellipse band.
    for (let i = DARK.length - 1; i >= 0; i--) {
      const r = radius + i * 0.071 + shelter, dx2 = r * r - dy * dy;
      if (dx2 <= 0) {
        if (left < right) runs.push(y, left, right, DARK[i]);
        break;
      }
      const dx = 172 * Math.sqrt(dx2), stagger = EDGE_DITHER[(y + 3 * i) & 7];
      const lo = Math.min(right, Math.max(left, Math.floor(cx - dx + stagger)));
      const hi = Math.max(lo, Math.min(right, Math.floor(cx + dx + 1 - stagger)));
      if (lo > left) runs.push(y, left, lo, DARK[i]);
      if (hi < right) runs.push(y, hi, right, DARK[i]);
      left = lo;
      right = hi;
    }
  }
  const out = Int32Array.from(runs);
  DARK_MEMO[level] = out;
  return out;
}

function darkness(p, t, op, solid) {
  const release = 1 - smooth(SHUT[1] + 0.2, SHUT[1] + 0.91, t);
  const strength = 0.08 * smooth(APPEAR, OPENS[0], t) + op * 0.69 + 0.13 * lockAt(t) + 0.1 * smooth(BOOM, BOOM + 0.5, t);
  const level = Math.round(16 * strength * release);
  if (level) drawRuns(p, darkRuns(level), solid);
}

// A 10 fps spiral with bilinear noise on a coarse grid. Only the visible
// cloud rows are rasterized and stored as same-color runs.
const CLOUD_BOTTOM = -94;
const CLOUD_MEMO = [];
const CLOUD_DIM = [hex('#100c17'), hex('#191322'), hex('#231929'), hex('#2c1f31'), hex('#342839'), hex('#423244')];
const CLOUD_LIT = [CLOUD[0], CLOUD[1], CLOUD[2], hex('#392f40'), CLOUD[3], hex('#584451')];
const CLOUD_GLOW = [hex('#432820'), hex('#684027'), hex('#9b612c')];
function cloudRuns(step) {
  if (CLOUD_MEMO[step]) return CLOUD_MEMO[step];
  const t = step / 10, op = openAt(Math.min(t, SHUT[0]));
  const fade = smooth(GATHER, APPEAR, t) * (1 - smooth(6, 7.06, t));
  const pull = op * (1 - smooth(SHUT[0], SHUT[1] + 0.3, t));
  const turn = t * (0.58 + pull * 0.16), flash = OPENS.some((at) => t >= at && t < at + 0.2);
  const noise = grid(LEFT, CEILING, RIGHT, CLOUD_BOTTOM, 6, (x, y) => {
    const dx = (x - EC[0]) / 124, dy = (y - EC[1]) / 52;
    const r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
    const spiral = a * 2 + (2.7 + 1.25 * pull) * Math.log(r + 0.32) + turn;
    const billow = Math.sin(x * 0.042 + y * 0.071 - t * 0.85) * 0.34 + Math.sin(x * 0.091 - y * 0.104 + t * 1.26) * 0.14;
    const roll = Math.sin(spiral * 2 - r * 3.1 + billow * 3 + Math.sin(a * 3 + r * 4));
    const fold = 0.22 * Math.cos(spiral * 3 - r * 4.9 + roll * 1.1);
    const canopy = 0.24 * (1 - pull) * smooth(6, 48, EC[1] - y);
    return 0.24 + canopy + Math.cos(spiral + billow + 0.2 * roll) * 0.43 + fold + billow * 0.57
      - smooth(1.3, 2.3, r) * 0.16 - smooth(0.22, 0.78, 1 - r) * 0.54;
  });
  const runs = [], pal = pull >= 0.55 ? CLOUD_DIM : CLOUD_LIT;
  const cutoff = 0.12 + (1 - fade) * 1.12;
  for (let y = CEILING; y < CLOUD_BOTTOM; y++) {
    const lower = smooth(-175, CLOUD_BOTTOM, y) * 0.89;
    const glow = pull > 0.16 && y < -129;
    const glowCutoff = flash ? 0.64 : 0.75;
    let previous = 0, start = LEFT;
    for (let x = LEFT; x < RIGHT; x++) {
      const n = noise(x + 0.5, y + 0.5) - lower - cutoff;
      const band = Math.min(pal.length - 1, Math.floor(n * 7.8));
      let color = band < 0 ? 0 : pal[band];
      if (glow && n > glowCutoff && Math.abs(x - EC[0]) < 165) {
        color = CLOUD_GLOW[flash ? (n > 0.8 ? 2 : 1) : n > 0.82 ? 1 : 0];
      }
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
const EYE_LEFT = -Math.round(EW * 1.39), EYE_RIGHT = Math.round(EW * 1.23);
const PROFILE_END = EYE_RIGHT - EYE_LEFT;
const PROFILE = Array.from({ length: PROFILE_END + 1 }, (_, i) => {
  const u = i / PROFILE_END, arch = i === PROFILE_END ? 0 : Math.sin(Math.PI * u);
  const axis = 4 - 8 * u - 13 * u ** 6 + 1.5 * arch;
  const upper = EH * (0.94 + 0.18 * u) * arch ** (0.44 + u * 0.22);
  const lower = EH * (0.88 - 0.16 * u) * arch ** (0.54 + u * 0.48);
  const brow = 1 + (15 + 5 * u) * arch ** 0.72;
  const lip = 1 + 5.8 * arch;
  const scales = Math.sin(i * 0.16 + 1.6 * Math.sin(i * 0.051)) + 0.48 * Math.sin(i * 0.43);
  return { axis, upper, lower, brow, lip, scales, arch };
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
function rift(p, t, op) {
  const seal = smooth(SHUT[1] - 0.035, SHUT[1] + 0.48, t);
  const growth = (0.11 * smooth(APPEAR, OPENS[0], t) + 0.89 * op) * (1 - seal);
  for (const { at, points } of RIFTS) {
    const length = clamp01((growth - at) / (1 - at)) * (points.length - 1);
    for (let j = 0; j < length; j++) {
      const [ax, ay, ah, al] = points[j], [bx, by, bh, bl] = points[j + 1];
      const fraction = Math.min(1, length - j), dx = Math.abs(bx - ax), direction = Math.sign(bx - ax);
      const steps = Math.ceil(dx * fraction);
      const width = (0.55 + 0.62 * growth) * (1 - 0.65 * seal), hot = Math.sin(t * 11 + j * 2.4 + ax * 0.08);
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
const ECHO = [hex('#65200b'), VEIN, BLOOD];
const RX = Math.round(EW * 0.74), RY = 36, DIAMETER = 2 * RY + 1;
const COLLARETTE = 9, RIM = 10, SOFT_RIM = 11;
const IRIS_MAP = new Uint8Array((2 * RX + 1) * DIAMETER);
const PUPIL_CURVE = new Float32Array(DIAMETER);
for (let j = -RY; j <= RY; j++) {
  const ey = j / RY;
  PUPIL_CURVE[j + RY] = Math.max(0, 1 - ey * ey) ** 0.65;
  for (let i = -RX; i <= RX; i++) {
    const ex = i / RX, r = Math.sqrt(ex * ex + ey * ey);
    if (r > 1) continue;
    const a = Math.atan2(ey, ex);
    const bend = a + 0.068 * Math.sin(a * 5 + r * 4) + 0.045 * r * Math.cos(a * 4);
    const cr = 0.31 + 0.048 * Math.sin(a * 13 + 1.55 * Math.sin(a * 5)) + 0.025 * Math.sin(a * 29);
    const fiber = Math.sin(bend * 23 + Math.sin(a * 7)) + 0.55 * Math.sin(bend * 47 + 0.7);
    const split = Math.cos(bend * 61 - r * 4) * smooth(0.35, 0.9, r);
    const pits = r > cr && Math.sin(r * 47 + a * 19 + fiber) < -0.4 ? 1.25 : 0;
    const shade = Math.round(7.4 - 4.35 * r + 1.24 * fiber + 0.6 * split - pits + (r < cr ? 0.8 : 0));
    IRIS_MAP[(i + RX) * DIAMETER + j + RY] = r > 0.975 ? RIM : r > 0.93 + 0.013 * fiber ? SOFT_RIM
      : Math.abs(r - cr) < 0.027 + 0.006 * fiber ? COLLARETTE : Math.max(1, Math.min(8, shade));
  }
}
const SCLERA = [hex('#281016'), hex('#321516'), hex('#361a18')];
const CORNEA = Array.from({ length: 4 }, (_, mode) => Array.from({ length: 3 }, (_, shadow) => {
  const colors = [shadow === 2 ? WALL : SCLERA[0]];
  for (let i = 0; i < IRX.length; i++) {
    const normal = IRX[Math.max(0, Math.min(7, i + mode - shadow))];
    if (mode === 3 && i >= 2) colors.push(i >= 6 ? IRX[7] : i === 2 ? IRIS[2] : IRIS[4]);
    else colors.push(normal);
  }
  colors[COLLARETTE] = mode === 3 ? ECHO[2] : ECHO[2 - shadow];
  colors[RIM] = IRX[0];
  colors[SOFT_RIM] = mode === 3 ? IRIS[1] : IRX[shadow > 0 ? 0 : 1];
  return colors;
}));

const TONGUES = Array.from({ length: 74 }, (_, i) => {
  const side = i < 39 ? -1 : 1, j = side < 0 ? i : i - 39;
  const u = (j + 0.2 + 0.6 * hsh(i, 50)) / (side < 0 ? 39 : 35);
  const x = EYE_LEFT + u * PROFILE_END;
  const size = (13 + 11 * smooth(22, 122, Math.abs(x)) + 8 * smooth(45, 117, x)) * (0.52 + 0.72 * hsh(i, 51));
  return { x, size: side > 0 ? size * 0.73 : size, side, phase: hsh(i, 52), curl: 0.6 + 0.7 * hsh(i, 53) };
});
const EMBERS = Array.from({ length: 56 }, (_, i) => ({
  period: 0.55 + hsh(i, 70) * 0.95,
  phase: hsh(i, 71), angle: hsh(i, 72) * 6.28318530718,
  stretch: 0.62 + hsh(i, 73) * 0.6,
}));

function flames(p, t, amount, heat, pull, upper, lower, solid) {
  if (amount < 0.08) return;
  for (const { x, size, side, phase, curl } of TONGUES) {
    const cycle = (t * (2.1 + phase * 2.4) + phase * 9) % 1;
    const pulse = smooth(0, 0.26, cycle) * (1 - smooth(0.5, 1, cycle));
    const root = Math.round(x * (1 - cycle * 0.036 * pull));
    const bank = side > 0 ? lower : upper, y0 = bank[root - EYE_LEFT];
    const rise = size * amount * (0.33 + 0.67 * pulse) * (1 + 0.18 * heat);
    const height = side < 0 ? Math.min(rise, (y0 - CEILING) * (0.77 + 0.23 * pulse)) : rise;
    const width = (1.7 + size * 0.115) * (0.69 + pulse * 0.31);
    const lean = -x / Math.max(32, Math.abs(x)) * (0.3 + pull * 0.55);
    for (let d = 1; d <= height; d++) {
      const f = d / height;
      const bend = f * (0.28 + f * 0.95) * curl;
      const sx = EC[0] + root + height * (lean * bend + (phase - 0.5) * f * (1.55 - f));
      const y = y0 + side * d;
      const w = width * (1 - f) * (0.78 + f * 0.76);
      const color = f < 0.35 ? L[3] : f < 0.66 ? L[2] : f < 0.89 ? FIRE[2] : FIRE[1];
      span(p, Math.floor(sx - w), Math.floor(sx + w) + 1, y, color, solid);
      if (f < 0.6 && w > 1.15) {
        span(p, Math.floor(sx - w * 0.41), Math.floor(sx + w * 0.32) + 1, y, f < 0.24 ? L[5] : f < 0.4 ? L[4] : FIRE[3], solid);
      }
      if (d + 1 > height && pulse > 0.5 && iSparks(phase)) {
        p.dot(sx + lean * 2.8, y + side * 2, FIRE[2]);
      }
    }
  }

  // Join each tongue at the bank with a solid hot ribbon on both lids.
  for (let side = -1; side <= 1; side += 2) {
    const bank = side < 0 ? upper : lower;
    for (let i = 0; i < bank.length; i++) {
      const x = EC[0] + EYE_LEFT + i, base = bank[i];
      const slope = Math.max(Math.abs(base - (bank[i - 1] ?? base)), Math.abs(base - (bank[i + 1] ?? base)));
      const wave = Math.sin(i * 0.18 - t * 16 * side + PROFILE[i].scales * 0.5);
      const thickness = Math.max(1, Math.round((1.8 + wave + heat * 0.5) * amount), slope - 1);
      for (let d = 1; d <= thickness + 2; d++) {
        const y = base + side * d;
        if (y < CEILING) continue;
        const color = d === 1 ? L[wave > -0.35 ? 5 : 4] : d <= thickness ? L[wave > 0.65 ? 4 : 3]
          : d === thickness + 1 ? L[2] : FIRE[wave > 0 ? 3 : 2];
        p.dot(x, y, color);
      }
    }
  }
}

const TOP = new Int16Array(PROFILE.length), BOTTOM = new Int16Array(PROFILE.length);
const BROW = new Int16Array(PROFILE.length), LIP = new Int16Array(PROFILE.length);
const PUPIL_HALF = new Float32Array(DIAMETER);

function eye(p, t, op, shut, solid) {
  if (t < APPEAR || t >= SHUT[1] + 0.36) return;
  const birth = smooth(APPEAR, APPEAR + 0.105, t), lock = lockAt(t);
  const inhale = smooth(INHALE[0], INHALE[0] + 0.65, t);
  if (shut === 1) {
    const age = t - SHUT[1], reach = 1 - smooth(0.055, 0.36, age);
    const start = Math.floor(PROFILE_END * (1 - reach) / 2), end = PROFILE_END - start;
    for (let i = start; i <= end; i++) {
      const x = EC[0] + EYE_LEFT + i;
      const { axis, lower } = PROFILE[i];
      const y = EC[1] + axis + lower * 0.56 * reach;
      if (age < 0.095 && i > start + 8 && i < end - 8) p.line(x, y - 1, x, y + 1, L[5]);
      p.dot(x, y, age < 0.095 ? L[6] : age < 0.22 ? FIRE[3] : FIRE[1]);
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
  const snap = smooth(-0.5 / 30, 1.5 / 30, lockTime) * (1 - smooth(0.08, 0.24, lockTime));
  const width = pupilW(Math.min(t, SHUT[0])) * (1 - 0.62 * snap) * (1 + 0.64 * inhale);
  const colors = CORNEA[flare ? 3 : flash > 0.2 || inhale > 0.5 ? 2 : lock > 0.6 ? 1 : 0];
  const live = 1 - shut;
  const xIris = Math.round(Math.sin(t * 2) * 2 * (1 - lock)), yIris = 4;
  for (let j = 0; j < DIAMETER; j++) PUPIL_HALF[j] = width * PUPIL_CURVE[j];

  for (let i = 0; i < PROFILE.length; i++) {
    const { axis, upper, lower, brow, lip, scales } = PROFILE[i];
    const join = axis + lower * op * 0.56;
    const topOpen = axis - upper * op + (tremor + 1.8 * lock) * upper / EH;
    const top = topOpen * live + join * shut;
    const bottom = (axis + lower * op) * live + join * shut;
    TOP[i] = Math.round(EC[1] + Math.min(top, bottom));
    BOTTOM[i] = Math.round(EC[1] + bottom);
    BROW[i] = Math.round(TOP[i] - brow * birth * (1 - shut * 0.38) + scales * birth * 0.7);
    LIP[i] = Math.round(BOTTOM[i] + lip * birth * (1 - shut * 0.22));
  }
  flames(p, t, birth * (1 - shut * 0.5), lock + flash + inhale, 0.6 + lock * 0.4 + inhale * 0.5, BROW, LIP, solid);

  const ox = solid ? p.cellX(0, 0) - p.ox : 0, oy = solid ? p.cellY(0, 0) - p.oy : 0;
  for (let i = 0; i < PROFILE.length; i++) {
    const dx = EYE_LEFT + i, x = EC[0] + dx;
    const top = TOP[i], bottom = BOTTOM[i];
    const from = Math.max(CEILING, BROW[i]), to = LIP[i];
    const sx = ox + x * p.fx;
    if (solid && (sx < 0 || sx >= p.w)) continue;
    const firstY = solid ? Math.max(from, -oy) : from, lastY = solid ? Math.min(to, p.h - oy - 1) : to;
    const du = dx - xIris, irisX = du < 0 ? Math.round(du * 0.91) : du;
    const irisOffset = (irisX + RX) * DIAMETER, inIris = Math.abs(irisX) <= RX;
    const radiusX = Math.abs(du);
    const mass = top - from, sc = PROFILE[i].scales;
    const fold = Math.round(mass * (0.36 + sc * 0.052)), ridge = Math.round(mass * (0.68 + sc * 0.082));
    const shadowEdge = 3 + Math.round((sc + 0.48) * 0.65);
    for (let y = firstY; y <= lastY; y++) {
      let color;
      if (y < top) {
        const d = top - y;
        const index = d === 1 || d === mass ? 0 : d === fold ? 0 : d === ridge ? 1
          : d < fold ? 3 : d < ridge ? 2 : sc > 0.45 ? 3 : 1;
        color = LID_COLORS[index];
        if (d === 2 && d < mass) color = sc > 0.62 ? WET : LID_COLORS[4];
        if (d === ridge - 1 && sc > 0.44 && d > fold) color = LID_COLORS[5];
      } else if (y > bottom) {
        const d = y - bottom;
        color = d === 1 ? (sc > 0.32 ? WATERLINE : WET) : d === 2 ? LID_COLORS[4] : y === to ? LID[0] : LID_COLORS[3];
      } else if (bottom - top < 2) {
        color = sc > -0.2 ? FIRE[2] : FIRE[1];
      } else {
        const j = y - EC[1] - yIris + RY;
        const depth = y - top, shadow = depth < shadowEdge ? 2 : depth < shadowEdge + 2 ? 1 : 0;
        const code = inIris && j >= 0 && j < DIAMETER ? IRIS_MAP[irisOffset + j] : 0;
        const half = PUPIL_HALF[j];
        color = code && radiusX < half ? PUPIL : code && radiusX < half + 1.6 ? VEIN : colors[shadow][code];
      }
      if (solid) p.C[(oy + y) * p.w + sx] = color;
      else p.dot(x, y, color);
    }
  }

  if (op > 0.2 && live > 0.62) {
    const x = EC[0] + xIris - 27, i = x - EC[0] - EYE_LEFT;
    const y = Math.max(TOP[i] + 3, EC[1] + yIris - 14 * op);
    if (y + 3 <= BOTTOM[i]) {
      p.rect(x, y, 5, 2, WHITE);
      p.rect(x - 1, y + 2, 2, 2, WHITE);
      p.dot(x + 5, y + 1, IRX[7]);
    }
    const gx = EC[0] + xIris + 29, gy = Math.min(EC[1] + 12, BOTTOM[gx - EC[0] - EYE_LEFT] - 1);
    p.rect(gx, gy, 2, 1, WHITE);
    const lip = Math.round(PROFILE_END * (0.22 + (t * 0.19) % 0.56));
    p.dot(EC[0] + EYE_LEFT + lip, BOTTOM[lip] + 1, L[4]);
  }

  for (let i = 0; i < EMBERS.length; i++) {
    const { period, phase, angle, stretch } = EMBERS[i];
    const f = (t / period + phase) % 1;
    if (birth * live < phase * 0.8 || f > 0.92) continue;
    const a = angle + f * (3.3 + lock + 0.9 * inhale), radius = (1 - f ** 1.4) * stretch;
    const x = EC[0] + xIris + Math.cos(a) * (EW + 47) * radius;
    const y = EC[1] + yIris + Math.sin(a) * (39 + 20 * op) * radius;
    if (y < CEILING) continue;
    const color = f < 0.18 ? FIRE[2] : f < 0.46 ? L[2] : f < 0.72 ? L[4] : L[5];
    p.dot(x, y, color);
    if (i % 4 === 0 && f > 0.25 && f < 0.75) {
      const tail = a - 0.13, tailRadius = radius + 0.075;
      const xx = EC[0] + xIris + Math.cos(tail) * (EW + 47) * tailRadius;
      const yy = EC[1] + yIris + Math.sin(tail) * (39 + 20 * op) * tailRadius;
      if (yy >= CEILING) p.line(x, y, xx, yy, i % 8 === 0 ? FIRE[2] : L[2]);
      p.dot(x, y, color);
    }
  }
}

export function sky(p, t, layer) {
  if (layer !== 'back') return;
  const solid = p.sn === 0 && p.cs === 1 && p.fade === 1;
  const op = Math.min(1, openAt(Math.min(t, SHUT[0])));
  const shut = smooth(SHUT[0] + 0.085, SHUT[1], t) ** 2;
  darkness(p, t, op, solid);
  if (t > GATHER && t < 7) drawRuns(p, cloudRuns(Math.floor(t * 10)), solid);
  if (t >= APPEAR && t < SHUT[1] + 0.48) rift(p, t, op);
  eye(p, t, op, shut, solid);
}
