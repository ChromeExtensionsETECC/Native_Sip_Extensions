// Roda no MAIN world (mesmo contexto da página) para observar o WebRTC do softphone.
(() => {
  if (window.__sipBoosterInjected) return;
  window.__sipBoosterInjected = true;

  const pcs = new Set();
  const Native = window.RTCPeerConnection;
  if (!Native) return;

  const emit = (type, detail) =>
    window.postMessage({ source: "sip-booster", type, detail }, "*");

  function Wrapped(...args) {
    const pc = new Native(...args);
    pcs.add(pc);
    emit("call-pc-created", {});
    pc.addEventListener("connectionstatechange", () => {
      emit("pc-state", { state: pc.connectionState });
      if (["closed", "failed", "disconnected"].includes(pc.connectionState)) {
        if (pc.connectionState === "closed") pcs.delete(pc);
      }
    });
    return pc;
  }
  Wrapped.prototype = Native.prototype;
  Object.setPrototypeOf(Wrapped, Native);
  window.RTCPeerConnection = Wrapped;

  let last = new WeakMap();

  async function sample() {
    for (const pc of pcs) {
      if (pc.connectionState === "closed") { pcs.delete(pc); continue; }
      try {
        const stats = await pc.getStats();
        let rtt = null, jitter = null, lost = 0, recv = 0, codec = null, sent = 0, muted = null;
        pc.getSenders().forEach((s) => { if (s.track && s.track.kind === "audio") muted = !s.track.enabled; });
        stats.forEach((r) => {
          if (r.type === "candidate-pair" && (r.nominated || r.state === "succeeded") && r.currentRoundTripTime != null) {
            rtt = r.currentRoundTripTime * 1000;
          }
          if (r.type === "inbound-rtp" && (r.kind || r.mediaType) === "audio") {
            jitter = r.jitter != null ? r.jitter * 1000 : jitter;
            lost = r.packetsLost || 0;
            recv = r.packetsReceived || 0;
          }
          if (r.type === "outbound-rtp" && (r.kind || r.mediaType) === "audio") sent = r.packetsSent || 0;
          if (r.type === "codec" && /audio/.test(r.mimeType || "")) codec = r.mimeType.replace("audio/", "");
        });
        const prev = last.get(pc) || { lost: 0, recv: 0 };
        const dLost = Math.max(0, lost - prev.lost);
        const dRecv = Math.max(0, recv - prev.recv);
        last.set(pc, { lost, recv });
        const lossPct = dLost + dRecv > 0 ? (dLost / (dLost + dRecv)) * 100 : 0;
        if (recv || sent || rtt != null) {
          emit("stats", {
            rtt, jitter, lossPct, codec, muted,
            state: pc.connectionState, ice: pc.iceConnectionState,
            flowing: dRecv > 0,
          });
        }
      } catch (_) {}
    }
  }
  setInterval(sample, 2000);

  // Medidor do microfone: analisa um CLONE do track enviado na chamada. O clone tem o próprio
  // "enabled", então o nível continua legível mesmo com a chamada em mudo. Nada é gravado nem enviado.
  let meter = null;
  function stopMeter() {
    if (!meter) return;
    try { meter.clone.stop(); } catch (_) {}
    try { meter.ctx.close(); } catch (_) {}
    meter = null;
  }
  function senderTrack() {
    let track = null;
    for (const pc of pcs) {
      if (pc.connectionState === "closed") continue;
      pc.getSenders().forEach((s) => {
        if (s.track && s.track.kind === "audio" && s.track.readyState === "live") track = s.track;
      });
    }
    return track;
  }
  function ensureMeter() {
    const track = senderTrack();
    if (!track) { stopMeter(); return null; }
    if (meter && meter.track === track) return meter;
    stopMeter();
    try {
      const clone = track.clone();
      clone.enabled = true;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(new MediaStream([clone])).connect(an);   // sem ligar ao destino: não toca nada
      meter = { track, clone, ctx, an, buf: new Float32Array(an.fftSize) };
    } catch (_) { meter = null; }
    return meter;
  }
  setInterval(() => {
    const m = ensureMeter();
    if (!m) return;
    if (m.ctx.state === "suspended") m.ctx.resume().catch(() => {});
    m.an.getFloatTimeDomainData(m.buf);
    let sum = 0, peak = 0;
    for (let i = 0; i < m.buf.length; i++) { const v = Math.abs(m.buf[i]); sum += v * v; if (v > peak) peak = v; }
    const db = 20 * Math.log10(Math.sqrt(sum / m.buf.length) || 1e-6);
    emit("level", { level: Math.max(0, Math.min(1, (db + 60) / 60)), peak, muted: !m.track.enabled });
  }, 100);

  // Fallback de mudo: alterna o track do microfone local.
  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.source !== "sip-booster-cmd") return;
    if (e.data.type === "toggle-mute") {
      let muted = null;
      for (const pc of pcs) {
        pc.getSenders().forEach((s) => {
          if (s.track && s.track.kind === "audio") {
            s.track.enabled = !s.track.enabled;
            muted = !s.track.enabled;
          }
        });
      }
      emit("mute-state", { muted });
    }
  });
})();
