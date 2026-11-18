// Đấu skill: hai bên luân phiên ra chiêu. Bên trái dùng Tù Thiên Chỉ, bên phải lao tới phản đòn bằng Phật Nộ Hoả Liên.
// Mỗi chiêu chạy đúng act của nó (tư thế, khựng hình, rung màn hình); người bị đánh do trang này vẽ và phản ứng theo hits.
import { createFrame, clearFrame, createAct, composite, backdrop, posed, SKINS, READY, Rng, mix } from "../src/core/index.js";
import { effects } from "../src/fx/index.js";
import { SKILLS } from "./skills.js";

const W = 480, H = 430, G = 400, STEP = 1 / 30;
const XA = 44;
let TTC = effects["ultimate/tu-thien-chi"], HL = effects["ultimate/phat-no-hoa-lien"];   // skill của bên trái / bên phải
let B_FAR = XA + TTC.act.target.x, B_NEAR = XA + HL.act.target.x;
const IDLE = { ...READY }, HURT = { ...READY, lean: -6, crouch: 4, fx: -6, fy: -30, bx: 8, by: -28 };
const KO = { ...READY, crouch: 11, lean: -9, fx: -8, fy: -12, bx: 6, by: -12 };
const DASH = { ...READY, lean: 7, crouch: 3, fx: 14, fy: -22, bx: -8, by: -24 };
const WHITE = 0xffffffff;

const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
cv.width = W; cv.height = H;
const frame = createFrame(W, H, 0, 0), img = ctx.createImageData(W, H), bg = backdrop("ground", W, H, G);
const $ = (id) => document.getElementById(id);

class Fighter {
  constructor(name, x, flip) { Object.assign(this, { name, x, flip, hp: 100, kx: 0, kv: 0, flashT: 0, skin: null, hurtT: 0, ko: false, pose: IDLE, clock: 0 }); }
  hit(h, dir, dmg) {
    if (h.skin !== undefined) this.skin = h.skin;
    if (!h.push) return;
    this.kv += dir * h.push * 30;
    this.flashT = Math.max(this.flashT, h.flash ?? 0.08);
    this.hurtT = 0.55;
    this.hp = Math.max(0, this.hp - dmg);
  }
  update(dt) {
    this.clock += dt;
    this.kx += this.kv * dt; this.kv *= Math.exp(-7 * dt);
    if (Math.abs(this.kv) < 8) this.kx += (0 - this.kx) * Math.min(1, 1.6 * dt);
    this.flashT = Math.max(0, this.flashT - dt); this.hurtT = Math.max(0, this.hurtT - dt);
  }
  currentPose() {
    if (this.ko) return KO;
    if (this.hurtT > 0) return HURT;
    if (this.pose !== IDLE) return this.pose;
    const up = Math.floor(this.clock * 3) & 1;   // breathing, like the act's idle
    return { ...IDLE, crouch: up, fy: IDLE.fy + up, by: IDLE.by + up };
  }
  draw(f) {
    const q = this.currentPose(), r = posed(q), C = f.color;
    const X = Math.round(this.x + this.kx + (this.flip ? -(q.x ?? 0) : q.x ?? 0)), Y = G + Math.round(q.y ?? 0);
    for (let dy = 0; dy < 2; dy++) for (let x = -10 + dy * 2; x <= 10 - dy * 2; x++) {   // shadow
      const i = (G + dy) * W + X + x;
      if (X + x >= 0 && X + x < W) C[i] = (C[i] & 0xffffff) | (Math.max(C[i] >>> 24, 110) << 24);
    }
    const sk = this.flashT > 0 ? [WHITE, 1] : this.skin ? SKINS[this.skin] : null;
    for (let i = 0; i < r.n; i++) {
      const px = this.flip ? X - r.xs[i] - 1 : X + r.xs[i], py = Y + r.ys[i];
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      C[py * W + px] = sk ? (mix(r.color[i], sk[0], sk[1]) | 0xff000000) >>> 0 : r.color[i];
    }
  }
}

