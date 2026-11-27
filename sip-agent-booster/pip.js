// Mini-telefone em Document Picture-in-Picture (Chrome 116+), espelhando o discador do Native.
// Roda no mesmo mundo isolado do content.js e usa window.__sipb (exposto por ele).
(() => {
  const api = () => window.__sipb;
  if (window.top !== window || !("documentPictureInPicture" in window)) return;

  let pip = null, ui = null, state = "idle", statusTxt = "", stateSince = Date.now(), muted = false, quality = null, typed = "", micAt = 0, numNow = "";

  // Ícones Material Design (Apache 2.0).
  const ICON = {
    phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    end: "M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z",
    mic: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
    micoff: "M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z",
    swap: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
    back: "M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z",
  };
  ICON.copy = "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z";
  const svg = (k, size = 22) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="${ICON[k]}"/></svg>`;

  const DIGITS = ["1","2","3","4","5","6","7","8","9","*","0","#"];
  const CSS = `
  /* ---- temas: cada um só troca as variáveis ---- */
  :root,html[data-theme=preto-azul]{--bg:#09090c;--glow:rgba(59,130,246,.34);--glow2:rgba(59,130,246,.14);--ac:#3b82f6;--acfg:#fff;--fg:#e8eaee;--mut:#8b93a1;--tint:rgba(255,255,255,.06);--tinth:rgba(255,255,255,.12);--stroke:rgba(255,255,255,.12);--gl1:rgba(255,255,255,.14);--gl2:rgba(255,255,255,.04);--pop:rgba(16,16,22,.92)}
  html[data-theme=preto-vermelho]{--bg:#0a0808;--glow:rgba(239,68,68,.34);--glow2:rgba(239,68,68,.14);--ac:#ef4444}
  html[data-theme=preto-rosa]{--bg:#0b090b;--glow:rgba(236,72,153,.34);--glow2:rgba(236,72,153,.14);--ac:#ec4899}
  html[data-theme=preto-verde]{--bg:#080a09;--glow:rgba(34,197,94,.30);--glow2:rgba(34,197,94,.12);--ac:#22c55e;--acfg:#04130a}
  html[data-theme=preto-roxo]{--bg:#0a090d;--glow:rgba(168,85,247,.34);--glow2:rgba(168,85,247,.14);--ac:#a855f7}
  html[data-theme=preto-laranja]{--bg:#0b0a08;--glow:rgba(249,115,22,.32);--glow2:rgba(249,115,22,.13);--ac:#f97316;--acfg:#1a0d02}
  html[data-theme=preto-ciano]{--bg:#080a0b;--glow:rgba(6,182,212,.32);--glow2:rgba(6,182,212,.13);--ac:#06b6d4;--acfg:#021014}
  html[data-theme=naval-amarelo]{--bg:#0a1a3a;--glow:rgba(250,204,21,.20);--glow2:rgba(96,165,250,.16);--ac:#facc15;--acfg:#1b1500;--mut:#93a4c4}
  html[data-theme=claro]{--bg:#eceef3;--glow:rgba(37,99,235,.20);--glow2:rgba(37,99,235,.09);--ac:#2563eb;--acfg:#fff;--fg:#111827;--mut:#6b7280;--tint:rgba(0,0,0,.05);--tinth:rgba(0,0,0,.10);--stroke:rgba(0,0,0,.12);--gl1:rgba(255,255,255,.80);--gl2:rgba(255,255,255,.40);--pop:rgba(255,255,255,.94)}
  *{box-sizing:border-box}
  html{background:var(--bg)}
  body{margin:0;font:13px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--fg);display:flex;flex-direction:column;height:100vh;padding:12px;gap:10px;user-select:none;opacity:.6;transition:opacity .15s;
    background:radial-gradient(120% 55% at 15% 0%,var(--glow),transparent 62%),radial-gradient(80% 45% at 100% 32%,var(--glow2),transparent 62%),var(--bg)}
  body:hover,body:focus-within{opacity:1}
  button{font-family:inherit;color:inherit}
  /* visor de vidro */
  #hdr{position:relative;overflow:hidden;border-radius:16px;padding:8px 12px 10px;display:flex;flex-direction:column;gap:2px;
    background:linear-gradient(135deg,var(--gl1),var(--gl2));-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);
    border:1px solid var(--stroke);box-shadow:inset 0 1px 0 rgba(255,255,255,.30),inset 0 -14px 26px rgba(0,0,0,.16),0 10px 28px rgba(0,0,0,.32)}
  #hdr::before{content:"";position:absolute;left:0;right:0;top:0;height:46%;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.17),rgba(255,255,255,0));border-radius:16px 16px 50% 50%/16px 16px 14px 14px}
  #hdr>*{position:relative}
  #hst{display:flex;justify-content:space-between;align-items:center;font-size:11px;border-bottom:1px solid var(--stroke);padding-bottom:4px;margin-bottom:4px}
  #hst .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:#9ca3af}
  #tm{font-variant-numeric:tabular-nums;color:var(--mut)}
  #num{width:100%;background:transparent;border:0;outline:0;color:var(--ac);font-size:22px;font-weight:300;letter-spacing:.04em;padding:0;min-height:30px;font-variant-numeric:tabular-nums;text-shadow:0 0 14px var(--glow)}
  #num::placeholder{color:var(--mut);opacity:.55;text-shadow:none}
  #line{color:var(--ac);opacity:.85;font-size:11px;min-height:14px}
  #hrow{display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-top:4px;color:var(--mut)}
  #hrow .ram{display:flex;align-items:center;gap:4px;white-space:nowrap}
  #tools{display:flex;margin-left:auto;margin-right:8px}
  #hst>span:first-child{white-space:nowrap}
  #modes{display:flex;gap:4px}
  .mode{border:1px solid var(--ac);border-radius:6px;padding:1px 7px;font-size:10px;background:var(--ac);color:var(--acfg);cursor:pointer}
  .mode.off{background:transparent;border-color:var(--stroke);color:var(--mut)}
  /* canais */
  #chs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  #chs button{display:flex;align-items:center;justify-content:center;gap:4px;padding:6px 0;border-radius:10px;border:1px solid var(--stroke);background:var(--tint);color:var(--fg);cursor:pointer;font-weight:600;transition:background .12s}
  #chs button:hover{background:var(--tinth)}
  #chs button.on{background:var(--ac);border-color:var(--ac);color:var(--acfg)}
  #chs button.on.live{background:#16a34a;border-color:#16a34a;color:#fff}
  /* teclado */
  #pad{display:grid;grid-template-columns:repeat(3,46px);justify-content:center;gap:8px 18px;margin:2px 0}
  #pad button{width:46px;height:46px;border-radius:50%;border:1px solid var(--stroke);background:var(--tint);color:var(--fg);font-size:19px;font-weight:300;cursor:pointer;transition:background .12s,transform .08s}
  #pad button:hover{background:var(--tinth)}
  #pad button:active{transform:scale(.93);border-color:var(--ac)}
  /* linha de ações */
  #act{display:flex;justify-content:center;align-items:center;gap:14px;margin-top:auto;min-height:52px}
  .ab{width:46px;height:46px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff}
  .ab[hidden]{display:none}
  .ab.dim{opacity:.35}
  #bk{background:transparent;color:var(--mut)}#bk:hover{background:var(--tint)}
  #call,#ans{background:#16a34a;box-shadow:0 4px 16px rgba(22,163,74,.45)}#hang{background:#dc2626;box-shadow:0 4px 16px rgba(220,38,38,.45)}
  #mute{background:var(--tint);color:var(--fg);border:1px solid var(--stroke)}#mute:hover{background:var(--tinth)}#mute.on{background:var(--ac);border-color:var(--ac);color:var(--acfg)}
  #xfer{background:var(--tint);color:var(--ac);border:1px solid var(--stroke)}#xfer:hover{background:var(--tinth)}
  #unpause{height:46px;padding:0 24px;border:0;border-radius:23px;background:#f97316;color:#fff;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(249,115,22,.4)}
  #unpause:hover{background:#ea580c}
  #unpause[hidden]{display:none}
  /* número copiável + botão de copiar */
  #numrow{display:flex;align-items:center;gap:6px}
  #numrow #num{flex:1;min-width:0}
  #num,#line{-webkit-user-select:text;user-select:text}
  #num::selection,#line::selection{background:var(--ac);color:var(--acfg)}
  #cpy{flex:none;width:28px;height:28px;padding:0;border:1px solid var(--stroke);border-radius:8px;background:var(--tint);color:var(--fg);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .12s,opacity .12s}
  #cpy:hover{background:var(--tinth)}
  #cpy.dim{opacity:.35}
  #cpy.ok{background:var(--ac);border-color:var(--ac);color:var(--acfg)}
  /* barra de captação do microfone */
  #mic{display:flex;flex-direction:column;gap:2px;align-items:stretch;visibility:hidden;margin:0 6px}
  #mic.on{visibility:visible}
  #micbar{height:4px;border-radius:2px;background:var(--tint);overflow:hidden}
  #micbar i{display:block;height:100%;width:0;background:var(--ac);transition:width .09s linear}
  #mic.hot i{background:#f59e0b}
  #mic.mute #micbar{background:rgba(239,68,68,.35)}
  #mic.mute i{width:0!important}
  #miclb{font-size:9px;color:var(--mut);text-align:center;min-height:11px}
  #mic.mute #miclb{color:#ef4444}
  /* botões pequenos do cabeçalho */
  #view,#thm,#pause{border:1px solid var(--stroke);border-radius:6px;background:transparent;color:var(--fg);font-size:10px;padding:0 6px;cursor:pointer;margin-left:4px;min-width:22px}
  #view:hover,#thm:hover,#pause:hover{background:var(--tint)}
  #pause{display:inline-flex;align-items:center;gap:3px}
  #pause.on{background:#f97316;border-color:#f97316;color:#fff}
  /* modos de visualização: full (teclado completo), sym (só * e #), min (só visor e botões) */
  body.v-min #pad,body.v-micro #pad,body.v-micro #chs,body.v-micro #q,body.v-micro #line,body.v-micro #miclb,body.v-micro #hrow .ram,body.v-micro #modes{display:none}
  body.v-micro{gap:6px}
  body.v-micro #hdr{padding:6px 10px 6px}
  body.v-micro #num{font-size:20px;min-height:26px}
  body.v-micro #act{min-height:46px}
  body.v-sym #pad{grid-template-columns:repeat(2,46px)}
  body.v-sym #pad button:not([data-k=sym]){display:none}
  #q{font-size:10px;color:var(--mut);text-align:center;min-height:12px}
  /* seletor de tema */
  #themes{display:none;position:fixed;top:100px;right:12px;z-index:10;gap:9px;padding:10px 12px;border-radius:14px;background:var(--pop);border:1px solid var(--stroke);box-shadow:0 12px 30px rgba(0,0,0,.4);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);max-width:190px;flex-wrap:wrap;justify-content:center}
  #themes.show{display:flex}
  #themes button{width:26px;height:26px;border-radius:50%;padding:0;cursor:pointer;border:2px solid var(--stroke)}
  #themes button.sel{border-color:var(--fg);box-shadow:0 0 0 2px var(--pop) inset}
  /* transferência (lista de contatos) */
  #tr{display:none;flex-direction:column;gap:6px;flex:1;min-height:0}
  body.tr-on > :not(#hdr):not(#tr):not(#themes){display:none}
  body.tr-on #tr{display:flex}
  #pz{display:none;flex-direction:column;gap:6px;flex:1;min-height:0}
  body.pz-on > :not(#hdr):not(#pz):not(#themes){display:none}
  body.pz-on #pz{display:flex}
  #pzinfo{font-size:12px;font-weight:600;color:var(--fg)}
  #pzlist{flex:1;overflow:auto;display:flex;flex-direction:column;gap:3px;min-height:0}
  #trq{padding:8px 10px;border-radius:10px;border:1px solid var(--stroke);background:var(--tint);color:var(--fg);outline:0}
  #trq:focus{border-color:var(--ac)}
  #trinfo{font-size:11px;color:var(--mut)}
  #trlist{flex:1;overflow:auto;display:flex;flex-direction:column;gap:3px;min-height:0}
  .ct{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:8px 10px;border-radius:10px;background:var(--tint);cursor:pointer;text-align:left;border:1px solid var(--stroke);color:var(--fg);width:100%}
  .ct:hover{background:var(--tinth)}
  .ct small{color:var(--mut)}.ct i{font-style:normal;font-size:10px;flex:none}
  #trconf{display:none;background:var(--tint);border:1px solid var(--stroke);border-radius:12px;padding:10px;flex-direction:column;gap:6px}
  #trconf.show{display:flex}
  #trconf .row{display:flex;gap:6px}
  .tb{flex:1;padding:9px 0;border:0;border-radius:10px;color:#fff;font-weight:600;cursor:pointer}
  #trok{background:#16a34a}#trno,#trback,#pzback{background:var(--tinth);color:var(--fg)}#pzback{flex:none}
  `;

  const $ = (id) => ui.doc.getElementById(id);
  const call = (name) => api().clickAction(name);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const vis = (e) => e.getBoundingClientRect().width > 0;

  function dialInput() { return document.querySelector(api().cfg().selectors.dialInput); }

  // Abre o discador da página se estiver fechado (ícone de telefone na barra inferior).
  async function ensureDialer() {
    let el = dialInput();
    if (el) return el;
    const s = [...document.querySelectorAll("svg")].find(
      (x) => x.getBoundingClientRect().y > innerHeight - 70 && x.querySelector('path[d^="M493.4 24.6"]'));
    if (s) s.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    for (let i = 0; i < 10 && !(el = dialInput()); i++) await sleep(100);
    return el;
  }

  function setNumber(v) {
    const el = dialInput();
    if (el) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function dialerRoot() {
    let el = dialInput();
    for (let i = 0; el && i < 8 && el.querySelectorAll("button").length < 14; i++) el = el.parentElement;
    return el;
  }

  // ---- canais 1–4: botões contained com texto 1..4; o ativo tem fundo cinza escuro ----
  let activeCh = null;
  function channelButtons() {
    const root = dialerRoot();
    if (!root) return [];
    return [...root.querySelectorAll("button.MuiButton-contained")]
      .filter((b) => /^[1-4]$/.test(b.innerText.trim()))
      .sort((a, b) => a.innerText - b.innerText);
  }
  function readChannel() {
    const i = channelButtons().findIndex((b) => {
      const c = getComputedStyle(b).backgroundColor;
      return c === "rgb(128, 128, 128)" || c === "rgb(0, 128, 0)";
    });
    if (i >= 0) activeCh = i + 1;
  }

  // ---- modo de transferência TD/TA (os dois badges do cabeçalho da página) ----
  function modeDivs() {
    const root = dialerRoot();
    const divs = root ? [...root.querySelectorAll("div")].filter((d) => d.children.length === 0 && /^(TD|TA)$/.test(d.innerText.trim())) : [];
    return { TD: divs.find((d) => d.innerText.trim() === "TD"), TA: divs.find((d) => d.innerText.trim() === "TA") };
  }
  // Modo selecionado = o que não tem a cor cinza (text-slate-500) de desativado.
  function currentMode() {
    const m = modeDivs();
    if (!m.TD || !m.TA) return null;
    return /text-slate-500/.test(m.TA.className) ? "TD" : "TA";
  }
  function setMode(mode) {
    const d = modeDivs()[mode];
    if (d && currentMode() !== mode) d.click();
  }

  // ---- transferência: usa o painel "Contatos" da própria página ----
  let trOn = false, pending = null;
  const contactsPanel = () =>
    [...document.querySelectorAll("div")].find((d) => vis(d) && /^Contatos/.test((d.innerText || "").trim()) && d.querySelector('input[placeholder*="Procurar"]'));
  function setPageSearch(v) {
    const el = contactsPanel()?.querySelector('input[placeholder*="Procurar"]');
    if (!el) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function contactRows() {
    const p = contactsPanel();
    if (!p) return [];
    return [...p.querySelectorAll("div")]
      .filter((d) => /border-b-\[1px\]/.test(d.className) && /justify-between/.test(d.className) && d.querySelector("p.font-bold"))
      .map((el) => ({
        el,
        name: el.querySelector("p.font-bold").innerText.trim(),
        ext: el.querySelector("p.text-gray-600")?.innerText.trim() || "",
        presence: [...el.querySelectorAll("span[title]")].map((s) => s.title).find(Boolean) || "",
      }));
  }
  function renderContacts() {
    if (!ui) return;
    const list = $("trlist");
    const rows = contactRows().slice(0, 40);
    list.textContent = "";
    if (!rows.length) { list.textContent = "Nenhum contato encontrado."; list.style.color = "#6b7280"; return; }
    for (const r of rows) {
      const b = ui.doc.createElement("button");
      b.className = "ct";
      const left = ui.doc.createElement("span");
      left.textContent = r.name + " ";
      const sm = ui.doc.createElement("small"); sm.textContent = r.ext; left.appendChild(sm);
      const pr = ui.doc.createElement("i"); pr.textContent = r.presence;
      pr.style.color = /online|dispon|livre/i.test(r.presence) ? "#16a34a" : "#6b7280";
      b.append(left, pr);
      b.onclick = () => askConfirm(r);
      list.appendChild(b);
    }
  }
  function askConfirm(r) {
    pending = r;
    const mode = currentMode() === "TA" ? "assistida (TA)" : "direta (TD)";
    $("trtxt").textContent = `Transferir a chamada para ${r.name} (${r.ext}) — transferência ${mode}?`;
    $("trconf").classList.add("show");
  }
  async function openTransfer() {
    if (!(await ensureDialer())) { api().toast("Discador não encontrado"); return; }
    if (!contactsPanel()) {
      const btn = api().findAction("transfer");
      if (!btn) { api().toast("Botão de transferir não encontrado"); return; }
      btn.click();
      for (let i = 0; i < 20 && !contactsPanel(); i++) await sleep(100);
    }
    if (!contactsPanel()) { api().toast("Painel de contatos não abriu"); return; }
    trOn = true;
    ui.doc.body.classList.add("tr-on");
    $("trconf").classList.remove("show");
    $("trq").value = "";
    await sleep(300);
    renderContacts();
    $("trq").focus();
  }
  function closeTransfer() {
    trOn = false; pending = null;
    if (ui) { ui.doc.body.classList.remove("tr-on"); $("trconf").classList.remove("show"); }
    const x = contactsPanel()?.querySelector('button svg[viewBox="0 0 352 512"]')?.closest("button");
    if (x) x.click();
  }

  // ---- pausa: botão "Pausar" do canto superior esquerdo → diálogo "Motivo da pausa" (lista) → Confirmar ----
  const PAUSE_ICON = "M6 19h4V5H6v14zm8-14v14h4V5h-4z", PLAY_ICON = "M8 5v14l11-7z";
  let pzOn = false;
  function pauseButton() {
    return [...document.querySelectorAll("button")].find((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.y < 60 && r.x < 100 && b.hasAttribute("aria-label");
    });
  }
  const own = (e) => { let t = ""; for (const n of e.childNodes) if (n.nodeType === 3) t += n.textContent; return t.trim(); };
  // Em pausa, a página cobre a tela com um painel "Tempo restante: 29:19 / Previsto: 30:00 / Iniciado em: 11:09:54" e o botão "Continuar".
  function pauseOverlay() {
    const t = [...document.querySelectorAll("div,span,p,h1,h2,h3")].find((e) => vis(e) && /^Tempo restante/i.test(own(e)));
    if (!t) return null;
    for (let n = t; n; n = n.parentElement) {
      const c = [...n.querySelectorAll("div,span,p,button")].find((e) => /^Continuar$/i.test(own(e)));
      if (c) return { root: n, cont: c };
    }
    return null;
  }
  const isPaused = () => !!pauseOverlay();
  function readPause() {
    const o = pauseOverlay();
    if (!o) return null;
    const t = o.root.innerText || "";
    const m = (re) => (t.match(re) || [])[1] || "";
    return { rest: m(/restante:?\s*([\d:]+)/i), planned: m(/previsto:?\s*([\d:]+)/i), start: m(/iniciado em:?\s*([\d:]+)/i) };
  }
  function continuePause() {
    const o = pauseOverlay();
    if (!o) return false;
    // "Continuar" é um texto dentro de um container clicável (junto com o ícone ▶): clica no mais externo com cursor de mão.
    let el = o.cont.closest('button,[role="button"]') || o.cont;
    for (let n = el.parentElement; n && n !== o.root; n = n.parentElement) {
      if (getComputedStyle(n).cursor === "pointer") el = n; else break;
    }
    el.click();
    return true;
  }
  // "11:09:54" (hoje) → milissegundos desde então
  function sinceClock(hms) {
    const p = (hms || "").split(":").map(Number);
    if (p.length < 2 || p.some(isNaN)) return null;
    const d = new Date(); d.setHours(p[0], p[1], p[2] || 0, 0);
    const ms = Date.now() - d.getTime();
    return ms >= 0 ? ms : null;
  }
  const pageBtnByText = (re) => [...document.querySelectorAll("button")].find((b) => vis(b) && re.test(b.innerText.trim()));
  const pauseDialog = () => {
    const t = [...document.querySelectorAll("div,h2,span,p")].find((e) => vis(e) && /Solicitação de pausa/i.test(e.textContent) && e.textContent.length < 40);
    for (let n = t; n; n = n.parentElement) if (n.querySelector('[role="combobox"]')) return n;
    return null;
  };
  async function openPause() {
    if (isPaused()) {                                  // já pausado: clica em "Continuar" no painel da página
      if (continuePause()) api().toast("Retomando…"); else api().toast("Botão Continuar não encontrado");
      return;
    }
    const b = pauseButton();
    if (!b) { api().toast("Botão de pausa não encontrado"); return; }
    b.click();
    let dlg = null;
    for (let i = 0; i < 20 && !(dlg = pauseDialog()); i++) await sleep(100);
    const combo = dlg && dlg.querySelector('[role="combobox"]');
    if (!combo) { api().toast("Diálogo de pausa não abriu"); return; }
    combo.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));   // o Select do MUI abre no mousedown
    let opts = [];
    for (let i = 0; i < 20 && !opts.length; i++) {
      await sleep(100);
      opts = [...document.querySelectorAll('[role="option"]')].filter((o) => vis(o) && o.innerText.trim() && !/^Selecione/i.test(o.innerText.trim()));
    }
    if (!opts.length) { cancelPause(); api().toast("Motivos de pausa não encontrados"); return; }
    reasons = opts.map((o) => o.innerText.trim());
    pzOn = true;
    ui.doc.body.classList.add("pz-on");
    const list = $("pzlist"); list.textContent = "";
    for (const o of opts) {
      const bt = ui.doc.createElement("button");
      bt.className = "ct"; bt.textContent = o.innerText.trim();
      bt.onclick = async () => {
        o.click();                                   // escolhe o motivo na página
        let ok = null;
        for (let i = 0; i < 15 && !(ok = pageBtnByText(/^Confirmar$/i)) ; i++) await sleep(100);
        for (let i = 0; i < 10 && ok && ok.disabled; i++) await sleep(100);
        if (ok && !ok.disabled) { chosen = { name: bt.textContent, t: Date.now() }; ok.click(); api().toast("Pausa: " + bt.textContent); }
        else { api().toast("Não consegui confirmar a pausa"); cancelPause(); }
        closePauseView();
      };
      list.appendChild(bt);
    }
  }
  function cancelPause() {
    // fecha a lista aberta (backdrop do menu) e clica em Cancelar no diálogo
    document.querySelector('[role="presentation"] .MuiBackdrop-root')?.click();
    setTimeout(() => pageBtnByText(/^Cancelar$/i)?.click(), 150);
  }
  function closePauseView() { pzOn = false; if (ui) ui.doc.body.classList.remove("pz-on"); }

  // ---- leitura do cabeçalho e do estado da chamada na página ----
  // Cabeçalho do discador: [status] [nome/número no input] [linha verde] [ramal] [TD TA]
  function readHeader() {
    const root = dialerRoot();
    if (!root) return null;
    const leaves = [...root.firstElementChild.querySelectorAll("div,p,span")].filter((e) => !e.children.length && e.textContent.trim());
    const nums = leaves.filter((e) => /^\d+$/.test(e.textContent.trim()));
    return {
      status: leaves[0]?.textContent.trim() || "",
      name: dialInput()?.value || "",
      line: nums.find((e) => /text-green/.test(e.className))?.textContent.trim() || "",
      ramal: nums.find((e) => !/text-green/.test(e.className))?.textContent.trim() || "",
    };
  }

  function readState() {
    const a = api();
    const h = readHeader();
    const raw = (h && h.status) || a.callStatus() || "";
    const ringing = a.isRinging();
    const hang = a.findAction("hangup");
    let st = "idle";
    if (ringing) st = "ringing";
    else if (hang) st = /atendimento/i.test(raw) ? "incall" : "calling";
    // Cartão da chamada (quando o discador está fechado): "1332 - Nome"
    let who = "";
    if (!h && (hang || ringing)) {
      let n = (a.findAction("answer") || hang)?.parentElement;
      for (let i = 0; n && i < 6; i++, n = n.parentElement) {
        const t = (n.innerText || "").trim();
        if (t.length > 8 && /atendimento|recebendo|chamando|ligação|ligando/i.test(t)) { who = t.split("\n").slice(1).join(" ").trim(); break; }
      }
    }
    return { st, raw, h, who };
  }

  const STATUS_COLOR = (t) =>
    /receb/i.test(t) ? "#f59e0b" : /atend/i.test(t) ? "#22c55e" : /chama|discand|ligando|toca/i.test(t) ? "#38bdf8" :
    /espera|segur|hold/i.test(t) ? "#a78bfa" : /pausa|ocupad/i.test(t) ? "#f97316" : "#9ca3af";

  const fmtT = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), p = (n) => String(n).padStart(2, "0");
    return (h ? h + ":" : "") + p(m) + ":" + p(s % 60);
  };

  // ---- estado da pausa (motivo + início), guardado também em sessionStorage para sobreviver a um reload ----
  let pauseInfo = null, chosen = null, reasons = [];
  const PKEY = "sipb_pause";
  function findReason() {
    // procura, na página, um texto igual a um dos motivos conhecidos (fora do discador e do diálogo de pausa)
    const want = reasons.map((r) => r.toLowerCase());
    if (!want.length) return null;
    for (const el of document.querySelectorAll("div,span,p,h1,h2,h3")) {
      if (el.children.length) continue;
      const t = (el.textContent || "").trim();
      if (t && want.includes(t.toLowerCase()) && vis(el) && !el.closest('[role="listbox"],[role="presentation"]')) return t;
    }
    return null;
  }
  function startPause() {
    let reason = null, since = Date.now();
    if (chosen && Date.now() - chosen.t < 60000) { reason = chosen.name; since = chosen.t; }
    else {
      try { const s = JSON.parse(sessionStorage.getItem(PKEY) || "null"); if (s) { reason = s.reason; since = s.since; } } catch (_) {}
    }
    pauseInfo = { reason: reason || findReason() || "Pausa", since };
    try { sessionStorage.setItem(PKEY, JSON.stringify(pauseInfo)); } catch (_) {}
  }
  function endPause() {
    pauseInfo = null; chosen = null;
    try { sessionStorage.removeItem(PKEY); } catch (_) {}
  }

  // ---- copiar o número do visor ----
  // Formato brasileiro: (11) 98765-4321, (11) 3456-7890, +55 (11) 98765-4321. Outros tamanhos ficam só com os dígitos.
  function fmtPhone(digits) {
    let d = String(digits).replace(/\D/g, ""), cc = "";
    if ((d.length === 12 || d.length === 13) && d.startsWith("55")) { cc = "+55 "; d = d.slice(2); }
    if (d.length === 11) return cc + `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return cc + `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    if (d.length === 9) return `${d.slice(0, 5)}-${d.slice(5)}`;
    if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return cc + d;
  }
  // O que está no visor: o número digitado (livre) ou o número da chamada (tocando, chamando, em ligação).
  function pickNumber(st, h, who) {
    const cands = st === "idle" ? [$("num").value] : [h && h.line, h && h.name, who, $("num").value];
    for (const c of cands) {
      const t = String(c || "").trim();
      if (!t) continue;
      let d = "";
      if (/^[\d\s()+\-.]{3,}$/.test(t)) d = t.replace(/\D/g, "");
      else { const m = t.match(/\+?\d[\d\s()\-]{7,}\d/); if (m) d = m[0].replace(/\D/g, ""); }
      if (d.length >= 3) return d;
    }
    return "";
  }
  async function copyNumber(digitsOnly) {
    if (!numNow) { api().toast("Nenhum número para copiar"); return; }
    const text = digitsOnly ? numNow : fmtPhone(numNow);
    let ok = false;
    try { await pip.navigator.clipboard.writeText(text); ok = true; } catch (_) {}
    if (!ok) {
      try {
        const ta = ui.doc.createElement("textarea");
        ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
        ui.doc.body.appendChild(ta); ta.select();
        ok = ui.doc.execCommand("copy"); ta.remove();
      } catch (_) {}
    }
    const b = $("cpy");
    b.classList.toggle("ok", ok);
    b.title = ok ? "Copiado: " + text : "Não foi possível copiar";
    setTimeout(() => { if (ui) { b.classList.remove("ok"); b.title = "Copiar número formatado (Shift: só dígitos) · Alt+C"; } }, 1400);
  }

  function render() {
    if (!ui) return;
    readChannel();
    const { st, raw, h, who } = readState();
    const paused = isPaused();
    if (paused && !pauseInfo) startPause(); else if (!paused && pauseInfo) endPause();
    const pz = paused && st === "idle";            // pausado e sem chamada: o visor mostra a pausa
    const label = pz ? "Em pausa" : st === "ringing" ? "Recebendo ligação…" : raw || { idle: "Livre", ringing: "Recebendo ligação…", calling: "Chamando…", incall: "Em atendimento…" }[st];
    if (st !== state || label !== statusTxt) { state = st; statusTxt = label; stateSince = Date.now(); if (st === "idle") { quality = null; muted = false; } }

    // cabeçalho
    $("hst").firstElementChild.innerHTML = `<span class="dot" style="background:${STATUS_COLOR(label)}"></span>${label.replace(/…|\.\.\.$/, "")}`;
    const pg = pz ? readPause() : null;               // tempo restante / previsto / início, lidos do painel da página
    const clockMs = pg ? sinceClock(pg.start) : null;
    const pMs = clockMs != null ? clockMs : pz && pauseInfo ? Date.now() - pauseInfo.since : 0;
    const pElapsed = pz ? fmtT(Math.floor(pMs / 1000)) : "";
    $("tm").textContent = pz ? pElapsed : st === "idle" ? "" : fmtT(Math.floor((Date.now() - stateSince) / 1000));
    const num = $("num");
    if (pz) {
      if (!num.readOnly) { typed = num.value; num.readOnly = true; }
      num.value = "⏸ " + (pauseInfo ? pauseInfo.reason : "Pausa");
      num.style.color = "#fb923c";
    } else if (st === "idle") {
      if (num.readOnly) { num.readOnly = false; num.value = typed; }
      num.placeholder = "Número";
      num.style.color = "";
    } else {
      if (!num.readOnly) { typed = num.value; num.readOnly = true; }
      num.value = (h && h.name) || who || "";
      num.style.color = "";
    }
    $("line").textContent = pz
      ? (pg && pg.rest ? `Restante ${pg.rest}` + (pg.planned ? ` de ${pg.planned}` : "") : "Tempo de pausa: " + pElapsed)
      : st === "ringing" && api().autoLeft && api().autoLeft() != null ? "Atende sozinho em " + api().autoLeft() + " s"
      : st === "idle" ? "" : (h && h.line) || "";
    $("line").style.color = pz ? "#fb923c" : "";
    numNow = pz ? "" : pickNumber(st, h, who);
    $("cpy").classList.toggle("dim", !numNow);
    $("ram").lastChild.textContent = (h && h.ramal) || $("ram").lastChild.textContent;
    const mode = currentMode();
    ui.doc.querySelectorAll(".mode").forEach((b) => b.classList.toggle("off", !!mode && b.dataset.m !== mode));

    // botão de pausa: mostra "Pausar" ou, se a página estiver pausada, "Retomar"
    $("pause").classList.toggle("on", paused);
    $("pause").innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="${paused ? PLAY_ICON : PAUSE_ICON}"/></svg>${paused ? "Retomar" : "Pausa"}`;

    // canais
    ui.doc.querySelectorAll("#chs button").forEach((b) => {
      const on = Number(b.dataset.ch) === activeCh;
      b.classList.toggle("on", on);
      b.classList.toggle("live", on && st !== "idle");
    });

    // ações por estado
    $("bk").hidden = st !== "idle" || pz;
    $("call").hidden = true;                       // "Ligar" agora é o próprio botão verde (#ans)
    $("unpause").hidden = !pz;
    // Atender (verde) e Desligar (vermelho) ficam sempre na tela; só esmaecem quando não servem para nada.
    $("ans").hidden = pz;
    $("hang").hidden = pz;
    $("ans").classList.toggle("dim", st === "incall");
    $("hang").classList.toggle("dim", st === "idle");
    $("ans").title = st === "idle" ? "Ligar (Enter)" : "Atender (Alt+A)";
    $("mute").hidden = st !== "incall";
    $("xfer").hidden = st !== "incall";
    if (st !== "incall" && trOn) closeTransfer();
    $("mute").classList.toggle("on", muted);
    $("mute").innerHTML = svg(muted ? "micoff" : "mic");
    $("mute").title = muted ? "Ativar microfone" : "Mutar";
    $("q").textContent = quality
      ? `RTT ${Math.round(quality.rtt ?? 0)} ms · jitter ${Math.round(quality.jitter ?? 0)} ms · perda ${quality.lossPct.toFixed(1)}%`
      : "";
    if (Date.now() - micAt > 1500) $("mic").classList.remove("on");   // sem medição (fora de chamada)
    document.title = st === "ringing" ? "📞 CHAMADA! | " + document.title.replace(/^📞 CHAMADA! \| /, "") : document.title;
  }

  const VIEWS = [
    { k: "full", h: 520, lb: "⌨", t: "Teclado completo (clique para trocar)" },
    { k: "sym", h: 360, lb: "*#", t: "Só * e # (clique para trocar)" },
    { k: "min", h: 305, lb: "▭", t: "Só visor e botões (clique para trocar)" },
    { k: "micro", h: 215, lb: "·", t: "Micro: visor e botões essenciais (clique para trocar)" },
  ];
  const BASE_W = 270;   // largura de projeto; a janela inteira escala a partir dela
  const scaleOf = (w) => Math.max(0.5, Math.min(1.6, w / BASE_W));
  let view = "full";
  try { chrome.storage.local.get("sipbView", (r) => { if (r && VIEWS.some((v) => v.k === r.sipbView)) view = r.sipbView; }); } catch (_) {}
  // Temas de cor: o CSS só troca variáveis (ver bloco :root / html[data-theme=…] acima).
  const THEMES = [
    { id: "preto-azul", name: "Preto e azul", bg: "#09090c", ac: "#3b82f6" },
    { id: "preto-vermelho", name: "Preto e vermelho", bg: "#0a0808", ac: "#ef4444" },
    { id: "preto-rosa", name: "Preto e rosa", bg: "#0b090b", ac: "#ec4899" },
    { id: "preto-verde", name: "Preto e verde", bg: "#080a09", ac: "#22c55e" },
    { id: "preto-roxo", name: "Preto e roxo", bg: "#0a090d", ac: "#a855f7" },
    { id: "preto-laranja", name: "Preto e laranja", bg: "#0b0a08", ac: "#f97316" },
    { id: "preto-ciano", name: "Preto e ciano", bg: "#080a0b", ac: "#06b6d4" },
    { id: "naval-amarelo", name: "Azul naval e amarelo", bg: "#0a1a3a", ac: "#facc15" },
    { id: "claro", name: "Claro", bg: "#eceef3", ac: "#2563eb" },
  ];
  let theme = "preto-azul";
  try { chrome.storage.local.get("sipbTheme", (r) => { if (r && THEMES.some((t) => t.id === r.sipbTheme)) theme = r.sipbTheme; }); } catch (_) {}
  function applyTheme() {
    if (!ui) return;
    ui.doc.documentElement.dataset.theme = theme;
    ui.doc.querySelectorAll("#themes button").forEach((b) => b.classList.toggle("sel", b.dataset.t === theme));
  }

  function applyView(resize) {
    if (!ui) return;
    const v = VIEWS.find((x) => x.k === view) || VIEWS[0];
    VIEWS.forEach((x) => ui.doc.body.classList.toggle("v-" + x.k, x.k === v.k));
    $("view").textContent = v.lb;
    $("view").title = v.t;
    if (resize) {
      try {
        let z = scaleOf(pip.innerWidth);
        if (v.k === "micro") z = Math.min(z, 0.75);   // o modo micro já encolhe a janela
        pip.resizeTo(Math.round(BASE_W * z) + (pip.outerWidth - pip.innerWidth), Math.round(v.h * z) + (pip.outerHeight - pip.innerHeight));
      } catch (_) {}
    }
    fit();
  }

  // Escala a interface inteira conforme o tamanho da janela (largura e altura), então dá para encolher bastante.
  function fit() {
    if (!ui || !pip) return;
    const v = VIEWS.find((x) => x.k === view) || VIEWS[0];
    const z = Math.max(0.5, Math.min(1.6, pip.innerWidth / BASE_W, pip.innerHeight / v.h));
    ui.doc.documentElement.style.zoom = z;
    ui.doc.body.style.height = Math.floor(pip.innerHeight / z) + "px";
  }

  async function open() {
    if (pip && !pip.closed) { pip.focus?.(); return; }
    try {
      pip = await documentPictureInPicture.requestWindow({ width: 270, height: (VIEWS.find((v) => v.k === view) || VIEWS[0]).h });
    } catch (e) {
      api().toast("Mini-telefone: " + e.message);
      return;
    }
    const doc = pip.document;
    const style = doc.createElement("style"); style.textContent = CSS; doc.head.appendChild(style);
    doc.title = "SIP Agent Booster";
    doc.body.innerHTML = `
      <div id="hdr">
        <div id="hst"><span></span><span><span id="tm"></span><button id="pause" title="Pausar / retomar (Alt+P)"></button></span></div>
        <div id="numrow"><input id="num" inputmode="tel" placeholder="Número" autocomplete="off"><button id="cpy" title="Copiar número formatado (Shift: só dígitos) · Alt+C">${svg("copy", 14)}</button></div>
        <div id="line"></div>
        <div id="hrow"><span class="ram" id="ram">${svg("phone", 12)}<span></span></span>
          <span id="tools"><button id="thm" title="Tema de cores">◐</button><button id="view"></button></span>
          <span id="modes"><button class="mode" data-m="TD" title="Transferência Direta">TD</button><button class="mode off" data-m="TA" title="Transferência Assistida">TA</button></span></div>
      </div>
      <div id="chs"></div>
      <div id="pad"></div>
      <div id="act">
        <button id="unpause" hidden title="Encerrar a pausa e voltar a ficar disponível">▶ Encerrar pausa</button>
        <button class="ab" id="bk" title="Apagar">${svg("back")}</button>
        <button class="ab" id="mute" hidden></button>
        <button class="ab" id="call" title="Ligar">${svg("phone")}</button>
        <button class="ab" id="ans" hidden title="Atender">${svg("phone")}</button>
        <button class="ab" id="hang" hidden title="Desligar">${svg("end")}</button>
        <button class="ab" id="xfer" hidden title="Transferir">${svg("swap")}</button>
      </div>
      <div id="mic" title="Captação do microfone"><div id="micbar"><i></i></div><div id="miclb"></div></div>
      <div id="q"></div>
      <div id="themes"></div>
      <div id="pz">
        <div id="pzinfo">Motivo da pausa</div>
        <div id="pzlist"></div>
        <button class="tb" id="pzback">← Cancelar</button>
      </div>
      <div id="tr">
        <input id="trq" placeholder="Buscar contato ou ramal" autocomplete="off">
        <div id="trinfo">Escolha o contato para transferir (modo TD/TA no cabeçalho).</div>
        <div id="trconf"><div id="trtxt"></div><div class="row"><button class="tb" id="trok">Confirmar</button><button class="tb" id="trno">Cancelar</button></div></div>
        <div id="trlist"></div>
        <button class="tb" id="trback" style="flex:none">← Voltar</button>
      </div>`;
    ui = { doc };
    $("ram").lastChild.textContent = "";

    // teclado: em chamada envia DTMF pelo teclado da página; livre, digita no campo
    const pad = $("pad");
    for (const d of DIGITS) {
      const b = doc.createElement("button"); b.textContent = d;
      b.dataset.k = d === "*" || d === "#" ? "sym" : "num";
      b.onclick = async () => {
        if (state === "idle" && $("num").readOnly) return;   // em pausa o visor mostra o motivo, não o número
        if (state === "idle") { $("num").value += d; typed = $("num").value; $("num").focus(); return; }
        await ensureDialer();
        const key = dialerRoot() && [...dialerRoot().querySelectorAll("button#virtual-keyboard")].find((k) => k.innerText.trim() === d);
        if (key) key.click(); else api().toast("Tecla não encontrada no discador");
      };
      pad.appendChild(b);
    }
    $("bk").onclick = () => { $("num").value = $("num").value.slice(0, -1); typed = $("num").value; $("num").focus(); };
    // o campo aceita só dígitos e os símbolos de discagem (* # +): letras e espaços são barrados, inclusive ao colar
    const numEl = $("num");
    numEl.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (!/[\d*#+]/.test(e.key)) e.preventDefault();
    });
    numEl.addEventListener("input", () => {
      if (numEl.readOnly) return;
      const clean = numEl.value.replace(/[^\d*#+]/g, "");
      if (clean !== numEl.value) {
        const pos = numEl.selectionStart - (numEl.value.length - clean.length);
        numEl.value = clean;
        numEl.setSelectionRange(Math.max(0, pos), Math.max(0, pos));
      }
      if (state === "idle") typed = numEl.value;
    });

    for (let n = 1; n <= 4; n++) {
      const b = doc.createElement("button"); b.dataset.ch = n;
      b.innerHTML = svg("phone", 12) + `<span>${n}</span>`;
      b.onclick = async () => {
        await ensureDialer();
        const pb = channelButtons()[n - 1];
        if (pb) { pb.click(); activeCh = n; render(); } else api().toast("Canal " + n + " não encontrado");
      };
      $("chs").appendChild(b);
    }
    doc.querySelectorAll(".mode").forEach((b) => (b.onclick = async () => { await ensureDialer(); setMode(b.dataset.m); setTimeout(render, 150); }));

    // seletor de tema
    for (const t of THEMES) {
      const b = doc.createElement("button");
      b.dataset.t = t.id; b.title = t.name;
      b.style.background = `linear-gradient(135deg, ${t.bg} 50%, ${t.ac} 50%)`;
      b.onclick = () => {
        theme = t.id;
        try { chrome.storage.local.set({ sipbTheme: theme }); } catch (_) {}
        applyTheme();
        $("themes").classList.remove("show");
      };
      $("themes").appendChild(b);
    }
    $("thm").onclick = (e) => { e.stopPropagation(); $("themes").classList.toggle("show"); };
    doc.addEventListener("click", (e) => { if (!e.target.closest("#themes")) $("themes").classList.remove("show"); });
    applyTheme();

    $("view").onclick = () => {
      view = VIEWS[(VIEWS.findIndex((v) => v.k === view) + 1) % VIEWS.length].k;
      try { chrome.storage.local.set({ sipbView: view }); } catch (_) {}
      applyView(true);
    };
    applyView(false);
    $("cpy").onclick = (e) => copyNumber(e.shiftKey);
    $("pause").onclick = openPause;
    $("unpause").onclick = openPause;     // pausado: openPause clica no botão da página para retomar
    $("pzback").onclick = () => { cancelPause(); closePauseView(); };
    $("ans").onclick = () => { if (state === "idle") dial(); else call("answer"); };
    $("hang").onclick = () => call("hangup");
    $("mute").onclick = async () => {
      // Clica no microfone do próprio discador da página (mantém a UI dela sincronizada).
      if (!call("mute")) { await ensureDialer(); await sleep(120); }
      if (!call("mute")) window.postMessage({ source: "sip-booster-cmd", type: "toggle-mute" }, "*");
    };

    // transferência
    $("xfer").onclick = openTransfer;
    $("trback").onclick = closeTransfer;
    $("trno").onclick = () => { pending = null; $("trconf").classList.remove("show"); };
    $("trok").onclick = () => {
      if (!pending) return;
      const r = pending; pending = null;
      r.el.click();                      // a página executa a transferência no modo TD/TA atual
      $("trconf").classList.remove("show");
      api().toast("Transferindo para " + r.name);
      setTimeout(() => { if (trOn) closeTransfer(); }, 800);
    };
    let tq;
    $("trq").addEventListener("input", () => { clearTimeout(tq); tq = setTimeout(() => { setPageSearch($("trq").value); setTimeout(renderContacts, 300); }, 200); });

    // discar
    const dial = async () => {
      if (state !== "idle") return;
      const n = $("num").value.replace(/[^\d*#+]/g, "");
      if (!n) return;
      if (!(await ensureDialer())) { api().toast("Discador não encontrado"); return; }
      setNumber(n);
      await sleep(150);
      if (!call("call")) api().toast("Botão ligar indisponível");
      else { $("num").value = ""; typed = ""; }
    };
    $("call").onclick = dial;
    $("num").addEventListener("keydown", (e) => { if (e.key === "Enter") dial(); });
    doc.addEventListener("keydown", (e) => {
      if (!e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "a") { call("answer"); e.preventDefault(); }
      if (k === "h") { call("hangup"); e.preventDefault(); }
      if (k === "p") { openPause(); e.preventDefault(); }
      if (k === "c" && !doc.getSelection().toString()) { copyNumber(e.shiftKey); e.preventDefault(); }
    });
    const timer = setInterval(render, 500);
    pip.addEventListener("resize", fit);
    pip.addEventListener("pagehide", () => { clearInterval(timer); ui = null; pip = null; });
    render();
    await ensureDialer();   // o cabeçalho (ramal, canal e TD/TA) só pode ser lido com o discador da página aberto
    render();
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.source !== "sip-booster") return;
    if (e.data.type === "mute-state" && e.data.detail.muted != null) muted = e.data.detail.muted;
    if (e.data.type === "level" && ui) {
      const d = e.data.detail, m = $("mic");
      micAt = Date.now();
      m.classList.add("on");
      m.classList.toggle("mute", !!d.muted);
      m.classList.toggle("hot", !d.muted && d.peak > 0.9);
      m.firstChild.firstChild.style.width = Math.round(d.level * 100) + "%";
      $("miclb").textContent = d.muted ? "Microfone mudo" : "";
    }
    if (e.data.type === "stats") { quality = e.data.detail; if (typeof quality.muted === "boolean") muted = quality.muted; }
  });

  window.__sipbPip = { open, ensureDialer };
})();
