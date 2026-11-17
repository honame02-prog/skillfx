// Tinh Lien part: the GAZE — the pale sunbeam from the eye (pulses, god rays, ground mark, focusing to a searing ray)
// and the stare's effects on the ground (levitating rubble, glowing cracks). Port of the draft.
import { smooth, clamp, TAU } from '../../core/index.js';
import { L, LID, IRIS, PUPIL, VEIN, DUST, CLOUD, TX, END, GATHER, APPEAR, OPENS, LEVEL, LOCK, BOOM, SHUT, GHOST, LC, EC, EW, EH, IR, sm, out3, hsh, openAt, eyeK, lockAt, pupilW, pulses, grid } from './_tinhlien-common.js';

function beam(p, t) {
  const op = openAt(t), k = eyeK(t);
  if (op < 0.05 || t > BOOM + 0.12) return;
  const lock = lockAt(t), fl = pulses(t), y0 = EC[1] + 5, y1 = LC[1] + 4 * lock;   // when focused it stops on the lotus
  const wTop = (3 + 6 * op) * (1 - 0.6 * lock), wBot = (10 + 34 * op) * (1 - 0.92 * lock) + 1, fade = 1 - smooth(BOOM, BOOM + 0.1, t);
  const str = (0.07 + 0.12 * op + 0.18 * fl + 0.35 * lock) * k * fade;
  const Y0 = Math.floor(y0), RW = new Float32Array(-Y0 + 2), RB = new Float32Array(RW.length), RS = new Float32Array(RW.length);
  for (let i = 0; i < RW.length; i++) {   // per row: width, the pulses running down the beam, the sway of the rays
    const v = (Y0 + i - y0) / (0 - y0);
    RW[i] = wTop + (wBot - wTop) * v; RS[i] = Math.sin(t * 1.7 + v * 2) * 1.5;
    for (const o0 of OPENS) { const s = (t - o0) / 0.25; if (s > 0 && s < 1.2) RB[i] += Math.exp(-(((v - s) / 0.06) ** 2)) * (1 - s / 1.2); }
  }
  p.shade(TX - wBot * 1.5 - 2, y0, TX + wBot * 1.5 + 2, 0, (x, y, o) => {
    const ri = Math.max(0, Math.min(RW.length - 1, Math.round(y - Y0))), w = RW[ri], e = Math.abs(x - TX) / w;
    if (e > 1.5 || (lock > 0.5 && y > y1)) return;
    const band = RB[ri], ray = 0.7 + 0.3 * Math.sin((x - TX) / w * 9 + RS[ri]);   // god rays, swaying
    if (e > 1) { o.l = L[3]; o.k = str * 0.35 * (1.5 - e) * 2 * ray; return; }   // soft halo
    o.l = e < 0.25 ? L[6] : L[4]; o.k = Math.min(0.9, str * (1 - e * e) * ray + band * 0.35 * k + (lock > 0.3 && e < 0.4 ? 0.4 * lock : 0));
  });
  for (let i = 0; i < 22; i++) {   // motes drifting down; heat rising from the ground
    const s = (t * 0.5 + hsh(i, 4)) % 1, y = y0 + (0 - y0) * s, w = wTop + (wBot - wTop) * s;
    if (y > y1 + 2 && lock > 0.5) continue;
    p.dot(TX + (hsh(i, 5) * 2 - 1) * w * 0.8, y, L[4 + (i % 3)], k * (0.5 + 0.5 * op) * fade);
    const s2 = (t * 0.9 + hsh(i, 12)) % 1;
    if (i < 12 && lock < 0.5) p.dot(TX + (hsh(i, 13) * 2 - 1) * wBot * 0.9 + Math.sin(t * 6 + i) * 1.5, -2 - s2 * 26, L[3], (1 - s2) * op * fade);
  }
  // the gaze mark on the ground: a pool of light, and the iris pattern turning slowly
  const pr = wBot * 1.15;
  p.shade(TX - pr, -4, TX + pr, 2, (x, y, o) => { const e = ((x - TX) / pr) ** 2 + ((y + 1) / 3) ** 2; if (e < 1) { o.l = L[5]; o.k = (1 - e) * str * 1.6; } });
  if (op > 0.3 && lock < 0.8) for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + t * 0.6, r0 = pr * 0.85, r1 = pr * (1.05 + 0.1 * Math.sin(t * 5 + i));
    p.line(TX + Math.cos(a) * r0, -1 + Math.sin(a) * r0 * 0.12, TX + Math.cos(a) * r1, -1 + Math.sin(a) * r1 * 0.12, IRIS[i % 2 ? 2 : 3], (op - 0.3) * (1 - lock) * fade);
  }
  if (lock > 0.3) for (let i = 0; i < 6; i++) {   // sparks where the searing ray strikes the lotus
    const s = (t * 4 + hsh(i, 14)) % 1, a = -Math.PI / 2 + (hsh(i, 15) - 0.5) * 3;
    p.line(TX + Math.cos(a) * s * 10, y1 + Math.sin(a) * s * 10, TX + Math.cos(a) * (s * 10 + 3), y1 + Math.sin(a) * (s * 10 + 3), L[6], (1 - s) * lock * fade);
  }
}

const FLOAT = Array.from({ length: 16 }, (_, i) => ({ x: TX + (hsh(i, 20) - 0.5) * 110, h: 8 + 34 * hsh(i, 21), s: 1 + Math.floor(hsh(i, 22) * 3), c: Math.floor(hsh(i, 23) * 3), d: hsh(i, 24) * 0.4, vx: (hsh(i, 25) - 0.5) * 2 }));
function stare(p, t, layer) {
  if (layer !== 'front' || t < OPENS[2] || t > BOOM + 1.2) return;
  for (const R of FLOAT) {   // levitating rubble; at the blast it is flung away
    const a = t - OPENS[2] - R.d;
    if (a < 0) continue;
    let x = R.x, y = -R.h * sm(clamp(a / 0.9)) + 1.2 * Math.sin(t * 3 + R.h);
    if (t > LOCK) x += (Math.floor(t * 30) & 1 ? 1 : -1) * lockAt(t);   // shaking
    if (t > BOOM) { const b = t - BOOM, dir = Math.sign(R.x - TX) || 1; x += dir * 260 * b; y += -80 * b + 260 * b * b; if (y > 0) continue; }
    p.disc(x, y, R.s * 0.7, DUST[R.c + 1], 1); p.dot(x, y - R.s * 0.5, DUST[R.c + 2], 1);
  }
  const ck = smooth(LOCK, LOCK + 0.3, t) * (1 - smooth(BOOM + 0.4, BOOM + 1.2, t));
  if (ck > 0) for (let i = 0; i < 10; i++) {   // glowing cracks radiating across the ground
    const a = (i / 10) * TAU + hsh(i, 26), len = (20 + 50 * hsh(i, 27)) * smooth(LOCK, LOCK + 0.35, t + hsh(i, 28) * 0.1);
    let x = TX, y = -1;
    for (let j = 0; j < 4; j++) {
      const q = a + (hsh(i * 7 + j, 29) - 0.5) * 0.8, nx = x + Math.cos(q) * len / 4, ny = -1 + Math.sin(q) * len / 4 * 0.1 * (j + 1);
      p.line(x, y, nx, ny, j < 2 ? L[5] : L[3], ck);
      x = nx; y = Math.max(-2, Math.min(1, ny));
    }
  }
}

export function gaze(p, t, layer) { if (layer === 'back') beam(p, t); else stare(p, t, 'front'); }
