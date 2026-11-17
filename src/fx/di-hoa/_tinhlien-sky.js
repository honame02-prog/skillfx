// Tinh Lien sky: solid cloud banks at 10 fps and a horn-scaled beast eye.
import { smooth, hex } from '../../core/index.js';
import { L, LID, IRIS, PUPIL, VEIN, CLOUD, GATHER, APPEAR, OPENS, SHUT, EC, EW, EH, IR, hsh, openAt, eyeK, lockAt, pupilW, pulses, grid } from './_tinhlien-common.js';

// The clouds boil at 10 fps: each step is computed once and kept (a pure memo keyed by the step, so the order of calls
// does not matter), then copied out on every frame.
const CX0 = -60, CY0 = -235, CW = 360, CH = 107, CLOUD_MEMO = new Map();
function cloudFrame(tq) {
  if (CLOUD_MEMO.has(tq)) return CLOUD_MEMO.get(tq);
  const k = smooth(GATHER, 0.6, tq) * (1 - smooth(5.0, 6.0, tq)), op = openAt(tq), buf = new Int32Array(CW * CH);
  const flash = pulses(tq), dissolve = smooth(5.0, 6.0, tq);
  const push = op + 0.3 * smooth(APPEAR, OPENS[0], tq) + 0.6 * dissolve, hx = 40 + 70 * push, hy = 12 + 22 * push, swirl = tq * 0.25 + dissolve * 1.8;
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
  if (t < GATHER || t > 6.0) return;
  const R = cloudFrame(Math.floor(t * 10) / 10);
  for (let q = 0; q < R.length; q += 4) {   // copy the runs straight to the screen
    const y = CY0 + R[q] + 0.5, a = p.cellX(CX0 + R[q + 1] + 0.5, y), b = p.cellX(CX0 + R[q + 2] + 0.5, y), sy = p.cellY(CX0 + R[q + 1] + 0.5, y);
    for (let sx = Math.min(a, b); sx <= Math.max(a, b); sx++) p.put(sx, sy, R[q + 3], 1);
  }
}

