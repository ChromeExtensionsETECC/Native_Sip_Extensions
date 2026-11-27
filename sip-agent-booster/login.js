// Tela de login do Native: fundo com o padrão da logo e lateral com o histórico de versões.
// O visual do modal vem do login.css (classes da própria página); aqui só ligamos o fundo e a lateral.
(() => {
  if (window.top !== window || window.__sipbLogin) return;
  window.__sipbLogin = true;

  const VISIBLE = 4;   // versões mostradas antes de "ver todas"
  const version = () => {
    try { return chrome.runtime.getManifest().version; } catch (_) { return window.SIPB_VERSION || ""; }
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let on = false, panel = null, pattern = null, expanded = false;

  function loginVisible() {
    const el = document.querySelector(".login .wrap-login100");
    return !!el && el.getBoundingClientRect().width > 0;
  }

  // Monta o ladrilho do fundo (duas logos em "tijolo", com espaço entre elas) a partir da logo que a própria página já carregou.
  let tileSrc = "";
  function syncLogo() {
    const img = document.querySelector(".login100-pic img");
    if (!img || !img.src || img.src === tileSrc) return;
    tileSrc = img.src;
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 300; c.height = 240;
        const g = c.getContext("2d");
        const w = 116, h = (w * im.naturalHeight) / im.naturalWidth;
        g.drawImage(im, 12, 12, w, h);
        g.drawImage(im, 162, 132, w, h);
        document.documentElement.style.setProperty("--nb-tile", `url("${c.toDataURL()}")`);
      } catch (_) { /* imagem de outra origem: sem padrão, o resto da tela continua igual */ }
    };
    im.src = img.src;
  }

  function renderPanel() {
    const log = window.SIPB_CHANGELOG || [];
    if (!panel || !log.length) return;
    const cur = version();
    const shown = expanded ? log : log.slice(0, VISIBLE);
    panel.innerHTML =
      `<h3>Novidades</h3>` +
      `<p class="nb-sub">SIP Agent Booster${cur ? " · você está na versão " + esc(cur) : ""}</p>` +
      `<div class="nb-list">` +
      shown.map((r, i) =>
        `<div class="nb-rel${r.v === cur ? " nb-cur" : ""}"><div class="nb-v">v${esc(r.v)}${i === 0 ? '<span class="nb-tag">Nova</span>' : ""}</div>` +
        `<ul>${r.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`).join("") +
      (log.length > VISIBLE ? `<button class="nb-more" type="button">${expanded ? "Mostrar menos" : "Ver todas as versões"}</button>` : "") +
      `</div>`;
    const more = panel.querySelector(".nb-more");
    if (more) more.onclick = () => { expanded = !expanded; renderPanel(); };
  }

  function build() {
    pattern = document.createElement("div");
    pattern.id = "nb-pattern";
    panel = document.createElement("aside");
    panel.id = "nb-changelog";
    document.documentElement.append(pattern, panel);
    renderPanel();
  }
  function teardown() {
    pattern?.remove(); panel?.remove();
    pattern = panel = null;
  }

  function sync() {
    const vis = loginVisible();
    if (vis !== on) {
      on = vis;
      document.documentElement.classList.toggle("nb-login-on", vis);
      vis ? build() : teardown();
    }
    if (on) syncLogo();
  }

  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(sync, 120); })
    .observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => setTimeout(sync, 150));
  sync();
})();
