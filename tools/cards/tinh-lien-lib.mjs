// Design card for the Tinh Lien shape libraries (lotus / eye fire / dust): static panels at 3x for user review.
// node tools/cards/tinh-lien-lib.mjs [out.png]
import { writeFileSync } from 'node:fs';
import { createFrame, clearFrame, painterFor, composite, hex } from '../../src/core/index.js';
import { canvas, upscale } from '../lib/fxlib.mjs';
import { flameLotus, flamePetal } from '../../src/fx/di-hoa/_tinhlien-lotus-lib.js';
import { lidFlames, shutBand, veil } from '../../src/fx/di-hoa/_tinhlien-eye-lib.js';
import { dustMass, cluster } from '../../src/fx/di-hoa/_tinhlien-dust-lib.js';
import { LID, IRIS, PUPIL } from '../../src/fx/di-hoa/_tinhlien-common.js';

const PW = 150, PH = 120, Z = 3, BG = hex('#0e0c14');
const f = createFrame(PW, PH);
function panel(draw) {
  clearFrame(f);
  const p = painterFor(f); p.place(0, 0, false, 0); p.fade = 1; p.lightK = 1;
  draw(p);
  const rgba = new Uint8ClampedArray(PW * PH * 4);
  composite(f, rgba, BG, 1);
  return upscale(rgba, PW, PH, Z);
}
// a stand-in eye (only so the lid fire is seen in place): almond lids, dark lid band, amber iris, slit pupil
function eye(p, open, t) {
  const cx = 75, cy = 66, hw = 66;
  const up = (x) => { const u = (x - cx) / hw; return cy - 26 * open * Math.max(0, 1 - u * u) ** 0.8 * (1 + 0.25 * u); };
  const lo = (x) => { const u = (x - cx) / hw; return cy + 12 * open * Math.max(0, 1 - u * u) ** 0.9; };
  p.shade(cx - hw, cy - 30, cx + hw, cy + 16, (x, y) => {
    if (y < up(x) || y > lo(x)) return;
    const d = Math.hypot(x - cx, (y - cy + 6) * 1.1);
    if (Math.abs(x - cx) < 2.2 && d < 26) return PUPIL;
    if (d < 26) return IRIS[Math.min(4, Math.max(0, 4 - Math.floor(d / 6) + ((Math.atan2(y - cy, x - cx) * 9 | 0) & 1)))];
    return y < up(x) + 3 || y > lo(x) - 2 ? LID[2] : LID[0];
  });
  const H = (x) => { const u = (x - cx) / hw; return 28 * Math.max(0, 1 - u * u) ** 0.6 * (1 + 0.35 * u); };
  lidFlames(p, cx - hw, cx + hw, up, -1, H, t, { cx, pull: 0.7 });
  lidFlames(p, cx - hw, cx + hw, (x) => lo(x) + 1, 1, (x) => H(x) * 0.32, t, { cx, pull: 0.5, seed: 3 });
}
const rows = [
  ['LIEN HOA: no 1.0s | 1.12s | 1.25s | nu (open .45) | nen (crush .7)', [
    (p) => flameLotus(p, 75, 100, 1.5, 1.0, { open: 1 }),
    (p) => flameLotus(p, 75, 100, 1.5, 1.12, { open: 1 }),
    (p) => flameLotus(p, 75, 100, 1.5, 1.25, { open: 1 }),
    (p) => flameLotus(p, 75, 100, 1.5, 1.0, { open: 0.45 }),
    (p) => flameLotus(p, 75, 100, 1.5, 3.2, { open: 1, crush: 0.7 }),
  ]],
  ['CANH SEN can canh | MAT: lua mi t=2.0 | t=2.1 | sap (k 1) | sap tat dan (k .4)', [
    (p) => { flamePetal(p, 60, 112, 70, 22, 22, 1.0, 1, { side: 1 }); },
    (p) => eye(p, 1, 2.0),
    (p) => eye(p, 1, 2.1),
    (p) => shutBand(p, 75, 66, 66, 5.85, { k: 1 }),
    (p) => shutBand(p, 75, 66, 66, 6.1, { k: 0.4 }),
  ]],
  ['BUI: cum t=0 | t=0.6 (cuon) | ruc sen ben trong | tan 0.35 | tan 0.7    + man toi (veil)', [
    (p) => dustMass(p, cluster(75, 66, 46, 11, 2, 0), 0, { top: 20, bottom: 112 }),
    (p) => dustMass(p, cluster(75, 66, 46, 11, 2, 0.6), 0.6, { top: 20, bottom: 112 }),
    (p) => dustMass(p, cluster(75, 66, 46, 11, 2, 0.3), 0.3, { top: 20, bottom: 112, glow: { x: 75, y: 72, r: 40, k: 0.9, c: hex('#fff3c4') } }),
    (p) => dustMass(p, cluster(75, 66, 46, 11, 2, 0.9), 0.9, { top: 20, bottom: 112, erode: 0.35 }),
    (p) => {
      const DARK = ['#1a1622', '#14111c', '#0f0c16', '#0a0810', '#06040a'].map(hex);
      p.rect(0, 0, PW, PH, hex('#2a2434'));
      veil(p, 0, 0, PW, PH, (x, y) => 5.2 * Math.min(1, Math.hypot(x - 75, (y - 20) * 1.4) / 110) + 0.4 * Math.sin(x * 0.07 + y * 0.05) + 0.3 * Math.sin(x * 0.031 - y * 0.09), DARK);
    },
  ]],
];
const LBL = 22, GAP = 6, W = 5 * (PW * Z + GAP) + GAP, H = rows.length * (PH * Z + LBL + GAP) + GAP;
const out = canvas(W, H, [24, 22, 30, 255]);
rows.forEach(([label, fns], r) => {
  const y = GAP + r * (PH * Z + LBL + GAP);
  out.text(label, GAP, y + 3, 2);
  fns.forEach((fn, i) => out.paste(panel(fn), PW * Z, PH * Z, GAP + i * (PW * Z + GAP), y + LBL));
});
const file = process.argv[2] ?? 'records/cards/tinh-lien-lib.png';
writeFileSync(file, out.png());
console.log(file, W + 'x' + H);
