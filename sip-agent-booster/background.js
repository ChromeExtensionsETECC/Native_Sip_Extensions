const DEFAULT_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="24" fill="#1b4b8f"/><path d="M36 40c0 30 22 52 52 52l8-14-16-8-8 8c-10-4-18-12-22-22l8-8-8-16z" fill="#fff"/></svg>');

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "notify") {
    chrome.notifications.create("sip-" + Date.now(), {
      type: "basic",
      iconUrl: DEFAULT_ICON,
      title: msg.title || "SIP Agent Booster",
      message: msg.message || "",
      priority: 2,
      requireInteraction: !!msg.sticky,
    });
  }
  if (msg.type === "badge" && sender.tab) {
    chrome.action.setBadgeText({ text: msg.text || "", tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: msg.color || "#2e7d32", tabId: sender.tab.id });
  }
});

chrome.notifications.onClicked.addListener(async (id) => {
  const tabs = await chrome.tabs.query({ url: "https://eteccnet.native-infinity.com.br/*" });
  if (tabs[0]) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.windows.update(tabs[0].windowId, { focused: true });
  }
  chrome.notifications.clear(id);
});
