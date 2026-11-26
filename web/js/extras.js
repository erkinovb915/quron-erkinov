// Namoz vaqtlari, tasbeh, ilovani o'rnatish taklifi va bildirishnomalar
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const KEYS = ["bomdod", "quyosh", "peshin", "asr", "shom", "xufton"];
const ICONS = { bomdod: "🌅", quyosh: "☀️", peshin: "🕛", asr: "🌤", shom: "🌇", xufton: "🌙" };

const store = {
  get(k, d) { try { const v = localStorage.getItem("q:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("q:" + k, JSON.stringify(v)); } catch { } },
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const toMin = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };

// Toshkent vaqti (UTC+5) — telefon soati boshqa mintaqada bo'lsa ham to'g'ri ishlashi uchun
function nowTashkent() {
  const d = new Date(Date.now() + 5 * 3600 * 1000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), min: d.getUTCHours() * 60 + d.getUTCMinutes(), sec: d.getUTCSeconds(),
    iso: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` };
}

export function initExtras(ctx) {
  const { api, toast, haptic, openSheet, closeSheet, t, getLang, IN_TG, TG, getUser, setUser, apiBase } = ctx;
  const P = {
    region: store.get("region", null),
    data: store.get("prayerData", null), // {region, days:[{date,times,source}], fetched}
    regions: store.get("regions", null),
  };

  // ================= NAMOZ VAQTLARI =================
  const names = () => t("prayerNames");

  async function loadRegions() {
    if (P.regions) return P.regions;
    try {
      const r = await (await fetch(apiBase + "/api/regions")).json();
      P.regions = r.regions;
      store.set("regions", P.regions);
    } catch { P.regions = [{ slug: "toshkent-shahri", uz: "Toshkent", ru: "Ташкент" }]; }
    return P.regions;
  }
  function regionSlug() {
    return P.region || getUser()?.region || "toshkent-shahri";
  }
  window.__notifyState = () => notifyState();
  async function loadPrayer(force = false) {
    const region = regionSlug();
    const today = nowTashkent().iso;
    const fresh = P.data && P.data.region === region && P.data.days?.some((d) => d.date === today)
      && Date.now() - (P.data.fetched || 0) < 6 * 3600 * 1000;
    if (fresh && !force) return P.data;
    try {
      const r = await fetch(`${apiBase}/api/prayer?region=${encodeURIComponent(region)}&days=7`);
      const j = await r.json();
      P.data = { region: j.region, name_uz: j.name_uz, name_ru: j.name_ru, days: j.days, fetched: Date.now() };
      store.set("prayerData", P.data);
    } catch { /* oflayn — saqlangan ma'lumot ishlatiladi */ }
    return P.data;
  }
  function todayTimes() {
    const now = nowTashkent();
    const days = P.data?.days || [];
    const today = days.find((d) => d.date === now.iso);
    const idx = days.indexOf(today);
    return { now, today, tomorrow: idx >= 0 ? days[idx + 1] : null };
  }
  // Keyingi namoz va qolgan vaqt
  function nextPrayer() {
    const { now, today, tomorrow } = todayTimes();
    if (!today) return null;
    const cur = now.min * 60 + now.sec;
    for (const k of KEYS) {
      const s = toMin(today.times[k]) * 60;
      if (s > cur) return { key: k, time: today.times[k], left: s - cur };
    }
    if (tomorrow) return { key: "bomdod", time: tomorrow.times.bomdod, left: 24 * 3600 - cur + toMin(tomorrow.times.bomdod) * 60, tomorrow: true };
    return null;
  }
  function currentPrayer() {
    const { now, today } = todayTimes();
    if (!today) return null;
    let cur = null;
    for (const k of KEYS) if (toMin(today.times[k]) <= now.min) cur = k;
    return cur;
  }
  const fmtLeft = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };
  const regionLabel = () => (getLang() === "ru" ? P.data?.name_ru : P.data?.name_uz) || "";

  function renderPrayerSheet() {
    const box = $("#prayerBody");
    const { today, tomorrow } = todayTimes();
    if (!today) { box.innerHTML = `<div class="loading" style="height:160px"><div class="spinner"></div></div>`; return; }
    const nx = nextPrayer();
    const cur = currentPrayer();
    const n = names();
    const rows = KEYS.map((k) => `<div class="pr-row${k === nx?.key && !nx.tomorrow ? " next" : ""}${k === cur ? " current" : ""}">
      <span class="pr-ic">${ICONS[k]}</span><span class="pr-name">${n[k]}</span><span class="pr-time">${today.times[k]}</span></div>`).join("");
    const tmr = tomorrow ? `<div class="pr-tomorrow">${t("tomorrow")}: ${KEYS.filter((k) => k !== "quyosh").map((k) => `${n[k]} ${tomorrow.times[k]}`).join(" · ")}</div>` : "";
    const [y, m, d] = today.date.split("-");
    box.innerHTML = `
      <div class="pr-hero">
        <div class="pr-region"><button class="chip" id="prRegionBtn">📍 ${esc(regionLabel())} ▾</button><span>${d}.${m}.${y}</span></div>
        <div class="pr-next-label">${nx ? `${t("nextPrayer")}: <b>${n[nx.key]}</b> ${nx.time}` : ""}</div>
        <div class="pr-count" id="prCount">${nx ? fmtLeft(nx.left) : "—"}</div>
      </div>
      <div class="pr-list">${rows}</div>${tmr}
      <div class="pr-notify" id="prNotify"></div>
      <p class="foot-note">${today.source === "official" ? t("prSourceOfficial") : t("prSourceCalc")}</p>`;
    renderNotifyBox();
  }

  async function renderRegionPicker() {
    const regions = await loadRegions();
    const lang = getLang();
    $("#prayerBody").innerHTML = `<h4 style="margin:4px 0 10px">${t("chooseRegion")}</h4><div class="region-grid">${regions.map((r) =>
      `<button class="chip${r.slug === regionSlug() ? " active" : ""}" data-region="${r.slug}">${esc(lang === "ru" ? r.ru : r.uz)}</button>`).join("")}</div>`;
  }

  async function setRegion(slug) {
    P.region = slug;
    store.set("region", slug);
    P.data = null;
    renderPrayerSheet();
    await loadPrayer(true);
    renderPrayerSheet();
    updateChips();
    const u = await api("/api/settings", { region: slug });
    if (u) setUser(u);
    // Saytdagi bildirishnoma obunasini ham yangi hududga o'tkazamiz
    if (!IN_TG && window.Notification?.permission === "granted") subscribePush(true).catch(() => { });
  }

  async function openPrayer() {
    openSheet("#sheetPrayer");
    renderPrayerSheet();
    const userRegion = getUser()?.region;
    const chosen = store.get("regionChosen", false) || P.region || (userRegion && userRegion !== "toshkent-shahri");
    if (!chosen) {
      await renderRegionPicker();
      return;
    }
    await loadPrayer();
    renderPrayerSheet();
  }

  $("#sheetPrayer").addEventListener("click", async (e) => {
    const rb = e.target.closest("[data-region]");
    if (rb) { store.set("regionChosen", true); haptic(); await setRegion(rb.dataset.region); return; }
    if (e.target.closest("#prRegionBtn")) { await renderRegionPicker(); return; }
    if (e.target.closest("#prNotifyBtn")) { await enableNotifications(); return; }
    if (e.target.closest("#prNotifyOff")) { await disableNotifications(); return; }
  });

  // Har soniya: qolgan vaqt va pastdagi namoz chipi
  function tick() {
    const nx = nextPrayer();
    const el = $("#prCount");
    if (el && nx) el.textContent = fmtLeft(nx.left);
    if (nx && nx.left <= 1) setTimeout(() => { renderPrayerSheet(); updateChips(); }, 1500);
    updateChips(nx);
  }
  function updateChips(nx = nextPrayer()) {
    const n = names();
    const txt = nx ? `🕌 ${n[nx.key]} ${nx.time}` : "🕌";
    $$(".prayer-chip").forEach((c) => { c.textContent = txt; });
    const card = $("#introPrayer");
    if (card) {
      card.innerHTML = nx ? `<span class="ip-l">🕌 ${t("nextPrayer")} · ${esc(regionLabel())}</span><b>${n[nx.key]} ${nx.time}</b><span class="ip-c">${fmtLeft(nx.left)}</span>` : `<span class="ip-l">🕌 ${t("prayerTimes")}</span>`;
    }
  }
  setInterval(tick, 1000);
  // Har kuni yangi kun boshlanganda va har 6 soatda yangilaymiz
  let lastDay = nowTashkent().iso;
  setInterval(async () => {
    const d = nowTashkent().iso;
    if (d !== lastDay) { lastDay = d; await loadPrayer(true); renderPrayerSheet(); }
  }, 30000);
  document.addEventListener("visibilitychange", async () => { if (!document.hidden) { await loadPrayer(); if (!$("#sheetPrayer").hidden) renderPrayerSheet(); updateChips(); } });

  // ================= BILDIRISHNOMALAR =================
  const pushSupported = () => !IN_TG && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  function notifyState() {
    if (IN_TG) return getUser()?.prayer_notify ? "on" : "off";
    if (!pushSupported()) return isIOS && !isStandalone() ? "needInstall" : "unsupported";
    if (Notification.permission === "denied") return "denied";
    return store.get("pushOn", false) && Notification.permission === "granted" ? "on" : "off";
  }
  function renderNotifyBox() {
    const box = $("#prNotify");
    if (!box) return;
    const st = notifyState();
    const msg = {
      on: `<span>🔔 ${t("notifyOn")}</span><button class="btn btn-small" id="prNotifyOff">${t("turnOff")}</button>`,
      off: `<span>${t("notifyAsk")}</span><button class="btn btn-gold btn-small" id="prNotifyBtn">🔔 ${t("turnOn")}</button>`,
      needInstall: `<span>${t("notifyNeedInstall")}</span><button class="btn btn-gold btn-small" id="prInstallBtn">📲 ${t("installShort")}</button>`,
      denied: `<span>${t("notifyDenied")}</span>`,
      unsupported: `<span>${t("notifyUnsupported")}</span>`,
    }[st];
    box.innerHTML = msg;
    const ib = $("#prInstallBtn");
    if (ib) ib.onclick = () => ctx.doInstall();
  }

  async function subscribePush(silent = false) {
    const reg = await navigator.serviceWorker.ready;
    const { key } = await (await fetch(apiBase + "/api/push/key")).json();
    if (!key) throw new Error("no key");
    const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (key.length % 4)) % 4));
    const appKey = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
    const r = await fetch(apiBase + "/api/push/subscribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), region: regionSlug(), lang: getLang(), prayer: true, daily: true, webId: ctx.webId }),
    });
    if (!r.ok) throw new Error("subscribe failed");
    store.set("pushOn", true);
    if (!silent) toast(t("notifyOnToast"));
  }

  async function enableNotifications() {
    haptic("medium");
    if (IN_TG) {
      const u = await api("/api/settings", { prayer_notify: true, region: regionSlug() });
      if (u) { setUser(u); toast(t("notifyTgOn")); }
      renderNotifyBox();
      hideBanner("#notifyBanner");
      return;
    }
    if (!pushSupported()) { renderNotifyBox(); if (isIOS && !isStandalone()) ctx.doInstall(); return; }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast(t("notifyDenied")); renderNotifyBox(); return; }
      await subscribePush();
    } catch { toast(t("notifyError")); }
    renderNotifyBox();
    hideBanner("#notifyBanner");
  }
  async function disableNotifications() {
    if (IN_TG) {
      const u = await api("/api/settings", { prayer_notify: false });
      if (u) setUser(u);
    } else {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch(apiBase + "/api/push/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
          await sub.unsubscribe();
        }
      } catch { }
      store.set("pushOn", false);
    }
    toast(t("notifyOffToast"));
    renderNotifyBox();
  }

  // ================= TAKLIF BANNERLARI =================
  function showBanner(id) { const b = $(id); if (b) { b.hidden = false; requestAnimationFrame(() => b.classList.add("show")); } }
  function hideBanner(id) { const b = $(id); if (b) { b.classList.remove("show"); setTimeout(() => { b.hidden = true; }, 300); } }
  $("#installBanner [data-x]").onclick = () => { hideBanner("#installBanner"); sessionStorage.setItem("q:installHidden", "1"); setTimeout(maybeNotifyBanner, 800); };
  $("#installBannerBtn").onclick = () => { hideBanner("#installBanner"); ctx.doInstall(); };
  $("#notifyBanner [data-x]").onclick = () => { hideBanner("#notifyBanner"); sessionStorage.setItem("q:notifyHidden", "1"); };
  $("#notifyBannerBtn").onclick = () => enableNotifications();

  function maybeNotifyBanner() {
    if (sessionStorage.getItem("q:notifyHidden")) return;
    const st = notifyState();
    if (st === "off") showBanner("#notifyBanner");
  }
  // Har bir kirgan odamga: avval o'rnatish, keyin bildirishnoma taklifi
  setTimeout(() => {
    if (!IN_TG && !isStandalone() && !sessionStorage.getItem("q:installHidden")) showBanner("#installBanner");
    else maybeNotifyBanner();
  }, 2500);
  window.addEventListener("appinstalled", () => { hideBanner("#installBanner"); setTimeout(maybeNotifyBanner, 1500); });

  // ================= TASBEH =================
  const DHIKR = [
    { ar: "سُبْحَانَ ٱللَّٰهِ", uz: "Subhanalloh", ru: "Субханаллах", tr_uz: "Alloh pokdir", tr_ru: "Пречист Аллах" },
    { ar: "ٱلْحَمْدُ لِلَّٰهِ", uz: "Alhamdulillah", ru: "Альхамдулиллях", tr_uz: "Allohga hamd bo'lsin", tr_ru: "Хвала Аллаху" },
    { ar: "ٱللَّٰهُ أَكْبَرُ", uz: "Allohu akbar", ru: "Аллаху акбар", tr_uz: "Alloh buyukdir", tr_ru: "Аллах велик" },
    { ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", uz: "La ilaha illalloh", ru: "Ля иляха илляЛлах", tr_uz: "Allohdan o'zga iloh yo'q", tr_ru: "Нет божества, кроме Аллаха" },
    { ar: "أَسْتَغْفِرُ ٱللَّٰهَ", uz: "Astag'firulloh", ru: "Астагфируллах", tr_uz: "Allohdan mag'firat so'rayman", tr_ru: "Прошу прощения у Аллаха" },
    { ar: "سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ", uz: "Subhanallohi va bihamdihi", ru: "Субханаллахи ва бихамдихи", tr_uz: "Alloh pokdir va Unga hamd", tr_ru: "Пречист Аллах и хвала Ему" },
    { ar: "ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", uz: "Salovat", ru: "Салават", tr_uz: "Allohim, Muhammadga salovot yo'lla", tr_ru: "О Аллах, благослови Мухаммада" },
  ];
  const TS = store.get("tasbih", { i: 0, count: 0, target: 33, total: 0, day: "", today: 0 });
  const saveTS = () => store.set("tasbih", TS);
  function renderTasbih(pulse) {
    const lang = getLang();
    const dk = DHIKR[TS.i] || DHIKR[0];
    const today = nowTashkent().iso;
    if (TS.day !== today) { TS.day = today; TS.today = 0; }
    $("#tsAr").textContent = dk.ar;
    $("#tsName").textContent = lang === "ru" ? dk.ru : dk.uz;
    $("#tsMean").textContent = lang === "ru" ? dk.tr_ru : dk.tr_uz;
    $("#tsCount").textContent = TS.count;
    $("#tsTarget").textContent = TS.target ? `/ ${TS.target}` : "∞";
    $("#tsToday").textContent = TS.today;
    $("#tsTotal").textContent = TS.total;
    const ring = $("#tsRing");
    const C = 2 * Math.PI * 108;
    const span = TS.target || 100;
    const mod = TS.count % span;
    const p = TS.count > 0 && mod === 0 ? 1 : mod / span;
    ring.style.strokeDasharray = `${C}`;
    ring.style.strokeDashoffset = `${C * (1 - p)}`;
    $$("#tsDhikr .chip").forEach((c, i) => c.classList.toggle("active", i === TS.i));
    $$("#tsTargets .chip").forEach((c) => c.classList.toggle("active", Number(c.dataset.t) === TS.target));
    // munchoqlar: oxirgi 33 tadan nechtasi
    const beads = $("#tsBeads");
    const n = 33;
    const lit = TS.count % n || (TS.count ? n : 0);
    if (!beads.children.length) {
      let html = "";
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 - Math.PI / 2;
        html += `<i style="left:${50 + 47 * Math.cos(a)}%;top:${50 + 47 * Math.sin(a)}%"></i>`;
      }
      beads.innerHTML = html;
    }
    [...beads.children].forEach((b, k) => b.classList.toggle("on", k < lit));
    if (pulse) {
      const btn = $("#tsBtn");
      btn.classList.remove("pulse"); void btn.offsetWidth; btn.classList.add("pulse");
    }
  }
  function tasbihTap() {
    TS.count += 1; TS.total += 1; TS.today += 1;
    const done = TS.target && TS.count % TS.target === 0;
    if (done) {
      haptic("heavy");
      try { navigator.vibrate?.([60, 40, 120]); } catch { }
      toast(`✨ ${TS.target} — ${t("tasbihDone")}`);
    } else {
      haptic("light");
      try { navigator.vibrate?.(15); } catch { }
    }
    saveTS();
    renderTasbih(true);
  }
  function initTasbih() {
    const lang = getLang();
    $("#tsDhikr").innerHTML = DHIKR.map((d, i) => `<button class="chip" data-i="${i}">${esc(lang === "ru" ? d.ru : d.uz)}</button>`).join("");
  }
  $("#tsBtn").addEventListener("click", tasbihTap);
  $("#tsDhikr").addEventListener("click", (e) => { const c = e.target.closest("[data-i]"); if (c) { TS.i = Number(c.dataset.i); TS.count = 0; saveTS(); renderTasbih(); haptic(); } });
  $("#tsTargets").addEventListener("click", (e) => { const c = e.target.closest("[data-t]"); if (c) { TS.target = Number(c.dataset.t); TS.count = 0; saveTS(); renderTasbih(); haptic(); } });
  $("#tsReset").addEventListener("click", () => { TS.count = 0; saveTS(); renderTasbih(); haptic("medium"); });
  function openTasbih() { initTasbih(); renderTasbih(); openSheet("#sheetTasbih"); }

  // Klaviatura: tasbeh ochiq bo'lsa probel/Enter sanaydi
  document.addEventListener("keydown", (e) => {
    if ($("#sheetTasbih").hidden || e.target.matches("input, textarea")) return;
    if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); tasbihTap(); }
  });

  // Tashqi tugmalar
  $$("[data-open='prayer']").forEach((b) => b.addEventListener("click", openPrayer));
  $$("[data-open='tasbih']").forEach((b) => b.addEventListener("click", openTasbih));
  document.addEventListener("click", (e) => { if (e.target.closest(".prayer-chip")) openPrayer(); });

  // Birinchi yuklash
  loadPrayer().then(() => updateChips());

  return {
    openPrayer, openTasbih, refresh: () => { initTasbih(); renderTasbih(); renderPrayerSheet(); updateChips(); },
    onUser: () => { if (!P.region && getUser()?.region) { P.region = null; loadPrayer().then(() => updateChips()); } renderNotifyBox(); },
  };
}
