// Game rules: movement, the orange's brain, pickups, scoring, winning and losing.
(function () {
  const OC = window.OC, W = OC.WORLD.w, H = OC.WORLD.h, A = OC.audio, TAU = Math.PI * 2;
  const clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  const G = (OC.G = { mode: "menu", demo: true, t: 0, clock: 0, parts: [], pickups: [], oranges: [], input: { x: 0, y: 0, dash: false },
    cam: { x: 0, y: 0 }, view: { w: 900, h: 600, zoom: 1 }, shake: 0, sc: {}, count: 0, outro: 0 });
  OC.ROUND = 60;
  const TAUNTS = ["NOM!", "COME BACK!", "JUST ONE BITE", "SNACK TIME", "PEELING HUNGRY", "ORANGE YOU SLOW?", "FRESH SQUEEZED!"];
  // phones that support it also get a short buzz with the bigger moments
  const BUZZ = { bite: [70, 40, 180], bonk: 45, shield: [30, 30, 30], near: 18, star: 12, power: 22, freeze: 22, dash: 10, warn: 25, win: [40, 60, 40, 60, 140], go: 30 };
  const S = function (n, a) {
    if (G.demo) return;
    A.play(n, a);
    if (BUZZ[n] && navigator.vibrate && OC.haptics !== false) { try { navigator.vibrate(BUZZ[n]); } catch (e) {} }
  };

  function part(o) { if (G.parts.length < 420) { o.age = 0; o.vx = o.vx || 0; o.vy = o.vy || 0; G.parts.push(o); } }
  function pop(x, y, text, color, size) { part({ type: "text", x: x, y: y, vy: -42, life: 1.15, text: text, color: color || "#fff", size: size || 22 }); }
  function burst(x, y, n, color, sp, type, size) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = sp * (0.35 + Math.random() * 0.65); part({ type: type || "dot", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, g: 380, life: 0.45 + Math.random() * 0.45, color: color, size: size || 4 }); }
  }
  OC.fx = { part: part, pop: pop, burst: burst };
  OC.autopilot = function () { bot(); };

  function makeOrange(x, y, baby) {
    return { x: x, y: y, vx: 0, vy: 0, r: baby ? 27 : 46, baby: !!baby, state: "chase", stT: 0, lungeCd: 3.5 + Math.random() * 2, mouth: 0.5, ch: 0,
      hop: 0, roll: 0, look: { x: 0, y: 1 }, dir: { x: 1, y: 0 }, windup: 0.6, close: false, lungeMin: 999, tauntT: 4 + Math.random() * 4, happy: false };
  }

  OC.setup = function (idx, demo) {
    const L = OC.LEVELS[idx];
    G.levelIdx = idx; G.level = L; G.world = L._world || (L._world = OC.buildWorld(L)); G.demo = !!demo;
    G.t = 0; G.outro = 0; G.ended = false; G.shake = 0; G.babyDone = false; G.starT = 0.8; G.powerT = 5; G.combo = 0; G.comboT = 0; G.lastSec = 99;
    G.player = { x: W / 2, y: H / 2, vx: 0, vy: 0, face: 1, run: 0, moveAmt: 0, dashT: 0, dashCd: 0, dashDir: { x: 1, y: 0 }, boostT: 0, shield: 0, invuln: 0, scared: 0, dead: false };
    const a = Math.random() * TAU;
    G.oranges = [makeOrange(clamp(W / 2 + Math.cos(a) * 600, 90, W - 90), clamp(H / 2 + Math.sin(a) * 520, 90, H - 90))];
    G.pickups = []; G.parts = []; G.input.dash = false;
    G.sc = { survive: 0, stars: 0, starCount: 0, close: 0, closeCount: 0, bonus: 0 };
    G.cam.x = G.player.x - G.view.w / 2; G.cam.y = G.player.y - G.view.h / 2;
    for (let i = 0; i < 4; i++) spawnPickup("star");
  };
  OC.total = function () { const s = G.sc; return Math.floor(s.survive + s.stars + s.close + s.bonus); };

  function zoneAt(x, y) {
    const zs = G.world.zones;
    for (let i = 0; i < zs.length; i++) { const z = zs[i], dx = (x - z.x) / z.r, dy = (y - z.y) / (z.r * 0.82); if (dx * dx + dy * dy < 0.86) return z.type; }
    return null;
  }
  OC.zoneAt = zoneAt;

  function collide(e, rad) {
    const obs = G.world.obstacles; let hit = false;
    for (let i = 0; i < obs.length; i++) {
      const o = obs[i], dx = e.x - o.x, dy = e.y - o.y, min = rad + o.r;
      if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
      const d = Math.hypot(dx, dy);
      if (d < min && d > 0.001) { const nx = dx / d, ny = dy / d; e.x = o.x + nx * min; e.y = o.y + ny * min; const vn = e.vx * nx + e.vy * ny; if (vn < 0) { e.vx -= vn * nx; e.vy -= vn * ny; } hit = true; }
    }
    const m = rad + 8;
    if (e.x < m) { e.x = m; e.vx = Math.max(0, e.vx); hit = true; } else if (e.x > W - m) { e.x = W - m; e.vx = Math.min(0, e.vx); hit = true; }
    if (e.y < m + 16) { e.y = m + 16; e.vy = Math.max(0, e.vy); hit = true; } else if (e.y > H - m) { e.y = H - m; e.vy = Math.min(0, e.vy); hit = true; }
    return hit;
  }

  function spawnPickup(type) {
    const p = G.player, obs = G.world.obstacles;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * TAU, d = 200 + Math.random() * 520, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (x < 60 || x > W - 60 || y < 80 || y > H - 60) continue;
      let ok = true;
      for (let k = 0; k < obs.length && ok; k++) if (Math.hypot(obs[k].x - x, obs[k].y - y) < obs[k].r + 28) ok = false;
      if (!ok) continue;
      G.pickups.push({ type: type, x: x, y: y, age: 0, life: type === "star" ? 13 : 15 });
      return;
    }
  }

  // the stickman on autopilot, used for the park preview behind the menu
  function bot() {
    const p = G.player; let ax = (W / 2 - p.x) / W * 0.5, ay = (H / 2 - p.y) / H * 0.5, near = 9999;
    G.oranges.forEach(function (o) {
      const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1, w = Math.min(3, 260 / d);
      near = Math.min(near, d); ax += (dx / d) * w - (dy / d) * w * 0.55; ay += (dy / d) * w + (dx / d) * w * 0.55;
    });
    const wall = 240;
    if (p.x < wall) ax += (wall - p.x) / wall * 3; if (p.x > W - wall) ax -= (p.x - (W - wall)) / wall * 3;
    if (p.y < wall) ay += (wall - p.y) / wall * 3; if (p.y > H - wall) ay -= (p.y - (H - wall)) / wall * 3;
    G.world.obstacles.forEach(function (o) { const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); if (d < o.r + 60) { ax += dx / d * 1.5; ay += dy / d * 1.5; } });
    if (near > 300 && G.pickups.length) {
      let b = null, bd = 500; G.pickups.forEach(function (k) { const d = Math.hypot(k.x - p.x, k.y - p.y); if (d < bd) { bd = d; b = k; } });
      if (b) { ax += (b.x - p.x) / bd * 1.6; ay += (b.y - p.y) / bd * 1.6; }
    }
    const l = Math.hypot(ax, ay) || 1; G.input.x = ax / l; G.input.y = ay / l; G.input.dash = near < 130;
  }

  function updatePlayer(dt) {
    const p = G.player; if (p.dead) return;
    let ix = G.input.x, iy = G.input.y; const il = Math.hypot(ix, iy);
    if (il > 1) { ix /= il; iy /= il; }
    const zone = zoneAt(p.x, p.y);
    let sp = 240; if (p.boostT > 0) sp *= 1.42; if (zone === "water") sp *= 0.6; if (zone === "mud") sp *= 0.52;
    if (G.input.dash && p.dashCd <= 0) {
      p.dashT = 0.2; p.dashCd = 2.4; p.dashDir = il > 0.15 ? { x: ix / il, y: iy / il } : { x: p.face, y: 0 };
      S("dash"); for (let i = 0; i < 6; i++) part({ type: "puff", x: p.x, y: p.y - 6, vx: -p.dashDir.x * 60 * Math.random(), vy: -p.dashDir.y * 60 * Math.random() - 10, life: 0.4, color: "#fff", size: 9 });
    }
    G.input.dash = false;
    if (p.dashT > 0) { p.dashT -= dt; p.vx = p.dashDir.x * 640; p.vy = p.dashDir.y * 640; }
    else { const k = Math.min(1, (zone === "ice" ? 1.9 : 16) * dt); p.vx += (ix * sp - p.vx) * k; p.vy += (iy * sp - p.vy) * k; }
    p.x += p.vx * dt; p.y += p.vy * dt; collide(p, 10);
    const v = Math.hypot(p.vx, p.vy);
    p.moveAmt += ((v > 30 ? 1 : 0) - p.moveAmt) * Math.min(1, 12 * dt); p.run += dt * (5 + v * 0.05);
    if (Math.abs(p.vx) > 25) p.face = p.vx > 0 ? 1 : -1;
    p.dashCd -= dt; p.boostT -= dt; p.invuln -= dt;
    if (v > 60 && Math.random() < dt * (zone ? 22 : 7)) part({ type: zone === "water" ? "ring" : "puff", x: p.x, y: p.y, life: 0.4, color: zone === "water" ? "rgba(255,255,255,.8)" : zone === "mud" ? "#5d4229" : "rgba(255,255,255,.7)", size: zone === "water" ? 4 : 5, grow: 16 });
    if (p.boostT > 0 && Math.random() < dt * 30) part({ type: "spark", x: p.x + (Math.random() - 0.5) * 16, y: p.y - Math.random() * 30, vy: -20, life: 0.4, color: "#ffe14d", size: 7 });
  }

  function biteDist(o) { return o.r * 0.72 + 9; }

  function updateOrange(o, dt) {
    const p = G.player, L = G.level.orange, obs = G.world.obstacles;
    const dx = p.x - o.x, dy = p.y - o.y, dist = Math.hypot(dx, dy) || 1;
    const lk = Math.min(1, 8 * dt); o.look.x += (dx / dist - o.look.x) * lk; o.look.y += (dy / dist - o.look.y) * lk;
    const zone = zoneAt(o.x, o.y);
    let max = L.speed * (1 + L.ramp * Math.min(1, G.t / OC.ROUND)) * (o.baby ? 0.78 : 1);
    if (zone === "water") max *= 0.8; if (zone === "mud") max *= 0.72;
    const acc = L.accel * (o.baby ? 1.25 : 1) * (zone === "ice" ? 0.4 : 1);
    const damp = function (k) { const f = Math.exp(-k * dt); o.vx *= f; o.vy *= f; };
    o.stT += dt; o.lungeCd -= dt;
    if (o.state === "frozen") { damp(10); if (o.stT > o.hold) { o.state = "chase"; S("thaw"); burst(o.x, o.y - o.r, 14, "#cfefff", 220, "dot", 5); } }
    else if (o.state === "stunned") { damp(3.5); if (o.stT > o.hold) o.state = "chase"; }
    else if (o.state === "recover") { damp(4); if (o.stT > 0.75) o.state = "chase"; }
    else if (o.state === "windup") {
      damp(9);
      if (Math.random() < dt * 20) part({ type: "puff", x: o.x + (Math.random() - 0.5) * o.r * 1.6, y: o.y - o.r * 1.9, vy: -60, life: 0.45, color: "#fff", size: 7 });
      if (o.stT >= o.windup) {
        const tx = p.x + p.vx * 0.16 - o.x, ty = p.y + p.vy * 0.16 - o.y, l = Math.hypot(tx, ty) || 1;
        o.dir = { x: tx / l, y: ty / l }; o.vx = o.dir.x * max * L.lunge.boost; o.vy = o.dir.y * max * L.lunge.boost;
        o.state = "lunge"; o.stT = 0; o.lungeMin = 999; S("lunge");
      }
    } else if (o.state === "lunge") {
      o.lungeMin = Math.min(o.lungeMin, dist);
      if (o.stT > 0.5) {
        o.state = "recover"; o.stT = 0; o.lungeCd = L.lunge.cd * (0.8 + Math.random() * 0.4);
        if (!p.dead && !G.demo && o.lungeMin < biteDist(o) + 75) { award(150, "DODGED!", p); o.close = false; }
      }
    } else {
      const lt = Math.min(0.6, dist / max) * L.lead;
      let tx = p.x + p.vx * lt - o.x, ty = p.y + p.vy * lt - o.y, l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      for (let i = 0; i < obs.length; i++) {
        const b = obs[i], ox = o.x - b.x, oy = o.y - b.y, min = o.r * 0.6 + b.r, reach = min + 80;
        if (Math.abs(ox) > reach || Math.abs(oy) > reach) continue;
        const d = Math.hypot(ox, oy); if (d > reach || d < 0.01) continue;
        const ax = ox / d, ay = oy / d; if (tx * -ax + ty * -ay <= 0) continue;
        const w = clamp(1 - (d - min) / 80, 0, 1); let px = -ay, py = ax; if (px * tx + py * ty < 0) { px = -px; py = -py; }
        tx += px * w * 1.3 + ax * w * 0.5; ty += py * w * 1.3 + ay * w * 0.5;
      }
      l = Math.hypot(tx, ty) || 1; let ex = tx / l * max - o.vx, ey = ty / l * max - o.vy; const el = Math.hypot(ex, ey), cap = acc * dt;
      if (el > cap) { ex *= cap / el; ey *= cap / el; }
      o.vx += ex; o.vy += ey;
      if (L.lunge && !o.baby && !p.dead && G.mode === "play" && o.lungeCd <= 0 && dist > 150 && dist < 430) {
        o.state = "windup"; o.stT = 0; o.windup = L.lunge.windup; S("warn"); pop(o.x, o.y - o.r * 2.3, "!", "#ff3b30", 40);
      }
      o.tauntT -= dt;
      if (o.tauntT <= 0 && G.mode === "play") { o.tauntT = 6 + Math.random() * 5; if (dist < 520) pop(o.x, o.y - o.r * 2.3, TAUNTS[Math.floor(Math.random() * TAUNTS.length)], "#fff3d6", 17); }
    }
    o.x += o.vx * dt; o.y += o.vy * dt;
    const hit = collide(o, o.r * 0.6);
    if (hit && o.state === "lunge" && o.stT > 0.06) {
      o.state = "stunned"; o.stT = 0; o.hold = 1.5; o.lungeCd = L.lunge.cd; o.vx = -o.dir.x * 120; o.vy = -o.dir.y * 120; G.shake = 10;
      S("bonk"); burst(o.x + o.dir.x * o.r, o.y - o.r, 12, "#ffb347", 240, "dot", 5);
      if (!G.demo && !p.dead) award(200, "BONK!", o);
    }
    const sp = Math.hypot(o.vx, o.vy);
    o.roll += o.vx * dt / o.r; o.hop += dt * (4 + sp * 0.03);
    const cl = clamp(1 - (dist - 60) / 440, 0, 1);
    if (o.state === "lunge" || o.happy) o.mouth = o.happy ? 0.25 + 0.2 * Math.sin(G.clock * 14) : 1;
    else if (o.state === "windup") o.mouth += (0.1 - o.mouth) * Math.min(1, 12 * dt);
    else if (o.state !== "frozen") {
      const before = Math.sin(o.ch); o.ch += dt * (4 + cl * 13); const now = Math.sin(o.ch);
      o.mouth = 0.5 + 0.5 * now;
      if (before > -0.92 && now <= -0.92 && cl > 0.12 && G.mode === "play") S("chomp", cl * cl * (o.baby ? 0.6 : 1));
    }
    return dist;
  }

  function award(pts, label, at) {
    const v = Math.round(pts * G.level.mult); G.sc.close += v; G.sc.closeCount++;
    pop(at.x, at.y - 70, label + " +" + v, "#7df9ff", 22); S("near");
  }

  function endRound(won) {
    G.mode = won ? "won" : "lost"; G.outro = 0; A.stopMusic();
    const p = G.player;
    if (won) {
      G.sc.bonus = Math.round((500 + (p.shield > 0 ? 250 : 0)) * G.level.mult);
      S("win"); G.oranges.forEach(function (o) { o.state = "stunned"; o.stT = 0; o.hold = 99; });
      for (let i = 0; i < 70; i++) part({ type: i % 3 ? "dot" : "spark", x: p.x + (Math.random() - 0.5) * 500, y: p.y - 260 - Math.random() * 200, vx: (Math.random() - 0.5) * 80, vy: 60 + Math.random() * 120, g: 60, life: 1.6 + Math.random(), color: ["#ffd23f", "#ff7a00", "#7df9ff", "#ff5d8f", "#8dff7a"][i % 5], size: 6 });
      pop(p.x, p.y - 80, "SAFE!", "#8dff7a", 38);
    } else {
      p.dead = true; G.shake = 20; S("bite");
      burst(p.x, p.y - 24, 18, G.level.pal.stick, 260, "dot", 4); burst(p.x, p.y - 24, 10, G.level.pal.scarf, 220, "dot", 5); burst(p.x, p.y - 24, 14, "#ffb347", 300, "dot", 5);
      pop(p.x, p.y - 80, "CHOMP!", "#ff3b30", 40);
    }
  }

  OC.update = function (dt) {
    G.clock += dt;
    const p = G.player, M = G.level.mult;
    for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.age += dt; if (q.age >= q.life) { G.parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; if (q.g) q.vy += q.g * dt; }
    G.shake *= Math.exp(-7 * dt);

    if (G.mode === "countdown") {
      const before = Math.ceil(G.count); G.count -= dt; const now = Math.ceil(G.count);
      if (now !== before && now > 0) S("count");
      if (G.count <= 0) { G.mode = "play"; S("go"); A.startMusic(G.level.music); pop(p.x, p.y - 90, "RUN!", "#ffd23f", 44); }
    }
    const live = G.mode === "play" || G.mode === "menu";
    if (G.mode === "menu") bot();
    if (live) updatePlayer(dt);
    let near = 9999;
    if (G.mode !== "countdown" && G.mode !== "paused") {
      for (let i = 0; i < G.oranges.length; i++) {
        const o = G.oranges[i];
        if (G.mode === "lost") { o.happy = true; const f = Math.exp(-5 * dt); o.vx *= f; o.vy *= f; }
        const d = updateOrange(o, dt); near = Math.min(near, d);
        if (!live || p.dead) continue;
        const bd = biteDist(o);
        if (o.state !== "frozen" && d < bd && p.invuln <= 0) {
          if (G.demo) { burst(o.x, o.y - o.r, 10, "#fff", 200, "puff", 10); const a = Math.random() * TAU; o.x = clamp(p.x + Math.cos(a) * 620, 90, W - 90); o.y = clamp(p.y + Math.sin(a) * 620, 90, H - 90); o.vx = o.vy = 0; continue; }
          if (p.shield > 0) {
            p.shield = 0; p.invuln = 1.3; o.state = "stunned"; o.stT = 0; o.hold = 1.7; const k = 320 / (d || 1); o.vx = (o.x - p.x) * k; o.vy = (o.y - p.y) * k;
            S("shield"); G.shake = 9; part({ type: "ring", x: p.x, y: p.y - 24, life: 0.5, color: "#bff3ff", size: 30, grow: 80 }); pop(p.x, p.y - 70, "BLOCKED!", "#bff3ff", 24);
          } else { endRound(false); break; }
        }
        if (!G.demo && o.state !== "lunge") {
          if (d < bd + 30) o.close = true;
          else if (o.close && d > bd + 125) { o.close = false; if (o.state === "chase") award(100, "CLOSE CALL", p); }
        }
      }
    }
    p.scared = clamp(1 - (near - 95) / 150, 0, 1);

    if (live) {
      for (let i = G.pickups.length - 1; i >= 0; i--) {
        const k = G.pickups[i]; k.age += dt;
        if (k.age > k.life) { G.pickups.splice(i, 1); continue; }
        if (Math.hypot(k.x - p.x, k.y - p.y) > 34) continue;
        G.pickups.splice(i, 1);
        if (k.type === "star") {
          G.combo = G.comboT > 0 ? G.combo + 1 : 0; G.comboT = 4;
          const v = Math.round(50 * M); G.sc.stars += v; G.sc.starCount++; S("star", G.combo); pop(k.x, k.y - 30, "+" + v, "#ffd23f", 20); burst(k.x, k.y - 18, 8, "#ffd23f", 170, "spark", 7);
        } else if (k.type === "bolt") { p.boostT = 5; S("power"); pop(k.x, k.y - 30, "ZOOM!", "#ffe14d", 24); }
        else if (k.type === "shield") { p.shield = 1; S("power"); pop(k.x, k.y - 30, "BUBBLE!", "#d9c4ff", 24); }
        else { G.oranges.forEach(function (o) { o.state = "frozen"; o.stT = 0; o.hold = 2.7; }); S("freeze"); pop(k.x, k.y - 30, "FREEZE!", "#bff3ff", 24); }
      }
      G.comboT -= dt; G.starT -= dt; G.powerT -= dt;
      const stars = G.pickups.filter(function (k) { return k.type === "star"; }).length;
      if (G.starT <= 0) { G.starT = 1.5 + Math.random() * 1.3; if (stars < 7) spawnPickup("star"); }
      if (G.powerT <= 0) {
        G.powerT = 7 + Math.random() * 4;
        if (G.pickups.length - stars < 2) { const opts = p.shield > 0 ? ["bolt", "ice"] : ["bolt", "ice", "shield"]; spawnPickup(opts[Math.floor(Math.random() * opts.length)]); }
      }
    }

    if (G.mode === "play") {
      G.t += dt; G.sc.survive += 10 * M * dt;
      const left = Math.ceil(OC.ROUND - G.t);
      if (left !== G.lastSec) { G.lastSec = left; if (left <= 5 && left > 0) S("count"); }
      if (G.level.baby && !G.babyDone && G.t >= G.level.baby) {
        G.babyDone = true; const o = G.oranges[0], b = makeOrange(o.x, o.y, true); b.vx = -o.vx; b.vy = -200; G.oranges.push(b);
        S("pop"); pop(o.x, o.y - o.r * 2.4, "TWO NOW!", "#ff7a00", 30); burst(o.x, o.y - o.r, 14, "#ffb347", 240, "dot", 5);
      }
      A.setIntensity(Math.max(clamp(1 - (near - 80) / 320, 0, 1) * 0.7, (G.t - 40) / 20));
      if (G.t >= OC.ROUND && !p.dead) { G.t = OC.ROUND; endRound(true); }
    }
    if ((G.mode === "won" || G.mode === "lost") && !G.ended) { G.outro += dt; if (G.outro > 1.5) { G.ended = true; if (OC.onEnd) OC.onEnd(G.mode === "won"); } }

    // camera
    const v = G.view, pad = 70;
    let cx = p.x + p.vx * 0.22 - v.w / 2, cy = p.y - 24 + p.vy * 0.22 - v.h / 2;
    cx = v.w >= W + pad * 2 ? (W - v.w) / 2 : clamp(cx, -pad, W + pad - v.w);
    cy = v.h >= H + pad * 2 ? (H - v.h) / 2 : clamp(cy, -pad, H + pad - v.h);
    const k = Math.min(1, 6 * dt); G.cam.x += (cx - G.cam.x) * k; G.cam.y += (cy - G.cam.y) * k;
  };
})();
