#!/usr/bin/env node
// Render effects so you can look at them.
//
//   node tools/render.mjs fire/torch            contact sheet: records/fire/torch/contact.png
//   node tools/render.mjs fire --gif            every fire effect, plus an animated GIF each
//   node tools/render.mjs "magic/portal*" --mp4 --scale 6
//   node tools/render.mjs ui/level-up --all     every frame in the contact sheet
//   node tools/render.mjs fire/torch --opts '{"palette":["#102","#215","#43a","#8cf","#fff"]}'
//
// Options: --gif --mp4 --sheet (transparent PNG + JSON) --all --max N (frames in the contact sheet)
// --zoom N (contact sheet scale) --scale N (GIF/MP4) --bg dark|ground|sky|light|black|none --seed N --fps N --opts JSON --out DIR
// --no-actor --loops N (repeat a loop in the GIF/MP4)
//
// Top-down views (camera tilted 30 degrees, painter space "aim" by default; see design/top-down/00-8-huong.md):
//   node tools/render.mjs vocab/vocab-strike --view SE           one heading: E SE S NE N, or W SW NW (E SE NE mirrored)
//   node tools/render.mjs vocab/vocab-strike --dirs 8            eight sheets <name>_<DIR>.png (+ JSON with --sheet)
//   node tools/render.mjs vocab/vocab-strike --dirs 8 --card 0.5,0.73,0.9,1.1   8 rows x those times -> card.png
// --pitch DEG (default 30), --card times are seconds on the act clock (the effect's own t).
//
// This shows the effect by itself, with the character standing by. tools/act.mjs shows it acted out.

