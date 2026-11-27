// Qur'on ma'lumotlari: api.alquran.cloud (Madina mushafi, 604 sahifa)
import { cyrToLat } from "./translit.js?v=12";

const API = "https://api.alquran.cloud/v1";
const EDITIONS = { ar: "quran-uthmani", uz: "uz.sodik", ru: "ru.kuliev" };
const mem = new Map();

async function getJSON(url, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      // 12 soniyada javob kelmasa — qayta urinamiz (aks holda sahifa "qotib" qoladi)
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (j.code !== 200) throw new Error(j.status || "API");
      return j.data;
    } catch (e) {
      lastErr = e;
      await new Promise((res) => setTimeout(res, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* to'lgan bo'lsa ham ishlayveradi */ }
}

// ---- Meta: suralar, poralar, sahifa boshlari ----
let metaPromise = null;
export function loadMeta() {
  if (metaPromise) return metaPromise;
  metaPromise = (async () => {
    const cached = lsGet("q:meta:v1");
    if (cached) return cached;
    const d = await getJSON(`${API}/meta`);
    const meta = {
      surahs: d.surahs.references.map((s) => ({ n: s.number, ar: s.name, en: s.englishName, ayahs: s.numberOfAyahs, type: s.revelationType })),
      pages: d.pages.references.map((p) => [p.surah, p.ayah]),
      juzs: d.juzs.references.map((j) => [j.surah, j.ayah]),
    };
    // Har bir sura qaysi sahifadan boshlanadi
    meta.surahStart = meta.surahs.map((s) => {
      let page = 1;
      for (let i = 0; i < meta.pages.length; i++) {
        const [ps, pa] = meta.pages[i];
        if (ps < s.n || (ps === s.n && pa <= 1)) page = i + 1; else break;
      }
      return page;
    });
    meta.juzStart = meta.juzs.map(([s, a]) => {
      let page = 1;
      for (let i = 0; i < meta.pages.length; i++) {
        const [ps, pa] = meta.pages[i];
        if (ps < s || (ps === s && pa <= a)) page = i + 1; else break;
      }
      return page;
    });
    lsSet("q:meta:v1", meta);
    return meta;
  })().catch((e) => { metaPromise = null; throw e; });
  return metaPromise;
}

export function juzOfPage(meta, page) {
  let j = 1;
  meta.juzStart.forEach((p, i) => { if (p <= page) j = i + 1; });
  return j;
}

// ---- Sahifa: arabcha + tarjima ----
function stripBasmala(text, surah, n) {
  if (surah === 1 || n !== 1) return text;
  const plain = text.replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/ٱ/g, "ا");
  if (plain.startsWith("بسم")) return text.split(" ").slice(4).join(" ").trim();
  return text;
}

async function fetchEdition(page, ed) {
  const key = `q:p:${ed}:${page}`;
  if (mem.has(key)) return mem.get(key);
  const p = (async () => {
    const cached = lsGet(key);
    if (cached) return cached;
    const d = await getJSON(`${API}/page/${page}/${ed}`);
    const ayahs = d.ayahs.map((a) => ({
      g: a.number, s: a.surah.number, n: a.numberInSurah, juz: a.juz, sajda: !!a.sajda, t: a.text,
    }));
    lsSet(key, ayahs);
    return ayahs;
  })();
  mem.set(key, p);
  p.catch(() => mem.delete(key));
  return p;
}

export async function loadPage(page, lang) {
  const [ar, tr] = await Promise.all([
    fetchEdition(page, EDITIONS.ar),
    fetchEdition(page, EDITIONS[lang] || EDITIONS.uz),
  ]);
  return ar.map((a, i) => ({
    ...a,
    ar: stripBasmala(a.t, a.s, a.n),
    tr: tr[i] ? (lang === "uz" ? cyrToLat(tr[i].t) : tr[i].t) : "",
  }));
}

export function prefetch(page, lang) {
  if (page < 1 || page > 604) return;
  loadPage(page, lang).catch(() => {});
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export const toArabicNum = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]);
