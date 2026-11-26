// Qur'oni Karim — Erkinov loyihasi. Sayt, Telegram Mini App va PWA uchun yagona ilova.
import { loadMeta, loadPage, prefetch, juzOfPage, toArabicNum } from "./quran.js";
import { SURAH_NAMES } from "./surahs.js";
import { STR, tr } from "./i18n.js";
import { startSky } from "./sky.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const TOTAL = 604;
const API_BASE = window.QURAN_API || "";
const TG = window.Telegram?.WebApp;
const IN_TG = !!(TG && TG.initData);

// ---------------- holat ----------------
const store = {
  get(k, d) { try { const v = localStorage.getItem("q:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("q:" + k, JSON.stringify(v)); } catch { } },
};
const urlPage = parseInt(new URLSearchParams(location.search).get("p"), 10);
const S = {
  lang: store.get("lang", (navigator.language || "").startsWith("ru") ? "ru" : "uz"),
  mode: store.get("mode", "ar"),          // ar | both | tr
  dark: store.get("dark", IN_TG ? TG.colorScheme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches),
  lamp: store.get("lamp", false),
  sound: store.get("sound", true),
  font: store.get("font", 0),
  progress: store.get("progress", { page: 1, surah: 1, ayah: 1, t: 0 }),
  marks: store.get("marks", []),
  webId: store.get("webId", null),
  page: 1,
  user: null,
  meta: null,
  busy: false,
  current: [],
  ready: new Map(),
  justDragged: 0,
};
if (!S.webId) {
  S.webId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  store.set("webId", S.webId);
}
const t = (k, v) => tr(S.lang, k, v);

// ---------------- server bilan aloqa ----------------
async function api(path, data) {
  try {
    const r = await fetch(API_BASE + path, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, initData: IN_TG ? TG.initData : "", webId: S.webId, lang: S.lang }),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
let cfg = { bot_username: "" };
fetch(API_BASE + "/api/config").then((r) => r.json()).then((c) => { cfg = c; renderTgBox(); }).catch(() => { });

async function syncUser() {
  const u = await api("/api/auth", {});
  if (!u) return;
  S.user = u;
  const serverT = u.updated_at ? Date.parse(u.updated_at.replace(" ", "T") + "Z") : 0;
  if (u.page && serverT > (S.progress.t || 0) && u.page !== S.progress.page) {
    S.progress = { page: u.page, surah: u.surah, ayah: u.ayah, t: serverT };
    store.set("progress", S.progress);
  }
  if (IN_TG && u.lang && u.lang !== S.lang && !store.get("langChosen", false)) setLang(u.lang, false);
  renderSubGate(u.subscribe || []);
  updateIntro();
  updateToday();
  renderTgBox();
}

// Majburiy obuna oynasi (faqat Telegram mini ilovada)
function renderSubGate(list) {
  const gate = $("#subGate");
  if (!list.length) { gate.hidden = true; return; }
  $("#subTitle").textContent = t("subTitle");
  $("#subText").textContent = t("subText");
  $("#subCheck").textContent = t("subCheck");
  $("#subList").innerHTML = list.map((c) => `<a href="${esc(c.link)}" data-link="${esc(c.link)}">📢 ${esc(c.title)}</a>`).join("");
  gate.hidden = false;
}
document.addEventListener("click", async (e) => {
  const a = e.target.closest("#subList a");
  if (a) {
    e.preventDefault();
    if (IN_TG && TG.openTelegramLink && a.dataset.link.includes("t.me/")) TG.openTelegramLink(a.dataset.link);
    else window.open(a.dataset.link, "_blank");
    return;
  }
  if (e.target.id === "subCheck") {
    const u = await api("/api/auth", { recheck: true });
    if (u) { S.user = u; renderSubGate(u.subscribe || []); if ((u.subscribe || []).length) { toast(t("subNot")); haptic("rigid"); } else haptic("medium"); }
  }
});

let saveTimer = null;
function saveProgress(page, surah, ayah, immediate = false) {
  S.progress = { page, surah, ayah, t: Date.now() };
  store.set("progress", S.progress);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const u = await api("/api/progress", { page, surah, ayah });
    if (u) { S.user = u; updateToday(); }
  }, immediate ? 0 : 1200);
}

// ---------------- Telegram ----------------
if (TG) {
  try {
    TG.ready();
    TG.expand();
    TG.disableVerticalSwipes?.();
    TG.setHeaderColor?.("#072f28");
    TG.setBackgroundColor?.("#04211c");
    TG.BackButton.onClick(() => {
      const open = $$(".sheet").find((s) => !s.hidden);
      if (open) closeSheet(open);
      else if (!$("#ayahPop").hidden) $("#ayahPop").hidden = true;
      else showIntro();
    });
  } catch { }
}
const haptic = (kind = "light") => { try { TG?.HapticFeedback?.impactOccurred(kind); } catch { } };
function updateBackButton() {
  if (!IN_TG) return;
  const needed = document.body.classList.contains("reading") || $$(".sheet").some((s) => !s.hidden);
  needed ? TG.BackButton.show() : TG.BackButton.hide();
}

// ---------------- matnlarni tarjima qilish ----------------
function applyI18n() {
  document.documentElement.lang = S.lang;
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $$("[data-lang]").forEach((b) => b.classList.toggle("active", b.dataset.lang === S.lang));
  $$("#segLang button").forEach((b) => b.classList.toggle("active", b.dataset.v === S.lang));
  updateIntro();
}
function setLang(lang, rerender = true) {
  if (!STR[lang]) return;
  S.lang = lang;
  store.set("lang", lang);
  applyI18n();
  renderTgBox();
  if (rerender && document.body.classList.contains("reading")) renderPage(S.page, null);
  else updateHeader();
}

// ---------------- toast ----------------
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

// ---------------- ovoz: varaq shitirlashi ----------------
let audioCtx;
function flipSound() {
  if (!S.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const dur = 0.38;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const x = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 2) * (0.4 + 0.6 * Math.sin(x * Math.PI));
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const f = audioCtx.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.6;
    const g = audioCtx.createGain();
    g.gain.value = 0.22;
    src.connect(f).connect(g).connect(audioCtx.destination);
    src.start();
  } catch { }
}

// ---------------- ko'rinish sozlamalari ----------------
function applyLook() {
  document.body.classList.toggle("dark", S.dark);
  document.body.classList.toggle("lamp-on", S.lamp);
  document.documentElement.style.setProperty("--ar-size", `${Math.max(18, (innerWidth < 480 ? 25 : 30) + S.font * 2)}px`);
  document.documentElement.style.setProperty("--tr-size", `${Math.max(12, (innerWidth < 480 ? 15 : 16) + S.font)}px`);
  $("#swSound").checked = S.sound;
  $("#swLamp").checked = S.lamp;
  $$("#segMode button").forEach((b) => b.classList.toggle("active", b.dataset.v === S.mode));
  $("#modeIcon").textContent = { ar: "ع", both: "ع+", tr: "Aa" }[S.mode];
  document.querySelector('meta[name="theme-color"]').content = S.dark ? "#030a09" : "#0b3d33";
  if (IN_TG) { try { TG.setHeaderColor(S.dark ? "#030a09" : "#072f28"); } catch { } }
}

// ---------------- sahifani chizish ----------------
function surahLabel(n) {
  const row = SURAH_NAMES[n - 1];
  return row ? (S.lang === "ru" ? row[1] : row[0]) : String(n);
}
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function surahHeadHTML(sn) {
  const m = S.meta?.surahs[sn - 1];
  const type = m ? (m.type === "Meccan" ? t("meccan") : t("medinan")) : "";
  const bas = sn !== 1 && sn !== 9 ? `<div class="basmala">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>` : "";
  return `<div class="surah-head"><div class="sh-ar">سُورَةُ ${esc((m?.ar || "").replace(/^سُورَةُ\s*/, ""))}</div>
    <div class="sh-tr">${sn}. ${esc(surahLabel(sn))} · ${m ? m.ayahs : ""} ${t("ayahs")} · ${type}</div></div>${bas}`;
}

function pageHTML(page, ayahs) {
  const first = ayahs[0];
  const juz = first?.juz || (S.meta ? juzOfPage(S.meta, page) : 1);
  const surahsOnPage = [...new Set(ayahs.map((a) => a.s))];
  const headName = surahsOnPage.map(surahLabel).join(" · ");
  const last = S.progress.page === page ? `${S.progress.surah}:${S.progress.ayah}` : "";
  let body = "";
  const modeClass = `mode-${S.mode}`;

  if (S.mode === "ar") {
    let flow = "";
    for (const a of ayahs) {
      if (a.n === 1) {
        if (flow) body += `<div class="ar-flow">${flow}</div>`;
        flow = "";
        body += surahHeadHTML(a.s);
      }
      const key = `${a.s}:${a.n}`;
      flow += `<span class="ayah${key === last ? " last" : ""}" data-k="${key}">${esc(a.ar)}</span><span class="anum">${toArabicNum(a.n)}</span>${a.sajda ? " ۩ " : " "}`;
    }
    if (flow) body += `<div class="ar-flow">${flow}</div>`;
  } else {
    for (const a of ayahs) {
      if (a.n === 1) body += surahHeadHTML(a.s);
      const key = `${a.s}:${a.n}`;
      const arPart = S.mode === "both"
        ? `<div class="ar-flow"><span class="ayah${key === last ? " last" : ""}" data-k="${key}">${esc(a.ar)}</span><span class="anum">${toArabicNum(a.n)}</span>${a.sajda ? " ۩" : ""}</div>` : "";
      body += `<div class="pair">${arPart}<div class="tr ${S.mode === "tr" ? "ayah" : ""}" ${S.mode === "tr" ? `data-k="${key}"` : ""}><b>${a.s}:${a.n}</b>${esc(a.tr)}</div></div>`;
    }
  }
  return `<div class="page-inner ${modeClass}"><div class="page-frame">
    <div class="page-head"><span>${esc(headName)}</span><span class="ar">الجزء ${toArabicNum(juz)}</span><span>${juz}-${t("juz")}</span></div>
    <div class="page-body">${body}</div>
    <div class="page-foot">﴾ ${toArabicNum(page)} ﴿</div>
  </div></div>`;
}

function loadingHTML() {
  return `<div class="page-inner"><div class="page-frame"><div class="loading"><div class="spinner"></div><span>${t("loading")}</span></div></div></div>`;
}
function errorHTML(page) {
  return `<div class="page-inner"><div class="page-frame"><div class="err"><p>⚠️ ${t("loadErr")}</p>
    <button class="btn btn-gold btn-small" data-retry="${page}">${t("retry")}</button></div></div></div>`;
}

function updateHeader() {
  const page = S.page;
  const first = S.current[0];
  const sn = first ? first.s : 1;
  $("#hdrSurah").textContent = `${sn}. ${surahLabel(sn)}`;
  const juz = first?.juz || (S.meta ? juzOfPage(S.meta, page) : 1);
  $("#hdrMeta").textContent = `${juz}-${t("juz")} · ${page}-${t("page")}`;
  if (S.lang === "ru") $("#hdrMeta").textContent = `${t("juz")} ${juz} · ${t("page")} ${page}`;
  $("#pageNum").textContent = page;
  $("#pageSlider").value = page;
  $("#progressFill").style.width = `${(page / TOTAL) * 100}%`;
}
function updateToday() {
  const n = S.user?.today ?? 0;
  $("#bbToday").textContent = `📅 ${t("today")}: ${n}`;
}

async function preparePage(page) {
  const key = `${page}:${S.lang}:${S.mode}`;
  if (S.ready.has(key)) return S.ready.get(key);
  const ayahs = await loadPage(page, S.lang);
  const prepared = { ayahs, html: pageHTML(page, ayahs) };
  S.ready.set(key, prepared);
  if (S.ready.size > 12) S.ready.delete(S.ready.keys().next().value);
  return prepared;
}

function commitPage(page, ayahs) {
  S.page = page;
  if (ayahs) {
    S.current = ayahs;
    const keepAyah = S.progress.page === page ? S.progress : null;
    if (!keepAyah) saveProgress(page, ayahs[0].s, ayahs[0].n);
    // Qo'shni sahifalarni oldindan tayyorlab qo'yamiz — barmoq bilan varaqlash darrov ishlashi uchun
    for (const p of [page + 1, page - 1, page + 2]) {
      if (p >= 1 && p <= TOTAL) preparePage(p).catch(() => { });
    }
  }
  updateHeader();
  history.replaceState(null, "", `?p=${page}`);
}

async function renderPage(page, dir) {
  page = Math.max(1, Math.min(TOTAL, page));
  if (S.busy) return;
  S.busy = true;
  const pageEl = $("#page");
  const prevHTML = pageEl.innerHTML;
  let ayahs = null;
  let html;
  const loader = setTimeout(() => { if (!dir) pageEl.innerHTML = loadingHTML(); }, 150);
  try {
    if (!dir) S.ready.delete(`${page}:${S.lang}:${S.mode}`); // rejim/til o'zgarganda yangidan chizamiz
    const prepared = await preparePage(page);
    ayahs = prepared.ayahs;
    html = prepared.html;
  } catch {
    html = errorHTML(page);
  }
  clearTimeout(loader);

  if (dir && prevHTML) await flipAnimation(prevHTML, html, dir);
  else pageEl.innerHTML = html;
  commitPage(page, ayahs);
  S.busy = false;
}

// ---------------- 3D varaq ----------------
// Qur'on o'ngdan chapga o'qiladi: keyingi sahifaga o'tishda varaq chap chetidan ko'tarilib, o'ngga ag'dariladi.
// makeLeaf — varaqni boshqaruvchi: set(0..1) bilan barmoq ortidan yuradi, finish() bilan oxiriga yetadi.
function makeLeaf(oldHTML, newHTML, forward) {
  const book = $("#book");
  const pageEl = $("#page");
  pageEl.innerHTML = forward ? newHTML : oldHTML;
  const leaf = document.createElement("div");
  leaf.className = "leaf";
  leaf.style.transformOrigin = "right center";
  leaf.innerHTML = `<div class="leaf-face leaf-front">${forward ? oldHTML : newHTML}</div>
    <div class="leaf-face leaf-back"></div><div class="leaf-shade"></div>`;
  const under = document.createElement("div");
  under.className = "under-shade";
  book.append(under, leaf);
  const shade = leaf.querySelector(".leaf-shade");
  const start = forward ? 0 : 180;
  const end = forward ? 180 : 0;
  let cur = 0;

  function set(p) {
    cur = Math.max(0, Math.min(1, p));
    const angle = start + (end - start) * cur;
    const lift = Math.sin(cur * Math.PI) * 40;
    leaf.style.transform = `translateZ(${lift}px) rotateY(${angle}deg)`;
    const k = Math.abs(Math.sin((angle / 180) * Math.PI));
    shade.style.opacity = String(k * 0.6);
    shade.style.background = `linear-gradient(${Math.abs(angle) < 90 ? 90 : 270}deg, rgba(0,0,0,.35), rgba(255,255,255,.12) 55%, transparent)`;
    under.style.opacity = String(k * 0.7);
  }
  function animateTo(target, ms, easeInOut) {
    return new Promise((resolve) => {
      const from = cur;
      const t0 = performance.now();
      const dur = Math.max(120, ms * Math.abs(target - from));
      const ease = easeInOut ? (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) : (x) => 1 - Math.pow(1 - x, 3);
      function frame(now) {
        const x = Math.min(1, (now - t0) / dur);
        set(from + (target - from) * ease(x));
        if (x < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  async function finish(complete, ms = 650, easeInOut = false) {
    await animateTo(complete ? 1 : 0, ms, easeInOut);
    pageEl.innerHTML = complete ? newHTML : oldHTML;
    leaf.remove();
    under.remove();
  }
  set(0);
  return { set, finish };
}

async function flipAnimation(oldHTML, newHTML, dir) {
  flipSound();
  haptic("light");
  const leaf = makeLeaf(oldHTML, newHTML, dir > 0);
  await leaf.finish(true, 780, true);
}

function go(delta) {
  const target = S.page + delta;
  if (target < 1 || target > TOTAL) { haptic("rigid"); return; }
  $("#ayahPop").hidden = true;
  renderPage(target, delta);
}
function goTo(page) {
  page = Math.max(1, Math.min(TOTAL, page | 0));
  if (page === S.page) return;
  renderPage(page, page > S.page ? 1 : -1);
}

// ---------------- oyat oynasi ----------------
let popAyah = null;
function openAyah(key) {
  const a = S.current.find((x) => `${x.s}:${x.n}` === key);
  if (!a) return;
  popAyah = a;
  $$(".ayah.active").forEach((e) => e.classList.remove("active"));
  $$(`.ayah[data-k="${key}"]`).forEach((e) => e.classList.add("active"));
  $("#apTitle").textContent = `${surahLabel(a.s)} · ${a.s}:${a.n}${a.sajda ? " · " + t("sajda") : ""}`;
  $("#apAr").textContent = a.ar;
  $("#apTr").textContent = a.tr;
  $("#ayahPop").hidden = false;
  haptic("light");
}

// ---------------- kirish ekrani ----------------
function updateIntro() {
  const p = S.progress.page || 1;
  const hasProgress = p > 1;
  $("#btnContinue").innerHTML = `<span>${hasProgress ? t("continueFrom", { p }) : t("start")}</span>`;
  $("#btnFromStart").hidden = !hasProgress;
  const n = S.user?.pages_read;
  $("#introStat").textContent = hasProgress ? t("readStat", { n: n ?? "—", p }) : "";
}
function showIntro() {
  document.body.classList.remove("reading");
  $("#reader").classList.remove("active");
  const intro = $("#intro");
  intro.classList.remove("opening");
  intro.classList.add("active");
  $("#ayahPop").hidden = true;
  updateIntro();
  updateBackButton();
}
function openBook(page) {
  const intro = $("#intro");
  intro.classList.add("opening");
  flipSound();
  haptic("medium");
  setTimeout(() => {
    intro.classList.remove("active");
    $("#reader").classList.add("active");
    document.body.classList.add("reading");
    S.page = 0;
    renderPage(page, null);
    if (!store.get("dragHint", false)) { store.set("dragHint", true); setTimeout(() => toast(t("dragHint")), 1800); }
    updateBackButton();
  }, 1000);
}

// ---------------- oynalar ----------------
function openSheet(id) {
  const el = $(id);
  el.hidden = false;
  updateBackButton();
}
function closeSheet(el) {
  el.hidden = true;
  updateBackButton();
}

let listTab = "surah";
function renderList() {
  const q = $("#surahSearch").value.trim().toLowerCase();
  const list = $("#surahList");
  const curSurah = S.current[0]?.s;
  let html = "";
  if (listTab === "surah") {
    SURAH_NAMES.forEach(([uz, ru, ayahs], i) => {
      const n = i + 1;
      const m = S.meta?.surahs[i];
      const hay = `${n} ${uz} ${ru} ${m?.en || ""} ${m?.ar || ""}`.toLowerCase();
      if (q && !hay.includes(q)) return;
      const page = S.meta?.surahStart[i] || "";
      html += `<button class="row${n === curSurah ? " current" : ""}" data-page="${page}" data-surah="${n}">
        <span class="num">${n}</span><span class="nm"><b>${esc(S.lang === "ru" ? ru : uz)}</b>
        <small>${ayahs} ${t("ayahs")}${page ? ` · ${page}-${t("page")}` : ""}${m ? " · " + (m.type === "Meccan" ? t("meccan") : t("medinan")) : ""}</small></span>
        <span class="arn">${esc((m?.ar || "").replace(/^سُورَةُ\s*/, ""))}</span></button>`;
    });
  } else if (listTab === "juz") {
    for (let j = 1; j <= 30; j++) {
      const page = S.meta?.juzStart[j - 1] || 1;
      const [js, ja] = S.meta?.juzs[j - 1] || [1, 1];
      if (q && !String(j).includes(q)) continue;
      html += `<button class="row" data-page="${page}"><span class="num">${j}</span><span class="nm"><b>${j}-${t("juz")}</b>
        <small>${esc(surahLabel(js))} ${js}:${ja} · ${page}-${t("page")}</small></span><span class="arn">الجزء ${toArabicNum(j)}</span></button>`;
    }
  } else {
    const marks = [...S.marks].sort((a, b) => a.page - b.page);
    if (!marks.length) html = `<div class="empty">🔖 ${t("noMarks")}</div>`;
    marks.forEach((m) => {
      html += `<button class="row" data-page="${m.page}"><span class="num">🔖</span><span class="nm"><b>${m.page}-${t("page")}</b>
        <small>${esc(surahLabel(m.surah))}</small></span></button>`;
    });
  }
  list.innerHTML = html;
}

function renderStats() {
  const u = S.user;
  const page = S.progress.page || 1;
  $("#statGrid").innerHTML = `
    <div class="stat"><b>${u?.today ?? 0}</b><small>${t("today")}</small></div>
    <div class="stat"><b>${u?.pages_read ?? "—"}</b><small>${t("total")}</small></div>
    <div class="stat"><b>${TOTAL - page}</b><small>${t("left")}</small></div>`;
}

function renderTgBox() {
  const box = $("#tgBox");
  if (!box) return;
  if (IN_TG) {
    const u = S.user;
    const hour = u?.remind_hour ?? 20;
    const hours = [5, 6, 7, 8, 9, 12, 15, 18, 20, 21, 22, 23];
    box.innerHTML = `<h4>${t("tgTitle")}</h4><div class="setting" style="border:0;padding:4px 0">
      <span>${u?.remind ? t("remindOn") : t("remindOff")}</span>
      <label class="switch"><input type="checkbox" id="swRemind" ${u?.remind ? "checked" : ""}><span></span></label></div>
      <p>${t("tgInText")}</p><div class="hours">${hours.map((h) =>
      `<button class="chip ${h === hour ? "active" : ""}" data-hour="${h}">${String(h).padStart(2, "0")}:00</button>`).join("")}</div>`;
  } else if (cfg.bot_username) {
    const link = `https://t.me/${cfg.bot_username}?start=link_${S.webId}`;
    box.innerHTML = `<h4>${t("tgTitle")}</h4><p>${t("tgWebText")}</p>
      <a class="btn-tg" href="${link}" target="_blank" rel="noopener">✈️ ${t("tgConnect")}</a>`;
  } else {
    box.innerHTML = "";
    box.hidden = true;
    return;
  }
  box.hidden = false;
}

// ---------------- PWA o'rnatish ----------------
let deferredInstall = null;
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; });
window.addEventListener("appinstalled", () => toast(t("installed")));
async function doInstall() {
  if (deferredInstall) {
    deferredInstall.prompt();
    await deferredInstall.userChoice.catch(() => { });
    deferredInstall = null;
    return;
  }
  const steps = isIOS ? t("iosSteps") : t("andSteps");
  $("#installSteps").innerHTML = `<div class="big">${isIOS ? "" : "🤖"}📲</div><h4>${isIOS ? t("iosTitle") : t("andTitle")}</h4>
    <ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol>`;
  openSheet("#sheetInstall");
}
if ("serviceWorker" in navigator && !IN_TG) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => { }));
}

// ---------------- chiroq: yorug'lik ko'rsatkich ortidan yuradi ----------------
function moveLight(x, y) {
  const r = document.documentElement.style;
  r.setProperty("--mx", `${x}px`);
  r.setProperty("--my", `${y}px`);
  const rect = $("#page").getBoundingClientRect();
  r.setProperty("--lx", `${((x - rect.left) / rect.width) * 100}%`);
  r.setProperty("--ly", `${((y - rect.top) / rect.height) * 100}%`);
}
function setLamp(on) {
  S.lamp = on;
  store.set("lamp", on);
  applyLook();
  toast(on ? t("lampOn") : t("lampOff"));
  haptic("medium");
  if (on) {
    const rect = $("#page").getBoundingClientRect();
    moveLight(rect.left + rect.width / 2, rect.top + rect.height * 0.35);
  }
}

// ---------------- hodisalar ----------------
function bind() {
  $("#btnContinue").onclick = () => openBook(urlPage > 0 && !S.usedUrl ? (S.usedUrl = true, urlPage) : S.progress.page || 1);
  $("#btnFromStart").onclick = () => openBook(1);
  $("#book3d").onclick = () => $("#btnContinue").click();
  $$("[data-lang]").forEach((b) => (b.onclick = () => { store.set("langChosen", true); setLang(b.dataset.lang); api("/api/settings", { lang: b.dataset.lang }); }));

  $("#btnHome").onclick = showIntro;
  $("#btnNext").onclick = () => go(1);
  $("#btnPrev").onclick = () => go(-1);
  $("#btnTheme").onclick = () => { S.dark = !S.dark; store.set("dark", S.dark); applyLook(); haptic(); };
  $("#btnMode").onclick = () => {
    S.mode = { ar: "both", both: "tr", tr: "ar" }[S.mode];
    store.set("mode", S.mode); applyLook(); renderPage(S.page, null); haptic();
  };
  $("#lamp").onclick = () => setLamp(!S.lamp);
  $("#btnLamp").onclick = () => setLamp(!S.lamp);
  $("#swLamp").onchange = (e) => setLamp(e.target.checked);
  $("#swSound").onchange = (e) => { S.sound = e.target.checked; store.set("sound", S.sound); };
  $("#btnSurahs").onclick = () => { renderList(); openSheet("#sheetSurahs"); };
  $("#btnMenu").onclick = () => { renderStats(); renderTgBox(); $("#installRow").hidden = !!isStandalone() || IN_TG; openSheet("#sheetMenu"); };
  $("#btnGoto").onclick = () => {
    const v = prompt(`1–${TOTAL}`, S.page);
    if (v) goTo(parseInt(v, 10));
  };
  $("#btnInstall").onclick = doInstall;
  $("#btnBookmark").onclick = () => {
    const i = S.marks.findIndex((m) => m.page === S.page);
    if (i >= 0) { S.marks.splice(i, 1); toast(t("unbookmarked")); }
    else { S.marks.push({ page: S.page, surah: S.current[0]?.s || 1 }); toast(t("bookmarked")); }
    store.set("marks", S.marks);
  };

  $$("[data-close]").forEach((b) => (b.onclick = () => closeSheet(b.closest(".sheet"))));
  $$(".sheet").forEach((s) => s.addEventListener("click", (e) => { if (e.target === s) closeSheet(s); }));
  $$(".tab").forEach((b) => (b.onclick = () => {
    listTab = b.dataset.tab;
    $$(".tab").forEach((x) => x.classList.toggle("active", x === b));
    renderList();
  }));
  $("#surahSearch").oninput = renderList;
  $("#surahList").onclick = (e) => {
    const row = e.target.closest(".row");
    if (!row || !row.dataset.page) return;
    closeSheet($("#sheetSurahs"));
    goTo(parseInt(row.dataset.page, 10));
  };
  $("#segLang").onclick = (e) => { const v = e.target.dataset?.v; if (v) { store.set("langChosen", true); setLang(v); api("/api/settings", { lang: v }); } };
  $("#segMode").onclick = (e) => { const v = e.target.dataset?.v; if (v) { S.mode = v; store.set("mode", v); applyLook(); renderPage(S.page, null); } };
  $("#segFont").onclick = (e) => { const v = e.target.dataset?.v; if (v) { S.font = Math.max(-4, Math.min(8, S.font + Number(v))); store.set("font", S.font); applyLook(); } };
  $("#tgBox").addEventListener("click", async (e) => {
    const h = e.target.dataset?.hour;
    if (h) {
      const u = await api("/api/settings", { remind_hour: Number(h), remind: true });
      if (u) { S.user = u; renderTgBox(); toast(`🔔 ${String(h).padStart(2, "0")}:00`); haptic(); }
    }
  });
  $("#tgBox").addEventListener("change", async (e) => {
    if (e.target.id === "swRemind") {
      const u = await api("/api/settings", { remind: e.target.checked });
      if (u) { S.user = u; renderTgBox(); toast(u.remind ? t("remindOn") : t("remindOff")); }
    }
  });

  $("#page").addEventListener("click", (e) => {
    if (Date.now() - S.justDragged < 400) return;
    const retry = e.target.closest("[data-retry]");
    if (retry) { renderPage(parseInt(retry.dataset.retry, 10), null); return; }
    const ay = e.target.closest(".ayah");
    if (ay) openAyah(ay.dataset.k);
  });
  $("#apClose").onclick = () => { $("#ayahPop").hidden = true; $$(".ayah.active").forEach((x) => x.classList.remove("active")); };
  $("#apCopy").onclick = async () => {
    if (!popAyah) return;
    const text = `${popAyah.ar}\n\n${popAyah.tr}\n— ${surahLabel(popAyah.s)} ${popAyah.s}:${popAyah.n}`;
    try { await navigator.clipboard.writeText(text); toast(t("copied")); } catch { }
  };
  $("#apMark").onclick = () => {
    if (!popAyah) return;
    saveProgress(S.page, popAyah.s, popAyah.n, true);
    $$(".ayah.last").forEach((x) => x.classList.remove("last"));
    $$(`.ayah[data-k="${popAyah.s}:${popAyah.n}"]`).forEach((x) => x.classList.add("last"));
    $("#ayahPop").hidden = true;
    toast(t("savedPlace"));
    haptic("medium");
  };

  const slider = $("#pageSlider");
  slider.oninput = () => { $("#pageNum").textContent = slider.value; };
  slider.onchange = () => goTo(parseInt(slider.value, 10));

  // Klaviatura (o'ngdan chapga kitob: ← keyingi, → oldingi)
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("reading") || e.target.matches("input, textarea")) return;
    if (e.key === "ArrowLeft") go(1);
    else if (e.key === "ArrowRight") go(-1);
    else if (e.key === "Escape") { const open = $$(".sheet").find((s) => !s.hidden); if (open) closeSheet(open); }
  });

  // Qo'lda varaqlash: varaqni barmoq/sichqoncha bilan ushlab sudrang (o'ngga — keyingi, chapga — oldingi)
  const stage = $("#stage");
  let drag = null;
  stage.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || S.busy || e.target.closest(".nav-arrow, button, a")) return;
    drag = { x0: e.clientX, y0: e.clientY, t0: performance.now(), id: e.pointerId, active: false, p: 0 };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.active) {
      if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) {
        if (Math.abs(dy) > 16) drag = null; // vertikal — sahifa ichida aylantirish
        return;
      }
      const dir = dx > 0 ? 1 : -1;
      const target = S.page + dir;
      if (target < 1 || target > TOTAL || S.busy) { drag = null; haptic("rigid"); return; }
      const ready = S.ready.get(`${target}:${S.lang}:${S.mode}`);
      if (!ready) { drag = null; go(dir); return; }
      Object.assign(drag, { active: true, dir, target, ready, x0: e.clientX - Math.sign(dx) * 12 });
      S.busy = true;
      $("#ayahPop").hidden = true;
      document.body.classList.add("dragging");
      drag.leaf = makeLeaf($("#page").innerHTML, ready.html, dir > 0);
      flipSound();
      haptic("light");
      try { stage.setPointerCapture(e.pointerId); } catch { }
    }
    // Varaq cheti barmoq ostida qolishi uchun: chet x = w·(1 − cos θ)
    const rect = $("#book").getBoundingClientRect();
    const w = rect.width;
    const clampCos = (v) => Math.max(-1, Math.min(1, v));
    if (drag.dir > 0) {
      drag.p = Math.acos(clampCos(1 - (e.clientX - drag.x0) / w)) / Math.PI;
    } else {
      // orqaga: oldingi varaq o'ng tomondan keladi, chet barmoq turgan joyda
      drag.p = 1 - Math.acos(clampCos(1 - (e.clientX - rect.left) / w)) / Math.PI;
      if (drag.p0 === undefined) drag.p0 = drag.p;
    }
    drag.leaf.set(drag.p);
  });
  const endDrag = async (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag;
    drag = null;
    if (!d.active) return;
    S.justDragged = Date.now();
    document.body.classList.remove("dragging");
    const secs = (performance.now() - d.t0) / 1000;
    const moved = d.p - (d.p0 ?? 0);
    const complete = d.dir > 0 ? (d.p > 0.3 || (d.p > 0.08 && d.p / secs > 0.9)) : (d.p > 0.72 || (moved > 0.06 && moved / secs > 0.5));
    await d.leaf.finish(complete, complete ? 520 : 380);
    if (complete) { haptic("light"); commitPage(d.target, d.ready.ayahs); }
    S.busy = false;
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  // Chiroq yorug'ligi
  const track = (x, y) => { if (S.lamp) moveLight(x, y); };
  document.addEventListener("pointermove", (e) => track(e.clientX, e.clientY), { passive: true });
  document.addEventListener("touchmove", (e) => { const p = e.touches[0]; track(p.clientX, p.clientY); }, { passive: true });

  addEventListener("resize", applyLook);
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveProgress(S.progress.page, S.progress.surah, S.progress.ayah, true); });
}

// ---------------- ishga tushirish ----------------
async function init() {
  applyLook();
  applyI18n();
  bind();
  startSky($("#sky"));
  updateIntro();
  loadMeta().then((m) => { S.meta = m; if (!$("#sheetSurahs").hidden) renderList(); updateHeader(); }).catch(() => { });
  syncUser();
  // Telegram'dan yoki havoladan ma'lum sahifa bilan ochilsa — darrov kitobni ochamiz
  if (urlPage > 0 || IN_TG) {
    const startPage = urlPage > 0 ? urlPage : S.progress.page || 1;
    S.usedUrl = true;
    setTimeout(() => openBook(startPage), IN_TG ? 900 : 600);
  }
  const p = S.progress.page;
  if (p > 1 && !urlPage && !IN_TG) setTimeout(() => toast(t("welcomeBack", { p })), 900);
}
init();
