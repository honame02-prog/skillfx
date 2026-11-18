// Trang trình diễn toàn bộ skill đã chốt. Tái dùng createAct/composite của core, giống gallery/app.js và battle.js.
import { effects } from "../src/fx/index.js";
import { createFrame, clearFrame, createAct, actBounds, composite, backdrop } from "../src/core/index.js";

import { GROUPS, SKILLS } from "./skills.js";
const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, kids = []) => { const e = Object.assign(document.createElement(tag), props); for (const k of [].concat(kids)) e.append(k); return e; };
const fmt = (n) => n.toFixed(1).replace(".", ",");
let speed = 1;

class Runner {
  constructor(canvas, id, mod) {
    this.canvas = canvas; this.id = id; this.mod = mod;
    this.ctx = canvas.getContext("2d");
    this.meta = { fps: 30, bg: "ground", duration: 1, ...mod.meta };
    const b = { ...actBounds(mod) };
    b.y1 = Math.min(b.y1, 22);
    this.W = Math.ceil(b.x1 - b.x0); this.H = Math.ceil(b.y1 - b.y0);
    this.x = -b.x0; this.y = -b.y0;
    canvas.width = this.W; canvas.height = this.H;
    this.frame = createFrame(this.W, this.H);
    this.img = this.ctx.createImageData(this.W, this.H);
    this.bg = this.meta.bg === "none" ? null : backdrop(this.meta.bg, this.W, this.H, this.y);
    this.playing = false; this.visible = true;
    this.restart();
  }
  restart() {
    this.inst = createAct(this.mod, { x: this.x, y: this.y, flip: false });
    this.acc = 0; this.wait = 0; this.render();
  }
  tick(dt) {
    if (!this.playing || !this.visible) return;
    const step = 1 / this.meta.fps;
    this.acc = Math.min(this.acc + dt * speed, 0.25);
    let moved = false;
    while (this.acc >= step) {
      this.acc -= step;
      if (this.inst.done()) { this.wait += step; if (this.wait > 0.6) this.restart(); }
      else this.inst.update(step);
      moved = true;
    }
    if (moved) this.render();
  }
  render() {
    const f = clearFrame(this.frame);
    this.inst.draw(f);
    composite(f, this.img.data, this.bg);
    const [sx, sy] = this.inst.shake;
    if (sx || sy) this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.putImageData(this.img, sx, sy);
  }
}

const runners = [];
const scaleFor = (r, boxW) => Math.max(1, Math.min(3, Math.floor(boxW / r.W)));

function build() {
  const main = $("main");
  for (const [title, list] of GROUPS) {
    const grid = el("div", { className: "grid" });
    main.append(el("h2", { textContent: title }), grid);
    for (const [id, name, sub] of list) {
      const mod = effects[id];
      if (!mod) { console.error("thiếu skill trong registry:", id); continue; }
      const cv = el("canvas");
      const r = new Runner(cv, id, mod);
      runners.push(r);
      const stage = el("div", { className: "stage" }, cv);
      const b = (t, fn) => el("button", { type: "button", textContent: t, onclick: fn });
      const btnPause = b("Tạm dừng", () => { r.playing = !r.playing; btnPause.textContent = r.playing ? "Tạm dừng" : "Tiếp tục"; });
      const card = el("article", { className: "card" }, [
        stage,
        el("div", { className: "meta" }, [el("em", { textContent: fmt(r.meta.duration) + " s" }), el("b", { textContent: name }), el("span", { textContent: sub })]),
        el("div", { className: "btns" }, [b("Phát lại", () => { r.restart(); r.playing = true; btnPause.textContent = "Tạm dừng"; }), btnPause, b("Phóng to", () => openZoom(id, name))]),
      ]);
      Object.assign(r, { btnPause, card, stage });
      stage.style.cursor = "pointer"; stage.title = "Đưa lên sân khấu chính";
      stage.onclick = () => { select(id); scrollTo({ top: 0, behavior: "smooth" }); };
      grid.append(card);
    }
  }
  applyScale();
  addEventListener("resize", applyScale);
  // chỉ chạy canvas đang hiện trong màn hình
  const io = new IntersectionObserver((es) => { for (const e of es) { const r = runners.find((x) => x.card === e.target); if (r) r.visible = e.isIntersecting; } }, { rootMargin: "100px" });
  for (const r of runners) { io.observe(r.card); r.playing = true; }
}
function applyScale() {
  for (const r of runners) {
    const boxW = r.stage.clientWidth - 12;
    if (boxW > 0) r.canvas.style.width = r.W * scaleFor(r, boxW) + "px";
  }
}

