// Trang trình diễn toàn bộ skill đã chốt. Tái dùng createAct/composite của core, giống gallery/app.js và battle.js.
import { effects } from "../src/fx/index.js";
import { createFrame, clearFrame, createAct, actBounds, composite, backdrop } from "../src/core/index.js";

const GROUPS = [
  ["Bộ Dị Hoả", [
    ["di-hoa/thanh-lien", "Thanh Liên Địa Tâm Hoả", "Dị Hoả 1 · lục lam, đánh vùng mặt đất"],
    ["di-hoa/cot-linh", "Cốt Linh Lãnh Hoả", "Dị Hoả 2 · trắng xương / lam băng, khống chế"],
    ["di-hoa/van-lac", "Vẫn Lạc Tâm Viêm", "Dị Hoả 3 · gần vô sắc, lõi đỏ hồng, đốt dần"],
    ["di-hoa/tam-thien", "Tam Thiên Diễm Viêm Hoả", "Dị Hoả 4 · tím đen, mưa sao lửa"],
    ["di-hoa/tinh-lien", "Tịnh Liên Yêu Hoả", "Dị Hoả 5 · trắng tinh viền vàng nhạt, hoá hư vô"],
  ]],
  ["Tuyệt chiêu", [["ultimate/phat-no-hoa-lien", "Phật Nộ Hoả Liên", "Tuyệt chiêu v3 · đổi 5 màu theo 5 dị hoả"]]],
  ["Đại Hoang Tù Thiên Chỉ", [["ultimate/tu-thien-chi", "Tù Thiên Chỉ", "Đại Hoang · mực đen và vàng kim, nặng, khối"]]],
];
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

const setAll = (on) => { for (const r of runners) { r.playing = on; r.btnPause.textContent = on ? "Tạm dừng" : "Tiếp tục"; } };
$("all-play").onclick = () => setAll(true);
$("all-stop").onclick = () => setAll(false);
$("speed").onchange = (e) => { speed = +e.target.value; };

build();
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  for (const r of runners) r.tick(dt);
  if (zr) zr.tick(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__showcase = { runners, get zoom() { return zr; } };
