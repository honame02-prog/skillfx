#!/usr/bin/env node
// Cổng tự động cho một skill trước khi đưa người xem: check.mjs sạch lỗi + hiệu năng cả act (trung vị, p95)
// + dải PNG lossless ở các mốc thời gian để soi bằng mắt. Dùng chung cho Opus và Codex.
//
//   node tools/gate.mjs di-hoa/thanh-lien
//   node tools/gate.mjs di-hoa/thanh-lien --at 0.3,0.5,1.2,1.7,2.1,2.6 --zoom 3 --med 5 --p95 16
//
// Ra: records/gate/<id>/strip.png + gate.json; dòng cuối "GATE PASS|FAIL <id> ...". Mã thoát 0 khi PASS.
// Ngưỡng mặc định: trung vị ≤ 5 ms, p95 ≤ 16 ms (1 khung 60 fps); hiệu chỉnh 17/11 trên tuyệt chiêu đã duyệt (p95 11–15 ms).
// Cảnh báo của check (tràn khung, chậm theo ngưỡng cũ 4 ms...) chỉ in ra, không làm FAIL; ngưỡng hiệu năng là --med/--p95.

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, resolveIds, loadEffect, renderAct, canvas, upscale, save } from "./lib/fxlib.mjs";
import { createFrame, clearFrame, createAct } from "../src/core/index.js";

const args = process.argv.slice(2), flags = {}, pos = [];
for (let i = 0; i < args.length; i++) args[i].startsWith("--") ? (flags[args[i].slice(2)] = args[++i]) : pos.push(args[i]);
const MED = +(flags.med ?? 5), P95 = +(flags.p95 ?? 16), ZOOM = +(flags.zoom ?? 3);
let bad = 0;

for (const id of resolveIds(pos)) {
  const fx = await loadEffect(id), { mod, meta } = fx, out = join(ROOT, "records", "gate", id.replace("/", "-"));
  mkdirSync(out, { recursive: true });
  const res = { id, fails: [], warns: [] };

  // 1. check.mjs
  const ck = spawnSync(process.execPath, [join(ROOT, "tools", "check.mjs"), id], { encoding: "utf8" });
  const lines = (ck.stdout || "").split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith(id.split("/")[0]) && !/^\d+ effects/.test(s) && !/^(ok|warn|FAIL)\s/.test(s));
  if (ck.status !== 0) res.fails.push("check: " + (lines.join(" | ") || ck.stderr.split("\n")[0]));
  else res.warns.push(...lines.map((s) => "check: " + s));

  // 2. hiệu năng cả act (update + draw, như game chạy 30 fps)
  if (mod.act) {
    const f = createFrame(640, 420), act = createAct(mod, { x: 160, y: 380 }), ms = [];
    for (let i = 0; i < 30 * 12 && !act.done(); i++) {
      const t0 = performance.now();
      act.update(1 / 30);
      act.draw(clearFrame(f));
      ms.push(performance.now() - t0);
    }
    ms.sort((a, b) => a - b);
    const q = (p) => +ms[Math.min(ms.length - 1, Math.floor(ms.length * p))].toFixed(2);
    res.perf = { frames: ms.length, median: q(0.5), p95: q(0.95), max: q(1) };
    if (res.perf.median > MED) res.fails.push(`chậm: trung vị ${res.perf.median} ms > ${MED}`);
    if (res.perf.p95 > P95) res.fails.push(`chậm: p95 ${res.perf.p95} ms > ${P95}`);
  }

  // 3. dải PNG ở các mốc
  const r = renderAct(fx, { fps: 30 }), t0 = r.frames[0].t, t1 = r.frames[r.frames.length - 1].t;
  const at = flags.at ? flags.at.split(",").map(Number) : Array.from({ length: 8 }, (_, i) => t0 + ((t1 - t0) * (i + 0.5)) / 8);
  const pick = at.map((t) => r.frames.reduce((b, f) => (Math.abs(f.t - t) < Math.abs(b.t - t) ? f : b)));
  const cols = Math.min(4, pick.length), rows = Math.ceil(pick.length / cols), cw = r.w * ZOOM + 4, ch = r.h * ZOOM + 18;
  const img = canvas(cols * cw, rows * ch);
  pick.forEach((f, j) => {
    const x = (j % cols) * cw, y = Math.floor(j / cols) * ch;
    img.text(f.t.toFixed(2), x + 2, y + 3, 2);
    img.paste(upscale(f.color, r.w, r.h, ZOOM), r.w * ZOOM, r.h * ZOOM, x, y + 16);
  });
  save(join(out, "strip.png"), img.png());
  res.strip = join(out, "strip.png");
  res.pass = !res.fails.length;
  writeFileSync(join(out, "gate.json"), JSON.stringify(res, null, 2));
  for (const w of res.warns) console.log("  warn  " + w);
  for (const e of res.fails) console.log("  FAIL  " + e);
  console.log(`GATE ${res.pass ? "PASS" : "FAIL"} ${id}  perf ${JSON.stringify(res.perf ?? {})}  strip ${res.strip}`);
  if (!res.pass) bad++;
}
process.exit(bad ? 1 : 0);
