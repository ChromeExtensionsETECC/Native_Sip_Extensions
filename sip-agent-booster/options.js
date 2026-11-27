const D = {
  hud: true, alerts: true, shortcuts: true, clickToCall: true, autoAnswer: false, autoAnswerDelay: 10,
  keys: { answer: "Alt+A", hangup: "Alt+H", mute: "Alt+M", dial: "Alt+D", call: "Alt+Enter", dump: "Alt+Shift+D", pip: "Alt+P" },
  selectors: { answer: "", hangup: "", mute: "", call: "", dialInput: "" },
  thresholds: { rttWarn: 250, jitterWarn: 30, lossWarn: 3 },
};
const $ = (id) => document.getElementById(id);
const groups = { k: "keys", s: "selectors", t: "thresholds" };

chrome.storage.sync.get("cfg").then(({ cfg = {} }) => {
  for (const f of ["hud", "alerts", "shortcuts", "clickToCall", "autoAnswer"]) $(f).checked = cfg[f] ?? D[f];
  $("autoAnswerDelay").value = cfg.autoAnswerDelay ?? D.autoAnswerDelay;
  for (const [p, g] of Object.entries(groups))
    for (const k in D[g]) $(`${p}_${k}`).value = (cfg[g] || {})[k] ?? D[g][k];
});

$("save").onclick = async () => {
  const { cfg: old = {} } = await chrome.storage.sync.get("cfg");
  const cfg = { ...old };
  for (const f of ["hud", "alerts", "shortcuts", "clickToCall", "autoAnswer"]) cfg[f] = $(f).checked;
  cfg.autoAnswerDelay = Math.min(120, Math.max(1, Number($("autoAnswerDelay").value) || D.autoAnswerDelay));
  for (const [p, g] of Object.entries(groups)) {
    cfg[g] = { ...(old[g] || {}) };
    for (const k in D[g]) cfg[g][k] = p === "t" ? Number($(`${p}_${k}`).value) : $(`${p}_${k}`).value.trim();
  }
  await chrome.storage.sync.set({ cfg });
  $("ok").textContent = "Salvo ✓";
  setTimeout(() => ($("ok").textContent = ""), 1500);
};
