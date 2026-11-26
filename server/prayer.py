"""Namoz vaqtlari.

Asosiy manba: namoz-vaqti.uz (O'zbekiston musulmonlari idorasining rasmiy jadvaliga asoslangan) —
har bir hudud uchun oylik jadval yuklab olinadi va bazada saqlanadi (bir oyga bir marta so'rov).
Zaxira: manba ishlamasa, vaqtlar astronomik formula bilan hisoblanadi (rasmiy jadvalga moslab sozlangan).
"""
import asyncio
import json
import logging
import math
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

from . import db

log = logging.getLogger("prayer")
TASHKENT = timezone(timedelta(hours=5))
KEYS = ["bomdod", "quyosh", "peshin", "asr", "shom", "xufton"]
PRAYER_KEYS = ["bomdod", "peshin", "asr", "shom", "xufton"]  # eslatma yuboriladiganlar (quyosh — namoz emas)

# slug, o'zbekcha, ruscha, kenglik, uzunlik
REGIONS = [
    ("toshkent-shahri", "Toshkent", "Ташкент", 41.2995, 69.2401),
    ("andijon-shahri", "Andijon", "Андижан", 40.7821, 72.3442),
    ("namangan-shahri", "Namangan", "Наманган", 40.9983, 71.6726),
    ("fargona-shahri", "Farg'ona", "Фергана", 40.3842, 71.7843),
    ("qoqon-shahri", "Qo'qon", "Коканд", 40.5286, 70.9425),
    ("samarqand-shahri", "Samarqand", "Самарканд", 39.6542, 66.9597),
    ("buxoro-shahri", "Buxoro", "Бухара", 39.7747, 64.4286),
    ("navoiy-shahri", "Navoiy", "Навои", 40.0844, 65.3792),
    ("jizzax-shahri", "Jizzax", "Джизак", 40.1158, 67.8422),
    ("guliston-shahri", "Guliston", "Гулистан", 40.4897, 68.7842),
    ("qarshi-shahri", "Qarshi", "Карши", 38.8606, 65.7891),
    ("shahrisabz-shahri", "Shahrisabz", "Шахрисабз", 39.0578, 66.8342),
    ("termiz-shahri", "Termiz", "Термез", 37.2242, 67.2783),
    ("urganch-shahri", "Urganch", "Ургенч", 41.5500, 60.6333),
    ("xiva-shahri", "Xiva", "Хива", 41.3783, 60.3639),
    ("nukus-shahri", "Nukus", "Нукус", 42.4600, 59.6100),
    ("chirchiq", "Chirchiq", "Чирчик", 41.4689, 69.5822),
    ("angren", "Angren", "Ангрен", 41.0167, 70.1436),
    ("olmaliq", "Olmaliq", "Алмалык", 40.8447, 69.5983),
]
REGION_MAP = {r[0]: r for r in REGIONS}
DEFAULT_REGION = "toshkent-shahri"
NAMES = {
    "uz": {"bomdod": "Bomdod", "quyosh": "Quyosh", "peshin": "Peshin", "asr": "Asr", "shom": "Shom", "xufton": "Xufton"},
    "ru": {"bomdod": "Фаджр", "quyosh": "Восход", "peshin": "Зухр", "asr": "Аср", "shom": "Магриб", "xufton": "Иша"},
}

_mem: dict[tuple, dict] = {}  # (region, "YYYY-MM") -> {"YYYY-MM-DD": {key: "HH:MM"}}
_fail: dict[tuple, float] = {}  # manba ishlamasa — 20 daqiqa qayta urinmaymiz (zaxira hisob ishlaydi)


def region_name(slug: str, lang: str = "uz") -> str:
    r = REGION_MAP.get(slug) or REGION_MAP[DEFAULT_REGION]
    return r[2] if lang == "ru" else r[1]


def valid_region(slug: str | None) -> str:
    return slug if slug in REGION_MAP else DEFAULT_REGION


# ---------------- zaxira: astronomik hisob ----------------

def _julian(y, m, d):
    if m <= 2:
        y -= 1
        m += 12
    a = y // 100
    b = 2 - a + a // 4
    return int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + b - 1524.5


