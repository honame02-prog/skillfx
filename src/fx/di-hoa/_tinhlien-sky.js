// Tinh Lien part: the SKY — clouds gathering and parting (memoised at 10 fps, drawn as runs) and the beast eye. Port of the draft.
import { smooth, clamp, TAU } from '../../core/index.js';
import { L, LID, IRIS, PUPIL, VEIN, DUST, CLOUD, TX, END, GATHER, APPEAR, OPENS, LEVEL, LOCK, BOOM, SHUT, GHOST, LC, EC, EW, EH, IR, sm, out3, hsh, openAt, eyeK, lockAt, pupilW, pulses, grid } from './_tinhlien-common.js';

// The clouds boil at 10 fps: each step is computed once and kept (a pure memo keyed by the step, so the order of calls
// does not matter), then copied out on every frame.
const CX0 = -60, CY0 = -235, CW = 360, CH = 107, CLOUD_MEMO = new Map();
function cloudFrame(tq) {
  if (CLOUD_MEMO.has(tq)) return CLOUD_MEMO.get(tq);
  const k = smooth(GATHER, 0.6, tq) * (1 - smooth(5.0, 6.0, tq)), op = openAt(tq), buf = new Int32Array(CW * CH);
  const push = op + 0.3 * smooth(APPEAR, OPENS[0], tq) + 0.6 * smooth(5.0, 6.0, tq), hx = 40 + 70 * push, hy = 12 + 22 * push, swirl = tq * 0.25;
  const N = grid(CX0, CY0, CX0 + CW, CY0 + CH, 3, (x, y) => {
    const r = Math.hypot((x - EC[0]) / 110, (y - EC[1]) / 34), ang = Math.atan2(y - EC[1], (x - EC[0]) * 0.4) + swirl;
    return 0.5 + 0.3 * Math.sin(ang * 5 + r * 3 - tq * 0.8) * Math.sin(x * 0.04 - tq * 0.5 + y * 0.09) + 0.2 * Math.sin(x * 0.11 + y * 0.07 + ang * 3);
  });
  const cut = 0.12 + 0.9 * (1 - k);   // fading in/out by shrinking, not by alpha (no stipple)
  if (k > 0) for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
    const x = CX0 + i, y = CY0 + j, r = Math.hypot((x - EC[0]) / hx, (y - EC[1]) / hy), n = N(x, y), lower = (-128 - y) / 60;
    const dens = (n * 1.1 + Math.min(1, lower) * 0.5 - 0.35) * smooth(1, 1.35 + 0.3 * n, r);
    if (dens <= cut) continue;
    const rim = op > 0.05 && r < 1.1 + 0.1 * n && n > 0.58;   // patches lit by the eye at the edge of the gap
    buf[j * CW + i] = rim ? (n > 0.68 ? IRIS[1] : CLOUD[3]) : CLOUD[dens > 0.75 ? 2 : dens > 0.45 ? 1 : 0];
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

// ---------------------------------------------------------------- the beast eye
function eye(p, t) {
  const k = eyeK(t) > 0.35 ? 1 : 0;
  if (k <= 0) return;
  const op = openAt(t), H = EH * op, pw = pupilW(t), look = 0.6 * Math.sin(t * 1.3), lidH = 5 + 3 * k;
  p.shade(EC[0] - EW - 6, EC[1] - EH - 14, EC[0] + EW + 6, EC[1] + EH + 10, (x, y, o) => {
    const dx = x - EC[0], dy = y - EC[1], u = dx / EW;
    if (Math.abs(u) > 1.08) return;
    const prof = Math.pow(Math.max(0, 1 - u * u), 0.75), top = -H * prof - 0.5, bot = H * 0.75 * prof + 0.5;
    const pl = Math.pow(Math.max(0, 1 - (u / 1.08) ** 2), 0.6), lt = -(H + lidH) * pl - 1.5, lb = (H * 0.75 + lidH * 0.7) * pl + 1.5;
    if (dy < lt || dy > lb) return;
    if (dy < top || dy > bot) {
      const rim = dy < top ? top - dy : dy - bot;
      o.c = rim < 1 ? IRIS[1] : (Math.abs(dy - (top - lidH * 0.6)) < 0.6 ? LID[2] : LID[rim < 3 ? 1 : 0]); o.a = k; return;
    }
    const ix = dx - look, d = Math.hypot(ix, dy), ang = Math.atan2(dy, ix);
    if (d > IR) { const vein = Math.abs(Math.sin(ang * 5 + Math.sin(d * 0.3 + ang * 3) * 0.8)) > 0.97; o.c = Math.abs(u) > 0.8 ? LID[1] : vein ? VEIN : (d < IR + 3 ? IRIS[1] : IRIS[0]); o.a = k; return; }
    const slit = (ix / pw) ** 2 + (dy / (IR * 0.95)) ** 2;
    if (slit < 1) { o.c = PUPIL; o.a = k; return; }
    if (slit < 1.6) { o.c = VEIN; o.a = k; return; }
    const streak = Math.sin(ang * 23 + Math.sin(ang * 5) * 2) * 0.5 + 0.5, r = d / IR;
    o.c = r > 0.92 ? IRIS[0] : IRIS[Math.max(0, Math.min(4, Math.round(4 - r * 3 + streak * 1.4 - 0.6 + 0.8 * lockAt(t))))]; o.a = k;
  });
  if (op > 0.2) { p.dot(EC[0] + look - 7, EC[1] - H * 0.45, L[6], k); p.dot(EC[0] + look - 6, EC[1] - H * 0.45, L[5], k); }
  for (let i = 0; i <= 16; i++) {   // flame lashes
    const u = -1 + 2 * i / 16, prof = Math.pow(Math.max(0, 1 - u * u), 0.6), x = EC[0] + u * EW * 1.04;
    const h = (3 + 3 * hsh(i, 3)) * (0.7 + 0.3 * Math.sin(t * 13 + i * 2.1)) * (0.6 + 0.4 * prof) * (1 + 0.6 * lockAt(t)), lean = u * 2;
    const yt = EC[1] - (H + lidH) * prof - 1.5, yb = EC[1] + (H * 0.75 + lidH * 0.7) * prof + 1.5;
    p.line(x, yt, x + lean, yt - h, L[i % 3 ? 3 : 2], k);
    p.dot(x + lean, yt - h, L[5], k);
    if (i % 2 === 0) p.line(x, yb, x + lean * 0.6, yb + h * 0.5, L[2], k);
  }
}

export function sky(p, t, layer) { if (layer === 'back') { clouds(p, t); eye(p, t); } }
