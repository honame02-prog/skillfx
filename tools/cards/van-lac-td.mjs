// Review card + GIF for di-hoa/van-lac-td (stone floor, Dao Si idle as the target).
// node tools/cards/van-lac-td.mjs   -> ../deliver/tienson/08-van-lac-td-the-v1-{cross,kiss}.png + 08-van-lac-td-v1.gif (cross, 90 frames)
// Grid: 8 marks x 4 rows (floor, back, front, assembled) at x2, plus a 4x close-up strip of the serpent column at 0.8 and 1.25.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createFrame, clearFrame, createFx, composite } from '../../src/core/index.js';
import { ROOT, loadEffect, canvas, upscale } from '../lib/fxlib.mjs';

const VER = process.env.VER || 'v1', WEAVES = (process.env.WEAVES || 'cross,kiss').split(',');
const Z = 3, ZC = 2, FPS = 30, LBL = 22, GAP = 6;
const fx = await loadEffect('di-hoa/van-lac-td');
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

// ---- one weave -> frames
const T = [0.35, 0.8, 1.2, 1.55, 2.25, 2.40, 2.6, 2.9];
function run(weave) {
  const mk = (part) => createFx(fx.mod, { x: OX, y: OY, part, weave });
  const inst = { floor: mk('floor'), back: mk('back'), front: mk('front') };
  const N = Math.round(fx.meta.duration * FPS);   // 90 frames, t = 0 .. 2.967
  const checker = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) checker[y * W + x] = ((x >> 3) + (y >> 3)) & 1 ? 0xff3a3a3a : 0xff2a2a2a;
  const fr = createFrame(W, H);
  const frames = [];
  const want = new Set(T.map((t) => Math.round(t * FPS)));
  for (let i = 0; i < N; i++) {
    if (i > 0) for (const k in inst) inst[k].update(1 / FPS);
    const one = (key, layer) => { clearFrame(fr); inst[key].draw(fr, layer); return composite(fr, new Uint8ClampedArray(W * H * 4), checker); };
    clearFrame(fr);
    inst.floor.draw(fr, 'back'); inst.back.draw(fr, 'back'); drawTarget(fr); inst.front.draw(fr, 'front');
    const f = { t: i / FPS, full: composite(fr, new Uint8ClampedArray(W * H * 4), BG) };
    if (want.has(i)) Object.assign(f, { floor: one('floor', 'back'), back: one('back', 'back'), front: one('front', 'front') });
    frames.push(f);
  }
  return frames;
}
function card(weave, frames) {
  const COLS = 8, CW = W * ZC, CH = H * ZC, ROWS = 4;
  const CROPW = 96, CROPH = 84, ZZ = 4, STRIP = CROPH * ZZ + LBL + GAP;
  const CWID = COLS * (CW + GAP) + GAP, CHT = ROWS * (CH + LBL + GAP) + GAP + STRIP;
  const out = canvas(CWID, CHT, [24, 22, 30, 255]);
  const cell = (r, c, buf, label) => {
    const x = GAP + c * (CW + GAP), y = GAP + r * (CH + LBL + GAP);
    out.paste(upscale(buf, W, H, ZC), CW, CH, x, y);
    out.text(label, x + 2, y + CH + 4, 2);
  };
  T.forEach((t, c) => {
    const f = frames[Math.round(t * FPS)], l = `${t.toFixed(2)}s`;
    cell(0, c, f.floor, 'FLOOR ' + l); cell(1, c, f.back, 'BACK ' + l); cell(2, c, f.front, 'FRONT ' + l); cell(3, c, f.full, 'GHEP ' + l + ' ' + weave);
  });
  const y0 = GAP + ROWS * (CH + LBL + GAP);
  [0.8, 1.25].forEach((t, k) => {
    const f = frames[Math.round(t * FPS)], c = new Uint8ClampedArray(CROPW * CROPH * 4);
    for (let y = 0; y < CROPH; y++) for (let x = 0; x < CROPW; x++) {
      const a = ((OY - 92 + y) * W + OX - 48 + x) * 4; c.set(f.full.subarray(a, a + 4), (y * CROPW + x) * 4);
    }
    const x = GAP + k * (CROPW * ZZ + GAP);
    out.paste(upscale(c, CROPW, CROPH, ZZ), CROPW * ZZ, CROPH * ZZ, x, y0);
    out.text(`CAN CANH 4x ${t.toFixed(2)}s ${weave}`, x + 2, y0 + CROPH * ZZ + 4, 2);
  });
  const file = join(OUT, `08-van-lac-td-the-${VER}-${weave}.png`);
  writeFileSync(file, out.png());
  console.log(file, CWID + 'x' + CHT);
}
for (const weave of WEAVES) {
  const frames = run(weave);
  card(weave, frames);
  if (weave === 'cross') {
    const buf = Buffer.concat(frames.map((f) => Buffer.from(upscale(f.full, W, H, Z).buffer)));
    const g = join(OUT, `08-van-lac-td-${VER}.gif`);
    const res = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W * Z}x${H * Z}`, '-r', String(FPS), '-i', '-',
      '-vf', 'split[a][b];[a]palettegen=max_colors=255:stats_mode=full[p];[b][p]paletteuse=dither=none', '-loop', '0', g], { input: buf, maxBuffer: 1 << 28 });
    if (res.status !== 0) throw new Error(String(res.stderr));
    console.log(g, frames.length + ' frames');
  }
}
