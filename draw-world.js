// Drawing the park itself: lawn, paths, ponds, fence, trees and furniture.
(function () {
  const OC = (window.OC = window.OC || {});
  const D = (OC.draw = OC.draw || {});
  const W = OC.WORLD.w, H = OC.WORLD.h, TAU = Math.PI * 2;
  const CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (CP && !CP.roundRect) CP.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };

  const shade = (D.shade = function (hex, f) {
    const n = parseInt(hex.slice(1), 16), t = f < 0 ? 0 : 255, a = Math.abs(f);
    const m = function (c) { return Math.round(c + (t - c) * a); };
    return "rgb(" + m(n >> 16) + "," + m((n >> 8) & 255) + "," + m(n & 255) + ")";
  });
  const ell = function (ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); };
  const shadow = (D.shadow = function (ctx, x, y, rx, ry, a) { ctx.fillStyle = "rgba(0,0,0," + (a || 0.2) + ")"; ell(ctx, x, y, rx, ry); ctx.fill(); });

  function tile(level) {
    const c = document.createElement("canvas"); c.width = c.height = 220;
    const g = c.getContext("2d"), r = OC.rng(level.seed * 7 + 1);
    g.strokeStyle = level.pal.speck; g.fillStyle = level.pal.speck; g.lineWidth = 2; g.lineCap = "round"; g.globalAlpha = 0.55;
    for (let i = 0; i < 46; i++) {
      const x = 10 + r() * 200, y = 12 + r() * 200;
      if (level.id === "snow") { g.beginPath(); g.arc(x, y, 1 + r() * 1.6, 0, TAU); g.fill(); continue; }
      g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 5, y - 6); g.moveTo(x, y); g.lineTo(x, y - 8); g.moveTo(x + 4, y); g.lineTo(x + 5, y - 6); g.stroke();
    }
    return c;
  }

  function blobPath(ctx, z, k) {
    const n = z.blob.length, pt = function (i) { const a = (i % n) / n * TAU, rr = z.r * z.blob[i % n] * k; return [z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr * 0.82]; };
    ctx.beginPath();
    let p0 = pt(0), p1 = pt(1);
    ctx.moveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    for (let i = 1; i <= n; i++) { const a = pt(i), b = pt(i + 1); ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.closePath();
  }

  D.ground = function (ctx, world, level, v, t) {
    const p = level.pal;
    ctx.fillStyle = p.hedge; ctx.fillRect(v.x - 2, v.y - 2, v.w + 4, v.h + 4);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.fillStyle = p.grassA; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = p.grassB;
    const band = 140;
    for (let x = Math.floor(v.x / band) * band; x < v.x + v.w; x += band) if ((Math.round(x / band) & 1) === 0) ctx.fillRect(x, 0, band, H);
    if (!level._tile) level._tile = tile(level);
    ctx.fillStyle = ctx.createPattern(level._tile, "repeat"); ctx.fillRect(v.x, v.y, v.w, v.h);

    ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass ? p.path : p.pathEdge; ctx.lineWidth = pass ? 58 : 70;
      world.paths.forEach(function (pp) {
        ctx.beginPath(); ctx.moveTo(pp[0].x, pp[0].y);
        for (let i = 1; i < pp.length - 1; i++) ctx.quadraticCurveTo(pp[i].x, pp[i].y, (pp[i].x + pp[i + 1].x) / 2, (pp[i].y + pp[i + 1].y) / 2);
        ctx.lineTo(pp[pp.length - 1].x, pp[pp.length - 1].y); ctx.stroke();
      });
    }

    world.zones.forEach(function (z) {
      if (z.x + z.r * 1.3 < v.x || z.x - z.r * 1.3 > v.x + v.w || z.y + z.r * 1.2 < v.y || z.y - z.r * 1.2 > v.y + v.h) return;
      ctx.fillStyle = p.zoneEdge; blobPath(ctx, z, 1.07); ctx.fill();
      ctx.fillStyle = p.zone; blobPath(ctx, z, 1); ctx.fill();
      ctx.save(); blobPath(ctx, z, 0.98); ctx.clip();
      if (z.type === "water") {
        ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) { const a = z.ph + i * 1.7, k = ((t * 0.25 + i * 0.27) % 1); ctx.globalAlpha = 1 - k; ell(ctx, z.x + Math.cos(a) * z.r * 0.4, z.y + Math.sin(a) * z.r * 0.3, 10 + k * 34, 5 + k * 15); ctx.stroke(); }
        ctx.globalAlpha = 1;
      } else if (z.type === "mud") {
        ctx.fillStyle = "rgba(40,24,10,.28)";
        for (let i = 0; i < 6; i++) { const a = z.ph + i * 1.1; ell(ctx, z.x + Math.cos(a) * z.r * 0.5, z.y + Math.sin(a * 1.3) * z.r * 0.4, 20 + (i % 3) * 8, 9 + (i % 2) * 5); ctx.fill(); }
        ctx.fillStyle = "rgba(255,235,200,.25)";
        for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i * 0.37 + z.ph) % 1; ctx.beginPath(); ctx.arc(z.x + Math.cos(z.ph + i * 2.3) * z.r * 0.45, z.y + Math.sin(z.ph + i * 2.9) * z.r * 0.35, 2 + k * 7, 0, TAU); ctx.fill(); }
      } else {
        ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 5;
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(z.x + i * 55 - 30, z.y + 26 + (i % 2) * 30); ctx.lineTo(z.x + i * 55 + 26, z.y - 30 + (i % 2) * 30); ctx.stroke(); }
        ctx.strokeStyle = "rgba(120,170,200,.5)"; ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) { const a = z.ph + i * 1.4; ctx.beginPath(); ctx.moveTo(z.x + Math.cos(a) * z.r * 0.2, z.y + Math.sin(a) * z.r * 0.2); ctx.lineTo(z.x + Math.cos(a + 0.3) * z.r * 0.75, z.y + Math.sin(a + 0.3) * z.r * 0.6); ctx.stroke(); }
      }
      ctx.restore();
    });

    world.decor.forEach(function (d) {
      if (d.x < v.x - 12 || d.x > v.x + v.w + 12 || d.y < v.y - 12 || d.y > v.y + v.h + 12) return;
      const col = p.decor[d.c];
      if (level.id === "meadow" || level.id === "midnight") {
        ctx.fillStyle = col; ctx.globalAlpha = level.dark ? 0.55 : 1;
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(d.x + Math.cos(d.a + k * 1.57) * 3.4 * d.s, d.y + Math.sin(d.a + k * 1.57) * 3.4 * d.s, 2.6 * d.s, 0, TAU); ctx.fill(); }
        ctx.fillStyle = "#f2a900"; ctx.beginPath(); ctx.arc(d.x, d.y, 2 * d.s, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      } else if (level.id === "autumn") {
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(d.x, d.y, 7 * d.s, 3.4 * d.s, d.a, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = "rgba(150,175,205,.35)"; ell(ctx, d.x + 2, d.y + 3, 11 * d.s, 5 * d.s); ctx.fill();
        ctx.fillStyle = "#fff"; ell(ctx, d.x, d.y, 10 * d.s, 5 * d.s); ctx.fill();
      }
    });
    ctx.restore();

    // fence
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 12; ctx.strokeRect(-6, -6, W + 12, H + 12);
    ctx.strokeStyle = p.fence; ctx.lineWidth = 7; ctx.strokeRect(-6, -6, W + 12, H + 12);
    ctx.fillStyle = p.fence; ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1.5;
    const post = function (x, y) { if (x < v.x - 20 || x > v.x + v.w + 20 || y < v.y - 20 || y > v.y + v.h + 20) return; ctx.fillRect(x - 7, y - 7, 14, 14); ctx.strokeRect(x - 7, y - 7, 14, 14); };
    for (let x = -6; x <= W + 6; x += 71.9) { post(x, -6); post(x, H + 6); }
    for (let y = -6; y <= H + 6; y += 70.6) { post(-6, y); post(W + 6, y); }
  };

  D.obstacle = function (ctx, o, level, t, fade) {
    const p = level.pal, x = o.x, y = o.y, s = o.s || 1;
    if (o.type === "tree") {
      const col = p.canopy[o.c % p.canopy.length];
      shadow(ctx, x + 8, y + 4, 40 * s, 13 * s);
      ctx.fillStyle = p.trunk; ctx.fillRect(x - 7, y - 50 * s, 14, 50 * s + 3);
      ctx.fillStyle = shade(p.trunk, -0.3); ctx.fillRect(x + 2, y - 50 * s, 5, 50 * s + 3);
      ctx.globalAlpha = fade;
      const sway = Math.sin(t * 1.3 + o.v * 9) * 1.6;
      const cs = [[-19, -60, 26], [19, -62, 27], [0, -86, 31]];
      ctx.fillStyle = shade(col, -0.35); cs.forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0] * s + sway, y + c[1] * s, c[2] * s + 3, 0, TAU); ctx.fill(); });
      ctx.fillStyle = col; cs.forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0] * s + sway, y + c[1] * s, c[2] * s, 0, TAU); ctx.fill(); });
      ctx.fillStyle = shade(col, 0.22); ctx.beginPath(); ctx.arc(x - 9 * s + sway, y - 95 * s, 13 * s, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 24 * s + sway, y - 68 * s, 9 * s, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (o.type === "pine") {
      const col = p.canopy[o.c % p.canopy.length];
      shadow(ctx, x + 8, y + 4, 36 * s, 12 * s, 0.14);
      ctx.fillStyle = p.trunk; ctx.fillRect(x - 6, y - 22 * s, 12, 22 * s + 3);
      ctx.globalAlpha = fade;
      [[40, -14, -58], [32, -44, -86], [23, -72, -112]].forEach(function (c) {
        ctx.fillStyle = shade(col, -0.35); ctx.beginPath(); ctx.moveTo(x - c[0] * s - 3, y + c[1] * s + 2); ctx.lineTo(x + c[0] * s + 3, y + c[1] * s + 2); ctx.lineTo(x, y + c[2] * s - 5); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - c[0] * s, y + c[1] * s); ctx.lineTo(x + c[0] * s, y + c[1] * s); ctx.lineTo(x, y + c[2] * s); ctx.fill();
        ctx.fillStyle = "#fff"; const my = y + (c[1] + (c[2] - c[1]) * 0.55) * s, mw = c[0] * 0.45 * s;
        ctx.beginPath(); ctx.moveTo(x, y + c[2] * s); ctx.lineTo(x + mw, my); ctx.lineTo(x + mw * 0.4, my - 5); ctx.lineTo(x, my + 3); ctx.lineTo(x - mw * 0.5, my - 5); ctx.lineTo(x - mw, my); ctx.fill();
      });
      ctx.globalAlpha = 1;
    } else if (o.type === "bench") {
      shadow(ctx, x + 4, y + 5, 36, 9);
      ctx.fillStyle = "#3a2a1c"; ctx.fillRect(x - 26, y - 14, 5, 16); ctx.fillRect(x + 21, y - 14, 5, 16);
      ctx.fillStyle = "#8a5a33"; ctx.strokeStyle = "#3a2a1c"; ctx.lineWidth = 2;
      [[-32, -40, 64, 9], [-32, -29, 64, 9], [-34, -17, 68, 11]].forEach(function (b) { ctx.fillRect(x + b[0], y + b[1], b[2], b[3]); ctx.strokeRect(x + b[0], y + b[1], b[2], b[3]); });
      if (level.id === "snow") { ctx.fillStyle = "#fff"; ctx.fillRect(x - 32, y - 44, 64, 5); ctx.fillRect(x - 34, y - 20, 68, 4); }
    } else if (o.type === "bush") {
      const col = p.canopy[(o.c + 1) % p.canopy.length];
      shadow(ctx, x + 4, y + 3, 28, 9);
      ctx.fillStyle = shade(col, -0.35); [[-12, -12, 17], [12, -13, 18], [0, -24, 18]].forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0], y + c[1], c[2] + 2.5, 0, TAU); ctx.fill(); });
      ctx.fillStyle = col; [[-12, -12, 17], [12, -13, 18], [0, -24, 18]].forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0], y + c[1], c[2], 0, TAU); ctx.fill(); });
      ctx.fillStyle = level.dark ? "#c9d6ff" : "#d7263d"; [[-14, -18], [6, -28], [14, -10], [-3, -9]].forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0], y + c[1], 2.6, 0, TAU); ctx.fill(); });
    } else if (o.type === "snowman") {
      shadow(ctx, x + 5, y + 3, 26, 8, 0.14);
      ctx.strokeStyle = "#5a4634"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 12, y - 30); ctx.lineTo(x - 30, y - 42); ctx.moveTo(x + 12, y - 30); ctx.lineTo(x + 30, y - 40); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#a9bdd3"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y - 16, 19, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y - 42, 13, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#18212e"; [[-5, -46], [5, -46], [0, -22], [0, -12]].forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0], y + c[1], 1.9, 0, TAU); ctx.fill(); });
      ctx.fillStyle = "#ff7a00"; ctx.beginPath(); ctx.moveTo(x, y - 43); ctx.lineTo(x + 12, y - 40); ctx.lineTo(x, y - 38.5); ctx.fill();
    } else if (o.type === "lamp") {
      shadow(ctx, x + 2, y + 2, 12, 4, 0.3);
      ctx.fillStyle = "#1a1f2b"; ctx.fillRect(x - 3, y - 78, 6, 80); ctx.fillRect(x - 7, y - 4, 14, 6);
      const fl = 0.9 + Math.sin(t * 9 + o.x) * 0.04;
      const g = ctx.createRadialGradient(x, y - 84, 2, x, y - 84, 46); g.addColorStop(0, "rgba(255,236,160," + 0.75 * fl + ")"); g.addColorStop(1, "rgba(255,236,160,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 84, 46, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff3bf"; ctx.strokeStyle = "#1a1f2b"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 84, 9, 0, TAU); ctx.fill(); ctx.stroke();
    }
  };
})();
