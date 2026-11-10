// App shell extras: offline cache, the Install button, and a hint for iPhone and iPad.
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const row = $("installRow"), btn = $("btnInstall"), tip = $("installTip");
  let standalone = false;
  try { standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) {}

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }

  let offer = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); offer = e;
    if (!standalone) { row.hidden = false; btn.hidden = false; tip.hidden = false; tip.textContent = "Adds Orange Chase to your home screen. It then opens full screen and works offline."; }
  });
  btn.addEventListener("click", function () {
    if (!offer) return;
    offer.prompt();
    offer.userChoice.then(function () { offer = null; row.hidden = true; }).catch(function () {});
  });
  window.addEventListener("appinstalled", function () { row.hidden = true; });

  const ua = navigator.userAgent || "";
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios && !standalone) { row.hidden = false; tip.hidden = false; tip.textContent = "To install on iPhone or iPad: open this page in Safari, tap Share, then Add to Home Screen."; }
})();
