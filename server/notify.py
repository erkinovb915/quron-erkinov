"""Namoz vaqti eslatmalari (Telegram + Web Push) va saytga kundalik Qur'on eslatmasi."""
import logging
import random
from datetime import datetime

from . import db, prayer, webpush
from . import telegram as tg

log = logging.getLogger("notify")
CATCH_UP_MIN = 25  # server uxlab qolgan bo'lsa ham shu daqiqa ichida kechikib yuboriladi

LINES = {
    "uz": ["Namozga shoshiling 🤲", "Alloh qabul qilsin 🤲", "Namoz — mo'minning me'roji ✨", "Vaqtida o'qilgan namoz — eng afzal amal 🌿"],
    "ru": ["Спешите на молитву 🤲", "Да примет Аллах 🤲", "Намаз — опора религии ✨", "Лучшее дело — намаз вовремя 🌿"],
}


def _min(hm: str) -> int:
    h, m = hm.split(":")
    return int(h) * 60 + int(m)


def prayer_message(lang: str, key: str, hm: str, region: str) -> str:
    name = prayer.NAMES.get(lang, prayer.NAMES["uz"])[key]
    if lang == "ru":
        head = f"🕌 <b>Наступило время намаза {name}</b> — {hm}"
    else:
        head = f"🕌 <b>{name} namozi vaqti kirdi</b> — {hm}"
    return f"{head}\n📍 {prayer.region_name(region, lang)}\n\n{random.choice(LINES.get(lang, LINES['uz']))}"


async def _claim(region: str, day: str, key: str) -> bool:
    """Shu namoz uchun eslatma hali yuborilmagan bo'lsa — belgilab, True qaytaradi (takror yubormaslik uchun)."""
    n = await db.execute("INSERT INTO prayer_sent (region, day, pkey) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
                         (region, day, key))
    return bool(n)


async def prayer_tick(now: datetime | None = None, open_button=None) -> int:
    now = now or datetime.now(prayer.TASHKENT)
    today = now.date()
    now_min = now.hour * 60 + now.minute
    tg_rows = await db.q_all("SELECT DISTINCT region FROM users WHERE tg_id IS NOT NULL AND prayer_notify = 1 AND blocked = 0")
    push_rows = await db.q_all("SELECT DISTINCT region FROM push_subs WHERE prayer = 1")
    regions = {prayer.valid_region(r["region"]) for r in tg_rows + push_rows}
    total = 0
    for region in regions:
        day = await prayer.get_day(region, today)
        for key in prayer.PRAYER_KEYS:
            t = _min(day["times"][key])
            if not (0 <= now_min - t <= CATCH_UP_MIN):
                continue
            if not await _claim(region, day["date"], key):
                continue
            hm = day["times"][key]
            # Telegram
            users = await db.q_all(
                "SELECT * FROM users WHERE tg_id IS NOT NULL AND prayer_notify = 1 AND blocked = 0 AND region = ?",
                (region,))
            if region == prayer.DEFAULT_REGION:
                users += await db.q_all(
                    "SELECT * FROM users WHERE tg_id IS NOT NULL AND prayer_notify = 1 AND blocked = 0 AND region IS NULL")
            for u in users:
                lang = u.get("lang") or "uz"
                try:
                    await tg.send(u["tg_id"], prayer_message(lang, key, hm, region), open_button(u) if open_button else None)
                    total += 1
                except tg.TgError as e:
                    if e.code == 403:
                        await db.set_field(u["id"], "blocked", 1)
            # Web Push
            subs = await db.q_all("SELECT * FROM push_subs WHERE prayer = 1 AND region = ?", (region,))

            def payload(row, key=key, hm=hm, region=region):
                lang = row.get("lang") or "uz"
                name = prayer.NAMES.get(lang, prayer.NAMES["uz"])[key]
                title = f"🕌 Время намаза {name} — {hm}" if lang == "ru" else f"🕌 {name} vaqti kirdi — {hm}"
                body = f"{prayer.region_name(region, lang)} · {random.choice(LINES.get(lang, LINES['uz']))}"
                return {"title": title, "body": body, "url": "/?view=prayer", "tag": f"prayer-{key}"}

            total += await webpush.send_to(subs, payload)
            log.info("Namoz eslatmasi: %s %s %s", region, key, hm)
    return total


async def daily_push_tick(now: datetime | None = None) -> int:
    """Saytdagi (o'rnatilgan ilova) foydalanuvchilarga har kuni 20:00 da Qur'on o'qish eslatmasi."""
    now = now or datetime.now(prayer.TASHKENT)
    if now.hour != 20:
        return 0
    if not await _claim("_daily", now.date().isoformat(), "quran"):
        return 0
    subs = await db.q_all("SELECT p.*, u.page AS page FROM push_subs p LEFT JOIN users u ON u.id = 'web:' || p.web_id WHERE p.daily = 1")

    def payload(row):
        lang = row.get("lang") or "uz"
        page = row.get("page") or 1
        if lang == "ru":
            return {"title": "📖 Время чтения Корана", "body": f"Вы остановились на стр. {page}. Продолжим?", "url": f"/?p={page}"}
        return {"title": "📖 Qur'on o'qish vaqti", "body": f"Siz {page}-sahifada to'xtagansiz. Davom etamizmi?", "url": f"/?p={page}"}

    return await webpush.send_to(subs, payload)
