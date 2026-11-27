// Fila de Chamadas e Histórico de Chamadas: marca os painéis para o lists.css, mostra o estado vazio
// e destaca na fila as chamadas que esperam muito.
(() => {
  if (window.top !== window || window.__sipbLists) return;
  window.__sipbLists = true;

  const WARN_S = 60;    // espera a partir da qual a linha fica amarela
  const BAD_S = 180;    // espera a partir da qual a linha fica vermelha

  // "02:35", "1:02:35", "45s", "2m 10s", "1h 5m"  ->  segundos (NaN se não entender)
  function parseDur(t) {
    t = (t || "").trim();
    let m = t.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
    if (m) return m[3] != null ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2];
    m = t.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$/i);
    if (m && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
    return NaN;
  }

  function panelFor(title) {
    for (const s of document.querySelectorAll("span.text-white.text-l.font-bold")) {
      if (s.textContent.trim() !== title) continue;
      const bar = s.closest("div.bg-gray-800");
      if (bar && bar.parentElement) return bar.parentElement;
    }
    return null;
  }

  function tidyEmpty(p) {
    const tb = p.querySelector("tbody");
    p.classList.toggle("sipb-empty", !!tb && tb.rows.length === 0);
  }

  function tidyQueue(p) {
    const ths = [...p.querySelectorAll("thead th")];
    const col = ths.findIndex((th) => /espera/i.test(th.textContent));
    for (const tr of p.querySelectorAll("tbody tr")) {
      const cell = col >= 0 ? tr.cells[col] : null;
      const s = cell ? parseDur(cell.textContent) : NaN;
      if (cell) cell.classList.add("sipb-wait");
      tr.classList.toggle("sipb-w1", s >= WARN_S && s < BAD_S);
      tr.classList.toggle("sipb-w2", s >= BAD_S);
    }
  }

  // Lê a cor de fundo que o Native deu à linha do histórico: avermelhada = perdida, esverdeada = atendida.
  function tone(el) {
    const m = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || []).map(Number);
    if (m.length < 3 || (m.length > 3 && m[3] === 0)) return "";
    const [r, g, b] = m;
    if (r > 200 && r - g > 25 && r - b > 15) return "miss";
    if (g > 200 && g - r > 15 && g - b > 5) return "ok";
    return "";
  }

  // Marca colunas pelo cabeçalho (Fila, Duração) e, no histórico, o tom de cada linha.
  function tidyCols(p, withTone) {
    const ths = [...p.querySelectorAll("thead th")];
    const fila = ths.findIndex((th) => /^fila$/i.test(th.textContent.trim()));
    const dur = ths.findIndex((th) => /dura/i.test(th.textContent));
    for (const tr of p.querySelectorAll("tbody tr")) {
      if (fila >= 0 && tr.cells[fila]) tr.cells[fila].classList.add("sipb-fila");
      if (dur >= 0 && tr.cells[dur]) tr.cells[dur].classList.add("sipb-dur");
      if (withTone && tr.cells[0]) {
        tr.classList.remove("sipb-miss", "sipb-ok");   // lê a cor original do Native, sem a nossa por cima
        const t = tone(tr.cells[0]) || tone(tr);
        tr.classList.toggle("sipb-miss", t === "miss");
        tr.classList.toggle("sipb-ok", t === "ok");
      }
    }
  }

  function sync() {
    const q = panelFor("Fila de Chamadas"), h = panelFor("Histórico de Chamadas");
    if (q) { q.classList.add("sipb-panel", "sipb-q"); tidyEmpty(q); tidyQueue(q); tidyCols(q, false); }
    if (h) { h.classList.add("sipb-panel", "sipb-h"); tidyEmpty(h); tidyCols(h, true); }
  }

  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(sync, 200); })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  sync();
})();
