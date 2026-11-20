#!/usr/bin/env node
// Export an effect as a Phaser atlas (Aseprite JSON hash + PNG): trimmed frames, duplicates merged, colors snapped to a .gpl palette.
//
//   node tools/phaser-atlas.mjs vocab/vocab-strike --out ../tiensonv2/public/assets/fx
//   options: --name <key> --fps 30 --scale 1 --palette <file.gpl> --no-snap --seed N --opts JSON
//
// Reuses renderFrames (tools/lib/fxlib.mjs): the transparent "clear" frame, no actor, no backdrop. Pivot = meta.origin (the caster's feet / effect origin).
// Frame keys are "0","1",... (Phaser createFromAseprite looks frames up by index).
// Also merges the entry into <out>/index.json (the manifest the game's FxLab reads).

import { join, resolve, basename } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { ROOT, loadEffect, renderFrames, upscale } from "./lib/fxlib.mjs";
import { encodePNG } from "./lib/png.mjs";

const args = process.argv.slice(2), flags = {}, ids = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) ids.push(a);
  else if (a === "--no-snap") flags.nosnap = true;
  else flags[a.slice(2)] = args[++i];
}
if (ids.length !== 1 || !flags.out) {
  console.error("usage: node tools/phaser-atlas.mjs <id> --out <dir> [--name key] [--fps 30] [--scale 1] [--palette file.gpl] [--no-snap]");
  process.exit(1);
}
const id = ids[0], name = flags.name ?? id.split("/").pop(), outDir = resolve(flags.out), scale = Math.max(1, Math.round(+(flags.scale ?? 1)));
const targetFps = +(flags.fps ?? 30);
const palFile = flags.palette ? resolve(flags.palette) : join(ROOT, "..", "tiensonv2", "art", "palette", "tienson-fx.gpl");

// ---- palette -> OKLab
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
function oklab(r, g, b) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
let pal = null;
if (!flags.nosnap) {
  pal = [];
  for (const line of readFileSync(palFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)(?:\s|$)/);
    if (m) pal.push({ rgb: [+m[1], +m[2], +m[3]], lab: oklab(+m[1], +m[2], +m[3]) });
  }
  if (!pal.length) throw new Error(`empty palette ${palFile}`);
}
const cache = new Map();
function snap(r, g, b) {
  const k = (r << 16) | (g << 8) | b;
  let v = cache.get(k);
  if (v) return v;
  const [L, A, B] = oklab(r, g, b);
  let best = Infinity;
  for (const p of pal) {
    const d = (p.lab[0] - L) ** 2 + (p.lab[1] - A) ** 2 + (p.lab[2] - B) ** 2;
    if (d < best) { best = d; v = p.rgb; }
  }
  cache.set(k, v);
  return v;
}

// ---- render, sample at target fps
const fx = await loadEffect(id);
const r = renderFrames(fx, { seed: flags.seed ? +flags.seed : undefined, options: flags.opts ? JSON.parse(flags.opts) : undefined, actor: false, bg: "none" });
const srcFps = r.fps, W = r.w * scale, H = r.h * scale;
const total = r.n, outN = Math.max(1, Math.round((total / srcFps) * targetFps));
const picked = [];
for (let i = 0; i < outN; i++) picked.push(Math.min(total - 1, Math.round((i / targetFps) * srcFps)));

// ---- snap + trim + dedupe
const uniq = [], byHash = new Map(), seq = [];
for (const si of picked) {
  let rgba = r.frames[si].clear, w = r.w, h = r.h;
  if (scale > 1) { rgba = upscale(rgba, w, h, scale); w = W; h = H; }
  const px = Uint8ClampedArray.from(rgba);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4;
    if (pal) {
      if (px[o + 3] >= 128) { const c = snap(px[o], px[o + 1], px[o + 2]); px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; }
      else px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0;
    } else if (px[o + 3] === 0) px[o] = px[o + 1] = px[o + 2] = 0;
    if (px[o + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  let tw, th, buf;
  if (x1 < 0) { x0 = 0; y0 = 0; tw = 1; th = 1; buf = new Uint8Array(4); }
  else {
    tw = x1 - x0 + 1; th = y1 - y0 + 1; buf = new Uint8Array(tw * th * 4);
    for (let y = 0; y < th; y++) buf.set(px.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + tw) * 4), y * tw * 4);
  }
  const hash = createHash("sha1").update(`${x0},${y0},${tw},${th}`).update(buf).digest("hex");
  let u = byHash.get(hash);
  if (!u) { u = { x0, y0, w: tw, h: th, buf, rect: null }; byHash.set(hash, u); uniq.push(u); }
  seq.push(u);
}

