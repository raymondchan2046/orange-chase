// One frame: world, cast sorted by depth, night-time darkness, weather and on-canvas HUD.
(function () {
  const OC = window.OC, D = OC.draw, G = OC.G, W = OC.WORLD.w, H = OC.WORLD.h, TAU = Math.PI * 2;
  const clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  let canvas, ctx, dark, dctx, flakes = [], lastCam = { x: 0, y: 0 };

  OC.initRender = function (cv) { canvas = cv; ctx = cv.getContext("2d"); dark = document.createElement("canvas"); dctx = dark.getContext("2d"); };

  OC.resize = function () {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(50, r.width), h = Math.max(50, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const zoom = clamp(Math.sqrt((w * h) / (840 * 560)), 0.72, 1.5);
    G.view = { w: w / zoom, h: h / zoom, zoom: zoom, cw: w, ch: h, dpr: dpr };
    dark.width = Math.ceil(canvas.width / 2); dark.height = Math.ceil(canvas.height / 2);
    flakes = [];
    for (let i = 0; i < 38; i++) flakes.push({ x: Math.random() * w, y: Math.random() * h, s: 0.6 + Math.random() * 0.8, ph: Math.random() * 6, c: i % 3 });
  };

  function light(x, y, rad, a) {
    const k = G.view.zoom * G.view.dpr / 2, sx = (x - G.cam.x) * k, sy = (y - G.cam.y) * k, r = rad * k;
    if (sx < -r || sy < -r || sx > dark.width + r || sy > dark.height + r) return;
    const g = dctx.createRadialGradient(sx, sy, r * 0.15, sx, sy, r);
    g.addColorStop(0, "rgba(0,0,0," + a + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
    dctx.fillStyle = g; dctx.beginPath(); dctx.arc(sx, sy, r, 0, TAU); dctx.fill();
  }

  function weather(dt, L, v) {
    if (L.weather === "none") return;
    const dx = (G.cam.x - lastCam.x) * v.zoom, dy = (G.cam.y - lastCam.y) * v.zoom, t = G.clock;
    const snow = L.weather === "snow", leaf = L.weather === "leaves";
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.x += (snow ? 12 : leaf ? 55 : 26) * f.s * dt + Math.sin(t * 1.6 + f.ph) * 22 * dt - dx;
      f.y += (snow ? 60 : leaf ? 46 : 22) * f.s * dt - dy;
      if (f.x > v.cw + 12) f.x -= v.cw + 24; else if (f.x < -12) f.x += v.cw + 24;
      if (f.y > v.ch + 12) f.y -= v.ch + 24; else if (f.y < -12) f.y += v.ch + 24;
      if (snow) { ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.arc(f.x, f.y, 2.2 * f.s, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = leaf ? L.pal.decor[f.c] : ["#ffd1e1", "#ffffff", "#ffe8a3"][f.c]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(f.x, f.y, (leaf ? 7 : 4.5) * f.s, (leaf ? 3.4 : 2.6) * f.s, t * (leaf ? 2.2 : 1.2) + f.ph, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
  }

  function pill(x, y, w, h, frac, label, col, ready) {
    ctx.fillStyle = "rgba(10,14,8,.55)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    if (frac > 0.02) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, Math.max(h - 4, (w - 4) * frac), h - 4, (h - 4) / 2); ctx.fill(); }
    ctx.font = "12px " + D.FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = ready ? "#2a1300" : "#fff"; ctx.fillText(label, x + w / 2, y + h / 2 + 1); ctx.textBaseline = "alphabetic";
  }

  function hud(v) {
    const p = G.player, t = G.clock;
    // where is it? arrows at the screen edge for any orange out of view
    G.oranges.forEach(function (o) {
      const sx = (o.x - G.cam.x) * v.zoom, sy = (o.y - o.r - G.cam.y) * v.zoom, m = o.r * v.zoom * 0.6;
      if (sx > -m && sx < v.cw + m && sy > -m && sy < v.ch + m) return;
      const ix = clamp(sx, 36, v.cw - 36), iy = clamp(sy, 44, v.ch - 36), a = Math.atan2(sy - iy, sx - ix);
      const d = Math.hypot(o.x - p.x, o.y - p.y), s = (o.baby ? 0.7 : 1) * (1 + clamp(1 - d / 900, 0, 1) * 0.5 + Math.sin(t * 8) * 0.06);
      ctx.save(); ctx.translate(ix, iy); ctx.scale(s, s);
      ctx.fillStyle = "#ff3b30"; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 27, Math.sin(a) * 27); ctx.lineTo(Math.cos(a + 0.5) * 17, Math.sin(a + 0.5) * 17); ctx.lineTo(Math.cos(a - 0.5) * 17, Math.sin(a - 0.5) * 17); ctx.fill();
      ctx.fillStyle = "#ff8f1f"; ctx.strokeStyle = "#4a1c00"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4d0810"; ctx.beginPath(); ctx.ellipse(0, 4, 9, 5.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); for (let i = -2; i < 2; i++) { ctx.moveTo(i * 4.2, 0.5); ctx.lineTo(i * 4.2 + 2.1, 5); ctx.lineTo(i * 4.2 + 4.2, 0.5); } ctx.fill();
      ctx.fillStyle = "#1a0d00"; ctx.beginPath(); ctx.arc(-5, -5, 2, 0, TAU); ctx.arc(5, -5, 2, 0, TAU); ctx.fill();
      ctx.restore();
    });
    if (G.mode === "play" || G.mode === "countdown" || G.mode === "paused") {
      const ready = p.dashCd <= 0, y = v.ch - 38;
      pill(14, y, 112, 24, ready ? 1 : 1 - p.dashCd / 2.4, ready ? "DASH READY" : "DASH", ready ? "#ffb21f" : "#a8641a", ready);
      if (p.boostT > 0) pill(14, y - 30, 112, 24, p.boostT / 5, "ZOOM", "#2f7bf5", false);
    }
    if (G.mode === "play" && p.scared > 0.3) {
      const g = ctx.createRadialGradient(v.cw / 2, v.ch / 2, Math.min(v.cw, v.ch) * 0.35, v.cw / 2, v.ch / 2, Math.max(v.cw, v.ch) * 0.75);
      g.addColorStop(0, "rgba(255,30,20,0)"); g.addColorStop(1, "rgba(255,30,20," + (p.scared - 0.3) * 0.5 + ")"); ctx.fillStyle = g; ctx.fillRect(0, 0, v.cw, v.ch);
    }
    if (G.mode === "countdown") {
      const n = Math.ceil(G.count), k = G.count - Math.floor(G.count), big = Math.min(v.cw, v.ch);
      ctx.textAlign = "center"; ctx.lineJoin = "round";
      ctx.font = Math.round(big * 0.05 + 12) + "px " + D.FONT; ctx.lineWidth = 6; ctx.strokeStyle = "rgba(20,12,0,.85)"; ctx.fillStyle = "#fff";
      const title = G.level.name + "  ·  " + G.level.diff; ctx.strokeText(title, v.cw / 2, v.ch * 0.2); ctx.fillText(title, v.cw / 2, v.ch * 0.2);
      if (n <= 3 && n > 0) { ctx.font = Math.round(big * 0.26 * (0.8 + k * 0.4)) + "px " + D.FONT; ctx.lineWidth = 10; ctx.fillStyle = "#ffd23f"; ctx.strokeText(n, v.cw / 2, v.ch * 0.42); ctx.fillText(n, v.cw / 2, v.ch * 0.42); }
    }
    const j = G.joy;
    if (j && j.on && G.mode === "play") {
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3; ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.arc(j.ox, j.oy, 46, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(j.ox + G.input.x * 46, j.oy + G.input.y * 46, 18, 0, TAU); ctx.fill();
    }
  }

  OC.render = function (dt) {
    const v = G.view, L = G.level, t = G.clock, p = G.player, k = v.dpr * v.zoom;
    const still = OC.reducedMotion ? 0 : 1;
    const shx = (Math.random() - 0.5) * G.shake * still, shy = (Math.random() - 0.5) * G.shake * still;
    const world = function () { ctx.setTransform(k, 0, 0, k, (-G.cam.x + shx) * k, (-G.cam.y + shy) * k); };
    world();
    const vr = { x: G.cam.x - 12, y: G.cam.y - 12, w: v.w + 24, h: v.h + 24 };
    D.ground(ctx, G.world, L, vr, t);

    const items = [];
    const actors = G.oranges.concat([p]);
    G.world.obstacles.forEach(function (o) {
      if (o.x < vr.x - 80 || o.x > vr.x + vr.w + 80 || o.y < vr.y - 10 || o.y > vr.y + vr.h + 150) return;
      let fade = 1;
      if (o.type === "tree" || o.type === "pine") for (let i = 0; i < actors.length; i++) { const a = actors[i]; if (a.y < o.y && a.y > o.y - 125 * o.s && Math.abs(a.x - o.x) < 50 * o.s + (a.r || 0) * 0.5) fade = 0.25; }
      items.push({ y: o.y, f: function () { D.obstacle(ctx, o, L, t, fade); } });
    });
    G.pickups.forEach(function (q) { items.push({ y: q.y, f: function () { D.pickup(ctx, q, t); } }); });
    G.oranges.forEach(function (o) { items.push({ y: o.y, f: function () { D.orange(ctx, o, t); } }); });
    items.push({ y: p.y, f: function () { D.stick(ctx, p, L.pal, t); } });
    items.sort(function (a, b) { return a.y - b.y; });
    for (let i = 0; i < items.length; i++) items[i].f();
    D.particles(ctx, G.parts);

    if (L.dark) {
      dctx.setTransform(1, 0, 0, 1, 0, 0); dctx.globalCompositeOperation = "source-over"; dctx.clearRect(0, 0, dark.width, dark.height);
      dctx.fillStyle = "rgba(5,8,30,.9)"; dctx.fillRect(0, 0, dark.width, dark.height);
      dctx.globalCompositeOperation = "destination-out";
      light(p.x, p.y - 24, 270, 1);
      G.world.lamps.forEach(function (l) { light(l.x, l.y - 50, l.light * (0.97 + Math.sin(t * 9 + l.x) * 0.03), 0.95); });
      G.pickups.forEach(function (q) { light(q.x, q.y - 18, 70, 0.8); });
      G.oranges.forEach(function (o) { light(o.x, o.y - o.r, o.r * 1.5, 0.3); });
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0, canvas.width, canvas.height);
      world();
      G.oranges.forEach(function (o) { D.orangeEyes(ctx, o); });
      G.world.decor.forEach(function (d, i) {
        if (i % 4 || d.x < vr.x || d.x > vr.x + vr.w || d.y < vr.y || d.y > vr.y + vr.h) return;
        const a = 0.5 + 0.5 * Math.sin(t * 2.2 + d.ph * 3); ctx.fillStyle = "rgba(230,255,140," + a * 0.9 + ")";
        ctx.beginPath(); ctx.arc(d.x + Math.sin(t * 0.8 + d.ph) * 16, d.y - 20 + Math.cos(t * 0.7 + d.a) * 12, 2.2, 0, TAU); ctx.fill();
      });
      D.particles(ctx, G.parts.filter(function (q) { return q.type === "text"; }));
    }

    ctx.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    weather(dt, L, v);
    lastCam.x = G.cam.x; lastCam.y = G.cam.y;
    hud(v);
  };
})();
