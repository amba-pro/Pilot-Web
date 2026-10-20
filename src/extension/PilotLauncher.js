/**
 * Test-only overlay launcher. Does not call undocumented Pilot APIs,
 * change the host navigation, or access user/project data.
 * This mounts only when Pilot instantiates the extension class.
 */
import { installStartScreenTile } from "./StartScreenTile.js";

const HOST_ID = "pilot-web-balloon-demo-launcher";
const STYLE = `
:host { display:contents; font: 500 14px system-ui, sans-serif; }
* { box-sizing:border-box; }
button { font:inherit; cursor:pointer; }
.trigger {
  position:fixed; bottom:20px; right:20px; z-index:2147483000;
  border:1px solid #e2daff; border-radius:999px; padding:13px 20px;
  color:#fff; background:#7352bd; box-shadow:0 8px 28px #1b124a5c;
  font-weight:800; letter-spacing:.01em;
}
.trigger:hover { background:#5b3a9f; }
.backdrop {
  position:fixed; inset:0; z-index:2147483001; display:grid; place-items:center;
  background:#121d358a; backdrop-filter:blur(4px); padding:16px;
}
.backdrop[hidden] { display:none !important; }
.panel {
  display:flex; flex-direction:column; width:min(1060px,100%);
  height:min(760px, calc(100vh - 32px)); max-height:calc(100vh - 32px);
  overflow:hidden; background:white; border-radius:18px;
  box-shadow:0 24px 95px #06112788;
}
.head {
  min-height:52px; display:flex; align-items:center; justify-content:space-between;
  background:#fff; color:#21334f; border-bottom:1px solid #e2e7ef;
  padding:9px 13px 9px 20px; gap:12px; font-weight:800;
}
.close {
  border:1px solid #d4ddeb; background:#f6f7fb; color:#3e4e68;
  border-radius:9px; padding:8px 13px; font-weight:750;
}
.slot { flex:1; min-height:0; overflow:auto; }
.trigger:focus-visible,.close:focus-visible { outline:3px solid #f59e0b; outline-offset:3px; }
@media(max-width:520px) {
  .trigger { bottom:12px; right:12px; padding:11px 15px; }
  .backdrop { padding:5px; }
  .panel { height:calc(100vh - 10px); max-height:calc(100vh - 10px); border-radius:12px; }
}
`;
const TEMPLATE = `
<style>${STYLE}</style>
<button type="button" class="trigger" id="open" aria-label="Открыть игру Лопни шарик">🎈 Лопни шарик</button>
<div class="backdrop" id="overlay" hidden>
  <section class="panel" role="dialog" aria-modal="true" aria-label="Игра Лопни шарик">
    <header class="head"><span>🎈 Тестовое веб-расширение Pilot-Web</span>
      <button type="button" class="close" id="close">✕ Закрыть игру</button>
    </header>
    <div class="slot" id="slot"></div>
  </section>
</div>
`;

export function createPilotLauncher(getGameView, onCloseGame) {
  if (typeof document === "undefined") return () => {};

  let destroyed = false;
  let host = null;
  let removeKeys = null;
  let removeStartScreenTile = null;
  let closeGame = null;
  const setup = () => {
    if (destroyed || !document.body || document.getElementById(HOST_ID)) return;
    host = document.createElement("div");
    host.id = HOST_ID;
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = TEMPLATE;
    document.body.appendChild(host);

    const open = root.getElementById("open");
    const close = root.getElementById("close");
    const overlay = root.getElementById("overlay");
    const slot = root.getElementById("slot");
    let gameOpen = false;

    closeGame = () => {
      overlay.hidden = true;
      if (gameOpen) {
        slot.replaceChildren();
        gameOpen = false;
        onCloseGame();
      }
      open.hidden = false;
      open.focus();
    };

    const showGame = () => {
      if (gameOpen) return;
      try {
        slot.appendChild(getGameView());
        gameOpen = true;
        overlay.hidden = false;
        open.hidden = true;
        close.focus();
      } catch (error) {
        console.error("[balloon-pop-demo] Cannot open game", error);
        slot.replaceChildren();
        onCloseGame();
      }
    };
    open.addEventListener("click", showGame);
    removeStartScreenTile = installStartScreenTile(showGame);
    close.addEventListener("click", () => closeGame());

    const onKey = (event) => {
      if (event.key === "Escape" && gameOpen) {
        event.preventDefault();
        closeGame();
      }
    };
    document.addEventListener("keydown", onKey);
    removeKeys = () => document.removeEventListener("keydown", onKey);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once:true });
  } else {
    setup();
  }

  return () => {
    if (destroyed) return;
    destroyed = true;
    document.removeEventListener("DOMContentLoaded", setup);
    if (removeKeys) removeKeys();
    if (removeStartScreenTile) removeStartScreenTile();
    if (closeGame && host && host.shadowRoot.getElementById("overlay").hidden === false) closeGame();
    if (host) host.remove();
    host = null;
  };
}
