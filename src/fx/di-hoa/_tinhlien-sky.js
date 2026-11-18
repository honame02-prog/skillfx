// Tinh Lien sky: solid cloud banks at 10 fps and a horn-scaled beast eye.
import { smooth, hex } from '../../core/index.js';
import { L, LID, IRIS, PUPIL, VEIN, CLOUD, GATHER, APPEAR, OPENS, LOCK, BOOM, SHUT, INHALE, EC, EW, EH, IR, hsh, openAt, eyeK, lockAt, pupilW, pulses, grid } from './_tinhlien-common.js';

// The clouds boil at 10 fps: each step is computed once and kept (a pure memo keyed by the step, so the order of calls
// does not matter), then copied out on every frame.
const CX0 = -60, CY0 = -235, CW = 360, CH = 107, CLOUD_MEMO = new Map();
function cloudFrame(tq) {
  if (CLOUD_MEMO.has(tq)) return CLOUD_MEMO.get(tq);
  const k = smooth(GATHER, 0.6, tq) * (1 - smooth(6.0, 7.0, tq)), op = openAt(tq), buf = new Int32Array(CW * CH);
  const flash = pulses(tq), dissolve = smooth(6.0, 7.0, tq);
  const push = op + 0.3 * smooth(APPEAR, OPENS[0], tq) + 0.6 * dissolve, hx = 60 + 105 * push, hy = 14 + 30 * push, swirl = tq * 0.25 + dissolve * 1.8;
  const N = grid(CX0, CY0, CX0 + CW, CY0 + CH, 3, (x, y) => {
    const r = Math.hypot((x - EC[0]) / 110, (y - EC[1]) / 34), ang = Math.atan2(y - EC[1], (x - EC[0]) * 0.4) + swirl;
    let wave = 0;
    for (const at of OPENS) {
      const age = tq - at;
      if (age >= 0 && age < 0.55) wave += 0.15 * Math.exp(-(((r - 0.6 - age * 3.4) / 0.18) ** 2)) * (1 - age / 0.55);
    }
    return 0.5 + 0.3 * Math.sin(ang * 5 + r * 3 - tq * 0.8) * Math.sin(x * 0.04 - tq * 0.5 + y * 0.09) + 0.2 * Math.sin(x * 0.11 + y * 0.07 + ang * 3) - wave;
  });
  const cut = 0.12 + 0.9 * (1 - k);   // fading in/out by shrinking, not by alpha (no stipple)
  if (k > 0) for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
    const x = CX0 + i, y = CY0 + j, dx = (x - EC[0]) / hx, dy = (y - EC[1]) / hy, r2 = dx * dx + dy * dy, n = N(x, y), lower = (-128 - y) / 60;
    const dens = (n * 1.1 + Math.min(1, lower) * 0.5 - 0.35) * smooth(1, (1.35 + 0.3 * n) ** 2, r2);
    if (dens <= cut) continue;
    const rim = op > 0.05 && r2 < 1.7 + flash * 0.35 && n > 0.74 - flash * 0.06;
    // Solid lit crests and dark undersides, never alpha stipple.
    buf[j * CW + i] = rim ? IRIS[flash > 0.3 ? 2 : n > 0.75 ? 1 : 0] : CLOUD[dens > 0.66 ? 2 : dens > 0.39 ? 1 : 0];
  }
  const runs = [];   // same-colour runs per row: [row, i0, i1, colour]
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW;) {
    const c = buf[j * CW + i];
    let e = i;
    while (e + 1 < CW && buf[j * CW + e + 1] === c) e++;
    if (c) runs.push(j, i, e, c);
    i = e + 1;
  }
  const out = Int32Array.from(runs);
  if (CLOUD_MEMO.size > 6) CLOUD_MEMO.delete(CLOUD_MEMO.keys().next().value);
  CLOUD_MEMO.set(tq, out);
  return out;
}
function clouds(p, t) {
  if (t < GATHER || t > 7.0) return;
  const R = cloudFrame(Math.floor(t * 10) / 10);
  for (let q = 0; q < R.length; q += 4) {   // copy the runs straight to the screen
    const y = CY0 + R[q] + 0.5, a = p.cellX(CX0 + R[q + 1] + 0.5, y), b = p.cellX(CX0 + R[q + 2] + 0.5, y), sy = p.cellY(CX0 + R[q + 1] + 0.5, y);
    for (let sx = Math.min(a, b); sx <= Math.max(a, b); sx++) p.put(sx, sy, R[q + 3], 1);
  }
}

