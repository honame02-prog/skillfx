// DRAFT v1 (motion + shape blocking) — Di Hoa 2: Cot Linh Lanh Hoa. Script: design/di-hoa/02-cot-linh-lanh-hoa.md.
// Cold fire: it hangs and flows DOWN, rolls along the ground as a low tide, climbs the target, then freezes mid-flicker into
// an ice sculpture of flame (rib-like spikes) that is held and then shattered. Flat shapes on purpose: this judges timing and silhouette.
import { fit, smooth, clamp, TAU, WHITE, READY, hex, poseAt } from '../../core/index.js';

const C = fit(['#0b1224', '#1d3557', '#3f6f9e', '#7fb2d9', '#c4e1f0', '#efece2', '#ffffff'], 7);
const TX = 150, END = 4.4, POUR = 0.6, SWEEP = 0.75, ARRIVE = 1.5, FREEZE = 2.1, FROZEN = 2.35, SHATTER = 3.2;
const sm = (u) => u * u * (3 - 2 * u), out3 = (u) => 1 - (1 - u) ** 3;
const hsh = (i, s = 0) => { const h = Math.sin(i * 91.7 + s * 47.3) * 43758.5453; return h - Math.floor(h); };
export const meta = {
  name: 'Cot Linh Draft',
  desc: 'Motion draft: a cold white fire pours from a down-turned palm, rolls along the ground, climbs the target, freezes into flame-shaped ice, then shatters.',
  tags: ['di-hoa', 'draft', 'ice', 'fire', 'control', 'one-shot'],
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

// a drooping flame tongue: base (x, y), hanging length L, sway; flat bands
function droop(p, x, y, L, W, t, s, k = 1) {
  const sway = Math.sin(t * 7 + s) * 2;
  for (const [f, c] of [[1, C[3]], [0.7, C[4]], [0.4, C[5]], [0.18, C[6]]]) {
    const w = W * f, l = L * (0.5 + 0.5 * f);
    p.poly([[x - w, y], [x + w, y], [x + sway * 0.5 + w * 0.3, y + l * 0.6], [x + sway, y + l]], c, k);
  }
}
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

function palmFire(p, t) {
  if (t > SWEEP + 0.05) return;
  const [hx, hy] = hand(t), k = smooth(0.05, 0.3, t) * (1 - smooth(SWEEP - 0.05, SWEEP + 0.05, t));
  p.glow(hx, hy + 4, 12, C[4], 0.3 * k);
  for (let i = 0; i < 4; i++) droop(p, hx - 4.5 + i * 3, hy + 2, 12 + 5 * Math.sin(t * 11 + i * 2), 2, t, i * 1.9, k);
  for (let i = 0; i < 4; i++) {   // cold drips falling
    const s = ((t * 1.6 + i * 0.25) % 1);
    p.dot(hx - 2 + i * 1.5, hy + 8 + s * Math.max(0, -hy - 8), C[5], k * (1 - s));
  }
}
function tide(p, t, layer) {
  if (t < SWEEP || t > FREEZE + 0.1) return;
  const xf = front(t), xs = tail(t), k = 1 - smooth(FREEZE - 0.15, FREEZE + 0.1, t);
  if (xf - xs < 2) return;
  for (const [f, c] of [[1, C[2]], [0.75, C[3]], [0.5, C[4]], [0.28, C[5]]]) {
    const pts = [];
    for (let x = xs; x <= xf; x += 3) {
      const u = (x - xs) / Math.max(1, xf - xs), crest = 6 + 12 * smooth(0.6, 0.95, u) * (1 - smooth(0.95, 1, u));
      pts.push([x, -(crest + 3 * Math.sin(x * 0.2 - t * 9)) * f]);
    }
    pts.push([xf + 4 * f, -2], [xf, 0], [xs, 0]);
    if (layer === 'front') p.poly(pts.map(([x, y]) => [x, y + 2]), c, k);
  }
}
function frost(p, t) {   // bone-white frost veins along the tide's path
  if (t < SWEEP) return;
  const xf = front(t), k = 1 - smooth(END - 1.0, END - 0.2, t);
  for (let i = 0; i < 22; i++) {
    const x = 16 + i * 7.5;
    if (x > xf) break;
    const y = (hsh(i, 2) - 0.5) * 8, l = 4 + hsh(i, 3) * 8, a = (hsh(i, 4) - 0.5) * 1.2;
    p.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.3, C[5], k * 0.8);
    p.line(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.15, x + Math.cos(a) * l * 0.5 + 2, y - 2, C[4], k * 0.7);
  }
}
function sculpture(p, t, layer) {
  if (t < ARRIVE || t >= SHATTER) return;
  // helix strands climbing (live fire only)
  if (t < FREEZE + 0.25) for (let s = 0; s < 3; s++) {
    const top = 74 * clamp((t - ARRIVE) / (FREEZE - ARRIVE)), pts = [];
    for (let h = 0; h <= top; h += 3) { const a = h * 0.16 + s * TAU / 3 + t * 3; if ((Math.sin(a) > 0) === (layer === 'front')) pts.push([TX + Math.cos(a) * 9, -h]); else if (pts.length) { p.polyline(pts, C[4], 0.9); pts.length = 0; } }
    if (pts.length > 1) p.polyline(pts, C[4], 0.9);
  }
  for (const q of TONGUES) {
    if ((q.i % 3 === 0) !== (layer === 'back')) continue;
    const g = tongue(q, t);
    if (!g) continue;
    const ice = frozenAt(q, t), pts = [[g.bx - g.w, g.by], [g.mx - g.w * 0.8, g.my], [g.tx, g.ty], [g.mx + g.w * 0.6, g.my + 1], [g.bx + g.w, g.by + 2]];
    if (ice) {   // faceted ice: dark edge, flat fill, a bright facet
      p.poly(pts, C[2], 1);
      p.poly([[g.bx, g.by], [g.mx, g.my], [g.tx, g.ty], [g.mx + g.w * 0.3, g.my + 1]], C[4], 1);
      p.line(g.mx, g.my, g.tx, g.ty, C[6], 1);
    } else {
      p.poly(pts, C[3], 0.95);
      p.poly([[g.bx, g.by], [g.mx, g.my], [g.tx, g.ty]], C[5], 0.95);
    }
  }
  if (t > FREEZE && t < FROZEN + 0.1) {   // the freezing front climbing
    const y = -76 * clamp((t - FREEZE) / 0.25);
    p.line(TX - 20, y, TX + 20, y, WHITE, 1 - smooth(FROZEN, FROZEN + 0.1, t));
  }
  if (t > FROZEN && layer === 'front') {   // glint sweep + cold vapour pouring down
    const u = clamp((t - FROZEN - 0.2) / 0.35);
    if (u > 0 && u < 1) p.line(TX - 26 + u * 52, -64, TX - 36 + u * 52, 0, WHITE, 0.6);
    for (let i = 0; i < 8; i++) { const s = ((t * 0.9 + i / 8) % 1); p.dot(TX - 18 + i * 5, -40 + i % 3 * 8 + s * 36, C[5], 0.7 * (1 - s)); }
  }
}
function shatter(p, t, layer) {
  const τ = t - SHATTER;
  if (τ < 0 || τ > 1.2) return;
  if (layer === 'front' && τ < 0.12) p.disc(TX, -30, 18 + 120 * τ, WHITE, 1 - τ / 0.12);
  for (let i = 0; i < 26; i++) {   // shards
    if ((i % 3 === 0) !== (layer === 'back')) continue;
    const a = -Math.PI * (0.05 + 0.9 * hsh(i, 5)), v = 70 + 120 * hsh(i, 6), h = 10 + 50 * hsh(i, 7);
    let x = TX + Math.cos(a) * v * τ, y = -h + Math.sin(a) * v * τ + 260 * τ * τ;
    if (y > 0) y = 0;
    const r = 1.5 + 2.5 * hsh(i, 8), sp = τ * 12 * (hsh(i, 9) - 0.5), k = 1 - smooth(0.8, 1.2, τ);
    p.poly([[x + Math.cos(sp) * r, y + Math.sin(sp) * r], [x + Math.cos(sp + 2.2) * r, y + Math.sin(sp + 2.2) * r], [x + Math.cos(sp + 4) * r * 0.7, y + Math.sin(sp + 4) * r * 0.7]], C[i % 2 ? 4 : 5], k);
  }
  // the soul of the cold fire sinks and spreads low along the ground
  const R = 10 + 110 * out3(clamp(τ / 0.7)), k = 1 - smooth(0.3, 0.9, τ);
  if (k > 0) p.polyline(Array.from({ length: 49 }, (_, i) => [TX + Math.cos(i * TAU / 48) * R, Math.sin(i * TAU / 48) * R * 0.16 - 1]), C[5], k);
  if (layer === 'front') for (let i = 0; i < 5; i++) droop(p, TX - 16 + i * 8, -26 - 18 * Math.max(0, 0.4 - τ), 10 * (1 - smooth(0.4, 1, τ)), 2, t, i * 2.3, 1 - smooth(0.4, 1, τ));
}

export function drawBack(p, t) {
  frost(p, t);
  tide(p, t, 'back');
  sculpture(p, t, 'back');
  shatter(p, t, 'back');
}
export function draw(p, t) {
  palmFire(p, t);
  tide(p, t, 'front');
  sculpture(p, t, 'front');
  shatter(p, t, 'front');
}
