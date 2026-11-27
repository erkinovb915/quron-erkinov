// Oflayn ishlash: ilova qobig'i va o'qilgan sahifalar keshda saqlanadi
const SHELL = "quron-shell-v13";
const DATA = "quron-data-v1";
const ASSETS = ["/", "/index.html", "/img/star-tile.svg", "/img/medallion.svg", "/manifest.json", "/icons/icon-192.png"];

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
  if (url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin") || url.pathname.endsWith(".webm")) return;
  // Ilova fayllari: tarmoq birinchi (yangilanishlar uchun), oflaynda kesh
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) caches.open(SHELL).then((c) => c.put(e.request, res.clone()));
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/"))));
});

// ---------- Bildirishnomalar (namoz vaqti, o'qish eslatmasi) ----------
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Qur'on", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Qur'oni Karim", {
    body: d.body || "", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png",
    tag: d.tag || "quron", renotify: true, vibrate: [120, 60, 120], data: { url: d.url || "/" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
