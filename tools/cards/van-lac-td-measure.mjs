// Measures the K-criteria of design/tienson/08-van-lac-topdown.md for di-hoa/van-lac-td, both weaves. Prints a table.
// node tools/cards/van-lac-td-measure.mjs [outdir-for-atlas-scratch]
// Pixels are read from the effect alone composited over transparency (what the atlas exports); no actor, no backdrop.
import { mkdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createFrame, clearFrame, createFx, composite, painterFor } from '../../src/core/index.js';
import { ROOT, loadEffect } from '../lib/fxlib.mjs';

const fx = await loadEffect('di-hoa/van-lac-td');
const [W, H] = fx.meta.size, [OX, OY] = fx.meta.origin, FPS = 30, N = Math.round(fx.meta.duration * FPS);
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const C = ['#140c12', '#4a1428', '#a8204a', '#ff4f7a', '#ffb3c6', '#efe9ee', '#ffffff'].map(hex);
const PAL = [...C, '#f4eef4', '#b9b3c4', '#d8d0e0', '#2b2626', '#5a524f', '#8f8580'].map((s) => (Array.isArray(s) ? s : hex(s)));
const near = (r, g, b, c, d = 8) => Math.abs(r - c[0]) <= d && Math.abs(g - c[1]) <= d && Math.abs(b - c[2]) <= d;
const inPal = (r, g, b) => PAL.some((c) => near(r, g, b, c));
function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return [0, 0];
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, mx ? d / mx : 0];
}
const pct = (a, b) => (b ? (100 * a) / b : 0);
const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2);

function render(weave) {
  const mk = (part) => createFx(fx.mod, { x: OX, y: OY, part, weave });
  const inst = { floor: mk('floor'), back: mk('back'), front: mk('front') };
  const fr = createFrame(W, H), frames = [];
  for (let i = 0; i < N; i++) {
    if (i > 0) for (const k in inst) inst[k].update(1 / FPS);
    const L = {};
    for (const k of ['floor', 'back', 'front']) {
      clearFrame(fr); inst[k].draw(fr, k === 'front' ? 'front' : 'back');
      L[k] = composite(fr, new Uint8ClampedArray(W * H * 4), null);
    }
    const all = new Uint8ClampedArray(W * H * 4);   // all three layers over transparency, in draw order
    clearFrame(fr);
    for (const k of ['floor', 'back', 'front']) inst[k].draw(fr, k === 'front' ? 'front' : 'back');
    composite(fr, all, null);
    frames.push({ ...L, all });
  }
  return frames;
}
const A = (b, i) => b[i * 4 + 3];
const opaque = (b) => { let n = 0; for (let i = 0; i < W * H; i++) if (A(b, i) >= 128) n++; return n; };

function time(weave) {
  const mod = fx.mod, o = { weave, seed: 5 }, f = createFrame(W, H), ts = [], reps = [];
  for (let rep = 0; rep < 4; rep++) for (let i = 0; i < N; i++) {
    clearFrame(f);
    const q = painterFor(f); q.place(OX, OY);
    const t0 = performance.now();
    mod.drawBack?.(q, i / FPS, o); mod.draw(q, i / FPS, o);
    if (rep) ts.push(performance.now() - t0);
    if (i === N - 1) reps.push(ts.length ? ts.slice(-N).reduce((a, b) => a + b, 0) / Math.min(ts.length, N) : 0);
  }
  ts.sort((a, b) => a - b);
  return { reps, mean: ts.reduce((a, b) => a + b, 0) / ts.length, med: ts[ts.length >> 1], max: ts[ts.length - 1] };
}