// Static iris fibres and lid columns keep expensive maths out of the shader.
// ---------------------------------------------------------------- the beast eye (Opus, pixel-art pass)
// Built like a painted pixel eye: scaled brow and lids with a crease, a wet lid margin and a dark lash line; a dark
// veined sclera barely showing; a big amber iris (dark limbal ring, radial fibres, crypts, a red collarette) under the
// shadow of the upper lid; a slit pupil with pointed ends; wet highlights; flame lashes. All flat stepped colours.
const SKIN = ['#0b0508', '#190b12', '#2a121c', '#3f1b27', '#5c2832', '#7a3a3a'].map(hex);
const SCL = ['#140805', '#24100a', '#3a1a0e', '#55260f'].map(hex);
const IRX = ['#2c0f04', '#5a2206', '#9a400a', '#d06a10', '#f0981c', '#ffc640', '#fff0a0'].map(hex);
const COLL = hex('#c0300c'), PUPR = hex('#4a0a06'), WET = hex('#ffeccc'), WAT = hex('#c98a6a'), VEINX = hex('#7a1a10');
const SLANT = 4, FH = new Float32Array(2 * EW + 17), FB = new Float32Array(2 * EW + 17);   // outer corners lifted: a menacing tilt
const PROF = Array.from({ length: 2 * EW + 17 }, (_, i) => {   // per column: opening profile, lid-mass profile, |u|, tilt
  const dx = i - EW - 8, u = dx / EW, a = Math.abs(u);
  return [Math.pow(Math.max(0, 1 - u * u), 0.7), Math.pow(Math.max(0, 1 - (u / 1.12) ** 2), 0.55), a, u * SLANT * a];
});
// iris texture, precomputed: fibre brightness per angle cell, crypts (dark pits) per (radius, angle) cell
const FIB = Array.from({ length: 64 }, (_, k) => { const a = k / 64 * Math.PI * 2; return Math.sin(a * 19 + Math.sin(a * 5) * 2.2) * 0.6 + Math.sin(a * 41 + 1.3) * 0.4; });
const CRYPT = Array.from({ length: 20 * 32 }, (_, i) => hsh(i, 61) > 0.91);
// veins of the sclera: branching random walks from both corners toward the iris, stamped once into a mask (eyeball space)
const VW = 2 * EW + 1, VH = 49, VEINS = new Uint8Array(VW * VH);
for (let v = 0; v < 12; v++) {
  const side = v % 2 ? 1 : -1;
  let x = side * EW * (0.72 + 0.2 * hsh(v, 70)), y = (hsh(v, 71) - 0.5) * 14, a = side > 0 ? Math.PI : 0;
  a += (hsh(v, 72) - 0.5) * 0.9;
  for (let s = 0; s < 34; s++) {
    a += (hsh(v * 50 + s, 73) - 0.5) * 0.8;
    x += Math.cos(a) * 1.2; y += Math.sin(a) * 1.2;
    const i = Math.round(x) + EW, j = Math.round(y) + 24;
    if (i < 0 || j < 0 || i >= VW || j >= VH || Math.hypot(x, y) < IR + 3) break;
    VEINS[j * VW + i] = s < 18 ? 1 : 2;
    if (s === 12 && hsh(v, 74) > 0.4) a += side * 0.9;   // a fork
  }
}
// one pixel of the burning rim: d px out from the lid edge, against the local flame height; tongues sway, split and
// tear off as they rise; white-gold at the root, orange, red at the tips
function flame(o, dx, d, F, x0, t, dir) {
  const i0 = dx - x0, h0 = F[i0] ?? 0;
  if (h0 <= 0.5 || d > h0 * 1.7) return;
  // the rim is a row of tongues: each cell has its own height and rhythm, sways more as it rises, tapers to a tip,
  // and now and then throws a detached lick above itself
  const sway = Math.sin(d * 0.28 - t * 8 + dx * 0.05) * 1.8 * Math.min(1, d / (h0 + 1)), X = dx + sway + 200;
  const Wc = 6, cell = Math.floor(X / Wc), lx = X - cell * Wc - Wc / 2;
  const hc = h0 * (0.55 + 0.45 * Math.abs(Math.sin(t * (6 + 2 * hsh(cell, 90)) + cell * 2.3))) * (0.8 + 0.4 * hsh(cell, 91));
  const f = d / hc;
  let inside = f <= 1 && Math.abs(lx) < Wc * 0.62 * Math.pow(Math.max(0, 1 - f), 0.75) + (f < 0.35 ? Wc * 0.5 : 0);
  if (!inside) {   // a lick torn off the tip, rising and shrinking
    const q = (t * (2.2 + hsh(cell, 92)) + hsh(cell, 93)) % 1, cy = hc * (1.05 + 0.6 * q), rr = 1.8 * (1 - q);
    if (rr > 0.6 && Math.abs(d - cy) < rr && Math.abs(lx) < rr) { o.c = q < 0.5 ? IRX[4] : IRX[3]; }
    return;
  }
  o.c = f < 0.2 ? IRX[6] : f < 0.45 ? IRX[5] : f < 0.68 ? IRX[4] : f < 0.88 ? IRX[3] : COLL;
}
function eye(p, t) {
  const op = openAt(t), shut = smooth(SHUT[0], SHUT[1], t), lock = lockAt(t);
  if (shut > 0.97) {   // shut: a last thin amber seam, then nothing
    const w = EW * (1 - smooth(SHUT[1], SHUT[1] + 0.28, t));
    if (w > 1) { p.line(EC[0] - w, EC[1], EC[0] + w, EC[1], IRX[t < SHUT[1] + 0.12 ? 4 : 2], 1); p.line(EC[0] - w * 0.8, EC[1] + 1, EC[0] + w * 0.8, EC[1] + 1, SKIN[1], 1); }
    return;
  }
  if (eyeK(t) <= 0.35) return;
  let tremor = 0, flash = 0;
  for (const at of OPENS) {
    const age = t - at;
    if (age >= 0 && age < 0.23) tremor += Math.sin(age * 95) * (1 - age / 0.23) * 0.8;
    if (age >= 0 && age < 0.14) flash = Math.max(flash, 1 - age / 0.14);
  }
  const H = EH * op, pw = pupilW(t) * 0.55 * (1 - 0.35 * flash), Lt = 9 + 3 * lock, Lb = 6;
  const lookX = Math.sin(t * 1.3) * 1.2 * (1 - lock), lookY = 3 + lock;   // it looks down at the target
  const squint = lock * 0.22;                                                    // the lower lid rises when it locks on
  // flame heights per column along the rim: tall rolling tongues on the upper lid, short ones under the lower lid
  const boost = (1 + 0.5 * lock + 0.4 * flash) * smooth(APPEAR - 0.1, APPEAR + 0.3, t);
  for (let i = 0; i < FH.length; i++) {
    const dx = i - EW - 8, a = Math.abs(dx / EW), body = Math.max(0, 1 - a * a * 0.7);
    const roll = Math.abs(Math.sin(dx * 0.13 + t * 5.3 + Math.sin(dx * 0.041 - t * 2.1) * 2.5)) ** 1.5;
    FH[i] = (4 + 13 * body * (0.35 + 0.65 * roll) + 2.5 * Math.sin(dx * 0.37 - t * 11)) * boost;
    FB[i] = (3 + 5 * body * (0.4 + 0.6 * Math.abs(Math.sin(dx * 0.17 - t * 6.1 + 1.7)))) * boost;
  }
  const x0 = -EW - 8, y0 = -H - Lt - 30, y1 = H * 0.75 + Lb + 12;
  p.shade(EC[0] + x0, EC[1] + y0, EC[0] - x0, EC[1] + y1, (x, y, o) => {
    const dx = Math.round(x - EC[0]), dy = y - EC[1], col = PROF[dx - x0];
    if (!col) return;
    const prof = col[0], pl = col[1], a = col[2], ty = dy + col[3];
    const top = -H * prof + tremor * prof, bot = H * (0.75 - squint) * prof;
    const lt = -(H + Lt) * pl - 2, lb = bot + Lb * pl + 1;
    if (a > 1.12) return;
    // ---- brow ridge: rows of overlapping scales above the lid mass
    if (ty < lt) return flame(o, dx, lt - ty, FH, x0, t, 1);
    // ---- upper lid: crease, lid skin, wet margin, lash line
    if (ty < top) {
      const d = top - ty;
      if (d < 1) o.c = SKIN[0];
      else if (d < 2) o.c = SKIN[5];
      else if (Math.abs(d - (Lt * 0.62 + 2) * pl) < 0.8) o.c = SKIN[0];
      else o.c = d < Lt * 0.62 * pl + 2 ? SKIN[3] : SKIN[2];
      return;
    }
    // ---- lower lid: waterline, lid skin, shadow
    if (ty > bot) {
      if (ty > lb) return flame(o, dx, ty - lb, FB, x0, t, -1);
      const d = ty - bot;
      o.c = d < 1 ? WAT : d < 2 ? SKIN[4] : d > Lb * pl - 1 ? SKIN[1] : SKIN[3];
      return;
    }
    // ---- the eyeball
    const ix = dx - lookX, iy = ty - lookY, r = Math.hypot(ix, iy), lidShade = ty - top < 3 ? 1 : 0;
    if (r > IR) {   // sclera: dark amber, darker into the corners, a few red veins reaching for the iris
      const vi = Math.round(ix) + EW, vj = Math.round(iy) + 24, v = vi >= 0 && vj >= 0 && vi < VW && vj < VH ? VEINS[vj * VW + vi] : 0;
      const depth = Math.min(1, (r - IR) / (EW * 0.75)) * 0.7 + (bot - ty < 3 ? 0.25 : 0);   // rounder: darker away from the iris and at the lower lid
      o.c = r < IR + 1.2 ? IRX[0] : v === 1 ? VEINX : v === 2 ? SCL[1] : SCL[Math.max(0, 3 - Math.round(depth * 3) - lidShade)];
      return;
    }
    // pupil: a vertical slit with pointed ends and a deep-red rim
    const fy = Math.abs(iy) / (IR * 0.95), half = fy < 1 ? pw * Math.pow(1 - fy * fy, 0.65) : 0;
    if (Math.abs(ix) < half) { o.c = Math.abs(ix) > half - 1.2 && fy < 0.92 ? PUPR : PUPIL; return; }
    if (Math.abs(ix) < half + 1.5) { o.c = COLL; return; }   // collarette hugging the slit
    const q = r / IR, ang = Math.atan2(iy, ix), k = ((Math.floor((ang / (Math.PI * 2)) * 64) % 64) + 64) % 64;
    if (q > 0.9) { o.c = IRX[0]; return; }   // dark limbal ring
    const crypt = CRYPT[Math.min(19, Math.floor(q * 20)) * 32 + (k >> 1)] && q > 0.45 && q < 0.85;
    let lvl = q > 0.75 ? 3 : q > 0.45 ? 5 : 4;
    lvl += FIB[k] > 0.45 ? 1 : FIB[k] < -0.5 ? -1 : 0;
    if (crypt) lvl -= 2;
    lvl += Math.round(flash + lock * 0.6) - lidShade * 2 - (iy < -IR * 0.55 ? 1 : 0);
    o.c = IRX[Math.max(1, Math.min(6, lvl))];
  });
  // wet highlights: a window glint top-left of the iris, a small one low right; a glint riding the waterline
  if (op > 0.25) {
    const hx = EC[0] + lookX - 8, hy = EC[1] + lookY - Math.min(H * 0.55, 10);
    p.rect(hx, hy, 3, 2, WET, 1); p.dot(hx + 3, hy + 1, IRX[6], 1); p.dot(hx - 1, hy + 2, IRX[6], 1);
    p.dot(EC[0] + lookX + 7, EC[1] + lookY + 7, IRX[6], 1);
    const gx = EC[0] + ((t * 40) % (EW * 1.2)) - EW * 0.6, gu = (gx - EC[0]) / EW;
    p.dot(gx, EC[1] + H * (0.75 - squint) * Math.pow(Math.max(0, 1 - gu * gu), 0.7) - gu * SLANT * Math.abs(gu) + 1, WET, 1);
  }
  // embers dancing off the burning rim, without end: born on the rim, rising and swaying, flickering out
  for (let i = 0; i < 40; i++) {
    const P = 0.7 + 0.5 * hsh(i, 80), ph = (t / P + hsh(i, 81)) % 1, low = i % 5 === 0;
    const u = hsh(i, 82) * 2 - 1, a = Math.abs(u), pl = Math.pow(Math.max(0, 1 - (u / 1.12) ** 2), 0.55);
    const rim = low ? EC[1] + (H * 0.75 + Lb) * Math.pow(Math.max(0, 1 - u * u), 0.7) + 3 : EC[1] - (H + Lt) * pl - 2 - FH[Math.round(u * EW) + EW + 8] * 0.6;
    const x = EC[0] + u * EW + Math.sin(ph * 7 + i) * 3 + u * ph * 10, y = rim - u * SLANT * a - ph * (low ? 10 : 30);
    if (Math.sin(t * 31 + i * 5.3) < -0.4 || y < CY0 + 1) continue;
    const c = ph < 0.3 ? IRX[6] : ph < 0.6 ? IRX[5] : ph < 0.85 ? IRX[4] : IRX[3];
    p.dot(x, y, c, 1);
    if (i % 4 === 0 && ph < 0.5) { p.dot(x + 1, y, c, 1); p.dot(x, y + 1, IRX[3], 1); }
  }
}
export function sky(p, t, layer) { if (layer === 'back') { clouds(p, t); eye(p, t); } }
