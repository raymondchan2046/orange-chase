// Menus, controls, saved best scores and the main loop.
(function () {
  const OC = window.OC, G = OC.G, A = OC.audio;
  const $ = function (id) { return document.getElementById(id); };
  const fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  const store = { best: {}, won: {}, muted: false };
  try { Object.assign(store, JSON.parse(localStorage.getItem("orange-chase-v1") || "{}")); } catch (e) {}
  const save = function () { try { localStorage.setItem("orange-chase-v1", JSON.stringify(store)); } catch (e) {} };
  let touch = false;
  try { OC.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches; touch = matchMedia("(pointer: coarse)").matches; } catch (e) {}

  const canvas = $("game"), keys = {};
  G.joy = { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
  let resumeMode = "play";

  // keep the screen awake during a round, where the browser allows it
  let wake = null;
  function stayAwake(on) {
    try {
      if (on && !wake && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wake = w; w.addEventListener("release", function () { wake = null; }); }).catch(function () {});
      else if (!on && wake) { wake.release().catch(function () {}); wake = null; }
    } catch (e) {}
  }

  function buildMenu() {
    const box = $("levels"); box.textContent = "";
    OC.LEVELS.forEach(function (L, i) {
      const b = document.createElement("button"); b.className = "lvl"; b.id = "lvl-" + L.id;
      const c = document.createElement("canvas"); c.width = c.height = 128; OC.draw.thumb(c, L);
      const d = document.createElement("div");
      const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = L.name + " ";
      const df = document.createElement("span"); df.className = "df"; df.textContent = L.diff; nm.appendChild(df);
      const bl = document.createElement("div"); bl.className = "bl"; bl.textContent = L.blurb;
      const bs = document.createElement("div"); bs.className = "bs" + (store.won[L.id] ? " done" : "");
      bs.textContent = store.best[L.id] ? "Best " + fmt(store.best[L.id]) + (store.won[L.id] ? "  ·  Survived" : "  ·  Not survived yet") : "Not played yet";
      d.appendChild(nm); d.appendChild(bl); d.appendChild(bs); b.appendChild(c); b.appendChild(d);
      b.addEventListener("click", function () { start(i); });
      const peek = function () { if (G.mode === "menu" && G.levelIdx !== i) OC.setup(i, true); };
      b.addEventListener("pointerenter", peek); b.addEventListener("focus", peek);
      box.appendChild(b);
    });
  }

  function playing(on) {
    $("hud").hidden = !on; $("btnPause").hidden = !on; $("timebar").hidden = !on; $("btnDash").hidden = !(on && touch);
    $("brand").classList.toggle("playing", on);
  }

  function start(i) {
    A.unlock(); A.setMuted(store.muted); A.stopMusic(); A.play("click");
    stayAwake(true);
    OC.setup(i, false); G.mode = "countdown"; G.count = 3.7; G.input.x = G.input.y = 0;
    $("menu").hidden = true; $("end").hidden = true; $("pause").hidden = true; playing(true);
    $("hudBest").textContent = fmt(store.best[G.level.id] || 0);
    canvas.focus && canvas.focus();
  }
  OC.start = start;

  function toMenu() {
    stayAwake(false);
    A.stopMusic(); OC.setup(G.levelIdx || 0, true); G.mode = "menu";
    $("end").hidden = true; $("pause").hidden = true; $("menu").hidden = false; playing(false); buildMenu();
  }

  function pause(on) {
    if (on && (G.mode === "play" || G.mode === "countdown")) { resumeMode = G.mode; G.mode = "paused"; A.stopMusic(); $("pause").hidden = false; $("btnResume").focus(); }
    else if (!on && G.mode === "paused") { stayAwake(true); G.mode = resumeMode; $("pause").hidden = true; if (resumeMode === "play") A.startMusic(G.level.music); }
  }

  OC.onEnd = function (won) {
    const L = G.level, s = G.sc, total = OC.total(), old = store.best[L.id] || 0, isBest = total > old;
    stayAwake(false);
    if (isBest) store.best[L.id] = total;
    if (won) store.won[L.id] = true;
    save();
    const t = $("endTitle"); t.textContent = won ? "You made it!" : "Chomped!"; t.className = won ? "win" : "lose";
    $("endSub").textContent = won
      ? "Sixty seconds in " + L.name + " and not a single tooth mark."
      : "The orange caught you after " + G.t.toFixed(1) + " seconds. Only " + (OC.ROUND - G.t).toFixed(1) + " more to go.";
    const rows = [["Survived " + G.t.toFixed(1) + " s", s.survive], ["Stars × " + s.starCount, s.stars], ["Close calls × " + s.closeCount, s.close]];
    if (won) rows.push(["Survival bonus", s.bonus]);
    const box = $("endRows"); box.textContent = "";
    rows.concat([["Score", total]]).forEach(function (r, i) {
      const d = document.createElement("div"); if (i === rows.length) d.className = "total";
      const a = document.createElement("span"), b = document.createElement("span"); a.textContent = r[0]; b.textContent = fmt(Math.floor(r[1])); d.appendChild(a); d.appendChild(b); box.appendChild(d);
    });
    $("endRecord").hidden = !isBest; $("endRecord").textContent = "New best for " + L.name + (old ? " (was " + fmt(old) + ")" : "");
    const next = won && G.levelIdx < OC.LEVELS.length - 1;
    $("btnNext").hidden = !next; $("btnRetry").classList.toggle("alt", next);
    $("btnRetry").textContent = won ? "Run again" : "Try again";
    $("hudBest").textContent = fmt(store.best[L.id] || 0);
    $("btnPause").hidden = true; $("btnDash").hidden = true; $("end").hidden = false;
    (next ? $("btnNext") : $("btnRetry")).focus();
  };

  // ---- controls ---------------------------------------------------------------------------
  const MOVE = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, Space: 1 };
  window.addEventListener("keydown", function (e) {
    const inGame = G.mode === "play" || G.mode === "countdown";
    if (inGame && MOVE[e.code]) e.preventDefault();
    if (e.repeat) return;
    keys[e.code] = true;
    if (inGame && (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight")) G.input.dash = true;
    if (e.code === "KeyP" || e.code === "Escape") pause(G.mode !== "paused");
  });
  window.addEventListener("keyup", function (e) { keys[e.code] = false; });
  window.addEventListener("blur", function () { for (const k in keys) keys[k] = false; G.joy.on = false; });
  document.addEventListener("visibilitychange", function () { if (document.hidden) pause(true); });

  canvas.addEventListener("pointerdown", function (e) {
    if (G.mode !== "play" && G.mode !== "countdown") return;
    const r = canvas.getBoundingClientRect(), j = G.joy;
    if (j.on && e.pointerId !== j.id) { G.input.dash = true; return; }
    j.on = true; j.id = e.pointerId; j.ox = e.clientX - r.left; j.oy = e.clientY - r.top; j.x = j.y = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    const j = G.joy; if (!j.on || e.pointerId !== j.id) return;
    const r = canvas.getBoundingClientRect(); let dx = e.clientX - r.left - j.ox, dy = e.clientY - r.top - j.oy; const l = Math.hypot(dx, dy);
    if (l > 46) { j.ox += dx * (1 - 46 / l); j.oy += dy * (1 - 46 / l); dx *= 46 / l; dy *= 46 / l; }
    j.x = l < 8 ? 0 : dx / 46; j.y = l < 8 ? 0 : dy / 46;
  });
  const lift = function (e) { if (e.pointerId === G.joy.id) { G.joy.on = false; G.joy.x = G.joy.y = 0; } };
  canvas.addEventListener("pointerup", lift); canvas.addEventListener("pointercancel", lift);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  $("btnDash").addEventListener("pointerdown", function (e) { e.preventDefault(); if (G.mode === "play") G.input.dash = true; });

  function readInput() {
    if (G.mode === "menu") return;
    const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    const ky = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
    if (kx || ky) { G.input.x = kx; G.input.y = ky; } else { G.input.x = G.joy.on ? G.joy.x : 0; G.input.y = G.joy.on ? G.joy.y : 0; }
  }

  // ---- buttons ----------------------------------------------------------------------------
  const sound = function () { const b = $("btnSound"); b.textContent = store.muted ? "Sound: off" : "Sound: on"; b.setAttribute("aria-pressed", String(!store.muted)); };
  $("btnSound").addEventListener("click", function () { store.muted = !store.muted; A.unlock(); A.setMuted(store.muted); save(); sound(); A.play("click"); });
  $("btnPause").addEventListener("click", function () { pause(G.mode !== "paused"); });
  $("btnResume").addEventListener("click", function () { pause(false); });
  $("btnQuit").addEventListener("click", toMenu);
  $("btnMenu").addEventListener("click", toMenu);
  $("btnRetry").addEventListener("click", function () { start(G.levelIdx); });
  $("btnNext").addEventListener("click", function () { start(Math.min(OC.LEVELS.length - 1, G.levelIdx + 1)); });

  // ---- loop -------------------------------------------------------------------------------
  let last = 0, shown = "";
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (G.mode !== "paused") { readInput(); const n = dt > 0.02 ? 2 : 1; for (let i = 0; i < n; i++) OC.update(dt / n); }
    OC.render(G.mode === "paused" ? 0 : dt);
    if (G.mode !== "menu") {
      const left = Math.max(0, OC.ROUND - G.t), txt = left.toFixed(1) + "|" + OC.total();
      if (txt !== shown) {
        shown = txt; $("hudTime").textContent = left.toFixed(1); $("hudScore").textContent = fmt(OC.total());
        $("timeFill").style.width = (G.t / OC.ROUND * 100).toFixed(2) + "%"; $("chipTime").classList.toggle("hot", left <= 10 && G.mode === "play");
      }
      $("btnDash").disabled = G.player.dashCd > 0;
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    OC.initRender(canvas); OC.resize();
    if (window.ResizeObserver) new ResizeObserver(function () { OC.resize(); }).observe($("stage")); else window.addEventListener("resize", OC.resize);
    A.setMuted(store.muted); sound();
    OC.setup(0, true); G.mode = "menu"; buildMenu(); playing(false);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildMenu).catch(function () {});
    requestAnimationFrame(function (t) { last = t; frame(t); });
  }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(boot); else boot();
})();
