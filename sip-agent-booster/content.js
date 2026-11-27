(() => {
  if (window.top !== window && !document.querySelector("audio,video")) {
    // frames sem mídia ainda participam de atalhos/alertas, então não retornamos.
  }
  if (window.__sipBoosterContent) return;
  window.__sipBoosterContent = true;

  const DEFAULTS = {
    hud: true,
    alerts: true,
    shortcuts: true,
    clickToCall: true,
    autoAnswer: false,      // desligado por padrão: cada usuário decide ativar
    autoAnswerDelay: 10,    // segundos tocando antes de atender sozinho
    phoneRegex: "(?:\\+?55\\s?)?\\(?\\d{2}\\)?\\s?9?\\d{4}[-\\s]?\\d{4}",
    keys: { answer: "Alt+A", hangup: "Alt+H", mute: "Alt+M", dial: "Alt+D", call: "Alt+Enter", dump: "Alt+Shift+D", pip: "Alt+P" },
    // Regex aplicada ao texto/title/aria-label/class dos botões (selector opcional tem prioridade).
    patterns: {
      answer: "atender|answer|accept|aceitar",
      hangup: "desligar|encerrar|hang ?up|finalizar|end call",
      mute: "mudo|mute|silenciar|microfone",
      call: "ligar|discar|chamar|call|dial",
    },
    // Descobertos na página real: campo #softphone-input; botão de ligar é o irmão após #virtual-keyboard.
    // Cartão da chamada: telefone (atender, desabilitado após atender) e telefone-cortado vermelho (desligar).
    selectors: {
      // Ícone verde (text-green-800) = atender; fica cinza (text-gray-800) depois de atendida.
      answer: "button[type=button]:not([aria-label]):has(svg.text-green-800)",
      hangup: "button[type=button]:not([aria-label]):has(svg.text-red-800)",
      // Microfone do discador (aparece durante a chamada, com o discador aberto).
      mute: 'button:has(svg[viewBox="0 0 352 512"])',
      transfer: 'button:has(svg path[d^="M504.971 359.029"])',
      // Botão ligar do discador: ícone de telefone, sem id, que não é o do cartão da chamada.
      // (Ligar e atender são o mesmo botão verde; o que diferencia é o texto de status da página.)
      call: 'button.MuiIconButton-root:not(#virtual-keyboard):has(svg[viewBox="0 0 512 512"])',
      dialInput: "#softphone-input",
    },
    thresholds: { rttWarn: 250, jitterWarn: 30, lossWarn: 3 },
  };

  let cfg = DEFAULTS;
  const merge = (a, b) => {
    const o = { ...a };
    for (const k in b) if (b[k] !== "") o[k] = b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k];
    return o;
  };
  const load = () =>
    chrome.storage.sync.get("cfg").then((r) => { cfg = merge(DEFAULTS, r.cfg || {}); applyUI(); });
  chrome.storage.onChanged.addListener(load);

  // ---------- util ----------
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.disabled;
  };
  const labelOf = (el) =>
    [el.innerText, el.title, el.getAttribute("aria-label"), el.getAttribute("ng-click"), el.getAttribute("data-original-title"), el.className && String(el.className)]
      .filter(Boolean).join(" ");

  // Raiz do discador (ancestral do campo de número que contém o teclado e os botões).
  function dialerRoot() {
    let el = document.querySelector(cfg.selectors.dialInput);
    for (let i = 0; el && i < 8 && el.querySelectorAll("button").length < 14; i++) el = el.parentElement;
    return el;
  }
  // Ações cujos ícones se repetem em outros botões da página: busca só dentro do discador e ignora botões com aria-label.
  const SCOPED = new Set(["call", "mute", "transfer"]);

  function findAction(name) {
    const sel = cfg.selectors[name];
    if (sel && SCOPED.has(name)) {
      const root = dialerRoot();
      if (!root) return null;
      return [...root.querySelectorAll(sel)].filter((b) => !b.hasAttribute("aria-label") && b.id !== "virtual-keyboard").find(visible) || null;
    }
    if (sel) {
      const el = [...document.querySelectorAll(sel)].find(visible);
      if (el) return el;
    }
    const re = new RegExp(cfg.patterns[name] || "$^", "i");
    return [...document.querySelectorAll("button,a,[role=button],.btn,i,span[ng-click]")]
      .filter(visible)
      .find((el) => re.test(labelOf(el)));
  }
  // Texto de status do softphone ("Livre", "Recebendo ligação…", "Em atendimento…").
  const RING_RE = /^(Recebendo|Chamada recebida|Tocando)/i;
  const STATUS_RE = /^(Recebendo|Chamada recebida|Tocando|Em atendimento|Livre|Chamando|Discando|Ligando)/i;
  // Se mais de um texto de status aparece na página (ex.: "Livre" da disponibilidade do agente e
  // "Recebendo ligação…" do discador), vale o mais "ativo": tocando > saindo > em atendimento > livre.
  const STATUS_PRIO = [RING_RE, /^(Chamando|Discando|Ligando)/i, /^Em atendimento/i, /^Livre/i];
  function callStatus() {
    // Usa só o texto próprio do elemento (nós de texto), para achar o status mesmo ao lado de ícones.
    let best = "", bp = 99;
    for (const el of document.querySelectorAll("div,p,span")) {
      let t = "";
      for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
      t = t.trim();
      if (!t || t.length >= 40 || !STATUS_RE.test(t) || !visible(el)) continue;
      const p = STATUS_PRIO.findIndex((re) => re.test(t));
      if (p < bp) { best = t; bp = p; if (p === 0) break; }
    }
    return best;
  }
  function isRinging() {
    const s = callStatus();
    if (RING_RE.test(s)) return true;
    if (/^Em atendimento/i.test(s)) return false;
    // Com o discador aberto, a chamada que ENTRA aparece como "Chamando..." (medido na página real), igual a uma
    // chamada saindo. O que as diferencia: na entrada o botão verde de atender aparece junto com o de desligar.
    return !!(findAction("hangup") && findAction("answer"));
  }

  const clickAction = (name) => {
    if (name === "answer" && !isRinging()) return false; // ligar/atender é o mesmo botão: só atende se estiver tocando
    if (name === "call" && isRinging()) return false;
    const el = findAction(name);
    if (el) { (el.closest("button,a,[role=button]") || el).click(); return true; }
    return false;
  };

  // ---------- beep / flash ----------
  let audioCtx;
  function beep(times = 3) {
    try {
      audioCtx = audioCtx || new AudioContext();
      for (let i = 0; i < times; i++) {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = 880; g.gain.value = 0.08;
        o.connect(g).connect(audioCtx.destination);
        const t = audioCtx.currentTime + i * 0.35;
        o.start(t); o.stop(t + 0.18);
      }
    } catch (_) {}
  }
  let flashTimer, origTitle = document.title;
  function flashTitle(on) {
    clearInterval(flashTimer);
    if (!on) { document.title = origTitle; return; }
    origTitle = document.title.replace(/^📞 CHAMADA! \| /, "");
    let t = false;
    flashTimer = setInterval(() => { document.title = (t = !t) ? "📞 CHAMADA! | " + origTitle : origTitle; }, 700);
  }

  // ---------- HUD ----------
  let hud;
  function ensureHud() {
    if (hud) return hud;
    hud = document.createElement("div");
    hud.id = "sipb-hud";
    hud.innerHTML = `<div class="sipb-dot"></div><div class="sipb-txt">SIP: sem chamada</div><button class="sipb-pip" title="Abrir mini-telefone flutuante (Alt+P)">⧉</button>`;
    hud.insertAdjacentHTML("beforeend", `<div class="sipb-mic"><i></i></div>`);
    hud.title = "SIP Agent Booster — clique para ver detalhes · arraste para mover · duplo clique volta ao canto";
    let moved = false;
    hud.addEventListener("click", () => {
      if (moved) { moved = false; return; }          // o clique que termina um arrasto não abre os detalhes
      hud.classList.toggle("sipb-open");
      setTimeout(keepInView, 0);
    });
    // Arrastar para mudar de lugar (a posição fica salva); duplo clique volta ao canto inferior direito.
    let drag = null;
    hud.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".sipb-pip")) return;
      const r = hud.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY };
      moved = false;
      try { hud.setPointerCapture(e.pointerId); } catch (_) {}
    });
    hud.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
      moved = true;
      hud.classList.add("sipb-drag");
      placeHud(...clampPos(e.clientX - drag.dx, e.clientY - drag.dy));
    });
    hud.addEventListener("pointerup", (e) => {
      if (!drag) return;
      drag = null;
      hud.classList.remove("sipb-drag");
      try { hud.releasePointerCapture(e.pointerId); } catch (_) {}
      if (moved) { const r = hud.getBoundingClientRect(); savePos({ x: r.left, y: r.top }); }
    });
    hud.addEventListener("dblclick", () => {
      hud.style.left = hud.style.top = ""; hud.style.right = hud.style.bottom = "";
      savePos(null);
    });
    hud.querySelector(".sipb-pip").addEventListener("click", (e) => {
      e.stopPropagation();
      window.__sipbPip ? window.__sipbPip.open() : toast("Mini-telefone indisponível neste navegador");
    });
    document.documentElement.appendChild(hud);
    loadPos();
    return hud;
  }
  // ---- posição do indicador (móvel) ----
  const POS_KEY = "sipbHudPos";
  const placeHud = (x, y) => { hud.style.left = x + "px"; hud.style.top = y + "px"; hud.style.right = "auto"; hud.style.bottom = "auto"; };
  const clampPos = (x, y) => [
    Math.min(Math.max(0, x), Math.max(0, innerWidth - hud.offsetWidth)),
    Math.min(Math.max(0, y), Math.max(0, innerHeight - hud.offsetHeight)),
  ];
  const keepInView = () => {
    if (!hud || !hud.style.left) return;
    const r = hud.getBoundingClientRect();
    placeHud(...clampPos(r.left, r.top));
  };
  function savePos(p) {
    try { (p ? chrome.storage.local.set({ [POS_KEY]: p }) : chrome.storage.local.remove(POS_KEY)).catch(() => {}); } catch (_) {}
  }
  function loadPos() {
    try {
      chrome.storage.local.get(POS_KEY).then((r) => { const p = r[POS_KEY]; if (p && hud) placeHud(...clampPos(p.x, p.y)); }).catch(() => {});
    } catch (_) {}
  }
  window.addEventListener("resize", keepInView);
  function applyUI() { if (cfg.hud && window.top === window) ensureHud(); else if (hud) hud.style.display = cfg.hud ? "" : "none"; }

  function mos(rtt, jitter, loss) {
    const eff = (rtt || 0) / 2 + (jitter || 0) * 2 + 10;
    let R = eff < 160 ? 93.2 - eff / 40 : 93.2 - (eff - 120) / 10;
    R -= loss * 2.5;
    R = Math.max(0, Math.min(100, R));
    return 1 + 0.035 * R + 7e-6 * R * (R - 60) * (100 - R);
  }

  let lastQuality = "ok", callStart = null, stale = null;
  function onStats(s) {
    clearTimeout(stale);
    stale = setTimeout(() => setHud("idle"), 6000);
    if (!callStart) callStart = Date.now();
    const m = mos(s.rtt, s.jitter, s.lossPct);
    const t = cfg.thresholds;
    const bad = (s.rtt || 0) > t.rttWarn || (s.jitter || 0) > t.jitterWarn || s.lossPct > t.lossWarn || !s.flowing;
    const q = !s.flowing ? "nomedia" : bad ? "bad" : m < 3.6 ? "warn" : "ok";
    setHud(q, s, m);
    if (cfg.alerts && q !== lastQuality && (q === "bad" || q === "nomedia")) {
      chrome.runtime.sendMessage({
        type: "notify",
        title: q === "nomedia" ? "Sem áudio na chamada" : "Qualidade da chamada ruim",
        message: `RTT ${fmt(s.rtt)}ms · jitter ${fmt(s.jitter)}ms · perda ${s.lossPct.toFixed(1)}%`,
      });
    }
    lastQuality = q;
  }
  const fmt = (n) => (n == null ? "–" : Math.round(n));
  function setHud(q, s, m) {
    if (!cfg.hud || window.top !== window) return;
    ensureHud();
    hud.dataset.q = q;
    const txt = hud.querySelector(".sipb-txt");
    if (q === "idle") { callStart = null; lastQuality = "ok"; txt.textContent = "SIP: sem chamada"; return; }
    const dur = callStart ? Math.floor((Date.now() - callStart) / 1000) : 0;
    const mm = String(Math.floor(dur / 60)).padStart(2, "0"), ss = String(dur % 60).padStart(2, "0");
    const label = { ok: "Boa", warn: "Regular", bad: "Ruim", nomedia: "Sem áudio" }[q];
    txt.innerHTML = `${label} · MOS ${m.toFixed(1)} · ${mm}:${ss}` +
      `<div class="sipb-det">RTT ${fmt(s.rtt)} ms · Jitter ${fmt(s.jitter)} ms · Perda ${s.lossPct.toFixed(1)}%<br>Codec ${s.codec || "?"} · ICE ${s.ice}</div>`;
    chrome.runtime.sendMessage({ type: "badge", text: q === "ok" ? "" : "!", color: q === "bad" || q === "nomedia" ? "#c62828" : "#f9a825" });
  }

  // barra do microfone no HUD: some sozinha se o medidor parar de enviar (chamada encerrada)
  let micOff;
  function onLevel(d) {
    if (!cfg.hud || window.top !== window) return;
    ensureHud();
    const bar = hud.querySelector(".sipb-mic");
    bar.classList.add("on");
    bar.classList.toggle("mute", !!d.muted);
    bar.classList.toggle("hot", !d.muted && d.peak > 0.9);
    bar.firstChild.style.width = Math.round(d.level * 100) + "%";
    bar.title = d.muted ? "Microfone mudo" : "Captação do microfone";
    clearTimeout(micOff);
    micOff = setTimeout(() => bar.classList.remove("on"), 1500);
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.source !== "sip-booster") return;
    const { type, detail } = e.data;
    if (type === "stats") onStats(detail);
    if (type === "level") onLevel(detail);
    if (type === "mute-state") toast(detail.muted ? "🔇 Microfone mudo" : "🎤 Microfone ativo");
  });

  // ---------- toast ----------
  function toast(msg) {
    if (window.top !== window) return;
    const t = document.createElement("div");
    t.className = "sipb-toast"; t.textContent = msg;
    document.documentElement.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  // ---------- atalhos ----------
  const combo = (e) =>
    [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift", e.metaKey && "Meta", e.key.length === 1 ? e.key.toUpperCase() : e.key]
      .filter(Boolean).join("+");

  document.addEventListener("keydown", (e) => {
    if (!cfg.shortcuts) return;
    const c = combo(e);
    const entry = Object.entries(cfg.keys).find(([, v]) => v && v.toLowerCase() === c.toLowerCase());
    if (!entry) return;
    const [action] = entry;
    e.preventDefault();
    if (action === "pip") { window.__sipbPip ? window.__sipbPip.open() : toast("Mini-telefone indisponível neste navegador"); }
    else if (action === "answer") { clickAction("answer") ? toast("📞 Atendendo") : toast("Botão atender não encontrado"); }
    else if (action === "hangup") { clickAction("hangup") ? toast("📴 Encerrando") : toast("Botão desligar não encontrado"); }
    else if (action === "mute") {
      (async () => {
        if (clickAction("mute")) return;
        await window.__sipbPip?.ensureDialer?.();
        if (!clickAction("mute")) window.postMessage({ source: "sip-booster-cmd", type: "toggle-mute" }, "*");
      })();
    } else if (action === "call") {
      clickAction("call") ? toast("☎ Ligando") : toast("Botão ligar indisponível (digite um número)");
    } else if (action === "dump") {
      // Diagnóstico: copia o HTML dos botões visíveis (rode durante uma chamada tocando/em curso).
      const out = [...document.querySelectorAll("button,[role=button]")].filter(visible)
        .map((b) => b.outerHTML.replace(/<path[^>]*>/g, "<path/>").slice(0, 300)).join("\n");
      navigator.clipboard.writeText(out).then(() => toast("Botões copiados para a área de transferência"));
    } else if (action === "dial") {
      const input = cfg.selectors.dialInput && document.querySelector(cfg.selectors.dialInput);
      if (input) { input.focus(); input.select(); } else toast("Defina o seletor do campo de discagem nas opções");
    }
  }, true);

  // ---------- alerta de chamada entrando ----------
  let ringing = false;
  let ringTimer;
  const ringObs = new MutationObserver(() => {
    if (ringTimer) return;
    ringTimer = setTimeout(() => { ringTimer = null; tickAuto(); checkRing(); }, 250);
  });
  // Atendimento automático (opcional): se a chamada toca por mais de autoAnswerDelay segundos, atende.
  let autoSince = null, autoDone = false;
  const autoDelayMs = () => Math.max(1, Number(cfg.autoAnswerDelay) || 10) * 1000;
  function tickAuto() {
    if (!cfg.autoAnswer || !(isRinging() && findAction("answer"))) { autoSince = null; autoDone = false; return; }
    if (!autoSince) autoSince = Date.now();
    if (!autoDone && Date.now() - autoSince > autoDelayMs()) {
      autoDone = true;
      if (clickAction("answer")) toast("📞 Atendida automaticamente");
    }
  }
  // segundos que faltam para atender sozinho (null se o recurso está desligado ou não há chamada tocando)
  const autoLeft = () => (cfg.autoAnswer && autoSince && !autoDone ? Math.max(0, Math.ceil((autoDelayMs() - (Date.now() - autoSince)) / 1000)) : null);
  setInterval(tickAuto, 500);

  function checkRing() {
    if (!cfg.alerts) return;
    const el = isRinging() && findAction("answer");
    if (el && !ringing) {
      ringing = true;
      beep();
      flashTitle(true);
      chrome.runtime.sendMessage({ type: "notify", title: "📞 Chamada entrando", message: "Clique para voltar ao atendimento", sticky: true });
    } else if (!el && ringing) {
      ringing = false;
      flashTitle(false);
    }
  }
  ringObs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });

  // ---------- click-to-call ----------
  document.addEventListener("dblclick", (e) => {
    if (!cfg.clickToCall) return;
    const sel = window.getSelection().toString().trim();
    if (!sel || !new RegExp("^" + cfg.phoneRegex + "$").test(sel)) return;
    const input = cfg.selectors.dialInput && document.querySelector(cfg.selectors.dialInput);
    if (!input) return;
    const digits = sel.replace(/\D/g, "");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, digits);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    toast("☎ Número " + digits + " no discador — Enter para ligar");
  });

  window.__sipb = { cfg: () => cfg, findAction, clickAction, toast, callStatus, isRinging, autoLeft };
  load();
})();
