// Review card + GIF for di-hoa/thanh-lien-td on a stone floor with the Dao Si idle (S) as the target.
// node tools/cards/thanh-lien-td.mjs   -> ../deliver/tienson/07-thanh-lien-td-the-v7.png + 07-thanh-lien-td-v7.gif
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createFrame, clearFrame, createFx, composite } from '../../src/core/index.js';
import { ROOT, loadEffect, canvas, upscale } from '../lib/fxlib.mjs';

const Z = 3, ZC = 2, FPS = 30, LBL = 22, GAP = 6;
const fx = await loadEffect('di-hoa/thanh-lien-td');
const [W, H] = fx.meta.size, [OX, OY] = fx.meta.origin;
const OUT = join(ROOT, '..', 'deliver', 'tienson');
mkdirSync(OUT, { recursive: true });

// ---- target: Dao Si idle_down_00 from the atlas (64x64, feet at 32,61)
const atlas = join(ROOT, '..', 'tienson', 'art', 'daosi', 'daosi.png');
const AW = 521, AH = 2081;
const raw = spawnSync('ffmpeg', ['-v', 'error', '-i', atlas, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 }).stdout;
if (raw.length !== AW * AH * 4) throw new Error('atlas decode size ' + raw.length);
const SPR = { x: 1, y: 521, w: 64, h: 64, fx: 32, fy: 61 };
function drawTarget(f) {
  for (let y = 0; y < SPR.h; y++) for (let x = 0; x < SPR.w; x++) {
    const s = ((SPR.y + y) * AW + SPR.x + x) * 4;
    if (raw[s + 3] < 128) continue;
    const dx = OX - SPR.fx + x, dy = OY - SPR.fy + y;
    if (dx < 0 || dy < 0 || dx >= W || dy >= H) continue;
    f.color[dy * W + dx] = 0xff000000 | (raw[s + 2] << 16) | (raw[s + 1] << 8) | raw[s];
  }
}

// ---- stone floor #6b6b66 with a light vein
const h2 = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const BG = new Uint32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const row = Math.floor(y / 18), off = row % 2 ? 12 : 0;
  const joint = y % 18 === 17 || (x + off) % 24 === 23;
  const v = h2(x, y), k = joint ? -14 : v > 0.93 ? 6 : v < 0.06 ? -5 : 0;
  const c = [0x6b + k, 0x6b + k, 0x66 + k];
  BG[y * W + x] = 0xff000000 | (c[2] << 16) | (c[1] << 8) | c[0];
}

// ---- three instances (one per layer), stepped in lock step
const mk = (part) => createFx(fx.mod, { x: OX, y: OY, part });
const inst = { floor: mk('floor'), back: mk('back'), front: mk('front') };
const N = Math.round(fx.meta.duration * FPS) + 1;
const checker = new Uint32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) checker[y * W + x] = ((x >> 3) + (y >> 3)) & 1 ? 0xff3a3a3a : 0xff2a2a2a;
const fr = createFrame(W, H);
const rgba = () => composite(fr, new Uint8ClampedArray(W * H * 4), BG);
const frames = [];
for (let i = 0; i < N; i++) {
  if (i > 0) for (const k in inst) inst[k].update(1 / FPS);
  const one = (key, layer, bg) => { clearFrame(fr); inst[key].draw(fr, layer); return composite(fr, new Uint8ClampedArray(W * H * 4), bg); };
  clearFrame(fr);
  inst.floor.draw(fr, 'back'); inst.back.draw(fr, 'back'); drawTarget(fr); inst.front.draw(fr, 'front');
  frames.push({ t: i / FPS, full: composite(fr, new Uint8ClampedArray(W * H * 4), BG),
    floor: one('floor', 'back', checker), back: one('back', 'back', checker), front: one('front', 'front', checker) });
}
const at = (t) => frames[Math.min(N - 1, Math.round(t * FPS))];

// ---- card: 16 marks (4x4) + layer row at 1.80
const T = [0.15, 0.28, 0.35, 0.50, 0.70, 0.85, 0.98, 1.10, 1.30, 1.45, 1.60, 1.72, 1.76, 1.85, 2.05, 2.30];
const COLS = 4, CW = W * ZC, CH = H * ZC, ROWS = Math.ceil(T.length / COLS) + 1;
const CWID = COLS * (CW + GAP) + GAP, CHT = ROWS * (CH + LBL + GAP) + GAP;
const out = canvas(CWID, CHT, [24, 22, 30, 255]);
const cell = (r, c, rgbaBuf, label) => {
  const x = GAP + c * (CW + GAP), y = GAP + r * (CH + LBL + GAP);
  out.paste(upscale(rgbaBuf, W, H, ZC), CW, CH, x, y);
  out.text(label, x + 2, y + CH + 4, 2);
};
T.forEach((t, i) => { const f = at(t); cell(Math.floor(i / COLS), i % COLS, f.full, `t=${t.toFixed(2)}s`); });
const fl = at(1.80), LR = ROWS - 1;
cell(LR, 0, fl.floor, 'FLOOR 1.80'); cell(LR, 1, fl.back, 'BACK 1.80'); cell(LR, 2, fl.front, 'FRONT 1.80');
cell(LR, 3, fl.full, 'GHEP 1.80 (floor,back,nguoi,front)');
const file = join(OUT, '07-thanh-lien-td-the-v7.png');
writeFileSync(file, out.png());
console.log(file, CWID + 'x' + CHT);

// ---- gif: full anim + 0.4 s blank end (bare floor + target), looped
const bare = (() => { clearFrame(fr); drawTarget(fr); return composite(fr, new Uint8ClampedArray(W * H * 4), BG); })();
const seq = frames.map((f) => f.full);
for (let i = 0; i < Math.round(0.4 * FPS); i++) seq.push(bare);
const buf = Buffer.concat(seq.map((r) => Buffer.from(upscale(r, W, H, Z).buffer)));
const g = join(OUT, '07-thanh-lien-td-v7.gif');
const res = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W * Z}x${H * Z}`, '-r', String(FPS), '-i', '-',
  '-vf', 'split[a][b];[a]palettegen=max_colors=255:stats_mode=full[p];[b][p]paletteuse=dither=none', '-loop', '0', g], { input: buf, maxBuffer: 1 << 28 });
if (res.status !== 0) throw new Error(String(res.stderr));
console.log(g, seq.length + ' frames');
