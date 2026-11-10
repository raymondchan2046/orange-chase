// Drawing the cast: the fanged orange, the stickman, pickups and particles.
(function () {
  const OC = (window.OC = window.OC || {});
  const D = (OC.draw = OC.draw || {});
  const TAU = Math.PI * 2;
  const FONT = '"Titan One","Arial Rounded MT Bold","Trebuchet MS",sans-serif';
  D.FONT = FONT;

  function starPath(ctx, x, y, R, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, d = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    ctx.closePath();
  }

  D.orange = function (ctx, o, t) {
    const r = o.r, sp = Math.min(1, Math.hypot(o.vx, o.vy) / 120);
    const hop = o.state === "frozen" ? 0 : Math.abs(Math.sin(o.hop)) * r * 0.16 * sp;
    let sx = 1, sy = 1, ox = 0;
    const angry = o.state === "windup" || o.state === "lunge";
    if (o.state === "windup") { const k = Math.min(1, o.stT / o.windup); sx = 1 + 0.18 * k; sy = 1 - 0.18 * k; ox = Math.sin(t * 70) * 3.5 * k; }
    else if (o.state === "lunge") { sx = 1.1; sy = 0.92; }
    else { const q = Math.sin(o.hop * 2) * 0.045 * sp; sx = 1 + q; sy = 1 - q; }
    o._cy = o.y - hop - r * 0.95 * sy;
    D.shadow(ctx, o.x, o.y, r * 0.86, r * 0.27, 0.26);

    if (o.state === "lunge") {
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 4; ctx.lineCap = "round";
      for (let i = -1; i <= 1; i++) { const px = -o.dir.y * i * r * 0.55, py = o.dir.x * i * r * 0.55; ctx.beginPath(); ctx.moveTo(o.x + px - o.dir.x * r * 1.1, o._cy + py - o.dir.y * r * 1.1); ctx.lineTo(o.x + px - o.dir.x * r * (1.9 + (i ? 0 : 0.5)), o._cy + py - o.dir.y * r * (1.9 + (i ? 0 : 0.5))); ctx.stroke(); }
    }

    ctx.save(); ctx.translate(o.x + ox, o.y - hop); ctx.scale(sx, sy); ctx.translate(0, -r * 0.95);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.08, 0, 0, r);
    g.addColorStop(0, angry ? "#ffb48a" : "#ffd27f"); g.addColorStop(0.55, angry ? "#ff641a" : "#ff8f1f"); g.addColorStop(1, angry ? "#cf3a00" : "#de6200");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.lineWidth = Math.max(2.5, r * 0.07); ctx.strokeStyle = "#8a3a00"; ctx.stroke();

    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r * 0.93, 0, TAU); ctx.clip(); ctx.rotate(o.roll); ctx.fillStyle = "rgba(150,62,0,.3)";
    for (let i = 0; i < 16; i++) { const a = i * 2.4, d = r * (0.3 + ((i * 37) % 62) / 100); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.032, 0, TAU); ctx.fill(); }
    ctx.restore();

    ctx.save(); ctx.translate(0, -r * 0.96); ctx.rotate(Math.sin(o.hop) * 0.16 * sp);
    ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = r * 0.1; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, r * 0.05); ctx.lineTo(r * 0.03, -r * 0.16); ctx.stroke();
    ctx.fillStyle = "#46ad54"; ctx.strokeStyle = "#1f6b2c"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(r * 0.03, -r * 0.1); ctx.quadraticCurveTo(r * 0.3, -r * 0.46, r * 0.62, -r * 0.16); ctx.quadraticCurveTo(r * 0.3, 0, r * 0.03, -r * 0.1); ctx.fill(); ctx.stroke();
    ctx.restore();

    const fx = o.look.x * r * 0.2, fy = o.look.y * r * 0.1;
    const ey = fy - r * 0.3, ex = r * 0.33;
    o._eyes = [o.x + ox + (fx - ex) * sx, o.x + ox + (fx + ex) * sx, o._cy + ey * sy];
    for (let k = -1; k <= 1; k += 2) {
      const cx = fx + k * ex;
      if (o.happy) { ctx.strokeStyle = "#4a1c00"; ctx.lineWidth = r * 0.08; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(cx, ey + r * 0.06, r * 0.15, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); continue; }
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#4a1c00"; ctx.lineWidth = Math.max(1.5, r * 0.045);
      ctx.beginPath(); ctx.ellipse(cx, ey, r * 0.2, r * 0.24, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (o.state === "recover" || o.state === "stunned") {
        ctx.strokeStyle = "#4a1c00"; ctx.lineWidth = r * 0.05; ctx.beginPath();
        for (let a = 0; a < 9; a += 0.4) { const d = a * r * 0.018; ctx.lineTo(cx + Math.cos(a + t * 8) * d, ey + Math.sin(a + t * 8) * d); }
        ctx.stroke();
      } else {
        const pr = o.state === "frozen" ? r * 0.05 : r * 0.1;
        ctx.fillStyle = angry ? "#c40018" : "#1a0d00"; ctx.beginPath(); ctx.arc(cx + o.look.x * r * 0.08, ey + o.look.y * r * 0.09 + r * 0.03, pr, 0, TAU); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + o.look.x * r * 0.08 - pr * 0.3, ey + o.look.y * r * 0.09, pr * 0.3, 0, TAU); ctx.fill();
      }
      if (o.state !== "frozen") { ctx.strokeStyle = "#4a1c00"; ctx.lineWidth = r * 0.1; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx + k * r * 0.25, ey - r * 0.36); ctx.lineTo(cx - k * r * 0.17, ey - r * (angry ? 0.1 : 0.15)); ctx.stroke(); }
    }

    // the mouth: a wide grin full of sharp, interlocking teeth
    const open = o.mouth, mw = r * 0.64, cTop = -r * (0.1 + 0.1 * open), cBot = r * (0.34 + 0.72 * open);
    ctx.save(); ctx.translate(fx, fy + r * 0.26);
    const lips = function () { ctx.beginPath(); ctx.moveTo(-mw, 0); ctx.quadraticCurveTo(0, cTop, mw, 0); ctx.quadraticCurveTo(0, cBot, -mw, 0); ctx.closePath(); };
    const yOn = function (u, c) { const q = (u / mw + 1) / 2; return 2 * q * (1 - q) * c; };
    lips(); ctx.fillStyle = "#4d0810"; ctx.fill();
    ctx.save(); lips(); ctx.clip(); ctx.fillStyle = "#e24a5e"; ctx.beginPath(); ctx.ellipse(0, cBot * 0.46, mw * 0.5, cBot * 0.2, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = "#fffdf0"; ctx.strokeStyle = "#b9b08f"; ctx.lineWidth = 1; ctx.lineJoin = "round";
    const row = function (n, cA, cB, dir, off) {
      const w = (mw * 1.84) / n;
      for (let i = 0; i < n; i++) {
        const a = -mw * 0.92 + off + i * w, b = a + w, m = (a + b) / 2;
        if (b > mw * 0.97) break;
        const gap = Math.abs(yOn(m, cB) - yOn(m, cA)), len = Math.min(r * 0.2, gap * 0.62);
        ctx.beginPath(); ctx.moveTo(a, yOn(a, cA)); ctx.lineTo(m, yOn(m, cA) + dir * len); ctx.lineTo(b, yOn(b, cA)); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    };
    row(7, cTop, cBot, 1, 0); row(7, cBot, cTop, -1, mw * 0.13);
    lips(); ctx.strokeStyle = "#4a1c00"; ctx.lineWidth = Math.max(2, r * 0.055); ctx.stroke();
    ctx.restore();

    if (o.state === "frozen") {
      ctx.fillStyle = "rgba(170,228,255,.5)"; ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-r * 1.12, -r * 1.2, r * 2.24, r * 2.3, r * 0.22); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.85, -r * 0.5); ctx.lineTo(-r * 0.5, -r * 0.95); ctx.moveTo(-r * 0.9, -r * 0.1); ctx.lineTo(-r * 0.25, -r * 0.98); ctx.stroke();
    }
    if (o.state === "recover" || o.state === "stunned") {
      ctx.fillStyle = "#ffe14d"; ctx.strokeStyle = "#9a6b00"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.09; starPath(ctx, Math.cos(a) * r * 0.7, -r * 1.25 + Math.sin(a) * r * 0.16, r * 0.14, r * 0.06, a); ctx.fill(); ctx.stroke(); }
    }
    ctx.restore();
  };

  // red eyes that still show in the dark
  D.orangeEyes = function (ctx, o) {
    if (!o._eyes || o.state === "frozen" || o.happy) return;
    for (let i = 0; i < 2; i++) {
      const g = ctx.createRadialGradient(o._eyes[i], o._eyes[2], 1, o._eyes[i], o._eyes[2], o.r * 0.42);
      g.addColorStop(0, "rgba(255,60,40,.95)"); g.addColorStop(0.3, "rgba(255,60,40,.5)"); g.addColorStop(1, "rgba(255,60,40,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o._eyes[i], o._eyes[2], o.r * 0.42, 0, TAU); ctx.fill();
    }
  };

  D.stick = function (ctx, p, pal, t) {
    if (p.dead) return;
    const mv = p.moveAmt, ph = p.run;
    D.shadow(ctx, p.x, p.y, 13, 4.5, 0.26);
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.invuln > 0 && Math.floor(t * 18) % 2) ctx.globalAlpha = 0.4;
    const bob = mv > 0.1 ? Math.abs(Math.sin(ph)) * 2.4 : Math.sin(t * 3) * 0.5;
    ctx.translate(0, -bob); ctx.scale(p.face, 1);
    const lean = p.dashT > 0 ? 0.55 : 0.2 * mv;
    const hip = [0, -17], up = function (L) { return [hip[0] + L * Math.sin(lean), hip[1] - L * Math.cos(lean)]; };
    const neck = up(15), sh = up(12.5), head = up(23.5);
    const seg = function (from, ang, L) { return [from[0] + L * Math.sin(ang), from[1] + L * Math.cos(ang)]; };
    const limbs = [];
    for (let k = -1; k <= 1; k += 2) {
      const a1 = k * 0.24 * (1 - mv) + Math.sin(ph) * k * 0.95 * mv;
      const knee = seg(hip, a1, 9), a2 = a1 - (0.25 + 0.8 * Math.max(0, Math.sin(ph + 1.2) * k)) * mv;
      limbs.push([hip, knee, seg(knee, a2, 8.5)]);
      let b1, b2;
      if (p.scared > 0.55) { b1 = Math.PI - k * 0.55 + Math.sin(t * 26 + k) * 0.35; b2 = b1 + k * 0.3; }
      else { b1 = k * 0.3 * (1 - mv) - Math.sin(ph) * k * 1.05 * mv; b2 = b1 + 0.95 * mv; }
      const elbow = seg(sh, b1, 7);
      limbs.push([sh, elbow, seg(elbow, b2, 7)]);
    }
    const body = function () {
      ctx.beginPath();
      limbs.forEach(function (l) { ctx.moveTo(l[0][0], l[0][1]); ctx.lineTo(l[1][0], l[1][1]); ctx.lineTo(l[2][0], l[2][1]); });
      ctx.moveTo(hip[0], hip[1]); ctx.lineTo(neck[0], neck[1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(head[0], head[1], 7.5, 0, TAU);
    };
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = pal.stickEdge; ctx.fillStyle = pal.stickEdge; ctx.lineWidth = 8; body(); ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
    // scarf trailing behind
    ctx.strokeStyle = pal.scarf; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(neck[0] + 2, neck[1] + 1);
    ctx.quadraticCurveTo(neck[0] - 8 - 6 * mv, neck[1] + Math.sin(t * 13) * 3, neck[0] - 15 - 12 * mv, neck[1] + 3 + Math.sin(t * 13 + 1.3) * 4 * (0.4 + mv)); ctx.stroke();
    ctx.strokeStyle = pal.stick; ctx.fillStyle = pal.stick; ctx.lineWidth = 4.2; body(); ctx.fill();
    ctx.fillStyle = pal.stickEdge;
    ctx.beginPath(); ctx.arc(head[0] + 1.5, head[1] - 1, 1.5, 0, TAU); ctx.arc(head[0] + 5, head[1] - 1, 1.5, 0, TAU); ctx.fill();
    if (p.scared > 0.55) { ctx.beginPath(); ctx.ellipse(head[0] + 3.4, head[1] + 3.4, 1.6, 2.1, 0, 0, TAU); ctx.fill(); }
    ctx.scale(p.face, 1);
    if (p.shield > 0) {
      ctx.fillStyle = "rgba(120,220,255,.2)"; ctx.strokeStyle = "rgba(215,248,255,.95)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, -24, 33 + Math.sin(t * 5) * 1.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -24, 27, -2.4, -1.5); ctx.stroke();
    }
    ctx.restore();
  };

  D.pickup = function (ctx, k, t) {
    const left = k.life - k.age;
    if (left < 3 && Math.floor(t * 9) % 2) return;
    const y = k.y - 18 + Math.sin(t * 4 + k.x) * 4, x = k.x, pop = Math.min(1, k.age * 5);
    D.shadow(ctx, x, k.y, 12, 4, 0.2);
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
    if (k.type === "star") {
      ctx.fillStyle = "#ffd23f"; ctx.strokeStyle = "#8a5a00"; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
      starPath(ctx, 0, 0, 15, 6.8, Math.sin(t * 2 + k.y) * 0.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(-4, -4, 2.6, 0, TAU); ctx.fill();
    } else {
      const col = { bolt: "#2f7bf5", ice: "#8fe3ff", shield: "#b48cff" }[k.type];
      ctx.fillStyle = col; ctx.strokeStyle = "#16233f"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 21 + Math.sin(t * 6) * 2, 0, TAU); ctx.stroke();
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      if (k.type === "bolt") { ctx.fillStyle = "#ffe14d"; ctx.strokeStyle = "#16233f"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(-7, 2); ctx.lineTo(-1, 2); ctx.lineTo(-4, 12); ctx.lineTo(7, -3); ctx.lineTo(1, -3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (k.type === "ice") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.6; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.lineTo(-Math.cos(a) * 11, -Math.sin(a) * 11); ctx.stroke(); } }
      else { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(9, -6); ctx.quadraticCurveTo(9, 6, 0, 11); ctx.quadraticCurveTo(-9, 6, -9, -6); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  };

  D.particles = function (ctx, list) {
    for (let i = 0; i < list.length; i++) {
      const q = list[i], k = q.age / q.life, a = Math.max(0, 1 - k);
      if (q.type === "text") {
        const s = Math.min(1, q.age * 9) * (q.size || 22);
        ctx.font = s + "px " + FONT; ctx.textAlign = "center"; ctx.globalAlpha = Math.min(1, a * 2.2);
        ctx.lineWidth = 5; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(20,12,0,.85)"; ctx.strokeText(q.text, q.x, q.y); ctx.fillStyle = q.color; ctx.fillText(q.text, q.x, q.y);
      } else if (q.type === "ring") {
        ctx.globalAlpha = a; ctx.strokeStyle = q.color; ctx.lineWidth = 4 * a + 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.size + k * q.grow, 0, TAU); ctx.stroke();
      } else if (q.type === "puff") {
        ctx.globalAlpha = a * 0.6; ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (0.6 + k), 0, TAU); ctx.fill();
      } else if (q.type === "spark") {
        ctx.globalAlpha = a; ctx.fillStyle = q.color; starPath(ctx, q.x, q.y, q.size * a + 1, q.size * 0.4 * a + 0.5, q.age * 6); ctx.fill();
      } else { ctx.globalAlpha = a; ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (0.4 + a * 0.6), 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };

  // little scene picture for a level card
  D.thumb = function (canvas, level) {
    const c = canvas.getContext("2d"), p = level.pal, S = canvas.width;
    c.fillStyle = p.grassA; c.fillRect(0, 0, S, S); c.fillStyle = p.grassB; c.fillRect(0, 0, S * 0.3, S); c.fillRect(S * 0.62, 0, S * 0.3, S);
    c.fillStyle = p.zone; c.beginPath(); c.ellipse(S * 0.2, S * 0.86, S * 0.3, S * 0.14, 0, 0, TAU); c.fill();
    c.save(); c.scale(S / 128, S / 128);
    D.obstacle(c, { type: level.id === "snow" ? "pine" : "tree", x: 30, y: 82, s: 0.62, c: 1, v: 0 }, level, 0, 1);
    D.orange(c, { x: 84, y: 112, r: 30, vx: 0, vy: 0, hop: 0, roll: 0.4, mouth: 0.8, state: "chase", look: { x: -0.6, y: 0.2 }, dir: { x: 1, y: 0 } }, 0);
    c.restore();
    if (level.dark) { const g = c.createRadialGradient(S * 0.66, S * 0.62, S * 0.1, S * 0.66, S * 0.62, S * 0.75); g.addColorStop(0, "rgba(6,10,30,0)"); g.addColorStop(1, "rgba(6,10,30,.88)"); c.fillStyle = g; c.fillRect(0, 0, S, S); }
  };
})();
