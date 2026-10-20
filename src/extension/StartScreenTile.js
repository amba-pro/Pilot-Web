/**
 * Temporary Pilot-Web start-screen enhancement for the demo.
 *
 * No undocumented Pilot API or routing is used. We recognize the visible
 * "Основные инструменты" picker and add one owned element after its cards.
 * If the host changes the picker markup, do nothing; the floating launch
 * button remains available. Changes are fully reversible on dispose.
 */
const TILE_ID = "pilot-web-balloon-start-screen-tile";
const LABELS = {
  heading: "Основные инструменты",
  reports: "Отчёты",
  messages: "Сообщения",
  bim: "Информационное моделирование (BIM)"
};
const STYLE = `
:host { display:block; width:100%; margin:6px 0 16px; font:500 14px/1.4 system-ui,sans-serif; }
* { box-sizing:border-box; }
.grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); column-gap:16px; }
.card { display:flex; align-items:center; gap:18px; width:100%; min-height:82px; padding:8px;
  border:0; text-align:left; background:transparent; color:#282b34; cursor:pointer; }
.card:hover { background:#eeeaf3; }
.card:focus-visible { outline:3px solid #8666c0; outline-offset:2px; }
.icon { flex:none; display:grid; place-items:center; width:64px; height:64px;
  background:#875e9e; color:white; font-size:29px; }
.copy { display:flex; flex-direction:column; gap:3px; min-width:0; }
.name { font-size:14px; font-weight:600; }
.desc { color:#737373; font-size:12px; }
@media(max-width:620px) {.grid { grid-template-columns:1fr; }}
`;

/**
 * Returns the cards container only when labels clearly identify a section
 * separate from the following BIM section; never return document.body.
 * Exported for inexpensive structural tests without a DOM implementation.
 */
export function findMainToolsContainer(heading, reports, messages, bim) {
  if (!heading || !reports || !messages) return null;
  for (let node = reports.parentElement; node && node.parentElement; node = node.parentElement) {
    if (node.contains(messages) && !node.contains(heading) && (!bim || !node.contains(bim))) {
      return node;
    }
  }
  return null;
}

function findLabels() {
  const found = {};
  const wanted = new Map(Object.entries(LABELS).map(([key, label]) => [label, key]));
  const walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
  let node;
  while ((node = walker.nextNode()) && Object.keys(found).length < 4) {
    const key = wanted.get(node.nodeValue.trim());
    if (!key || found[key]) continue;
    const el = node.parentElement;
    if (!el || el.closest("#" + TILE_ID + ", #pilot-web-balloon-demo-launcher, script, style")) continue;
    if (el.getClientRects().length) found[key] = el;
  }
  return found;
}

function createTile(onOpen) {
  const host = document.createElement("div");
  host.id = TILE_ID;
  host.setAttribute("data-extension", "balloon_pop_demo");
  const shadow = host.attachShadow({mode:"open"});
  shadow.innerHTML = `<style>${STYLE}</style>
    <div class="grid"><button class="card" type="button" id="launch"
    aria-label="Открыть игру Лопни шарик"><span class="icon" aria-hidden="true">🎈</span>
    <span class="copy"><span class="name">Лопни шарик</span>
    <span class="desc">Мини-игра · 30 секунд</span></span></button></div>`;
  shadow.getElementById("launch").addEventListener("click", onOpen);
  return host;
}

export function installStartScreenTile(onOpen) {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined" || !document.body) {
    return () => {};
  }

  let disposed = false;
  let timer = null;
  let ownedTile = null;
  const update = () => {
    timer = null;
    if (disposed) return;
    // Keep an already visible tile without rescanning Pilot's potentially
    // large document tree on unrelated changes.
    if (ownedTile?.isConnected && ownedTile.getClientRects().length) return;
    const {heading, reports, messages, bim} = findLabels();
    const anchor = findMainToolsContainer(heading, reports, messages, bim);
    if (!anchor || !anchor.parentElement) {
      if (ownedTile) ownedTile.remove();
      ownedTile = null;
      return;
    }
    // Two versions of the same extension should never create duplicate tiles.
    const existing = document.getElementById(TILE_ID);
    if (existing && existing !== ownedTile) return;
    if (ownedTile) ownedTile.remove();
    ownedTile = createTile(onOpen);
    anchor.insertAdjacentElement("afterend", ownedTile);
  };
  const observer = new MutationObserver(() => {
    if (disposed || (ownedTile?.isConnected && ownedTile.getClientRects().length)) return;
    if (timer !== null) return;
    timer = setTimeout(update, 120);
  });
  observer.observe(document.body, {childList:true, subtree:true});
  update();

  return () => {
    disposed = true;
    observer.disconnect();
    if (timer !== null) clearTimeout(timer);
    if (ownedTile) ownedTile.remove();
    ownedTile = null;
  };
}
