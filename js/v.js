(function () {
  var ENDPOINT = "https://site-log.brooder-heavies-60.workers.dev";
  var params, store;
  try { params = new URLSearchParams(location.search); store = window.localStorage; } catch (e) { return; }

  // Owner opt-out: visit andy-price.net/?me=1 once per browser to stop logging your own visits (?me=0 to undo).
  try {
    if (params.get("me") === "1") store.setItem("ap_me", "1");
    if (params.get("me") === "0") store.removeItem("ap_me");
  } catch (e) {}

  // Personal link code, e.g. andy-price.net/?r=kf. Remembered for later visits from the same browser.
  var code = "";
  try {
    code = (params.get("r") || store.getItem("ap_r") || "").slice(0, 64);
    if (params.get("r")) store.setItem("ap_r", code);
  } catch (e) {}

  // Remove ?r= and ?me= from the address bar so the code isn't visible or passed along.
  if (params.has("r") || params.has("me")) {
    params.delete("r"); params.delete("me");
    var rest = params.toString();
    try { history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + location.hash); } catch (e) {}
  }

  var isOwner = false;
  try { isOwner = store.getItem("ap_me") === "1"; } catch (e) {}
  if (isOwner) return;

  var visitor = "";
  try {
    visitor = store.getItem("ap_v");
    if (!visitor) { visitor = Math.random().toString(36).slice(2, 10); store.setItem("ap_v", visitor); }
  } catch (e) {}

  var started = Date.now(), id = null;
  fetch(ENDPOINT + "/hit", {
    method: "POST",
    keepalive: true,
    body: JSON.stringify({ p: location.pathname, r: code, ref: document.referrer, v: visitor })
  }).then(function (res) { return res.json(); }).then(function (d) { id = d.id; }).catch(function () {});

  function sendTime() {
    if (!id || !navigator.sendBeacon) return;
    navigator.sendBeacon(ENDPOINT + "/end", JSON.stringify({ id: id, v: visitor, s: (Date.now() - started) / 1000 }));
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") sendTime(); });
  window.addEventListener("pagehide", sendTime);
})();
