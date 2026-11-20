#!/usr/bin/env node
// A fingerprint of every effect's rendered frames, to prove a change to src/core left the pictures alone.
//
//   node tools/hash-frames.mjs [--out file.json] [id|category|pattern ...]     no ids = every effect
//
// Per id: one sha1 over the frames of (a) the plain render, (b) the render mirrored + rotated (exercises the
// painter's placement), each frame's color and light buffers; and, for effects with an act, the acted frames.
// Prints {id: hash} as JSON (and writes it to --out).

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { allIds, resolveIds, loadEffect, renderFrames, renderAct } from "./lib/fxlib.mjs";

const args = process.argv.slice(2), pats = [];
let out = null, child = false, chunk = 6;
for (let i = 0; i < args.length; i++) args[i] === "--out" ? (out = args[++i]) : args[i] === "--child" ? (child = true) : args[i] === "--chunk" ? (chunk = +args[++i]) : pats.push(args[i]);
const ids = pats.length ? resolveIds(pats) : allIds();

// a long list is hashed in short-lived child processes (a few ids each), so memory never piles up
if (!child && ids.length > chunk) {
  const res = {}, me = fileURLToPath(import.meta.url);
  for (let i = 0; i < ids.length; i += chunk) {
    const r = spawnSync(process.execPath, [me, "--child", ...ids.slice(i, i + chunk)], { encoding: "utf8", maxBuffer: 1 << 26 });
    let part;
    try { part = JSON.parse(r.stdout); } catch { part = Object.fromEntries(ids.slice(i, i + chunk).map((id) => [id, `ERR child failed (${r.status}) ${String(r.stderr).slice(0, 80)}`])); }
    Object.assign(res, part);
    console.error(`${Object.keys(res).length}/${ids.length}`);
  }
  const json = JSON.stringify(res, null, 1);
  if (out) writeFileSync(out, json); else console.log(json);
  process.exit(0);
}

const feed = (h, arr) => h.update(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength));
const res = {};
for (const id of ids) {
  const h = createHash("sha1");
  try {
    const fx = await loadEffect(id);
    for (const options of [undefined, { flip: true, angle: 0.6 }]) {
      const r = renderFrames(fx, { options });
      h.update(`${r.w}x${r.h}x${r.n};`);
      for (const f of r.frames) { feed(h, f.color); feed(h, f.raw); feed(h, f.light); }
    }
    if (fx.mod.act) {
      const r = renderAct(fx, {});
      h.update(`act ${r.w}x${r.h}x${r.n};`);
      for (const f of r.frames) feed(h, f.color);
    }
    res[id] = h.digest("hex").slice(0, 16);
  } catch (e) {
    res[id] = "ERR " + String(e.message ?? e).split("\n")[0];
  }
}
const json = JSON.stringify(res, null, 1);
if (out) writeFileSync(out, json);
else console.log(json);
