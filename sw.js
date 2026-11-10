// Offline support: the whole game is cached on first visit, then served from the cache
// and refreshed in the background, so a new version shows up on the next launch.
const CACHE = "orange-chase-v1";
const SHELL = ["./", "index.html", "style.css", "manifest.webmanifest", "audio.js", "scenes.js", "draw-world.js", "draw-actors.js",
  "game.js", "render.js", "ui.js", "app.js", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png",
  "fonts/titan-one-latin.woff2", "fonts/nunito-latin.woff2"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const work = caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      const fresh = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      });
      if (hit) { fresh.catch(function () {}); return hit; }
      return fresh.catch(function () { return req.mode === "navigate" ? cache.match("index.html") : Response.error(); });
    });
  });
  e.respondWith(work);
});
