import { FACE_SOURCES } from "./FaceAssets.js";

import { createPilotLauncher } from "./PilotLauncher.js";

/**
 * Pilot-Web SDK IOpenspaceView<PageContext>.
 * Standalone playground, does not access Pilot database or API.
 */

const STYLE = [
  ":host{display:block;height:100%;width:100%;font:500 15px/1.4 system-ui,sans-serif;color:#163052}",
  "*{box-sizing:border-box}button{font:inherit;cursor:pointer}",
  ".root{min-height:440px;height:100%;padding:20px;display:flex;flex-direction:column;gap:13px;background:#f5f7fc}",
  ".head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}",
  "h1{margin:0;font-size:24px;letter-spacing:-.04em}.sub{margin:4px 0 0;color:#8190a9;font-size:12px}",
  ".stats{display:flex;gap:8px}.stat{display:grid;place-items:center;min-width:85px;padding:8px 17px;background:white;border:1px solid #dfe6f3;border-radius:13px}",
  ".label{color:#8190a9;font-size:11px}.value{font-size:23px;font-weight:800;font-variant-numeric:tabular-nums}",
  ".arena{position:relative;isolation:isolate;flex:1;min-height:320px;overflow:hidden;border-radius:22px;border:1px solid #95b7f3;background:radial-gradient(circle at 50% 95%,#c7efff 0%,transparent 47%),linear-gradient(170deg,#6688ed,#79b9f2 60%,#beeafa)}",
  ".arena:before{content:'';position:absolute;inset:0;z-index:-1;opacity:.2;background-image:radial-gradient(white 2px,transparent 2px);background-size:38px 38px}",
  ".balloon{position:absolute;border:0;padding:0;border-radius:53% 53% 48% 48%;background:#edf0f8;box-shadow:0 9px 15px #1e478c35;overflow:hidden;touch-action:manipulation}",
  ".balloon img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;user-select:none;-webkit-user-drag:none}",
  ".balloon:focus-visible,.primary:focus-visible{outline:3px solid #ffdc83;outline-offset:4px}",
  ".popped{pointer-events:none;animation:pop .18s ease-out forwards}@keyframes pop{to{opacity:0;scale:1.5}}",
  ".modal{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:15px;background:#12386d77;backdrop-filter:blur(5px)}",
  ".modal[hidden]{display:none}.card{max-width:360px;padding:28px 24px;border-radius:24px;text-align:center;background:white;box-shadow:0 17px 40px #14386a55}",
  ".emoji{font-size:44px}.title{font-size:25px;font-weight:850;margin:6px 0}.copy{color:#6c7993;margin:9px 0 20px}",
  ".primary{border:0;background:#5b55e8;color:white;font-weight:750;border-radius:12px;padding:12px 24px}",
  ".footer{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#7c89a3;font-size:12px}",
  ".secondary{border:1px solid #d3deed;background:white;color:#445c85;padding:8px 14px;border-radius:10px;font-weight:700}",
  ".secondary:disabled{opacity:.4;cursor:default}@media(max-width:580px){.stats{width:100%}.stat{flex:1;min-width:0;padding:6px}.root{padding:12px}.arena{min-height:300px}}",
  "@media(prefers-reduced-motion:reduce){.popped{animation:none;opacity:0}}"
].join("");
const HTML = '<section class="root"><div class="head"><div><h1>🎈 Лопни шарик!</h1><p class="sub">Тестовое расширение Pilot-Web</p></div><div class="stats"><div class="stat"><span class="label">ОЧКИ</span><strong class="value" id="score">0</strong></div><div class="stat"><span class="label">ВРЕМЯ</span><strong class="value" id="time">30</strong></div><div class="stat"><span class="label">РЕКОРД</span><strong class="value" id="best">0</strong></div></div></div><div class="arena" id="arena"><div class="modal" id="modal"><div class="card"><div class="emoji" id="emoji">🎈</div><div class="title" id="title">Готов играть?</div><p class="copy" id="copy">Нажимай на лица мышкой или пальцем. У тебя 30 секунд! За серию попаданий — бонус.</p><button type="button" class="primary" id="start">Начать игру</button></div></div></div><div class="footer"><span>🎯 Кликай по лицам, пока они не улетели</span><button type="button" id="pause" class="secondary" disabled>Пауза</button></div></section>';
const KEY = "pilot-web-balloon-pop-best-v1";

