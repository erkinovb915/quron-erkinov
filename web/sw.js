// Oflayn ishlash: ilova qobig'i va o'qilgan sahifalar keshda saqlanadi
const SHELL = "quron-shell-v1";
const DATA = "quron-data-v1";
const ASSETS = ["/", "/index.html", "/css/style.css", "/js/app.js", "/js/quran.js", "/js/translit.js", "/js/i18n.js",
  "/js/surahs.js", "/js/sky.js", "/img/star-tile.svg", "/img/medallion.svg", "/manifest.json", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA].includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Qur'on matni va shriftlar: avval kesh, keyin tarmoq
  if (url.hostname === "api.alquran.cloud" || url.hostname.includes("fonts.g")) {
    e.respondWith(caches.open(DATA).then(async (c) => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok || res.type === "opaque") c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  // Ilova fayllari: tarmoq birinchi (yangilanishlar uchun), oflaynda kesh
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) caches.open(SHELL).then((c) => c.put(e.request, res.clone()));
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/"))));
});