// ---- phóng to ×4
let zr = null;
function openZoom(id, name) {
  zr = new Runner($("z-cv"), id, effects[id]);
  zr.canvas.style.width = zr.W * 4 + "px";
  zr.playing = true;
  $("z-name").textContent = name; $("z-pause").textContent = "Tạm dừng";
  $("zoom").hidden = false;
}
function closeZoom() { $("zoom").hidden = true; zr = null; }
$("z-close").onclick = closeZoom;
$("z-replay").onclick = () => { if (zr) { zr.restart(); zr.playing = true; $("z-pause").textContent = "Tạm dừng"; } };
$("z-pause").onclick = () => { if (zr) { zr.playing = !zr.playing; $("z-pause").textContent = zr.playing ? "Tạm dừng" : "Tiếp tục"; } };
addEventListener("keydown", (e) => { if (e.key === "Escape") closeZoom(); });

// ---- sân khấu chính
let main = null, cur = -1;
const tabs = new Map();
function stageScale() {
  const box = $("big").clientWidth - 12;
  if (!main || box <= 0) return;
  const s = box >= main.W * 3 ? 3 : box >= main.W * 2 ? 2 : 1;
  main.canvas.style.width = main.W * s + "px";
}
function select(id, fromHash) {
  const i = SKILLS.findIndex((k) => k.id === id);
  if (i < 0) return;
  cur = i;
  const k = SKILLS[i];
  main = new Runner($("big-cv"), id, effects[id]);
  main.playing = true;
  stageScale();
  $("s-name").textContent = k.name; $("s-group").textContent = k.group; $("s-sub").textContent = k.sub.split(" · ").slice(1).join(" · ");
  $("s-dur").textContent = fmt(main.meta.duration) + " s";
  for (const [tid, b] of tabs) b.classList.toggle("on", tid === id);
  if (!fromHash && location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id);
}
function step(d) { select(SKILLS[(cur + d + SKILLS.length) % SKILLS.length].id); }
function buildPicker() {
  const box = $("picker");
  for (const [title, list] of GROUPS) {
    const g = el("div", { className: "pg" }, [el("span", { textContent: title })]);
    list.forEach(([id, name], n) => {
      const b = el("button", { type: "button", textContent: (list.length > 1 ? (n + 1) + ". " : "") + name, onclick: () => select(id) });
      tabs.set(id, b); g.append(b);
    });
    box.append(g);
  }
  $("prev").onclick = () => step(-1); $("next").onclick = () => step(1);
  $("s-replay").onclick = () => { main.restart(); main.playing = true; };
  addEventListener("keydown", (e) => {
    if (!$("zoom").hidden || /^(SELECT|INPUT)$/.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { step(1); e.preventDefault(); }
    else if (e.key === " " && e.target.tagName !== "BUTTON") { main.restart(); main.playing = true; e.preventDefault(); }
  });
  addEventListener("hashchange", () => select(location.hash.slice(1), true));
  addEventListener("resize", stageScale);
  select(SKILLS.some((k) => k.id === location.hash.slice(1)) ? location.hash.slice(1) : SKILLS[0].id, true);
}

const setAll = (on) => { for (const r of runners) { r.playing = on; r.btnPause.textContent = on ? "Tạm dừng" : "Tiếp tục"; } };
$("all-play").onclick = () => setAll(true);
$("all-stop").onclick = () => setAll(false);
$("speed").onchange = (e) => { speed = +e.target.value; };

build();
buildPicker();
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  for (const r of runners) r.tick(dt);
  if (zr) zr.tick(dt);
  if (main) { main.tick(dt); $("s-bar").style.width = Math.min(100, (main.inst.t / main.meta.duration) * 100) + "%"; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__showcase = { runners, get zoom() { return zr; } };
