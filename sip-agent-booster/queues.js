// Modal "Seleção de Filas": marca o modal para o queues.css, acrescenta busca e contadores e destaca as filas ativas.
(() => {
  if (window.top !== window || window.__sipbQueues) return;
  window.__sipbQueues = true;

  const SW = ".w-9.h-5";
  const isOn = (s) => !/bg-gray-400/.test(s.className);   // desligado = cinza; ligado = verde (recebidas) ou azul (efetuadas)

  function findModal() {
    for (const m of document.querySelectorAll(".MuiModal-root")) {
      const p = m.querySelector("p.text-xl");
      if (p && /^\s*Seleção de Filas\s*$/.test(p.textContent)) return m;
    }
    return null;
  }
  const rowsOf = (m) => [...m.querySelectorAll("div.pl-6.pr-6")].filter((r) => r.querySelector("span.w-1\\/2"));
  const nameOf = (r) => (r.querySelector("span.w-1\\/2")?.textContent || "").trim().toLowerCase();

  function applyFilter(m) {
    const q = (m.querySelector(".sipb-qbar input")?.value || "").trim().toLowerCase();
    rowsOf(m).forEach((r) => { r.style.display = !q || nameOf(r).includes(q) ? "" : "none"; });
  }

  function update(m) {
    const rows = rowsOf(m);
    let a = 0, b = 0;
    rows.forEach((r) => {
      const [s1, s2] = r.querySelectorAll(SW);
      const o1 = !!s1 && isOn(s1), o2 = !!s2 && isOn(s2);
      if (o1) a++;
      if (o2) b++;
      r.classList.toggle("sipb-on", o1 || o2);
    });
    const c = m.querySelector(".sipb-count");
    if (c) c.innerHTML = `<i class="g"></i>Recebidas <b>${a}/${rows.length}</b><i class="b"></i>Efetuadas <b>${b}/${rows.length}</b>`;
    applyFilter(m);
  }

  function enhance(m) {
    m.classList.add("sipb-queues");
    const rows = rowsOf(m);
    if (!rows.length) return;
    if (!m.querySelector(".sipb-qbar")) {
      const list = rows[0].parentElement;
      const bar = document.createElement("div");
      bar.className = "sipb-qbar";
      bar.innerHTML = `<input type="search" placeholder="Buscar fila…" autocomplete="off"><span class="sipb-count"></span>`;
      bar.querySelector("input").addEventListener("input", () => applyFilter(m));
      list.parentElement.insertBefore(bar, list);
    }
    m.querySelectorAll('button[aria-label="Recebidas"],button[aria-label="Efetuadas"]').forEach((b) => {
      if (!b.title) b.title = `Marcar ou desmarcar todas as filas: ${b.getAttribute("aria-label")}`;
    });
    update(m);
  }

  let t;
  const run = () => { const m = findModal(); if (m) enhance(m); };
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 80); })
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  document.addEventListener("click", () => setTimeout(run, 60), true);
  run();
})();
