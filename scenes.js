// The four parks: tuning for each difficulty, its colours, its music, and a seeded layout.
(function () {
  const OC = (window.OC = window.OC || {});
  const W = 2000, H = 1400;
  OC.WORLD = { w: W, h: H };
  const _ = null;

  OC.LEVELS = [
    {
      id: "meadow", name: "Sunny Meadow", diff: "Easy", mult: 1, seed: 11,
      blurb: "A slow, hungry orange and lots of open lawn. Ponds slow you down.",
      orange: { speed: 186, accel: 300, ramp: 0.2, lead: 0, lunge: null },
      trees: 20, zones: 3, zoneType: "water", weather: "petals",
      pal: { grassA: "#7cc254", grassB: "#71b84b", speck: "#5ea33e", path: "#ead7a6", pathEdge: "#cdb47a", trunk: "#7a5230",
        canopy: ["#3f9a3c", "#4fae45", "#2f8a3a"], zone: "#62bdea", zoneEdge: "#3b93c7", decor: ["#ffffff", "#ffd84a", "#ff8db1"],
        fence: "#f7f1e3", hedge: "#3c7d33", stick: "#1b2620", stickEdge: "rgba(255,255,255,.9)", scarf: "#e5383b" },
      music: { bpm: 124, root: 60, scale: "major", wave: "square",
        lead: [0, _, 2, _, 4, _, 2, _, 4, 5, 4, 2, 0, _, _, _, 1, _, 3, _, 5, _, 3, _, 4, _, 2, _, 0, _, _, _],
        bass: [0, _, 0, _, 3, _, 3, _, 4, _, 4, _, 0, _, 4, _] },
    },
    {
      id: "autumn", name: "Autumn Grove", diff: "Medium", mult: 1.5, seed: 23,
      blurb: "The orange learns to lunge. Watch for the wind-up, then sidestep. Mud is sticky.",
      orange: { speed: 218, accel: 420, ramp: 0.22, lead: 0.2, lunge: { cd: 6, windup: 0.7, boost: 2.5 } },
      trees: 24, zones: 4, zoneType: "mud", weather: "leaves",
      pal: { grassA: "#bda64d", grassB: "#b09945", speck: "#8f7a30", path: "#dccba8", pathEdge: "#b7a078", trunk: "#5c3d26",
        canopy: ["#d9622b", "#e89a2c", "#b8432a", "#e2b93b"], zone: "#7d5c3d", zoneEdge: "#5d4229", decor: ["#d9622b", "#e2b93b", "#b8432a"],
        fence: "#f0e7d3", hedge: "#7a5a2a", stick: "#24170f", stickEdge: "rgba(255,248,230,.9)", scarf: "#1d7fd1" },
      music: { bpm: 136, root: 57, scale: "minor", wave: "square",
        lead: [0, _, _, 2, _, _, 4, _, 3, _, 2, _, 0, _, _, _, 5, _, _, 4, _, _, 2, _, 3, _, 1, _, 0, _, _, _],
        bass: [0, _, 0, _, 5, _, 5, _, 3, _, 3, _, 4, _, 4, _] },
    },
    {
      id: "snow", name: "Frozen Commons", diff: "Hard", mult: 2, seed: 37,
      blurb: "A faster orange on frozen ponds. Ice makes you slide, and makes it slide too.",
      orange: { speed: 234, accel: 480, ramp: 0.22, lead: 0.3, lunge: { cd: 4.8, windup: 0.6, boost: 2.6 } },
      trees: 22, zones: 5, zoneType: "ice", weather: "snow",
      pal: { grassA: "#eef4fb", grassB: "#e3ecf7", speck: "#cddaea", path: "#cbd6e3", pathEdge: "#aebbd0", trunk: "#5a4634",
        canopy: ["#2f6b57", "#3a7d66", "#285c4c"], zone: "#bfe6f7", zoneEdge: "#8ac6e6", decor: ["#ffffff", "#dbe6f3", "#ffffff"],
        fence: "#8a6f52", hedge: "#9fb4c9", stick: "#18212e", stickEdge: "rgba(255,255,255,.95)", scarf: "#e5383b" },
      music: { bpm: 146, root: 62, scale: "dorian", wave: "triangle",
        lead: [7, _, 4, _, 7, _, 4, _, 6, _, 4, _, 2, _, _, _, 5, _, 3, _, 5, _, 3, _, 4, 2, 1, _, 0, _, _, _],
        bass: [0, _, 0, _, 3, _, 3, _, 6, _, 6, _, 4, _, 4, _] },
    },
    {
      id: "midnight", name: "Midnight Park", diff: "Extreme", mult: 3, seed: 53,
      blurb: "Lights out. You only see by lamp glow, and at 30 seconds it brings a friend.",
      orange: { speed: 230, accel: 500, ramp: 0.22, lead: 0.35, lunge: { cd: 4.4, windup: 0.56, boost: 2.6 } },
      trees: 24, zones: 3, zoneType: "water", weather: "none", dark: true, lamps: 9, baby: 30,
      pal: { grassA: "#2f6140", grassB: "#2a583a", speck: "#1f4329", path: "#948e79", pathEdge: "#6f6a59", trunk: "#3d2c1e",
        canopy: ["#1f4d34", "#27593c", "#1a4230"], zone: "#2f6aa3", zoneEdge: "#1f4d7c", decor: ["#cdd7ff", "#fff6b0", "#ffffff"],
        fence: "#cbc4ae", hedge: "#12301f", stick: "#f6f2e4", stickEdge: "rgba(10,14,30,.9)", scarf: "#ffb000" },
      music: { bpm: 158, root: 55, scale: "harm", wave: "sawtooth",
        lead: [0, _, 0, 2, _, 2, 4, _, 6, _, 4, _, 7, _, _, _, 5, _, 5, 4, _, 4, 2, _, 1, _, -1, _, 0, _, _, _],
        bass: [0, _, 0, _, 0, _, 5, _, 4, _, 4, _, 4, _, -1, _] },
    },
  ];

  OC.rng = function (seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  OC.buildWorld = function (level) {
    const r = OC.rng(level.seed);
    const cx = W / 2, cy = H / 2;
    const zones = [], obstacles = [], decor = [], lamps = [];
    const far = function (x, y, list, gap) {
      for (let i = 0; i < list.length; i++) { const o = list[i]; if (Math.hypot(o.x - x, o.y - y) < o.r + gap) return false; }
      return true;
    };
    const place = function (margin, test) {
      for (let i = 0; i < 80; i++) {
        const x = margin + r() * (W - margin * 2), y = margin + r() * (H - margin * 2);
        if (test(x, y)) return { x: x, y: y };
      }
      return null;
    };

    for (let i = 0; i < level.zones; i++) {
      const rad = level.zoneType === "ice" ? 130 + r() * 60 : 90 + r() * 55;
      const p = place(rad + 60, function (x, y) { return Math.hypot(x - cx, y - cy) > rad + 190 && far(x, y, zones, rad + 70); });
      if (!p) continue;
      const blob = []; for (let k = 0; k < 12; k++) blob.push(0.86 + r() * 0.26);
      zones.push({ type: level.zoneType, x: p.x, y: p.y, r: rad, blob: blob, ph: r() * 6 });
    }
    if (level.lamps) {
      const cols = 3, rows = 3;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = W * (i + 0.5) / cols + (r() - 0.5) * 220, y = H * (j + 0.5) / rows + (r() - 0.5) * 160;
        if (Math.hypot(x - cx, y - cy) < 120) continue;
        const l = { type: "lamp", x: x, y: y, r: 8, light: 200 };
        lamps.push(l); obstacles.push(l);
      }
    }
    const add = function (type, count, rad, gap) {
      for (let i = 0; i < count; i++) {
        const p = place(70, function (x, y) {
          return Math.hypot(x - cx, y - cy) > 170 && far(x, y, zones, rad + 26) && far(x, y, obstacles, rad + gap);
        });
        if (p) obstacles.push({ type: type, x: p.x, y: p.y, r: rad, v: r(), c: Math.floor(r() * 4), s: 0.85 + r() * 0.35 });
      }
    };
    add(level.id === "snow" ? "pine" : "tree", level.trees, 20, 105);
    add("bench", 5, 24, 90);
    add(level.id === "snow" ? "snowman" : "bush", 7, 19, 80);

    // two wandering footpaths, purely for looks
    const paths = [];
    const ph = [], pv = [];
    for (let i = 0; i <= 8; i++) ph.push({ x: -60 + (W + 120) * i / 8, y: H * 0.5 + Math.sin(i * 0.9 + r() * 2) * 260 * (i % 8 ? 1 : 0.4) });
    for (let i = 0; i <= 6; i++) pv.push({ x: W * 0.5 + Math.sin(i * 1.2 + r() * 2 + 2) * 420, y: -60 + (H + 120) * i / 6 });
    paths.push(ph, pv);

    for (let i = 0; i < 190; i++) {
      const x = 30 + r() * (W - 60), y = 30 + r() * (H - 60);
      if (!far(x, y, zones, 8)) continue;
      decor.push({ x: x, y: y, c: Math.floor(r() * 3), s: 0.7 + r() * 0.7, a: r() * 6.28, ph: r() * 6.28 });
    }
    obstacles.sort(function (a, b) { return a.y - b.y; });
    return { zones: zones, obstacles: obstacles, decor: decor, paths: paths, lamps: lamps };
  };
})();
