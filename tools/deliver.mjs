#!/usr/bin/env node
// Xuất bản giao người dùng: act ở zoom 1 → ffmpeg phóng nearest ×K → MP4 (crf 15) + GIF (palette, 20 fps).
// Thay quy trình gõ tay (act.mjs --mp4 ở zoom 2 trên Windows từng ra file 261 byte, xem LESSONS).
//
//   node tools/deliver.mjs di-hoa/thanh-lien --name 01-thanh-lien-dia-tam-hoa --dir ../deliver/di-hoa
//   tuỳ chọn: --scale 3  --fps 20 (GIF)  --no-gif  --no-mp4

import { spawnSync } from "node:child_process";
import { mkdirSync, statSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { ROOT, resolveIds, loadEffect, renderAct, writeVideo } from "./lib/fxlib.mjs";

const args = process.argv.slice(2), flags = {}, pos = [];
for (let i = 0; i < args.length; i++) {
  if (["--no-gif", "--no-mp4"].includes(args[i])) flags[args[i].slice(2)] = true;
  else if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i];
  else pos.push(args[i]);
}
const [id] = resolveIds(pos), K = +(flags.scale ?? 3), FPS = +(flags.fps ?? 20);
const dir = resolve(ROOT, flags.dir ?? "../deliver"), name = flags.name ?? id.split("/")[1];
mkdirSync(dir, { recursive: true });

const fx = await loadEffect(id), r = renderAct(fx, { fps: 60 });
const raw = join(tmpdir(), `deliver-${process.pid}.mp4`);
writeVideo(raw, r, 1);
const ff = (a) => {
  const p = spawnSync("ffmpeg", ["-v", "error", "-y", ...a], { encoding: "utf8" });
  if (p.status !== 0) throw new Error("ffmpeg: " + p.stderr);
};
const scale = `scale=iw*${K}:ih*${K}:flags=neighbor`, made = [];
if (!flags["no-mp4"]) {
  const f = join(dir, name + ".mp4");
  ff(["-i", raw, "-vf", scale, "-c:v", "libx264", "-crf", "15", "-pix_fmt", "yuv420p", f]);
  made.push(f);
}
if (!flags["no-gif"]) {
  const f = join(dir, name + ".gif");
  ff(["-i", raw, "-vf", `fps=${FPS},${scale},split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none`, f]);
  made.push(f);
}
rmSync(raw, { force: true });
for (const f of made) {
  const sz = statSync(f).size;
  if (sz < 10000) throw new Error(`${f} chỉ ${sz} byte: hỏng`);
  console.log(`${f}  ${(sz / 1024).toFixed(0)} KB`);
}
console.log(`${id}: ${r.frames.length} khung act (${(r.frames.length / r.fps).toFixed(2)} s), ${r.w}x${r.h} ×${K}`);