import { join, dirname } from "node:path";
import { mkdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { ROOT, resolveIds, loadEffect, renderFrames, contactSheet, spriteSheet, writeVideo, save, canvas, upscale } from "./lib/fxlib.mjs";
import { createFrame, clearFrame, createAct, actBounds, composite, backdrop } from "../src/core/index.js";

// ---- top-down views: floor heading in radians (0 = east, pi/2 = towards the viewer). W, SW, NW are the mirror of E, SE, NE.
const DEG = Math.PI / 180;
const HEADING = { E: 0, SE: 45 * DEG, S: 90 * DEG, NE: -45 * DEG, N: -90 * DEG };
const MIRROR = { W: "E", SW: "SE", NW: "NE" };
const ORDER = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
const flipRGBA = (rgba, w, h) => {
  const out = new Uint8ClampedArray(rgba.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.set(rgba.subarray((y * w + x) * 4, (y * w + x) * 4 + 4), (y * w + (w - 1 - x)) * 4);
  return out;
};
/** One canvas for every heading, so the cells line up: the union of the five built headings, made symmetric so a mirror keeps the feet put. */
function viewBox(fx, pitch, pad = 6) {
  let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
  for (const dir of Object.values(HEADING)) {
    const b = actBounds(fx.mod, { dir, pitch });
    x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1);
  }
  const R = Math.max(-x0, x1) + pad;
  return { w: 2 * R + 1, h: y1 - y0 + pad * 2, X: R, Y: pad - y0 };
}
/** The act (or the effect with the character standing by) played from one heading: { w, h, fps, n, frames: [{ t, color, clear }] }. */
function renderView(fx, dirName, box, pitch, flags) {
  const base = MIRROR[dirName] ?? dirName, view = { dir: HEADING[base], pitch }, { w, h, X, Y } = box, meta = fx.meta, fps = flags.fps ? +flags.fps : 60;
  const frame = createFrame(w, h), bgKind = flags.bg ?? meta.bg, bg = bgKind === "none" ? null : backdrop(bgKind === "light" || bgKind === "black" ? bgKind : "floor", w, h, Y); // top-down: a floor seen from above
  const act = createAct(fx.mod, { x: X, y: Y, view, ...(flags.seed ? { seed: +flags.seed } : {}), ...(flags.opts ? JSON.parse(flags.opts) : {}) });
  const frames = [], max = Math.round((meta.loop ? meta.duration * 2 - act.t : 8) * fps);
  const show = () => {
    clearFrame(frame);
    act.draw(frame, { body: !flags["no-actor"], target: true });
    let color = composite(frame, new Uint8ClampedArray(w * h * 4), bg), clear = composite(frame, new Uint8ClampedArray(w * h * 4), null);
    if (MIRROR[dirName]) { color = flipRGBA(color, w, h); clear = flipRGBA(clear, w, h); }
    frames.push({ t: act.t, frozen: act.frozen, color, clear });
  };
  show();
  for (let i = 0; i < max && !act.done(); i++) { act.update(1 / fps); show(); }
  if (!meta.loop) for (let i = 0; i < fps * 0.3; i++) { act.update(1 / fps); show(); }
  return { w, h, fps, n: frames.length, frames, pivot: [X, Y] };
}
const GRID = [["W", "NW", "N", "NE"], ["SW", "S", "SE", "E"]];
/** One video: the eight headings in a 4x2 compass grid, 4 px apart, all cells on the same frame. Rendered at zoom 1, ffmpeg scales by k. */
function writeGridVideo(file, runs, k, loops) {
  const first = runs.E, { w, h, fps } = first, gap = 4, n = Math.min(...Object.values(runs).map((r) => r.n));
  const GW = 4 * w + 5 * gap, GH = 2 * h + 3 * gap, img = canvas(GW, GH);
  const frames = [];
  for (let i = 0; i < n; i++) {
    img.rect(0, 0, GW, GH, [12, 11, 16, 255]);
    GRID.forEach((row, ry) => row.forEach((d, cx) => {
      const x = gap + cx * (w + gap), y = gap + ry * (h + gap);
      img.paste(runs[d].frames[i].color, w, h, x, y);
      img.text(d, x + 2, y + 2, 1, [255, 214, 120]);
    }));
    frames.push(Buffer.from(img.data));
  }
  const W = GW * k, H = GH * k, mp4 = file.endsWith(".mp4"), sc = `scale=${W}:${H}:flags=neighbor`;
  const vf = mp4 ? `${sc},pad=${W + (W % 2)}:${H + (H % 2)}:0:0:black,format=yuv420p` : `${sc},split[a][b];[a]palettegen=max_colors=255:stats_mode=diff[p];[b][p]paletteuse=dither=none`;
  const args = ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${GW}x${GH}`, "-r", String(fps), "-i", "-", "-vf", vf];
  if (mp4) args.push("-c:v", "libx264", "-crf", "14", "-preset", "slow", "-movflags", "+faststart"); else args.push("-loop", "0");
  args.push(file);
  mkdirSync(dirname(file), { recursive: true });
  const all = []; for (let l = 0; l < loops; l++) all.push(...frames);
  const res = spawnSync("ffmpeg", args, { input: Buffer.concat(all), maxBuffer: 1 << 30 });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`ffmpeg failed: ${res.stderr}`);
  const size = statSync(file).size;
  if (size < 100 * 1024) throw new Error(`${file}: only ${size} bytes (ffmpeg pipe problem?)`);
  return { size, n, GW, GH, W, H, fps };
}
const filled = (rgba) => { let n = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i]) n++; return n; };

const args = process.argv.slice(2), flags = {}, ids = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) ids.push(a);
  else if (["gif", "mp4", "sheet", "all", "no-actor"].includes(a.slice(2))) flags[a.slice(2)] = true;
  else flags[a.slice(2)] = args[++i];
}
if (!ids.length) {
  console.error("usage: node tools/render.mjs <id|category|pattern>... [--gif] [--mp4] [--sheet] [--all]");
  process.exit(1);
}

const out = flags.out ?? join(ROOT, "records");
let failed = 0;
for (const id of resolveIds(ids)) {
  try {
    const fx = await loadEffect(id);
    if (flags.view || flags.dirs) {
      const pitch = (flags.pitch ? +flags.pitch : 30) * DEG, dirs = flags.dirs ? ORDER : [flags.view.toUpperCase()];
      for (const d of dirs) if (!(d in HEADING) && !(d in MIRROR)) throw new Error(`--view ${d}: use ${ORDER.join(" ")}`);
      const box = viewBox(fx, pitch), name = id.split("/")[1], dir = join(out, id), made = [], runs = {};
      for (const d of dirs) {
        runs[d] = renderView(fx, d, box, pitch, flags);
        if (flags.dirs || flags.sheet) {
          const s = spriteSheet(fx, runs[d], `${name}_${d}`);
          made.push(save(join(dir, `${name}_${d}.png`), s.png));
          if (flags.sheet || flags.dirs) made.push(save(join(dir, `${name}_${d}.json`), JSON.stringify({ ...s.json, pixelfx: { ...s.json.meta.pixelfx, view: { dir: d, pitchDeg: pitch / DEG } } }, null, 1)));
        } else made.push(save(join(dir, `contact_${d}.png`), contactSheet(fx, runs[d], { max: +(flags.max ?? 16), zoom: flags.zoom ? +flags.zoom : undefined })));
      }
      if (flags.dirs && (flags.gif || flags.mp4)) {
        const k = +(flags.scale ?? 2), loops = +(flags.loops ?? (fx.meta.loop ? 2 : 1));
        for (const ext of ["gif", "mp4"]) if (flags[ext]) {
          const f = join(dir, `${name}_8dirs.${ext}`), v = writeGridVideo(f, runs, k, ext === "mp4" && fx.meta.loop ? Math.max(loops, 3) : loops);
          made.push(f);
          console.log(`grid ${ext}: ${v.size} bytes, ${v.n} frames x${ext === "mp4" && fx.meta.loop ? Math.max(loops, 3) : loops} loops, source ${v.GW}x${v.GH}, output ${v.W}x${v.H}, ${v.fps} fps`);
        }
      }
      if (flags.card) {
        // a grid: one row per heading, one column per time (the nearest frame at or after it)
        const times = flags.card.split(",").map(Number), k = +(flags.zoom ?? 2), { w, h } = box, pad = 6, head = 22, lab = 34;
        const img = canvas(lab + times.length * (w * k + pad) + pad, head + dirs.length * (h * k + pad) + pad);
        times.forEach((t, c) => img.text(`t ${t}`, lab + c * (w * k + pad), 6, 2));
        const counts = [];
        dirs.forEach((d, row) => {
          img.text(d, 4, head + row * (h * k + pad) + 8, 2, [255, 214, 120]);
          const r = runs[d], line = [];
          times.forEach((t, c) => {
            const f = r.frames.find((q) => q.t >= t - 1e-6) ?? r.frames[r.frames.length - 1];
            img.paste(upscale(f.color, w, h, k), w * k, h * k, lab + c * (w * k + pad), head + row * (h * k + pad));
            line.push(filled(f.clear));
          });
          counts.push(`${d.padEnd(3)} ${line.map((n) => String(n).padStart(6)).join(" ")}`);
        });
        made.push(save(join(dir, "card.png"), img.png()));
        console.log(`card ${img.w}x${img.h}, cell ${w}x${h} x${k}; pixels filled per cell (rows ${dirs.join(" ")}; columns t = ${times.join(", ")}):`);
        for (const l of counts) console.log(l);
      }
      console.log(`${id}  ${dirs.length} view${dirs.length > 1 ? "s" : ""}, ${runs[dirs[0]].n} frames of ${box.w}x${box.h}  ->  ${made.join("  ")}`);
      continue;
    }
    const r = renderFrames(fx, {
      fps: flags.fps ? +flags.fps : undefined,
      seed: flags.seed ? +flags.seed : undefined,
      bg: flags.bg,
      actor: flags["no-actor"] ? false : undefined,
      options: flags.opts ? JSON.parse(flags.opts) : undefined,
    });
    const dir = join(out, id), made = [];
    made.push(save(join(dir, "contact.png"), contactSheet(fx, r, { max: flags.all ? 400 : +(flags.max ?? 16), zoom: flags.zoom ? +flags.zoom : undefined })));
    const k = +(flags.scale ?? Math.max(2, Math.min(8, Math.floor(480 / Math.max(r.w, r.h)))));
    const loops = +(flags.loops ?? (fx.meta.loop ? 2 : 1));
    if (flags.gif && writeVideo(join(dir, "anim.gif"), r, k, { loops })) made.push(join(dir, "anim.gif"));
    if (flags.mp4 && writeVideo(join(dir, "anim.mp4"), r, k, { loops: Math.max(loops, fx.meta.loop ? 3 : 1) })) made.push(join(dir, "anim.mp4"));
    if (flags.sheet) {
      const name = id.split("/")[1], s = spriteSheet(fx, r, name);
      made.push(save(join(dir, `${name}.png`), s.png), save(join(dir, `${name}.json`), JSON.stringify(s.json, null, 1)));
    }
    console.log(`${id}  ${r.n} frames  ->  ${made.join("  ")}`);
  } catch (e) {
    failed++;
    console.error(`${id}  FAILED: ${e.stack ?? e}`);
  }
}
process.exit(failed ? 1 : 0);