def calculate(day: date, lat: float, lng: float) -> dict:
    """Rasmiy jadvalga moslab sozlangan hisob (o'rtacha farq ~1 daqiqa)."""
    jd = _julian(day.year, day.month, day.day) - lng / 360 + 0.5
    d = jd - 2451545.0
    g = math.radians((357.529 + 0.98560028 * d) % 360)
    q = (280.459 + 0.98564736 * d) % 360
    lam = math.radians((q + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g)) % 360)
    e = math.radians(23.439 - 0.00000036 * d)
    ra = math.degrees(math.atan2(math.cos(e) * math.sin(lam), math.cos(lam))) / 15
    decl = math.asin(math.sin(e) * math.sin(lam))
    eqt = q / 15 - (ra % 24)
    eqt = (eqt + 12) % 24 - 12
    noon = 12 + 5 - lng / 15 - eqt
    phi = math.radians(lat)

    def ha(angle):
        c = (-math.sin(math.radians(angle)) - math.sin(phi) * math.sin(decl)) / (math.cos(phi) * math.cos(decl))
        return math.degrees(math.acos(max(-1.0, min(1.0, c)))) / 15

    asr_angle = -math.degrees(math.atan(1 / (2 + math.tan(abs(phi - decl)))))  # Hanafiy
    raw = {
        "bomdod": noon - ha(16.5) + 5 / 60,
        "quyosh": noon - ha(0.833),
        "peshin": noon,
        "asr": noon + ha(asr_angle) + 1 / 60,
        "shom": noon + ha(3) - 8 / 60,
        "xufton": noon + ha(17.5) - 11 / 60,
    }
    out = {}
    for k, h in raw.items():
        m = round(((h % 24) * 60))
        out[k] = f"{(m // 60) % 24:02d}:{m % 60:02d}"
    return out


# ---------------- asosiy manba ----------------

def _fetch_month_sync(slug: str, ym: str) -> dict:
    qs = urllib.parse.urlencode({"region": slug, "lang": "lotin", "period": ym, "format": "json"})
    req = urllib.request.Request(f"https://namoz-vaqti.uz/index.php?{qs}",
                                 headers={"Accept": "application/json", "User-Agent": "QuronErkinovBot/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read().decode())
    days = {}
    for row in data.get("period_table") or []:
        dd, mm, yy = row["date"].split(".")
        times = row.get("times") or {}
        if all(k in times for k in KEYS):
            days[f"{yy}-{mm}-{dd}"] = {k: times[k] for k in KEYS}
    if len(days) < 25:
        raise ValueError(f"{slug} {ym}: jadval to'liq emas ({len(days)} kun)")
    return days


async def get_month(slug: str, ym: str, refresh: bool = False) -> dict | None:
    key = (slug, ym)
    if key in _mem and not refresh:
        return _mem[key]
    if not refresh:
        row = await db.q_one("SELECT data FROM prayer_cache WHERE region = ? AND ym = ?", (slug, ym))
        if row:
            _mem[key] = json.loads(row["data"])
            return _mem[key]
    import time as _time
    if _fail.get(key, 0) > _time.time() and not refresh:
        return _mem.get(key)
    try:
        days = await asyncio.to_thread(_fetch_month_sync, slug, ym)
    except Exception as e:
        _fail[key] = _time.time() + 20 * 60
        log.warning("namoz-vaqti.uz yuklanmadi (%s %s): %s", slug, ym, e)
        return _mem.get(key)
    await db.execute("DELETE FROM prayer_cache WHERE region = ? AND ym = ?", (slug, ym))
    await db.execute("INSERT INTO prayer_cache (region, ym, data, fetched_at) VALUES (?, ?, ?, ?)",
                     (slug, ym, json.dumps(days), db.now_iso()))
    _mem[key] = days
    return days


async def get_day(slug: str, day: date) -> dict:
    slug = valid_region(slug)
    month = await get_month(slug, day.strftime("%Y-%m"))
    iso = day.isoformat()
    if month and iso in month:
        return {"date": iso, "times": month[iso], "source": "official"}
    r = REGION_MAP[slug]
    return {"date": iso, "times": calculate(day, r[3], r[4]), "source": "calc"}


def today_tashkent() -> date:
    return datetime.now(TASHKENT).date()


async def prefetch_all():
    """Barcha hududlar uchun shu oy va keyingi oy jadvalini oldindan yuklab qo'yadi."""
    t = today_tashkent()
    nxt = (t.replace(day=1) + timedelta(days=32)).strftime("%Y-%m")
    for slug, *_ in REGIONS:
        for ym in (t.strftime("%Y-%m"), nxt):
            await get_month(slug, ym)
            await asyncio.sleep(0.3)


def regions_payload():
    return [{"slug": s, "uz": uz, "ru": ru, "lat": lat, "lng": lng} for s, uz, ru, lat, lng in REGIONS]