// ---------------------------------------------------------------- v4: darkness, the tear in the sky, the beast eye
const SKIN = ['#0b0508', '#190b12', '#2a121c', '#3f1b27', '#5c2832', '#7a3a3a'].map(hex);
const SCL = ['#100604', '#1e0c08', '#30140c'].map(hex);
const IRX = ['#2c0f04', '#5a2206', '#9a400a', '#d06a10', '#f0981c', '#ffc640', '#fff0a0'].map(hex);
const COLL = hex('#c0300c'), PUPR = hex('#4a0a06'), WET = hex('#ffeccc'), WAT = hex('#c98a6a');
const DARK = ['#050407', '#0a080e'].map(hex);
const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
const SLANT = 7, NC = 2 * EW + 25, X0 = -EW - 12, FH = new Float32Array(NC), FB = new Float32Array(NC);
// per column: top opening, bottom opening, lid-mass profile, |u|, tilt. Heavy flat upper lid, round lower lid, sharp corners.
const PROF = Array.from({ length: NC }, (_, i) => {
  const dx = i + X0, u = dx / EW, a = Math.abs(u), q = Math.max(0, 1 - u * u);
  return [0.86 * Math.pow(q, 0.45) * (1 - 0.12 * Math.max(0, -u)), 0.8 * Math.pow(q, 0.85), Math.pow(Math.max(0, 1 - (u / 1.1) ** 2), 0.5), a, u * SLANT * a];
});
const FIB = Array.from({ length: 96 }, (_, k) => { const a = k / 96 * Math.PI * 2; return Math.sin(a * 23 + Math.sin(a * 6) * 2.4) * 0.6 + Math.sin(a * 47 + 1.3) * 0.4; });
const CRYPT = Array.from({ length: 24 * 48 }, (_, i) => hsh(i, 61) > 0.9);
const RXI = EW * 0.56, RYI = EH * 1.02;   // a beast iris: fills the opening, clipped by both lids

