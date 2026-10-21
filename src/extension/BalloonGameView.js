import { HEAD_SOURCES } from "./HeadAssets.js";
import { createPilotLauncher } from "./PilotLauncher.js";

/**
 * Pilot-Web SDK IOpenspaceView<PageContext>.
 * Faces replace the former balloons. Targets keep the same gameplay logic
 * and now burst into particles when clicked.
 */
// All seven targets have exactly the same visible hit area.
export const TARGET_DIAMETER = 104;

const STYLE = [
  ":host{display:block;height:100%;width:100%;font:500 15px/1.4 system-ui,sans-serif;color:#163052}",
  "*{box-sizing:border-box}button{font:inherit;cursor:pointer}",
  ".root{min-height:440px;height:100%;padding:20px;display:flex;flex-direction:column;gap:13px;background:#f5f7fc}",
  ".head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}",
  "h1{margin:0;font-size:24px;letter-spacing:-.04em}.sub{margin:4px 0 0;color:#8190a9;font-size:12px}",
  ".stats{display:flex;gap:8px}.stat{display:grid;place-items:center;min-width:85px;padding:8px 17px;background:white;border:1px solid #dfe6f3;border-radius:13px}",
  ".label{color:#8190a9;font-size:11px}.value{font-size:23px;font-weight:800;font-variant-numeric:tabular-nums}",
  ".arena{position:relative;isolation:isolate;flex:1;min-height:320px;overflow:hidden;border-radius:22px;border:1px solid #95b7f3;background:radial-gradient(circle at 50% 95%,#c7efff 0%,transparent 47%),linear-gradient(170deg,#6688ed,#79b9f2 60%,#beeafa)}",
  ".arena:before{content:'';position:absolute;inset:0;z-index:-1;opacity:.22;background-image:radial-gradient(white 2px,transparent 2px);background-size:38px 38px}",
  ".balloon{position:absolute;display:block;box-sizing:border-box;border:2px solid rgba(255,255,255,.85);border-radius:50%;overflow:hidden;padding:0;background:radial-gradient(circle at 28% 22%,#fff 0%,#d4e7fa 85%);box-shadow:0 10px 18px rgba(30,71,140,.24);touch-action:manipulation;will-change:transform;transition:box-shadow .16s ease}",
  ".balloon:hover{box-shadow:0 14px 22px rgba(30,71,140,.34)}",
  ".balloon img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 25%;pointer-events:none;user-select:none;-webkit-user-drag:none}",
  ".balloon:focus-visible,.primary:focus-visible{outline:3px solid #ffdc83;outline-offset:4px}",
  ".popped{pointer-events:none;animation:pop .16s ease-out forwards}@keyframes pop{to{opacity:0;filter:brightness(1.6)}}",
  ".modal{position:absolute;inset:0;z-index:5;display:grid;place-items:center;padding:15px;background:#12386d77;backdrop-filter:blur(5px)}",
  ".modal[hidden]{display:none}.card{max-width:360px;padding:28px 24px;border-radius:24px;text-align:center;background:white;box-shadow:0 17px 40px #14386a55}",
  ".emoji{font-size:44px}.title{font-size:25px;font-weight:850;margin:6px 0}.copy{color:#6c7993;margin:9px 0 20px}",
  ".primary{border:0;background:#5b55e8;color:white;font-weight:750;border-radius:12px;padding:12px 24px}",
  ".footer{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#7c89a3;font-size:12px}",
  ".secondary{border:1px solid #d3deed;background:white;color:#445c85;padding:8px 14px;border-radius:10px;font-weight:700}",
  ".secondary:disabled{opacity:.4;cursor:default}",
  ".burst{position:absolute;pointer-events:none;transform:translate(-50%,-50%);z-index:10}",
  ".flash{position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:24px;height:24px;border:2px solid rgba(255,255,255,.92);border-radius:50%;box-shadow:0 0 0 6px rgba(255,214,102,.32);animation:flash .45s ease-out forwards}",
  ".particle{position:absolute;left:0;top:0;border-radius:999px;transform:translate(-50%,-50%);animation:particle .55s cubic-bezier(.2,.7,.2,1) forwards}",
  "@keyframes flash{0%{opacity:1;transform:translate(-50%,-50%) scale(.15)}100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)}}",
  "@keyframes particle{0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(.35)}}",
  "@media(max-width:580px){.stats{width:100%}.stat{flex:1;min-width:0;padding:6px}.root{padding:12px}.arena{min-height:300px}}",
  "@media(prefers-reduced-motion:reduce){.popped,.flash,.particle{animation:none!important;opacity:0}}"
].join("");

