// Bo'limlar: duolar va zikrlar, 99 ism, Islom, taqvim, qibla, hissa qo'shish
import { DUA_CATEGORIES } from "./data/duas.js?v=8";
import { NAMES_99 } from "./data/names.js?v=8";
import { ISLAM_TOPICS, ISLAMIC_EVENTS, HIJRI_MONTHS } from "./data/islam.js?v=8";
import { cyrToLat } from "./translit.js?v=8";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const KAABA = [21.422487, 39.826206];
export const DONATE = { card: "4448 8444 0951 5858", owner: "Dusmatova Maxliyoxon" };

export function initSections(ctx) {
  const { t, getLang, toast, haptic, openSheet, closeSheet, IN_TG, TG, getUser, apiBase } = ctx;
  const sheet = $("#sheetSection");
  const body = $("#secBody");
  const title = $("#secTitle");
  const backBtn = $("#secBack");
  let stack = [];
  const L = () => getLang();
  const pick = (o) => (L() === "ru" ? o.ru : o.uz);

  function open(view, arg) { stack = [{ view, arg }]; render(); openSheet("#sheetSection"); body.scrollTop = 0; stopQibla(); if (view === "qibla") startQibla(); }
  function go(view, arg) { stack.push({ view, arg }); render(); body.scrollTop = 0; if (view === "qibla") startQibla(); }
  backBtn.onclick = () => { if (stack.length > 1) { stack.pop(); stopQibla(); render(); if (stack[stack.length - 1].view === "qibla") startQibla(); } else close(); };
  function close() { stopQibla(); closeSheet(sheet); }
  $("#secClose").onclick = close;

  function render() {
    const { view, arg } = stack[stack.length - 1];
    backBtn.style.visibility = stack.length > 1 ? "visible" : "hidden";
    const r = { duas: viewDuas, duaCat: viewDuaCat, names: viewNames, islam: viewIslam, topic: viewTopic,
      calendar: viewCalendar, qibla: viewQibla, donate: viewDonate }[view];
    r(arg);
  }

  // ================= DUOLAR =================
  function viewDuas() {
    title.textContent = t("duas");
    body.innerHTML = `<div class="sec-grid">${DUA_CATEGORIES.map((c) =>
      `<button class="sec-tile" data-cat="${c.id}"><span>${c.icon}</span><b>${esc(pick(c))}</b><small>${c.items.length}</small></button>`).join("")}</div>`;
  }
  async function viewDuaCat(id) {
    const cat = DUA_CATEGORIES.find((c) => c.id === id);
    title.textContent = `${cat.icon} ${pick(cat)}`;
    body.innerHTML = cat.items.map((it, i) => `<article class="dua" data-i="${i}">
      <div class="dua-head"><b>${it.q ? esc(pick(it)) : ""}</b>${it.n ? `<span class="dua-n">${it.n}×</span>` : ""}</div>
      ${it.q ? `<div class="dua-q" data-q="${it.q}"><div class="spinner sm"></div></div>`
        : `<p class="dua-ar">${esc(it.ar)}</p><p class="dua-tr">${esc(it.tr)}</p><p class="dua-mean">${esc(pick(it))}</p>`}
      <div class="dua-foot"><span>${it.q ? `📖 ${t("quranRef")} ${it.q}` : it.src ? `📚 ${esc(it.src)}` : ""}</span>
        <button class="btn btn-small" data-copy="${i}">${t("copy")}</button></div></article>`).join("");
    // Qur'on oyatlarini manbadan yuklaymiz
    for (const el of $$(".dua-q", body)) {
      try {
        const v = await loadVerses(el.dataset.q);
        if (!el.isConnected) return;
        el.innerHTML = `<p class="dua-ar">${v.map((a) => `${esc(a.ar)} <span class="anum-s">﴿${a.n}﴾</span>`).join(" ")}</p>
          <p class="dua-mean">${v.map((a) => esc(L() === "ru" ? a.ru : a.uz)).join(" ")}</p>`;
      } catch {
        el.innerHTML = `<p class="dua-mean">⚠️ ${t("loadErr")}</p>`;
      }
    }
  }
  body.addEventListener("click", async (e) => {
    const cat = e.target.closest("[data-cat]");
    if (cat) { haptic(); go("duaCat", cat.dataset.cat); return; }
    const top = e.target.closest("[data-topic]");
    if (top) { haptic(); go("topic", top.dataset.topic); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) {
      const card = cp.closest(".dua");
      const text = [...card.querySelectorAll(".dua-ar, .dua-tr, .dua-mean")].map((p) => p.innerText.trim()).join("\n\n");
      try { await navigator.clipboard.writeText(text + "\n\n— Qur'oni Karim · Erkinov loyihasi"); toast(t("copied")); } catch { }
      return;
    }
    const nm = e.target.closest(".name-card");
    if (nm) { nm.classList.toggle("open"); haptic(); return; }
    if (e.target.closest("#copyCard")) {
      try { await navigator.clipboard.writeText(DONATE.card.replace(/\s/g, "")); toast(t("cardCopied")); haptic("medium"); } catch { }
      return;
    }
    if (e.target.closest("#qiblaStart")) { await requestCompass(); return; }
    const ev = e.target.closest("[data-month]");
    if (ev) { calMonth = ev.dataset.month === "prev" ? addMonth(calMonth, -1) : addMonth(calMonth, 1); viewCalendar(); }
  });

  // Qur'on oyatlari: "2:255", "20:25-28", "112"
  async function loadVerses(ref) {
    const key = "q:verses:" + ref;
    try { const c = JSON.parse(localStorage.getItem(key)); if (c) return c; } catch { }
    let surah, from = 1, to = null;
    if (ref.includes(":")) {
      const [s, r] = ref.split(":");
      surah = +s;
      const [a, b] = r.split("-").map(Number);
      from = a; to = b || a;
    } else surah = +ref;
    const qs = to ? `?offset=${from - 1}&limit=${to - from + 1}` : "";
    const r = await fetch(`https://api.alquran.cloud/v1/surah/${surah}/editions/quran-uthmani,uz.sodik,ru.kuliev${qs}`);
    const j = await r.json();
    if (j.code !== 200) throw new Error("api");
    const [ar, uz, ru] = j.data;
    // Manba oraliqni qo'llamasa ham — kerakli oyatlarni o'zimiz ajratamiz
    const idx = ar.ayahs.map((a, i) => i).filter((i) => !to || (ar.ayahs[i].numberInSurah >= from && ar.ayahs[i].numberInSurah <= to));
    const out = idx.map((i) => ar.ayahs[i]).map((a, k) => {
      const i = idx[k];
      let text = a.text;
      if (a.numberInSurah === 1 && surah !== 1) {
        const plain = text.replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/ٱ/g, "ا");
        if (plain.startsWith("بسم")) text = text.split(" ").slice(4).join(" ");
      }
      return { n: a.numberInSurah, ar: text, uz: cyrToLat(uz.ayahs[i].text), ru: ru.ayahs[i].text };
    });
    try { localStorage.setItem(key, JSON.stringify(out)); } catch { }
    return out;
  }

  // ================= 99 ISM =================
  function viewNames() {
    title.textContent = t("names99");
    body.innerHTML = `<input class="search" id="nameSearch" type="search" placeholder="${t("search")}">
      <div class="names-grid">${NAMES_99.map(([ar, tr, uz, ru], i) => `<button class="name-card" data-s="${esc((tr + " " + uz + " " + ru).toLowerCase())}">
        <span class="nm-i">${i + 1}</span><span class="nm-ar">${ar}</span><b>${esc(tr)}</b><small>${esc(L() === "ru" ? ru : uz)}</small></button>`).join("")}</div>
      <p class="foot-note">${t("namesHadith")}</p>`;
    $("#nameSearch").oninput = (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$(".name-card", body).forEach((c) => { c.hidden = q && !c.dataset.s.includes(q); });
    };
  }

  // ================= ISLOM =================
  function viewIslam() {
    title.textContent = t("islam");
    body.innerHTML = `<div class="sec-grid">${ISLAM_TOPICS.map((tp) =>
      `<button class="sec-tile" data-topic="${tp.id}"><span>${tp.icon}</span><b>${esc(pick(tp))}</b></button>`).join("")}</div>`;
  }
  function viewTopic(id) {
    const tp = ISLAM_TOPICS.find((x) => x.id === id);
    title.textContent = `${tp.icon} ${pick(tp)}`;
    const blocks = L() === "ru" ? tp.body.ru : tp.body.uz;
    body.innerHTML = blocks.map((b) => `<section class="topic-block"><h4>${esc(b.h)}</h4>
      ${b.p.length > 1 ? `<ul>${b.p.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>${esc(b.p[0])}</p>`}</section>`).join("")
      + `<p class="foot-note">${t("islamNote")}</p>`;
  }

  // ================= TAQVIM =================
  const hijriFmt = (() => {
    try { return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Tashkent" }); }
    catch { return null; }
  })();
  function hijri(date) {
    if (!hijriFmt) return null;
    const parts = hijriFmt.formatToParts(date);
    const g = (type) => +parts.find((p) => p.type === type)?.value;
    return { d: g("day"), m: g("month"), y: g("year") };
  }
  const tashToday = () => { const d = new Date(Date.now() + 5 * 3600e3); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 7)); };
  let calMonth = null;
  const addMonth = (ym, k) => { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + k, 1)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`; };
  const GREG = { uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
    ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"] };
  const WEEK = { uz: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"], ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] };

  function upcomingEvents(limit = 6) {
    const out = [];
    const start = tashToday();
    for (let i = 0; i < 400 && out.length < limit; i++) {
      const d = new Date(start.getTime() + i * 86400e3);
      const h = hijri(d);
      if (!h) break;
      const ev = ISLAMIC_EVENTS.find(([m, dd]) => m === h.m && dd === h.d);
      if (ev) out.push({ date: d, days: i, name: L() === "ru" ? ev[3] : ev[2], h });
    }
    return out;
  }
  async function viewCalendar() {
    title.textContent = t("calendar");
    const today = tashToday();
    const ymToday = `${today.getUTCFullYear()}-${pad(today.getUTCMonth() + 1)}`;
    calMonth = calMonth || ymToday;
    const [y, m] = calMonth.split("-").map(Number);
    const h = hijri(today);
    const lang = L();
    const first = new Date(Date.UTC(y, m - 1, 1, 7));
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    let cells = "";
    for (let i = 0; i < lead; i++) cells += `<span></span>`;
    for (let d = 1; d <= days; d++) {
      const dt = new Date(Date.UTC(y, m - 1, d, 7));
      const hh = hijri(dt);
      const isToday = calMonth === ymToday && d === today.getUTCDate();
      const ev = hh && ISLAMIC_EVENTS.find(([mm, dd]) => mm === hh.m && dd === hh.d);
      const fri = dt.getUTCDay() === 5;
      cells += `<span class="cal-d${isToday ? " today" : ""}${ev ? " ev" : ""}${fri ? " fri" : ""}" title="${ev ? esc(lang === "ru" ? ev[3] : ev[2]) : ""}"><b>${d}</b><small>${hh ? hh.d : ""}</small></span>`;
    }
    const evs = upcomingEvents();
    body.innerHTML = `
      <div class="hijri-today">${h ? `<div class="hj-big">${h.d} ${HIJRI_MONTHS[lang][h.m - 1]} ${h.y}</div>` : ""}
        <div class="hj-small">${today.getUTCDate()} ${GREG[lang][today.getUTCMonth()]} ${today.getUTCFullYear()} · ${t("hijriNote")}</div></div>
      <div class="cal-nav"><button class="icon-btn" data-month="prev">‹</button><b>${GREG[lang][m - 1]} ${y}</b><button class="icon-btn" data-month="next">›</button></div>
      <div class="cal-grid">${WEEK[lang].map((w) => `<span class="cal-w">${w}</span>`).join("")}${cells}</div>
      <h4 class="sec-h">🌙 ${t("upcoming")}</h4>
      <div class="ev-list">${evs.map((e) => `<div class="ev-row"><span>${esc(e.name)}</span><span>${e.date.getUTCDate()} ${GREG[lang][e.date.getUTCMonth()]}${e.days ? ` · ${e.days} ${t("daysLeft")}` : ` · ${t("todayWord")}`}</span></div>`).join("")}</div>
      <h4 class="sec-h">🕌 ${t("monthlyPrayer")}</h4><div id="calPrayer"><div class="spinner sm"></div></div>`;
    try {
      const region = localStorage.getItem("q:region") ? JSON.parse(localStorage.getItem("q:region")) : (getUser()?.region || "toshkent-shahri");
      const j = await (await fetch(`${apiBase}/api/prayer?region=${encodeURIComponent(region)}&month=${calMonth}`)).json();
      const el = $("#calPrayer");
      if (!el) return;
      const n = t("prayerNames");
      el.innerHTML = `<p class="hj-small">📍 ${esc(lang === "ru" ? j.name_ru : j.name_uz)}</p><div class="tt-wrap"><table class="tt"><thead><tr><th></th>${["bomdod", "quyosh", "peshin", "asr", "shom", "xufton"].map((k) => `<th>${n[k]}</th>`).join("")}</tr></thead>
        <tbody>${j.days.map((d) => `<tr class="${d.date === `${ymToday}-${pad(today.getUTCDate())}` ? "today" : ""}"><td>${+d.date.slice(8)}</td>${["bomdod", "quyosh", "peshin", "asr", "shom", "xufton"].map((k) => `<td>${d.times[k]}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    } catch { const el = $("#calPrayer"); if (el) el.innerHTML = `<p class="dua-mean">⚠️ ${t("loadErr")}</p>`; }
  }

  // ================= QIBLA =================
  const Q = { heading: null, bearing: null, lat: null, lng: null, src: "", listening: false, aligned: false };
  function bearingTo(lat, lng) {
    const r = Math.PI / 180;
    const p1 = lat * r, p2 = KAABA[0] * r, dl = (KAABA[1] - lng) * r;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  function distanceKm(lat, lng) {
    const r = Math.PI / 180, R = 6371;
    const dLat = (KAABA[0] - lat) * r, dLng = (KAABA[1] - lng) * r;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * r) * Math.cos(KAABA[0] * r) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
  }
  async function regionCoords() {
    try {
      const region = JSON.parse(localStorage.getItem("q:region") || "null") || getUser()?.region || "toshkent-shahri";
      const j = await (await fetch(`${apiBase}/api/regions`)).json();
      const r = j.regions.find((x) => x.slug === region) || j.regions[0];
      return { lat: r.lat, lng: r.lng, name: L() === "ru" ? r.ru : r.uz };
    } catch { return { lat: 41.2995, lng: 69.2401, name: "Toshkent" }; }
  }
  function setLocation(lat, lng, src) {
    Q.lat = lat; Q.lng = lng; Q.src = src;
    Q.bearing = bearingTo(lat, lng);
    drawQibla();
  }
  async function locate() {
    const rc = await regionCoords();
    setLocation(rc.lat, rc.lng, `📍 ${rc.name}`);
    // Aniqroq joylashuv (ruxsat berilsa)
    const tgLoc = IN_TG && TG?.LocationManager;
    if (tgLoc && typeof tgLoc.init === "function") {
      try {
        tgLoc.init(() => {
          if (tgLoc.isLocationAvailable) tgLoc.getLocation((loc) => { if (loc) setLocation(loc.latitude, loc.longitude, `📡 ${t("myLocation")}`); });
        });
        return;
      } catch { }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation(p.coords.latitude, p.coords.longitude, `📡 ${t("myLocation")}`),
        () => { }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    }
  }
  function onOrient(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === "number") h = e.webkitCompassHeading;
    else if (e.absolute && typeof e.alpha === "number") h = (360 - e.alpha) % 360;
    else if (typeof e.alpha === "number" && e.type === "deviceorientationabsolute") h = (360 - e.alpha) % 360;
    if (h === null) return;
    $("#qiblaStart")?.remove();
    const so = (screen.orientation && screen.orientation.angle) || 0;
    Q.heading = (h + so + 360) % 360;
    drawQibla();
  }
  function onTgOrient() {
    const d = TG?.DeviceOrientation;
    if (!d || typeof d.alpha !== "number" || !d.absolute) return;
    Q.heading = (360 - (d.alpha * 180) / Math.PI + 360) % 360;
    drawQibla();
  }
  async function requestCompass() {
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== "granted") { toast(t("compassDenied")); return; }
      }
    } catch { }
    listen();
    $("#qiblaStart")?.remove();
  }
  function listen() {
    if (Q.listening) return;
    Q.listening = true;
    if ("ondeviceorientationabsolute" in window) window.addEventListener("deviceorientationabsolute", onOrient);
    else window.addEventListener("deviceorientation", onOrient);
    try {
      if (IN_TG && TG?.DeviceOrientation?.start) {
        TG.DeviceOrientation.start({ refresh_rate: 60, need_absolute: true });
        TG.onEvent("deviceOrientationChanged", onTgOrient);
      }
    } catch { }
  }
  function stopQibla() {
    if (!Q.listening) return;
    Q.listening = false;
    window.removeEventListener("deviceorientationabsolute", onOrient);
    window.removeEventListener("deviceorientation", onOrient);
    try { if (IN_TG && TG?.DeviceOrientation?.stop) { TG.DeviceOrientation.stop(); TG.offEvent("deviceOrientationChanged", onTgOrient); } } catch { }
  }
  function startQibla() {
    locate();
    listen(); // Android'da ruxsatsiz ishlaydi; iPhone'da "Kompasni yoqish" tugmasi ruxsat so'raydi
  }
  function viewQibla() {
    title.textContent = t("qibla");
    const needsPerm = typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function";
    body.innerHTML = `
      <div class="qibla">
        <div class="qb-info" id="qbInfo">…</div>
        <div class="compass" id="compass">
          <div class="dial" id="dial">
            <span class="cd n">N</span><span class="cd e">E</span><span class="cd s">S</span><span class="cd w">W</span>
            <div class="ticks"></div>
            <div class="qneedle" id="qneedle"><span class="kaaba">🕋</span></div>
          </div>
          <div class="pointer"></div>
        </div>
        <div class="qb-status" id="qbStatus">${t("compassHint")}</div>
        ${needsPerm ? `<button class="btn btn-gold" id="qiblaStart">🧭 ${t("compassStart")}</button>` : ""}
        <p class="foot-note">${t("qiblaNote")}</p>
      </div>`;
    const ticks = $(".ticks", body);
    let h = "";
    for (let i = 0; i < 72; i++) h += `<i style="transform:rotate(${i * 5}deg)" class="${i % 6 === 0 ? "big" : ""}"></i>`;
    ticks.innerHTML = h;
    drawQibla();
  }
  function drawQibla() {
    const info = $("#qbInfo");
    if (!info || Q.bearing === null) return;
    info.innerHTML = `${esc(Q.src)} · ${t("qiblaAngle")}: <b>${Math.round(Q.bearing)}°</b> · 🕋 ${distanceKm(Q.lat, Q.lng).toLocaleString()} km`;
    const dial = $("#dial");
    const needle = $("#qneedle");
    const heading = Q.heading ?? 0;
    dial.style.transform = `rotate(${-heading}deg)`;
    needle.style.transform = `rotate(${Q.bearing}deg)`;
    const st = $("#qbStatus");
    if (Q.heading === null) { st.textContent = t("compassNoSensor"); return; }
    const diff = ((Q.bearing - heading + 540) % 360) - 180;
    const aligned = Math.abs(diff) < 5;
    $("#compass").classList.toggle("aligned", aligned);
    st.textContent = aligned ? `✅ ${t("qiblaFound")}` : diff > 0 ? `↻ ${t("turnRight")} ${Math.round(diff)}°` : `↺ ${t("turnLeft")} ${Math.round(-diff)}°`;
    if (aligned && !Q.aligned) haptic("heavy");
    Q.aligned = aligned;
  }

  // ================= HISSA QO'SHISH =================
  function viewDonate() {
    title.textContent = t("donate");
    body.innerHTML = `
      <div class="donate">
        <p class="don-text">${t("donateText")}</p>
        <div class="bank-card">
          <div class="bc-top"><span class="bc-brand">✦ Erkinov loyihasi</span><span class="bc-chip"></span></div>
          <div class="bc-num">${DONATE.card}</div>
          <div class="bc-owner">${DONATE.owner}</div>
        </div>
        <button class="btn btn-gold" id="copyCard">📋 ${t("copyCard")}</button>
        <p class="don-dua">جَزَاكُمُ اللَّهُ خَيْرًا<br><small>${t("donateThanks")}</small></p>
      </div>`;
  }

  // Tashqi tugmalar
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sec]");
    if (b) { haptic(); open(b.dataset.sec); }
  });
  return { open, refresh: () => { if (!sheet.hidden) render(); }, close };
}
