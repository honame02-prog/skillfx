// DRAFT 7 v2 (user 18/11: too fast, the fox -> devouring transition has no climax) — longer (8.4 s), more beats.
// 0–1.0 gather (slower) · 1.0–3.6 attack (8 petals) · 3.6–4.4 THE INHALE (climax): the lotus folds shut round the fox
// like a bud, wind and embers are drawn from everywhere into its chest, a fire-heart beats twice (rings), at 4.2 a lotus
// seal flares on the chest + one inverted frame · 4.3–5.1 the fox is twisted into the hole · 4.4–6.6 devouring (disk,
// ribbons, rocks, the target) · 6.6–7.2 the disk squashes, flash, shock ring · 7.2–8.4 aftermath: ember petals drift
// down, a lotus mark glows in the crater and fades. Libraries: _holyfox-lib, _holylotus-lib, _devour-lib, _whitehole-lib.
import { smooth, clamp, hex, READY } from '../../core/index.js';
import { L, CLOUD, DUST, sm, hsh } from './_tinhlien-common.js';
import { holyFox, chestOf } from './_holyfox-lib.js';
import { holyLotus } from './_holylotus-lib.js';
import { flamePetal } from './_tinhlien-lotus-lib.js';
import { accretion, core, ribbon } from './_devour-lib.js';
import { intro } from './_tlv2-intro.js';
import { ground } from './_tlv2-ground.js';
import { SHEDN, shedT as shedT0, FLY } from './_tlv2-common.js';

const TX = 150, END = 8.4, FORM = [0, 1.0], ATTACK = [1.0, 3.6], INHALE = [3.6, 4.4], BEATS = [3.85, 4.12], SEAL = 4.2;
const DEV = [4.3, 5.1], OPEN = 4.35, SQUASH = [6.6, 7.1], AFTER = [7.2, 8.3];
const F = [TX, -1], SP = 0.95, H = chestOf(F, SP);
const KA = 2.9 / 3.6;                       // the intro part was timed for 2.9 s of attack: play it slower
const GSHIFT = OPEN - 3.05;                 // the ground part was timed for OPEN = 3.05
const WOOD = ['#4a2c14', '#8a5a2a', '#c08a4a'].map(hex), IVR = [hex('#b3a490'), L[4], L[6]];

export const meta = {
  name: 'Tinh Lien v2 Draft 7v2',
  desc: 'Draft 7 v2: longer; the white fox inhales, its lotus folds shut, a fire-heart beats and a lotus seal flares before the white hole devours all.',
  tags: ['di-hoa', 'draft', 'fire', 'fox', 'lotus', 'vortex', 'one-shot'],
  size: [360, 320], origin: [60, 295], duration: END, loop: false, fps: 30, bg: 'ground', actor: 2,
  options: { seed: 5 },
};
const RAISE = { ...READY, crouch: 0, lean: -2, fx: 10, fy: -44, bx: 7, by: -40 };
const PUSH = { ...READY, crouch: 3, lean: 3, fx: 16, fy: -34, bx: 8, by: -32, armsFront: true };
const BRACE = { ...READY, crouch: 6, lean: -5, fx: 8, fy: -26, bx: 2, by: -22, armsFront: true };
const ticks = [];
for (let i = 0; i < SHEDN; i++) ticks.push({ t: (shedT0(i) + FLY) / KA, stop: 0.03, shake: 0.12 + 0.02 * i, amp: 1.5 + 0.3 * i, push: 0.3, straw: 3, flash: 0.02 });
for (const b of BEATS) ticks.push({ t: b, stop: 0.05, shake: 0.25, amp: 2.5, push: -0.4, straw: 2, flash: 0.02 });
for (let t = DEV[0] + 0.2; t < SQUASH[0]; t += 0.25) ticks.push({ t, shake: 0.12, amp: 1.4, push: -0.15, straw: 3, flash: 0 });
export const act = {
  target: { x: TX },
  poses: [[-0.2, READY], [0.5, RAISE], [INHALE[0], RAISE], [INHALE[0] + 0.3, BRACE], [SEAL, BRACE], [SEAL + 0.06, PUSH, 'snap'], [SQUASH[1], PUSH], [END, READY]],
  hits: [
    ...ticks,
    { t: SEAL, stop: 0.16, shake: 0.6, amp: 4, push: -0.8, straw: 10, flash: 0.06, skin: 'holy' },
    { t: OPEN, stop: 0.1, shake: 0.7, amp: 5, push: -1, straw: 16, flash: 0.04 },
    { t: DEV[0] + 0.3, shake: 0.2, amp: 2, push: -0.6, straw: 12, flash: 0, erase: 1.1 },
    { t: SQUASH[1], stop: 0.1, shake: 0.6, amp: 5, push: 0, straw: 8, flash: 0.06 },
    { t: END - 0.02, push: 0, straw: 0, flash: 0, skin: null, erase: 0 },
  ],
};