// ---- pack: shelf, tallest first, 1px gutter; smallest power-of-two width that fits within 2048
const GUT = 1;
function pack(width) {
  const order = [...uniq].sort((a, b) => b.h - a.h || b.w - a.w);
  let x = 0, y = 0, rowH = 0, maxW = 0;
  for (const u of order) {
    if (u.w > width) return null;
    if (x + u.w > width) { x = 0; y += rowH + GUT; rowH = 0; }
    u.rect = { x, y }; x += u.w + GUT; rowH = Math.max(rowH, u.h); maxW = Math.max(maxW, x - GUT);
  }
  return { w: maxW, h: y + rowH };
}
let best = null;
for (const wd of [64, 128, 256, 512, 1024, 2048]) {
  const p = pack(wd);
  if (p && (!best || p.w * p.h < best.w * best.h)) { best = p; best.width = wd; }
  if (p && p.h <= wd) break;
}
if (!best) throw new Error("frames do not fit in 2048 wide");
pack(best.width);
const aw = best.w, ah = best.h, atlas = new Uint8Array(aw * ah * 4);
for (const u of uniq) for (let y = 0; y < u.h; y++) atlas.set(u.buf.subarray(y * u.w * 4, (y + 1) * u.w * 4), ((u.rect.y + y) * aw + u.rect.x) * 4);
const png = encodePNG(aw, ah, atlas);

// ---- JSON (Aseprite hash)
const dur = Math.round(1000 / targetFps), frames = {};
seq.forEach((u, i) => {
  frames[String(i)] = {
    frame: { x: u.rect.x, y: u.rect.y, w: u.w, h: u.h }, rotated: false, trimmed: u.w !== W || u.h !== H,
    spriteSourceSize: { x: u.x0, y: u.y0, w: u.w, h: u.h }, sourceSize: { w: W, h: H }, duration: dur,
  };
});
const pivot = { x: fx.meta.origin[0] * scale, y: fx.meta.origin[1] * scale };
const json = {
  frames,
  meta: {
    app: "skillfx/phaser-atlas", version: "1", image: `${name}.png`, format: "RGBA8888", size: { w: aw, h: ah }, scale: "1",
    frameTags: [{ name, from: 0, to: outN - 1, direction: "forward" }],
    pivot, skillfx: { id, fps: targetFps, srcFps, loop: !!fx.meta.loop, frames: outN, unique: uniq.length, sourceSize: [W, H], palette: pal ? basename(palFile) : null },
  },
};
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `${name}.png`), png);
writeFileSync(join(outDir, `${name}.json`), JSON.stringify(json, null, 1));

// ---- manifest
const mf = join(outDir, "index.json");
let list = [];
if (existsSync(mf)) try { list = JSON.parse(readFileSync(mf, "utf8")).atlases ?? []; } catch {}
list = list.filter((a) => a.key !== name);
list.push({ key: name, image: `${name}.png`, json: `${name}.json`, tags: [name], fps: targetFps, frames: outN, loop: !!fx.meta.loop, size: [aw, ah], pivot: [pivot.x, pivot.y], source: id });
list.sort((a, b) => a.key.localeCompare(b.key));
writeFileSync(mf, JSON.stringify({ atlases: list }, null, 1));

console.log(`${id} -> ${name}: frames ${outN} (src ${total} @${srcFps}fps -> ${targetFps}fps), unique ${uniq.length}, atlas ${aw}x${ah}, PNG ${png.length} bytes, pivot ${pivot.x},${pivot.y}, ${pal ? "snapped to " + basename(palFile) + " (" + pal.length + " colors)" : "no snap"}`);