// The tear: jagged cracks run from both corners out past the frame, a few branches; dark core, burning lips.
const RIFT = [];
for (let s = 0; s < 2; s++) {
  const side = s ? 1 : -1;
  const main = [[side * (EW + 6), side * SLANT * 0.9]];
  for (let j = 1; j < 14; j++) { const [x, y] = main[j - 1]; main.push([x + side * (8 + 9 * hsh(j + s * 20, 41)), y + (hsh(j + s * 20, 42) - 0.5) * 22 - 3]); }
  RIFT.push({ pts: main, w: 5, delay: 0 });
  for (let b = 0; b < 3; b++) {
    const k = 2 + b * 3 + Math.floor(hsh(b + s * 9, 43) * 2), dir = hsh(b + s * 9, 44) > 0.5 ? 1 : -1, br = [main[k]];
    for (let j = 1; j < 5; j++) { const [x, y] = br[j - 1]; br.push([x + side * (6 + 6 * hsh(j * 7 + b, 45)), y + dir * (5 + 6 * hsh(j * 5 + b, 46))]); }
    RIFT.push({ pts: br, w: 2, delay: 0.25 + 0.1 * b });
  }
}
function rift(p, t) {
  const g = smooth(APPEAR, OPENS[2] + 0.4, t) * (1 - smooth(SHUT[1], SHUT[1] + 0.45, t));
  if (g <= 0) return;
  for (const R of RIFT) {
    const n = R.pts.length - 1, len = clamp01((g - R.delay) / (1 - R.delay)) * n;
    for (let j = 0; j < len; j++) {
      const u = Math.min(1, len - j), [ax, ay] = R.pts[j], bx = ax + (R.pts[j + 1][0] - ax) * u, by = ay + (R.pts[j + 1][1] - ay) * u;
      const x0 = EC[0] + ax, y0 = EC[1] + ay, x1 = EC[0] + bx, y1 = EC[1] + by, w = Math.max(1, Math.round(R.w * (1 - j / (n + 2))));
      const hot = Math.sin(t * 9 + j * 1.7) > 0.3;
      p.line(x0, y0 - w, x1, y1 - w, IRX[hot ? 4 : 3], 1);
      for (let k = 1 - w; k < w; k++) p.line(x0, y0 + k, x1, y1 + k, k === 0 && hot && w > 1 ? IRX[2] : PUPIL, 1);
      p.line(x0, y0 + w, x1, y1 + w, IRX[2], 1);
    }
  }
}
// Darkness closes in as the eye opens: solid bands from the frame edges, ground untouched. Row spans, no shader.
const DARK_MEMO = new Map();
function darkRuns(lv) {   // pure memo per darkness level: row runs [y, x0, x1, colour]
  if (DARK_MEMO.has(lv)) return DARK_MEMO.get(lv);
  const v = lv / 40, cx = EC[0], cy = -105, rx = 300 - 125 * v, ry = 210 - 85 * v, runs = [];
  for (let y = -235; y < -3; y++) {
    const yy = y + 0.5, e0 = 1 - ((yy - cy) / ry) ** 2, e1 = 1 - ((yy - cy) / (ry + 10)) ** 2;
    const h0 = e0 > 0 ? rx * Math.sqrt(e0) : 0, h1 = e1 > 0 ? (rx + 10) * Math.sqrt(e1) : 0;
    let start = -1, col = 0;
    for (let x = -60; x <= 300; x++) {
      const d = Math.abs(x + 0.5 - cx), jag = (hsh((x >> 2) * 131 + (y >> 2), 3) - 0.5) * 6;
      const c = x === 300 ? 0 : d + jag > h1 ? DARK[0] : d + jag > h0 ? DARK[1] : 0;
      if (c !== col) { if (col) runs.push(y, start, x - 1, col); start = x; col = c; }
    }
  }
  const out = Int32Array.from(runs);
  DARK_MEMO.set(lv, out);
  return out;
}
function darkness(p, t) {
  const v = (0.55 * Math.min(1, openAt(Math.min(t, SHUT[0]))) + 0.25 * lockAt(t) + 0.2 * smooth(BOOM, BOOM + 0.5, t))
    * smooth(APPEAR, OPENS[0] + 0.3, t) * (1 - smooth(SHUT[1] + 0.2, SHUT[1] + 0.9, t));
  if (v < 0.02) return;
  const R = darkRuns(Math.round(v * 40));
  for (let q = 0; q < R.length; q += 4) {
    const y = R[q] + 0.5, sy = p.cellY(0, y);
    for (let x = R[q + 1]; x <= R[q + 2]; x++) p.put(p.cellX(x + 0.5, y), sy, R[q + 3], 1);
  }
}
// one pixel of the burning rim; tongues lean in toward the eye as they rise (it draws the fire into itself)
function flame(o, dx, d, F, t, pull) {
  const h0 = F[dx - X0] ?? 0;
  if (h0 <= 0.5 || d > h0 * 1.7) return;
  const sway = Math.sin(d * 0.28 - t * 8 + dx * 0.05) * 1.8 * Math.min(1, d / (h0 + 1));
  const X = dx + Math.sign(dx) * d * pull + sway + 300;
  const Wc = 7, cell = Math.floor(X / Wc), lx = X - cell * Wc - Wc / 2;
  const hc = h0 * (0.5 + 0.5 * Math.abs(Math.sin(t * (6 + 2 * hsh(cell, 90)) + cell * 2.3))) * (0.75 + 0.5 * hsh(cell, 91));
  const f = d / hc;
  const inside = f <= 1 && Math.abs(lx) < Wc * 0.62 * Math.pow(Math.max(0, 1 - f), 0.75) + (f < 0.35 ? Wc * 0.5 : 0);
  if (!inside) {
    const q = (t * (2.2 + hsh(cell, 92)) + hsh(cell, 93)) % 1, cy = hc * (1.05 + 0.6 * q), rr = 2 * (1 - q);
    if (rr > 0.6 && Math.abs(d - cy) < rr && Math.abs(lx) < rr) o.c = q < 0.5 ? IRX[4] : IRX[3];
    return;
  }
  o.c = f < 0.18 ? IRX[6] : f < 0.42 ? IRX[5] : f < 0.66 ? IRX[4] : f < 0.86 ? IRX[3] : COLL;
}
function eye(p, t) {
  const op = openAt(t), shut = smooth(SHUT[0], SHUT[1], t), lock = lockAt(t), inh = smooth(INHALE[0], INHALE[0] + 0.4, t);
  if (shut > 0.97) {   // snapped shut: a white seam that thins to nothing
    const a = t - SHUT[1], w = EW * 1.05 * (1 - smooth(0.05, 0.4, a));
    if (w > 1) {
      p.line(EC[0] - w, EC[1] + 1, EC[0] + w, EC[1] + 1, a < 0.1 ? L[6] : IRX[a < 0.22 ? 5 : 3], 1);
      if (a < 0.1) { p.line(EC[0] - w * 0.8, EC[1], EC[0] + w * 0.8, EC[1], L[5], 1); p.line(EC[0] - w * 0.8, EC[1] + 2, EC[0] + w * 0.8, EC[1] + 2, L[5], 1); }
    }
    return;
  }
  if (eyeK(t) <= 0.35) return;
  let tremor = 0, flash = 0;
  for (const at of OPENS) {
    const age = t - at;
    if (age >= 0 && age < 0.23) tremor += Math.sin(age * 95) * (1 - age / 0.23) * 1.2;
    if (age >= 0 && age < 0.14) flash = Math.max(flash, 1 - age / 0.14);
  }
  // the lock: the pupil jerks shut in two frames and the whole iris flares
  const jerk = t > LOCK && t < LOCK + 0.07 ? 1 : 0;
  const H = EH * op, pw = pupilW(t) * 0.85 * (1 - 0.35 * flash) * (jerk ? 0.4 : 1) * (1 + 1.2 * inh), Lt = 13 + 4 * lock, Lb = 8;
  const lookX = Math.sin(t * 1.3) * 2 * (1 - lock), lookY = 4 + 2 * lock;
  const squint = lock * 0.2 * (1 - inh);
  const boost = (1 + 0.6 * lock + 0.5 * flash + 0.5 * inh) * smooth(APPEAR - 0.1, APPEAR + 0.3, t), pull = 0.35 + 0.45 * lock + 0.5 * inh;
  for (let i = 0; i < NC; i++) {   // flame heights: biggest at the corners, smaller toward the middle
    const dx = i + X0, a = Math.abs(dx / EW), body = a > 1.08 ? 0 : 0.45 + 0.75 * a;
    const roll = Math.abs(Math.sin(dx * 0.11 + t * 5.3 + Math.sin(dx * 0.037 - t * 2.1) * 2.5)) ** 1.5;
    FH[i] = (4 + 15 * body * (0.35 + 0.65 * roll) + 2.5 * Math.sin(dx * 0.37 - t * 11)) * boost;
    FB[i] = (3 + 7 * body * (0.4 + 0.6 * Math.abs(Math.sin(dx * 0.15 - t * 6.1 + 1.7)))) * boost;
  }
  const y0 = -H - Lt - 36, y1 = H * 0.8 + Lb + 18;
  const eyePx = (x, y, o) => {
    const dx = Math.round(x - EC[0]), col = PROF[dx - X0];
    if (!col) return;
    const pl = col[2], a = col[3], ty = y - EC[1] + col[4];
    const top = -H * col[0] + tremor * col[0], bot = H * col[1] * (1 - squint);
    const lt = top - Lt * pl - 2, lb = bot + Lb * pl + 1;
    if (a > 1.1) return;
    if (ty < lt) return flame(o, dx, lt - ty, FH, t, pull);
    if (ty < top) {   // heavy upper lid: lash line, wet margin, two creases, dark fold under the fire
      const d = top - ty, lid = Lt * pl;
      if (d < 1) o.c = SKIN[0];
      else if (d < 2) o.c = SKIN[5];
      else if (Math.abs(d - lid * 0.45 - 1) < 0.7 || Math.abs(d - lid * 0.78 - 1) < 0.7) o.c = SKIN[0];
      else o.c = d < lid * 0.45 + 1 ? SKIN[3] : d > lid * 0.9 ? SKIN[1] : SKIN[2];
      return;
    }
    if (ty > bot) {
      if (ty > lb) return flame(o, dx, ty - lb, FB, t, pull * 0.6);
      const d = ty - bot;
      o.c = d < 1 ? WAT : d < 2 ? SKIN[4] : d > Lb * pl - 1.2 ? SKIN[1] : SKIN[3];
      return;
    }
    // ---- the eyeball: a huge amber iris, dark sclera only in the corners
    const ix = dx - lookX, iy = ty - lookY, ex = ix / RXI, ey = iy / RYI, q = Math.sqrt(ex * ex + ey * ey);
    const shadow = ty - top < 4 ? 2 : ty - top < 7 ? 1 : 0;   // the heavy lid casts a band of shadow
    if (q > 1) { o.c = q < 1.05 ? IRX[0] : SCL[Math.max(0, 2 - shadow - (a > 0.85 ? 1 : 0))]; return; }
    const fy = Math.abs(iy) / (RYI * 1.05), half = fy < 1 ? pw * Math.pow(1 - fy * fy, 0.6) : 0;
    if (Math.abs(ix) < half) { o.c = Math.abs(ix) > half - 1.3 && fy < 0.94 ? PUPR : PUPIL; return; }
    if (Math.abs(ix) < half + 1.6) { o.c = COLL; return; }
    if (q > 0.93) { o.c = IRX[0]; return; }
    const ang = Math.atan2(ey, ex), k = ((Math.floor(ang / (Math.PI * 2) * 96) % 96) + 96) % 96;
    const cr = 0.38 + 0.05 * Math.sin(ang * 14 + t * 0.5);   // a zigzag collarette: the ring of fire round the pupil
    if (Math.abs(q - cr) < 0.04) { o.c = COLL; return; }
    let lvl = q < cr ? 6 : q > 0.8 ? 2 : q > 0.6 ? 3 : 4;   // hottest round the pupil
    lvl += FIB[k] > 0.45 ? 1 : FIB[k] < -0.5 ? -1 : 0;
    if (q > cr && q < 0.88 && CRYPT[Math.min(23, Math.floor(q * 24)) * 48 + (k >> 1)]) lvl -= 2;
    lvl += Math.round(flash + lock * 0.6 + inh) - shadow;
    o.c = IRX[Math.max(1, Math.min(6, lvl))];
  };
  // walk column by column over only the rows that can hold something (lid, eyeball, this column's flames)
  const O = { c: 0 };
  for (let i = EC[0] + X0; i <= EC[0] - X0; i++) {
    const xc = i + 0.5, dx = Math.round(xc - EC[0]), col = PROF[dx - X0];
    if (!col || col[3] > 1.1) continue;
    const top = -H * col[0] + tremor * col[0], bot = H * col[1] * (1 - squint), lt = top - Lt * col[2] - 2, lb = bot + Lb * col[2] + 1;
    const f0 = lt - (FH[dx - X0] || 0) * 1.7 - 1, f1 = lb + (FB[dx - X0] || 0) * 1.7 + 1;
    const k0 = Math.max(-235, Math.floor(EC[1] + f0 - col[4])), k1 = Math.min(-1, Math.ceil(EC[1] + f1 - col[4]));
    for (let k = k0; k <= k1; k++) {
      O.c = 0; eyePx(xc, k + 0.5, O);
      if (O.c) p.put(p.cellX(xc, k + 0.5), p.cellY(xc, k + 0.5), O.c, 1);
    }
  }
  if (op > 0.25) {   // wet highlights: a window glint top-left, a small one low right, a glint along the waterline
    const hx = EC[0] + lookX - RXI * 0.42, hy = EC[1] + lookY - Math.min(H * 0.55, 14);
    p.rect(hx, hy, 5, 2, WET, 1); p.rect(hx - 1, hy + 2, 2, 2, WET, 1); p.dot(hx + 5, hy + 1, IRX[6], 1);
    p.dot(EC[0] + lookX + RXI * 0.35, EC[1] + lookY + 9, IRX[6], 1); p.dot(EC[0] + lookX + RXI * 0.35 + 1, EC[1] + lookY + 9, IRX[6], 1);
    const gx = EC[0] + ((t * 55) % (EW * 1.3)) - EW * 0.65, gu = (gx - EC[0]) / EW;
    p.dot(gx, EC[1] + H * 0.8 * Math.pow(Math.max(0, 1 - gu * gu), 0.85) * (1 - squint) - gu * SLANT * Math.abs(gu) + 1, WET, 1);
  }
  // embers: half rise off the rim, half are drawn in a spiral into the pupil
  for (let i = 0; i < 48; i++) {
    const P = 0.7 + 0.5 * hsh(i, 80), ph = (t / P + hsh(i, 81)) % 1;
    if (Math.sin(t * 31 + i * 5.3) < -0.4) continue;
    let x, y;
    if (i % 2) {
      const u = hsh(i, 82) * 2.1 - 1.05, a = Math.abs(u), pl = Math.pow(Math.max(0, 1 - (u / 1.1) ** 2), 0.5);
      x = EC[0] + u * EW + Math.sin(ph * 7 + i) * 3 - u * ph * 12; y = EC[1] - (H * 0.86 + Lt) * pl - 6 - u * SLANT * a - ph * 34;
    } else {
      const th = hsh(i, 83) * Math.PI * 2 + ph * 2.4, r = 1 - ph * ph;
      x = EC[0] + Math.cos(th) * (EW + 20) * r; y = EC[1] + lookY + Math.sin(th) * (H + Lt + 18) * r;
    }
    if (y < -234) continue;
    const c = ph < 0.3 ? IRX[6] : ph < 0.6 ? IRX[5] : ph < 0.85 ? IRX[4] : IRX[3];
    p.dot(x, y, c, 1);
    if (i % 4 === 0 && ph < 0.5) { p.dot(x + 1, y, c, 1); p.dot(x, y + 1, IRX[3], 1); }
  }
}
export function sky(p, t, layer) { if (layer === 'back') { darkness(p, t); clouds(p, t); rift(p, t); eye(p, t); } }
