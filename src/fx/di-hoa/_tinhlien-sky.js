// Tinh Lien sky: solid cloud banks at 10 fps and a horn-scaled beast eye.
import { smooth } from '../../core/index.js';
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
    const rim = op > 0.05 && r2 < 2.05 + flash * 0.35 && n > 0.65 - flash * 0.05;
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
const COL = Array.from({ length: 145 }, (_, i) => {
  const u = (i - 72) / EW;
  return [Math.pow(Math.max(0, 1 - u * u), 0.75), Math.pow(Math.max(0, 1 - (u / 1.12) ** 2), 0.6), Math.abs(u)];
});
const TEX = Array.from({ length: 41 * 41 }, (_, i) => {
  const x = i % 41 - 20, y = Math.floor(i / 41) - 20, d = Math.hypot(x, y), a = Math.atan2(y, x), r = d / IR;
  const fibre = (Math.sin(a * 29 + Math.sin(a * 7) * 1.5 + r * 3) + 1) * 0.5;
  return [d, Math.max(0, Math.min(4, Math.round(3.8 - r * 3 + fibre * 1.5))),
    Math.abs(y + 8 + x * x * 0.027) < 0.8 && x > -12 && x < 5,
    r < 0.64 && r > 0.35 && fibre > 0.78];
});
function eye(p, t) {
  const op = openAt(t), shut = smooth(SHUT[0], SHUT[1], t), lock = lockAt(t);
  if (shut > 0.97) {
    const w = EW * (1 - smooth(SHUT[1], SHUT[1] + 0.28, t));
    if (w > 1) p.line(EC[0] - w, EC[1], EC[0] + w, EC[1], IRIS[t < SHUT[1] + 0.12 ? 2 : 0], 1);
    return;
  }
  if (eyeK(t) <= 0.35) return;
  let tremor = 0;
  for (const at of OPENS) {
    const age = t - at;
    if (age >= 0 && age < 0.23) tremor += Math.sin(age * 95) * (1 - age / 0.23) * 0.8;
  }
  const H = EH * op, pw = pupilW(t), invPw = 1 / (pw * pw), lidH = 8;
  const lookX = Math.sin(t * 1.3) * 1.1 * (1 - lock), lookY = 2 + lock;
  p.shade(EC[0] - 72, EC[1] - H - 15, EC[0] + 72, EC[1] + H + 10, (x, y, o) => {
    const dx = x - EC[0], dy = y - EC[1], col = COL[Math.max(0, Math.min(144, Math.round(dx) + 72))];
    const prof = col[0], pl = col[1], u = col[2];
    const top = -H * prof - 0.5 + tremor * prof, bot = H * (0.75 - lock * 0.16) * prof + 0.5;
    const lt = -(H + lidH + 3 * lock) * pl - 1.5, lb = bot + lidH * 0.7 * pl + 1.5;
    if (dy < lt || dy > lb || u > 1.12) return;
    o.a = 1;
    if (dy < top || dy > bot || u > 1) {
      const upper = dy < top, rim = upper ? top - dy : dy - bot;
      const scale = ((Math.floor((dx + 73) / 6) + (upper ? 0 : 1)) & 1);
      const ridge = (Math.abs(((dx + 73) % 6) - 3) * 0.45 + rim) % 4.5;
      o.c = rim < 1.1 ? IRIS[1] : upper && dy < lt + 2 ? LID[0] : LID[ridge < 1.2 ? 2 : scale && rim > 3 ? 0 : 1];
      return;
    }
    const ix = dx - lookX, iy = dy - lookY, ax = Math.round(ix), ay = Math.round(iy);
    const tex = Math.abs(ax) <= 20 && Math.abs(ay) <= 20 ? TEX[(ay + 20) * 41 + ax + 20] : null;
    if (!tex || tex[0] > IR) {
      o.c = u > 0.78 ? LID[1] : tex && tex[0] < IR + 1.5 ? IRIS[0] : LID[0];
      return;
    }
    const slit = ix * ix * invPw + iy * iy / (IR * IR * 0.9025);
    if (slit < 1) { o.c = PUPIL; return; }
    if (slit < 1.55) { o.c = VEIN; return; }
    o.c = tex[0] > IR * 0.9 ? IRIS[0] : tex[2] ? L[5] : tex[3] ? IRIS[4] : IRIS[Math.min(4, tex[1] + (lock > 0.5 ? 1 : 0))];
  });
  for (let i = 0; i <= 16; i++) {
    const u = -1 + 2 * i / 16, prof = Math.pow(Math.max(0, 1 - u * u), 0.6), x = EC[0] + u * EW * 1.1;
    const h = (3 + 3 * hsh(i, 3)) * (0.7 + 0.3 * Math.sin(t * 13 + i * 2.1)) * (0.6 + 0.4 * prof) * (1 + 0.9 * lock), lean = u * 3 * (1 - lock * 0.7);
    const yt = EC[1] - (H + lidH + 3 * lock) * prof - 1.5, yb = EC[1] + (H * (0.75 - lock * 0.16) + lidH * 0.7) * prof + 1.5;
    p.line(x, yt, x + lean, Math.max(CY0 + 1, yt - h), L[2], 1);
    p.line(x, yt, x + lean * 0.7, Math.max(CY0 + 1, yt - h * 0.65), L[4], 1);
    if (i % 2 === 0) p.line(x, yb, x + lean * 0.6, yb + h * 0.5, L[2], 1);
  }
}
export function sky(p, t, layer) { if (layer === 'back') { clouds(p, t); eye(p, t); } }