let A, B, phase, phaseT, act, attacker, defender, R, speed = 1, playing = true, acc = 0, round = 0;
function log(s) { const d = document.createElement("div"); d.textContent = s; $("log").prepend(d); }
function hud() {
  for (const [k, f] of [["A", A], ["B", B]]) { $("hp" + k).style.width = f.hp + "%"; $("trail" + k).style.width = f.hp + "%"; $("hp" + k).style.background = f.hp > 35 ? "var(--hp)" : "var(--hurt)"; }
}
function pop(x, text, crit) {
  const e = document.createElement("div");
  e.className = "pop" + (crit ? " crit" : ""); e.textContent = text;
  e.style.left = (x / W * 100) + "%"; e.style.top = ((G - 90) / H * 100) + "%";
  $("stage").append(e); setTimeout(() => e.remove(), 1200);
}
function setPhase(p) {
  phase = p; phaseT = 0;
  const label = { intro: "chuẩn bị", A: `hiệp ${round}: Kim Chỉ Tôn ra chiêu`, dash: "Liên Hoả Tăng lao tới", B: `hiệp ${round}: Liên Hoả Tăng phản đòn`, back: "lùi về thế thủ", ko: "kết thúc" }[p];
  $("turn").textContent = label;
}
function cast(who, mod, target, power) {
  attacker = who; defender = target;
  act = createAct(mod, { x: who.x, y: G, flip: who.flip, seed: R.int(1, 9999) });
  act.onHit = (h) => {
    if (h.target === false) return;
    const crit = !!h.push && R.chance(0.2), dmg = h.push ? Math.round((h.push * 5 + R.range(0, 6)) * power * (crit ? 1.5 : 1)) : 0;
    defender.hit(h, defender.x > who.x ? 1 : -1, dmg);
    if (dmg) { pop(defender.x, (crit ? "CHÍ MẠNG " : "") + "-" + dmg, crit); log(`${who.name} trúng ${defender.name}: -${dmg}${crit ? " (chí mạng)" : ""}`); }
    hud();
  };
}
function restart() {
  R = new Rng((Date.now() & 0xffff) + 1);
  A = new Fighter("Kim Chỉ Tôn", XA, false); B = new Fighter("Liên Hoả Tăng", B_FAR, true);
  $("nameA").textContent = SKILLS.find((k) => effects[k.id] === TTC).name; $("nameB").textContent = SKILLS.find((k) => effects[k.id] === HL).name;
  act = null; round = 0; $("log").textContent = ""; $("banner").classList.remove("on");
  hud(); setPhase("intro");
}
function checkKO() {
  const loser = A.hp <= 0 ? A : B.hp <= 0 ? B : null;
  if (!loser) return false;
  loser.ko = true; act = null; setPhase("ko");
  $("banner").textContent = "K.O."; $("banner").classList.add("on");
  log(`${loser === A ? B.name : A.name} thắng sau ${round} hiệp`);
  return true;
}
function step(dt) {
  phaseT += dt;
  A.update(dt); B.update(dt);
  if (act) act.update(dt);
  switch (phase) {
    case "intro": if (phaseT > 1) { round++; cast(A, TTC, B, 1); setPhase("A"); } break;
    case "A": if (act.done()) { act = null; if (!checkKO()) setPhase("dash"); } break;
    case "dash": {
      const u = Math.min(1, (phaseT - 0.4) / 0.4);
      B.pose = u > 0 && u < 1 ? DASH : IDLE;
      if (u > 0) B.x = B_FAR + (B_NEAR - B_FAR) * (u * u * (3 - 2 * u));
      if (phaseT > 1.0) { B.pose = IDLE; cast(B, HL, A, 1.15); setPhase("B"); }
      break;
    }
    case "B": if (act.done()) { act = null; if (!checkKO()) setPhase("back"); } break;
    case "back": {
      const u = Math.min(1, phaseT / 0.5);
      B.x = B_NEAR + (B_FAR - B_NEAR) * (u * u * (3 - 2 * u));
      if (phaseT > 1.1) { round++; cast(A, TTC, B, 1); setPhase("A"); }
      break;
    }
    case "ko": if (phaseT > 4) restart(); break;
  }
}
function render() {
  const f = clearFrame(frame);
  if (act) {
    act.draw(f, { target: false });
    defender.draw(f);
  } else { A.draw(f); B.draw(f); }
  composite(f, img.data, bg);
  const [sx, sy] = act ? act.shake : [0, 0];
  if (sx || sy) ctx.clearRect(0, 0, W, H);
  ctx.putImageData(img, sx, sy);
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (playing) { acc += dt * speed; while (acc >= STEP) { acc -= STEP; step(STEP); } }
  render();
  requestAnimationFrame(loop);
}
$("play").onclick = () => { playing = !playing; $("play").textContent = playing ? "Tạm dừng" : "Tiếp tục"; };
$("restart").onclick = restart;
// chọn skill cho mỗi bên; đổi skill thì bắt đầu trận mới
for (const [sel, side] of [[$("pickA"), "A"], [$("pickB"), "B"]]) {
  for (const k of SKILLS) sel.append(new Option(k.name, k.id));
  sel.value = side === "A" ? "ultimate/tu-thien-chi" : "ultimate/phat-no-hoa-lien";
  sel.onchange = () => {
    const mod = effects[$("pickA").value], mod2 = effects[$("pickB").value];
    TTC = mod; HL = mod2;
    B_FAR = XA + TTC.act.target.x; B_NEAR = XA + HL.act.target.x;
    restart();
  };
}
$("speed").onchange = (e) => { speed = +e.target.value; };
restart();
requestAnimationFrame(loop);
// for automated checks
window.__battle = { get phase() { return phase; }, get hp() { return [A.hp, B.hp]; }, get round() { return round; }, step: (s) => { for (let t = 0; t < s; t += STEP) step(STEP); render(); } };
