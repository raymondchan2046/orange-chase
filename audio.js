// Sound: every effect and the music are synthesised with WebAudio, so there are no files to load.
(function () {
  const OC = (window.OC = window.OC || {});
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let muted = false, music = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.45; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume().catch(function () {});
    return ctx;
  }

  function tone(f, dur, o) {
    if (!ctx) return;
    o = o || {};
    const t0 = o.time != null ? o.time : ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || "square";
    osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const v = Math.max(0.0002, o.vol == null ? 0.2 : o.vol);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.04);
  }

  function noise(dur, o) {
    if (!ctx) return;
    o = o || {};
    const t0 = o.time != null ? o.time : ctx.currentTime + (o.at || 0);
    const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true;
    flt.type = o.kind || "bandpass"; flt.Q.value = o.q || 1;
    flt.frequency.setValueAtTime(o.from || o.freq || 1200, t0);
    if (o.to) flt.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const v = Math.max(0.0002, o.vol == null ? 0.25 : o.vol);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(flt); flt.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.04);
  }

  const seq = function (notes, step, o) {
    const base = o.at || 0;
    notes.forEach(function (n, i) { tone(n, o.dur || step * 1.6, Object.assign({}, o, { at: base + i * step })); });
  };

  const sfx = {
    click: function () { tone(700, 0.06, { type: "triangle", vol: 0.16 }); },
    count: function () { tone(440, 0.14, { type: "square", vol: 0.16 }); },
    go: function () { tone(880, 0.4, { type: "square", vol: 0.16 }); tone(1320, 0.4, { type: "triangle", vol: 0.14 }); },
    star: function (n) { const b = 880 * Math.pow(1.06, Math.min(n || 0, 8)); tone(b, 0.08, { type: "triangle", vol: 0.22 }); tone(b * 1.5, 0.16, { type: "triangle", vol: 0.2, at: 0.07 }); },
    power: function () { seq([523, 659, 784, 1047], 0.06, { type: "square", vol: 0.14, dur: 0.12 }); },
    dash: function () { noise(0.2, { from: 2600, to: 500, vol: 0.3, q: 0.8 }); },
    chomp: function (v) { noise(0.05, { freq: 1900, vol: 0.34 * v, q: 2 }); tone(150, 0.08, { type: "square", to: 70, vol: 0.2 * v }); },
    warn: function () { tone(280, 0.5, { type: "sawtooth", to: 950, vol: 0.11 }); },
    lunge: function () { noise(0.4, { from: 500, to: 3200, vol: 0.3, q: 0.7 }); tone(240, 0.35, { type: "sawtooth", to: 70, vol: 0.16 }); },
    near: function () { tone(1200, 0.1, { type: "triangle", to: 1900, vol: 0.2 }); tone(1900, 0.14, { type: "triangle", vol: 0.16, at: 0.1 }); },
    shield: function () { tone(320, 0.35, { type: "sine", to: 1300, vol: 0.25 }); noise(0.25, { from: 3000, to: 800, vol: 0.18 }); },
    freeze: function () { seq([2093, 2637, 3136, 4186], 0.05, { type: "sine", vol: 0.14, dur: 0.25 }); },
    thaw: function () { noise(0.2, { from: 900, to: 3500, vol: 0.16 }); },
    bonk: function () { noise(0.16, { freq: 420, vol: 0.5, q: 0.7 }); tone(190, 0.28, { type: "square", to: 55, vol: 0.24 }); tone(880, 0.3, { type: "sine", to: 620, vol: 0.1, at: 0.12 }); },
    pop: function () { tone(420, 0.14, { type: "square", to: 1100, vol: 0.2 }); },
    bite: function () {
      noise(0.28, { freq: 900, vol: 0.5, q: 0.6 });
      tone(230, 0.5, { type: "sawtooth", to: 50, vol: 0.25 });
      seq([392, 330, 262, 196], 0.17, { type: "triangle", vol: 0.2, dur: 0.3, at: 0.4 });
    },
    win: function () { seq([523, 659, 784, 1047, 784, 1047, 1319], 0.11, { type: "square", vol: 0.15, dur: 0.24 }); seq([262, 330, 392, 523], 0.22, { type: "triangle", vol: 0.16, dur: 0.4 }); },
  };
  // ---- music: a tiny step sequencer, 32 sixteenth-notes per loop -------------------------
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
  function freq(def, deg, oct) {
    const sc = SCALES[def.scale], n = sc.length;
    const k = ((deg % n) + n) % n, o = Math.floor(deg / n);
    return 440 * Math.pow(2, (def.root + sc[k] + 12 * (o + (oct || 0)) - 69) / 12);
  }
  function playStep(s, t, spb) {
    const d = music.def, hot = music.intensity;
    const lead = d.lead[s];
    if (lead != null) tone(freq(d, lead, 1), spb * 1.7, { type: d.wave, vol: 0.11, time: t, bus: musicBus });
    if (s % 2 === 0) { const b = d.bass[s / 2]; if (b != null) tone(freq(d, b, -1), spb * 1.8, { type: "triangle", vol: 0.22, time: t, bus: musicBus }); }
    if (s % 8 === 0) tone(120, 0.12, { type: "sine", to: 45, vol: 0.35, time: t, bus: musicBus });
    if (s % 8 === 4) noise(0.07, { freq: 2200, vol: 0.12, q: 0.8, time: t, bus: musicBus });
    if (s % 4 === 2 || (hot > 0.5 && s % 2 === 1)) noise(0.025, { freq: 7000, kind: "highpass", vol: 0.06, time: t, bus: musicBus });
  }
  function tick() {
    if (!music || !ctx || ctx.state !== "running") return;
    if (music.next < ctx.currentTime - 0.1) music.next = ctx.currentTime + 0.05;
    const spb = 60 / (music.def.bpm * (1 + 0.22 * music.intensity)) / 4;
    while (music.next < ctx.currentTime + 0.2) {
      playStep(music.step, music.next, spb);
      music.step = (music.step + 1) % 32;
      music.next += spb;
    }
  }
  function startMusic(def) {
    stopMusic();
    if (!ensure()) return;
    music = { def: def, step: 0, next: ctx.currentTime + 0.08, intensity: 0 };
    music.timer = setInterval(tick, 50);
  }
  function stopMusic() { if (music) { clearInterval(music.timer); music = null; } }

  OC.audio = {
    unlock: ensure, sfx: sfx, startMusic: startMusic, stopMusic: stopMusic,
    setIntensity: function (x) { if (music) music.intensity = Math.max(0, Math.min(1, x)); },
    setMuted: function (m) { muted = m; if (master) master.gain.value = m ? 0 : 1; },
    isMuted: function () { return muted; },
    play: function (name, a) { if (ctx && !muted && sfx[name]) sfx[name](a); },
  };
})();