// fox: grows while attacking, rears up a little while inhaling, squeezes at the seal, then devoured
const foxS = (t) => {
  const grow = 1 + 0.25 * sm(clamp((t - FORM[1]) / (ATTACK[1] - FORM[1])));
  const rear = 0.06 * sm(clamp((t - INHALE[0]) / 0.5));
  return grow + rear + (SP - grow - rear) * sm(clamp((t - SEAL) / 0.1));
};
const devour = (t) => sm(clamp((t - DEV[0]) / (DEV[1] - DEV[0])));
const lotusOpen = (t) => smooth(0.4, 1.1, t) * (1 - 0.75 * sm(clamp((t - INHALE[0]) / 0.55)));   // folds shut into a bud
const coreR = (t) => 20 * sm(clamp((t - OPEN) / 0.5)) * (1 - sm(clamp((t - SQUASH[0]) / (SQUASH[1] - SQUASH[0]))));
const diskK = (t) => smooth(OPEN, OPEN + 0.6, t);
const flat = (t) => smooth(SQUASH[0], SQUASH[1] - 0.05, t);
const lotusFn = (p, x, y, s, t, dv, open) => holyLotus(p, x, y + 2 * s, s * 1.05, t, { open: lotusOpen(t), crush: Math.max(dv, 0.5 * sm(clamp((t - INHALE[0]) / 0.7))), k: 1.2, seed: 5 });

function fox(p, t, layer) {
  const dv = devour(t);
  if (dv >= 1) return null;
  return holyFox(p, t, { F, S: foxS(t), reveal: smooth(FORM[0], FORM[1], t), eye: smooth(FORM[1] - 0.2, FORM[1] + 0.1, t), lotus: 1, devour: dv, layer, lotusFn, twist: 7, twistR: 26 });
}

export function drawBack(p, t) {
  if ((t > SEAL - 0.01 && t < SEAL + 0.04) || (t > OPEN - 0.01 && t < OPEN + 0.03)) p.rect(-60, -295, 360, 320, CLOUD[0]);   // inverted beats
  ground(p, t - GSHIFT, 'back');
  lotusMark(p, t);
  const r = fox(p, t, 'back');
  intro(p, t * KA < 2.95 ? t * KA : 9, 'back', r);
}

export function draw(p, t) {
  const r = fox(p, t, 'front');
  intro(p, t * KA < 2.95 ? t * KA : 9, 'front', r);
  inhale(p, t);
  const R = coreR(t), dk = diskK(t) * (1 - 0.3 * flat(t));
  if (t > OPEN && t < SQUASH[1]) {
    accretion(p, H[0], H[1], R, t, dk, 'back', flat(t));
    ribbon(p, H[0], H[1], TX + 6, -22, sm(clamp((t - DEV[0] - 0.3) / 1.3)), 4.5, 7, WOOD, t, 1);
    for (let i = 0; i < 4; i++) ribbon(p, H[0], H[1], H[0] + [-26, 24, -6, 12][i], H[1] + [-30, -22, -48, 10][i], sm(clamp((t - DEV[0] - i * 0.15) / 0.9)), 3.4, 6 + i, IVR, t, 3 + i);
    core(p, H[0], H[1], R * (1 - 0.6 * flat(t)), t);
    accretion(p, H[0], H[1], R, t, dk, 'front', flat(t));
  }
  ground(p, t - GSHIFT, 'front');
  const u = (t - SQUASH[1]) / 0.45;
  if (u >= 0 && u < 1) {
    if (u < 0.08) p.disc(H[0], H[1], 12, L[6], 1);
    p.ring(H[0], H[1], 8 + 110 * sm(u), u < 0.5 ? 2 : 1, u < 0.5 ? L[6] : L[4]);
    p.ring(H[0], H[1], 4 + 70 * sm(u), 1, L[5]);
    p.line(H[0] - 140 * (1 - u), H[1], H[0] + 140 * (1 - u), H[1], u < 0.4 ? L[6] : L[4]);
  }
  embers(p, t);
}