function mount(container) {
  const shadow = container.attachShadow({ mode: "open" });
  shadow.innerHTML = "<style>" + STYLE + "</style>" + HTML;
  const get = (id) => shadow.getElementById(id);
  const arena = get("arena");
  const modal = get("modal");
  const pauseButton = get("pause");
  const startButton = get("start");
  const balloons = new Map();
  const timers = new Set();
  let score = 0, hits = 0, misses = 0, streak = 0, secondsLeft = 30;
  let phase = "idle", raf = 0, lastFrame = 0, lastSpawn = 0, lastId = 0;
  let disposed = false;
  let best = 0;
  try { best = Math.max(0, Number(localStorage.getItem(KEY)) || 0); } catch {}
  const showScore = () => {
    get("score").textContent = String(score);
    get("time").textContent = String(Math.ceil(secondsLeft));
    get("best").textContent = String(best);
  };
  const clear = () => {
    for (const b of balloons.values()) b.element.remove();
    balloons.clear();
    for (const id of timers) clearTimeout(id);
    timers.clear();
    arena.querySelectorAll(".balloon").forEach((node) => node.remove());
  };
  const saveBest = () => {
    if (score <= best) return;
    best = score;
    try { localStorage.setItem(KEY, String(best)); } catch {}
  };
  const popup = (icon, title, copy, action) => {
    get("emoji").textContent = icon;
    get("title").textContent = title;
    get("copy").textContent = copy;
    startButton.textContent = action;
    modal.hidden = false;
  };
  const miss = (id) => {
    const b = balloons.get(id);
    if (!b) return;
    balloons.delete(id);
    b.element.remove();
    misses++;
    streak = 0;
  };
  const pop = (id) => {
    if (phase !== "playing") return;
    const b = balloons.get(id);
    if (!b) return;
    balloons.delete(id);
    hits++;
    streak++;
    score += 10 + Math.min(streak - 1, 5) * 2;
    saveBest();
    showScore();
    b.element.classList.add("popped");
    b.element.disabled = true;
    const timer = setTimeout(() => {
      b.element.remove();
      timers.delete(timer);
    }, 190);
    timers.add(timer);
  };
  const spawn = () => {
    if (balloons.size >= 8) return;
    const size = 67 + Math.round(Math.random() * 44);
    const width = arena.clientWidth || 650;
    const x = 8 + Math.random() * Math.max(0, width - size - 16);
    const faceIndex = Math.floor(Math.random() * FACE_SOURCES.length);
    const id = ++lastId;
    const element = document.createElement("button");
    element.type = "button";
    element.className = "balloon";
    element.setAttribute("aria-label", "Нажать на фото лица " + (faceIndex + 1));
    element.style.width = size + "px";
    element.style.height = size + "px";
    element.style.left = x + "px";
    element.style.bottom = "-100px";
    const picture = document.createElement("img");
    picture.src = FACE_SOURCES[faceIndex];
    picture.alt = "";
    picture.draggable = false;
    element.appendChild(picture);
    element.addEventListener("click", () => pop(id));
    arena.appendChild(element);
    balloons.set(id, { element, distance: 0, speed: 83 + Math.random() * 53, size });
  };
  const finish = () => {
    phase = "finished";
    secondsLeft = 0;
    cancelAnimationFrame(raf);
    raf = 0;
    clear();
    saveBest();
    showScore();
    pauseButton.disabled = true;
    popup("🏆", "Время вышло!", "Лопнуто: " + hits + ". Пропущено: " + misses + ". Очки: " + score + ".", "Играть ещё");
  };
  const step = (now) => {
    if (phase !== "playing" || disposed) return;
    const delta = Math.max(0, Math.min(now - lastFrame, 50));
    lastFrame = now;
    secondsLeft = Math.max(0, secondsLeft - delta / 1000);
    showScore();
    if (secondsLeft <= 0) { finish(); return; }
    const elapsed = 30 - secondsLeft;
    const interval = Math.max(400, 880 - Math.floor(elapsed / 5) * 75);
    if (!lastSpawn || now - lastSpawn >= interval) {
      spawn();
      lastSpawn = now;
    }
    for (const [id, b] of balloons) {
      b.distance += (b.speed * delta) / 1000;
      b.element.style.transform = "translate3d(0," + (-b.distance) + "px,0)";
      if (b.distance > arena.clientHeight + b.size + 125) miss(id);
    }
    raf = requestAnimationFrame(step);
  };
  const startRound = () => {
    cancelAnimationFrame(raf);
    clear();
    score = hits = misses = streak = 0;
    secondsLeft = 30;
    phase = "playing";
    lastFrame = performance.now();
    lastSpawn = 0;
    modal.hidden = true;
    pauseButton.disabled = false;
    pauseButton.textContent = "Пауза";
    showScore();
    for (let i = 0; i < 3; i++) spawn();
    raf = requestAnimationFrame(step);
  };
  const pause = () => {
    if (phase !== "playing") return;
    phase = "paused";
    cancelAnimationFrame(raf);
    raf = 0;
    pauseButton.textContent = "Продолжить";
    popup("⏸️", "Пауза", "Таймер остановлен. Продолжим?", "Продолжить");
  };
  const resume = () => {
    if (phase !== "paused") return;
    phase = "playing";
    lastFrame = performance.now();
    lastSpawn = lastFrame;
    modal.hidden = true;
    pauseButton.textContent = "Пауза";
    raf = requestAnimationFrame(step);
  };
  startButton.addEventListener("click", () => phase === "paused" ? resume() : startRound());
  pauseButton.addEventListener("click", () => phase === "playing" ? pause() : resume());
  const visibility = () => { if (document.hidden) pause(); };
  document.addEventListener("visibilitychange", visibility);
  showScore();
  return () => {
    if (disposed) return;
    disposed = true;
    phase = "disposed";
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", visibility);
    clear();
    shadow.innerHTML = "";
  };
}

export class BalloonGameView {
  constructor() {
    this.element = undefined;
    this.destroy = undefined;
    // Pilot instantiates IOpenspaceView, but does not necessarily open getView().
    // Install a reversible, isolated test launcher to make the demo discoverable.
    this.removeLauncher = createPilotLauncher(
      () => this.getView(),
      () => this.resetGame()
    );
  }
  getViewId() { return "balloon-pop-demo-view"; }
  getView() {
    if (!this.element) {
      this.element = document.createElement("div");
      this.element.style.cssText = "display:block;width:100%;height:100%;min-height:440px";
      this.destroy = mount(this.element);
    }
    return this.element;
  }
  resetGame() {
    if (this.destroy) this.destroy();
    this.destroy = undefined;
    this.element = undefined;
  }
  dispose() {
    if (this.removeLauncher) this.removeLauncher();
    this.removeLauncher = undefined;
    this.resetGame();
  }
}