function atlasKB(weave) {
  const dir = join(ROOT, '..', '_scratch_vltd_atlas', weave);   // outside src/ and outside tiensonv2
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  let kb = 0; const per = {};
  for (const part of ['floor', 'back', 'front']) {
    const r = spawnSync('node', [join(ROOT, 'tools', 'phaser-atlas.mjs'), 'di-hoa/van-lac-td', '--out', dir, '--name', part, '--no-snap', '--opts', JSON.stringify({ part, weave })], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
    const s = statSync(join(dir, part + '.png')).size + statSync(join(dir, part + '.json')).size;
    per[part] = s / 1024; kb += s / 1024;
  }
  rmSync(join(ROOT, '..', '_scratch_vltd_atlas'), { recursive: true, force: true });
  return { kb, per };
}

function runLen(b) {   // longest vertical opaque run (px) in any column
  let best = 0;
  for (let x = 0; x < W; x++) { let run = 0; for (let y = 0; y < H; y++) { if (A(b, y * W + x) >= 128) { run++; if (run > best) best = run; } else run = 0; } }
  return best;
}
function gapAxis(frame) {   // smallest horizontal gap across the axis between the serpents (back + front layers only)
  const m = new Uint8Array(W * H);
  for (const k of ['back', 'front']) for (let i = 0; i < W * H; i++) if (A(frame[k], i) >= 128) m[i] = 1;
  let min = Infinity, merged = 0, rows = 0;
  for (let y = OY - 70; y <= OY - 8; y++) {
    let l = -1, r = -1;
    for (let x = OX - 1; x >= OX - 30; x--) if (m[y * W + x]) { l = x; break; }
    for (let x = OX; x <= OX + 30; x++) if (m[y * W + x]) { r = x; break; }
    if (l < 0 || r < 0) continue;
    rows++;
    const gap = r - l - 1;
    if (gap < min) min = gap;
    if (gap < 3) merged++;
  }
  return { min: min === Infinity ? 'n/a' : min, rowsLt3: merged, rows };
}

const out = {};
for (const weave of ['cross', 'kiss']) {
  const fr = render(weave), R = {};
  const at = (t) => Math.round(t * FPS);
  // K1
  let tot = 0, ok = 0, cg = 0;
  for (const f of fr) for (let i = 0; i < W * H; i++) {
    if (A(f.all, i) < 128) continue;
    const r = f.all[i * 4], g = f.all[i * 4 + 1], b = f.all[i * 4 + 2];
    tot++; if (inPal(r, g, b)) ok++;
    const [h, s] = hsv(r, g, b); if (h >= 20 && h <= 200 && s > 0.25) cg++;
  }
  let a0 = 0; for (const f of fr) for (let i = 0; i < W * H; i++) if (A(f.all, i) > 0) a0++;
  R.K1 = `${f2(pct(ok, tot))} % in palette (${ok}/${tot}); orange/green(h20-200,s>.25): ${cg}; px lost to 2-level alpha (a>0 -> a>=128): ${f2(pct(a0 - tot, a0))} % (${a0}->${tot})`;
  // K3 (mirror about x=112: x'=224-x as briefed; and about 111.5: x'=223-x = the pixel-grid mirror the dots use)
  for (const [nm, S] of [['223-x', 223]]) {
    const v = [];
    for (const f of fr) {
      let op = 0, df = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, a = A(f.all, i);
        if (a >= 128) op++;
        const xm = S - x, j = xm >= 0 && xm < W ? y * W + xm : -1;
        const same = j >= 0 && f.all[i * 4] === f.all[j * 4] && f.all[i * 4 + 1] === f.all[j * 4 + 1] && f.all[i * 4 + 2] === f.all[j * 4 + 2] && a === A(f.all, j);
        if (!same && (a >= 128 || (j >= 0 && A(f.all, j) >= 128))) df++;
      }
      if (op) v.push(pct(df, op));
    }
    R['K3 ' + nm] = `max ${f2(Math.max(...v))} %, mean ${f2(v.reduce((a, b) => a + b, 0) / v.length)} %`;
  }
  // K4
  let min4 = Infinity, at4 = 0;
  for (let i = at(1.55); i <= at(2.5); i++) {
    let n = 0;
    for (let y = OY - 57; y <= OY; y++) for (let x = OX - 10; x <= OX + 10; x++) if (A(fr[i].front, y * W + x) >= 128) n++;
    if (n < min4) { min4 = n; at4 = i; }
  }
  R.K4 = `min ${min4} px opaque in body box (frame ${at4}, t=${f2(at4 / FPS)})`;
  // K7
  const k7 = [];
  for (const k of ['floor', 'back', 'front']) {
    const v = []; let sumL = 0, sumR = 0;
    for (const f of fr) {
      let L = 0, Rr = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A(f[k], y * W + x) >= 128) (x < OX ? L++ : Rr++);
      sumL += L; sumR += Rr;
      if (L + Rr >= 20) v.push((100 * Math.abs(L - Rr)) / (L + Rr));
    }
    k7.push(`${k} max ${f2(Math.max(...v))}% mean ${f2(v.reduce((a, b) => a + b, 0) / v.length)}% total L/R ${sumL}/${sumR}`);
  }
  R.K7 = k7.join(' | ');
  // K9
  let k9 = 0, k9f = 0;
  for (let i = at(2.4); i < N; i++) { const r = runLen(fr[i].all); if (r > k9) { k9 = r; k9f = i; } }
  R.K9 = `longest vertical opaque run ${k9} px (frame ${k9f}, t=${f2(k9f / FPS)})`;
  // K10: front layer, option only:'heart', C[3..6] px at each beat peak (+0.03 s) and max radius from the chest
  {
    const h = createFx(fx.mod, { x: OX, y: OY, part: 'front', weave, only: 'heart' }), hf = createFrame(W, H), cnt = [], rad = [];
    const want = [1.55, 1.9, 2.25].map((t) => Math.round((t + 0.03) * FPS)); let ii = 0;
    for (let i = 0; i <= want[2]; i++) {
      if (i > 0) h.update(1 / FPS);
      if (!want.includes(i)) continue;
      clearFrame(hf); h.draw(hf, 'front'); const b = composite(hf, new Uint8ClampedArray(W * H * 4), null); let n = 0, rm = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x; if (A(b, p) >= 128 && [3, 4, 5, 6].some((c) => near(b[p * 4], b[p * 4 + 1], b[p * 4 + 2], C[c]))) { n++; rm = Math.max(rm, Math.hypot(x - OX, y - (OY - 30))); } }
      cnt.push(n); rad.push(f2(rm)); ii++;
    }
    R.K10 = `heart-only front C[3..6] px @1.58/1.93/2.28: ${cnt.join(' / ')} -> ${cnt[0] < cnt[1] && cnt[1] < cnt[2] ? 'increasing OK' : 'NOT increasing'}; max radius from chest (0,-30): ${rad.join(' / ')} px`;
  }
  // K12
  let k12 = 0, k12f = 0;
  for (let i = at(2.6); i <= at(2.95); i++) {
    const b = fr[i].front; let iso = 0, op = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x; if (A(b, p) < 128) continue; op++;
      if (!near(b[p * 4], b[p * 4 + 1], b[p * 4 + 2], C[6])) continue;
      let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < H && A(b, p + dy * W + dx) >= 128) nb++;
      if (!nb) iso++;
    }
    const v = pct(iso, op); if (v > k12) { k12 = v; k12f = i; }
  }
  R.K12 = `max isolated-white ${f2(k12)} % of front layer pixels (frame ${k12f})`;
  // K13
  const tm = time(weave);
  const lost = {}; let before = 0, after = 0;
  for (const k of ['floor', 'back', 'front']) {
    let b4 = 0, af = 0;
    for (const f of fr) for (let p = 0; p < W * H; p++) { const a = A(f[k], p); if (a > 0) b4++; if (a >= 128) af++; }
    lost[k] = `${k} ${f2(pct(b4 - af, b4))}% (${b4}->${af})`; before += b4; after += af;
  }
  const at_ = atlasKB(weave);
  R.K13 = `draw ms/frame mean ${f2(tm.mean)} med ${f2(tm.med)} max ${f2(tm.max)}; mean per rep 2..4: ${tm.reps.slice(1).map(f2).join(' / ')}; atlas --no-snap ${f2(at_.kb / 1024)} MB = ` + Object.entries(at_.per).map(([k, v]) => `${k} ${f2(v)} KB`).join(', ') +
    `; alpha-2-level loss (px a>0 -> a>=128): ${lost.floor}, ${lost.back}, ${lost.front}; total ${f2(pct(before - after, before))}%`;
  // K15
  R.K15 = weave !== 'kiss' ? 'n/a (cross)' : [0.8, 1.2].map((t) => { const g = gapAxis(fr[at(t)]); return `t=${t}: min gap ${g.min} px, rows gap<3: ${g.rowsLt3}/${g.rows}`; }).join(' | ');
  out[weave] = R;
}
for (const weave of ['cross', 'kiss']) {
  console.log(`\n=== weave ${weave} ===`);
  for (const [k, v] of Object.entries(out[weave])) console.log(`${k.padEnd(10)} ${v}`);
}