// THE INHALE: wind streaks and embers drawn from everywhere into the chest, the fire-heart beats, the lotus seal flares
function inhale(p, t) {
  if (t < INHALE[0] || t > OPEN + 0.1) return;
  const k = smooth(INHALE[0], INHALE[0] + 0.3, t);
  for (let i = 0; i < 26; i++) {
    const ph = ((t - INHALE[0]) * (1.6 + hsh(i, 1)) + hsh(i, 2)) % 1;        // each streak loops inward
    const a = hsh(i, 3) * Math.PI * 2, r = (150 - 135 * ph * ph) * (0.7 + 0.3 * hsh(i, 4));
    const x = H[0] + Math.cos(a) * r, y = H[1] + Math.sin(a) * r * 0.75, len = (4 + 10 * ph) * k;
    if (y > -1) continue;
    const ux = (H[0] - x) / (r || 1), uy = (H[1] - y) / (r || 1);
    for (let j = 0; j < len; j++) p.dot(x - ux * j, y - uy * j, j < 2 ? L[6] : j < len * 0.6 ? L[4] : DUST[4]);
  }
  // fire-heart in the chest: grows, beats
  const beat = BEATS.reduce((s, b) => s + Math.exp(-(((t - b) / 0.05) ** 2)), 0);
  const hr = (2 + 3 * smooth(INHALE[0], SEAL, t)) * (1 + 0.6 * beat);
  p.disc(H[0], H[1], hr + 1.5, L[4], 1); p.disc(H[0], H[1], hr, L[6], 1);
  for (const b of BEATS) {
    const u = (t - b) / 0.35;
    if (u > 0 && u < 1) p.ring(H[0], H[1], 6 + 46 * sm(u), u < 0.5 ? 2 : 1, u < 0.4 ? L[6] : L[4]);
  }
  // the seal: five flame petals flare round the chest for 0.18 s
  const su = (t - SEAL) / 0.18;
  if (su >= 0 && su < 1) {
    const s = 1 + 0.5 * su;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.62;
      flamePetal(p, H[0], H[1] + 4, H[0] + Math.cos(a) * 26 * s, H[1] + 4 + Math.sin(a) * 26 * s, 7 * s, t, i * 3.3, { heat: 1, wisp: 1 });
    }
  }
}

// aftermath: ember petals drifting down, swaying, shrinking
function embers(p, t) {
  if (t < SQUASH[1] || t > AFTER[1]) return;
  for (let i = 0; i < 12; i++) {
    const t0 = SQUASH[1] + hsh(i, 8) * 0.4, u = (t - t0) / (0.9 + hsh(i, 9) * 0.5);
    if (u < 0 || u >= 1) continue;
    const x = H[0] + (hsh(i, 10) - 0.5) * 160 + Math.sin(u * 6 + i) * 8, y = H[1] - 30 + u * (H[1] < 0 ? -H[1] + 26 : 60);
    const s = 5 * (1 - u), a = Math.sin(u * 5 + i) * 0.8;
    if (s < 1) { p.dot(x, y, L[4]); continue; }
    flamePetal(p, x, y, x + Math.sin(a) * s * 2, y - Math.cos(a) * s * 2, s * 0.8, t, i * 2.7, { wisp: 0.5, heat: 0.3 });
  }
}

// a lotus mark glowing in the crater after it all, then fading (shrinks back)
function lotusMark(p, t) {
  const k = smooth(SQUASH[1], SQUASH[1] + 0.3, t) * (1 - smooth(AFTER[1] - 0.6, AFTER[1], t));
  if (k <= 0) return;
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i + 0.5) / 5 * Math.PI, len = 26 * k;
    p.line(TX, -1, TX + Math.cos(a) * len * 1.4, -1 + Math.sin(a) * len * 0.18, k > 0.6 ? L[4] : L[3]);
  }
  p.ellipse(TX, -1, 6 * k, 1.5 * k, L[5]);
}