const HTML = '<section class="root"><div class="head"><div><h1>🎯 Лопни цель!</h1><p class="sub">Тестовое расширение Pilot-Web</p></div><div class="stats"><div class="stat"><span class="label">ОЧКИ</span><strong class="value" id="score">0</strong></div><div class="stat"><span class="label">ВРЕМЯ</span><strong class="value" id="time">30</strong></div><div class="stat"><span class="label">РЕКОРД</span><strong class="value" id="best">0</strong></div></div></div><div class="arena" id="arena"><div class="modal" id="modal"><div class="card"><div class="emoji" id="emoji">🎈</div><div class="title" id="title">Готов играть?</div><p class="copy" id="copy">Кликай по головам мышкой или пальцем. У тебя 30 секунд! При попадании появляется мини-взрыв.</p><button type="button" class="primary" id="start">Начать игру</button></div></div></div><div class="footer"><span>💥 Кликай по головам, пока они не улетели</span><button type="button" id="pause" class="secondary" disabled>Пауза</button></div></section>';
const KEY = "pilot-web-head-pop-best-v2";

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

  const clearEffects = () => {
    arena.querySelectorAll(".burst").forEach((node) => node.remove());
  };

  const clear = () => {
    for (const b of balloons.values()) b.element.remove();
    balloons.clear();
    for (const id of timers) clearTimeout(id);
    timers.clear();
    arena.querySelectorAll(".balloon").forEach((node) => node.remove());
    clearEffects();
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

  const explode = (element) => {
    const arenaRect = arena.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const cx = rect.left - arenaRect.left + rect.width / 2;
    const cy = rect.top - arenaRect.top + rect.height / 2;
    const burst = document.createElement("div");
    burst.className = "burst";
    burst.style.left = cx + "px";
    burst.style.top = cy + "px";

    const flash = document.createElement("div");
    flash.className = "flash";
    burst.appendChild(flash);

    const colors = ["#ffffff", "#ffd166", "#ff7aa2", "#7fd8ff", "#b7ff7a"];
    const particlesCount = 12;
    for (let i = 0; i < particlesCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      const angle = (Math.PI * 2 * i) / particlesCount + Math.random() * 0.35;
      const distance = 28 + Math.random() * 38;
      const size = 5 + Math.random() * 9;
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.background = colors[i % colors.length];
      particle.style.boxShadow = "0 0 8px rgba(255,255,255,.55)";
      particle.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      particle.style.setProperty("--ty", Math.sin(angle) * distance + "px");
      burst.appendChild(particle);
    }

    arena.appendChild(burst);
    const timer = setTimeout(() => {
      burst.remove();
      timers.delete(timer);
    }, 650);
    timers.add(timer);
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
    explode(b.element);
    b.element.classList.add("popped");
    b.element.disabled = true;
    const timer = setTimeout(() => {
      b.element.remove();
      timers.delete(timer);
    }, 180);
    timers.add(timer);
  };

  const spawn = () => {
    if (balloons.size >= 8) return;
    const size = TARGET_DIAMETER;
    const width = arena.clientWidth || 650;
    const x = 8 + Math.random() * Math.max(0, width - size - 16);
    const id = ++lastId;
    const headSrc = HEAD_SOURCES[Math.floor(Math.random() * HEAD_SOURCES.length)];

    const element = document.createElement("button");
    element.type = "button";
    element.className = "balloon";
    element.setAttribute("aria-label", "Лопнуть голову цели");
    element.style.width = size + "px";
    element.style.height = size + "px";
    element.style.left = x + "px";
    element.style.bottom = "-" + (size + 16) + "px";
    element.style.transform = "translate3d(0,0,0) rotate(" + (-8 + Math.random() * 16) + "deg)";

    const img = document.createElement("img");
    img.src = headSrc;
    img.alt = "";
    img.draggable = false;
    element.appendChild(img);
    element.addEventListener("click", () => pop(id));

    arena.appendChild(element);
    balloons.set(id, {
      element,
      distance: 0,
      speed: 80 + Math.random() * 55,
      size,
      swaySeed: Math.random() * Math.PI * 2,
      swayStrength: 8 + Math.random() * 12,
      rotation: -8 + Math.random() * 16,
      rotationSpeed: -8 + Math.random() * 16
    });
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
    popup("🏆", "Время вышло!", "Поймано: " + hits + ". Пропущено: " + misses + ". Очки: " + score + ".", "Играть ещё");
  };

  const step = (now) => {
    if (phase !== "playing" || disposed) return;
    const delta = Math.max(0, Math.min(now - lastFrame, 50));
    lastFrame = now;
    secondsLeft = Math.max(0, secondsLeft - delta / 1000);
    showScore();
    if (secondsLeft <= 0) { finish(); return; }

    const elapsed = 30 - secondsLeft;
    const interval = Math.max(380, 860 - Math.floor(elapsed / 5) * 80);
    if (!lastSpawn || now - lastSpawn >= interval) {
      spawn();
      lastSpawn = now;
    }

    const seconds = now / 1000;
    for (const [id, b] of balloons) {
      b.distance += (b.speed * delta) / 1000;
      const sway = Math.sin(seconds * 2 + b.swaySeed + b.distance / 80) * b.swayStrength;
      const tilt = b.rotation + Math.sin(seconds * 2.4 + b.swaySeed) * 7;
      b.element.style.transform = "translate3d(" + sway + "px," + (-b.distance) + "px,0) rotate(" + tilt + "deg)";
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
