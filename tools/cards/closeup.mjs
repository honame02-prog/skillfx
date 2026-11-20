// 4x close-up of a top-down effect around the target's feet (floor, back, Dao Si, front) + left/right pixel balance.
// node tools/cards/closeup.mjs <fx-id> <out.png> <t1> [t2 ...]     e.g. di-hoa/thanh-lien-td records/lotus.png 1.0 1.3 1.5 1.66
// Balance: per layer, count of opaque pixels left / right of the pivot column (a symmetric effect gives L ~= R).
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createFrame, clearFrame, createFx, composite } from '../../src/core/index.js';
import { ROOT, loadEffect, canvas, upscale } from '../lib/fxlib.mjs';
const [id, outArg, ...ts] = process.argv.slice(2);
const fx = await loadEffect(id); const [W, H] = fx.meta.size, [OX, OY] = fx.meta.origin;
const atlas = process.env.DAOSI ?? join(ROOT, '..', 'tienson', 'art', 'daosi', 'daosi.png'), AW = 521;   // DAOSI= when run from a worktree
const raw = spawnSync('ffmpeg', ['-v', 'error', '-i', atlas, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 }).stdout;
const tgt = (f) => { if (!raw?.length) return; for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const s = ((521 + y) * AW + 1 + x) * 4; if (raw[s + 3] < 128) continue; f.color[(OY - 61 + y) * W + OX - 32 + x] = 0xff000000 | (raw[s + 2] << 16) | (raw[s + 1] << 8) | raw[s]; } };
const BG = new Uint32Array(W * H).fill(0xff666b6b);
const inst = Object.fromEntries(['floor', 'back', 'front'].map((k) => [k, createFx(fx.mod, { x: OX, y: OY, part: k })]));
const T = ts.map(Number), fr = createFrame(W, H), shots = []; let i = 0;
for (const t of T) {
  while (i < Math.round(t * 30)) { for (const k in inst) inst[k].update(1 / 30); i++; }
  const bal = [];
  for (const k in inst) { clearFrame(fr); inst[k].draw(fr, k === 'front' ? 'front' : 'back'); let L = 0, R = 0; for (let p = 0; p < W * H; p++) if (fr.color[p] >>> 24) (p % W < OX ? L++ : R++); bal.push(`${k} ${L}/${R}`); }
  console.log(`t=${t} L/R ` + bal.join('  '));
  clearFrame(fr); inst.floor.draw(fr, 'back'); inst.back.draw(fr, 'back'); tgt(fr); inst.front.draw(fr, 'front');
  shots.push(composite(fr, new Uint8ClampedArray(W * H * 4), BG));
}
const cx0 = OX - 64, cy0 = OY - 76, cw = 128, ch = 104, Z = 4, cols = 2, rows = Math.ceil(T.length / cols);
const out = canvas(cols * (cw * Z + 6) + 6, rows * (ch * Z + 24) + 6);
shots.forEach((s, k) => {
  const c = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const a = ((cy0 + y) * W + cx0 + x) * 4; c.set(s.subarray(a, a + 4), (y * cw + x) * 4); }
  const X = 6 + (k % cols) * (cw * Z + 6), Y = 6 + Math.floor(k / cols) * (ch * Z + 24);
  out.paste(upscale(c, cw, ch, Z), cw * Z, ch * Z, X, Y); out.text('t=' + T[k], X + 2, Y + ch * Z + 4, 2);
});
const file = resolve(outArg); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, out.png()); console.log(file);
