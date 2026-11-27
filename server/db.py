"""Ma'lumotlar bazasi.

DATABASE_URL (postgres://...) berilsa PostgreSQL ishlatiladi (Render),
aks holda lokal SQLite fayli (sinov uchun).
Barcha SQL ikkala bazada ham ishlaydigan qilib yozilgan, joy belgisi: ?
"""
import asyncio
import os
import sqlite3
import threading
from datetime import datetime, timezone

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
IS_PG = DATABASE_URL.startswith("postgres")

if IS_PG:
    import psycopg
    from psycopg.rows import dict_row

_lock = threading.Lock()
_sqlite = None
_pg = None


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _conn():
    global _sqlite, _pg
    if IS_PG:
        if _pg is None or _pg.closed:
            _pg = psycopg.connect(DATABASE_URL, autocommit=True, row_factory=dict_row)
        return _pg
    if _sqlite is None:
        path = os.environ.get("SQLITE_PATH", os.path.join(os.path.dirname(__file__), "data.db"))
        _sqlite = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        _sqlite.row_factory = sqlite3.Row
    return _sqlite


def _run(sql: str, params=(), fetch: str = "all"):
    global _pg
    if IS_PG:
        sql = sql.replace("?", "%s")
    with _lock:
        for attempt in range(2):
            try:
                cur = _conn().cursor()
                cur.execute(sql, params)
                if fetch == "one":
                    row = cur.fetchone()
                    return dict(row) if row else None
                if fetch == "all":
                    return [dict(r) for r in cur.fetchall()]
                return cur.rowcount
            except Exception:
                # PostgreSQL ulanishi uzilgan bo'lsa bir marta qayta ulanamiz
                if IS_PG and attempt == 0:
                    try:
                        _pg.close()
                    except Exception:
                        pass
                    _pg = None
                    continue
                raise


async def q_all(sql, params=()):
    return await asyncio.to_thread(_run, sql, params, "all")


async def q_one(sql, params=()):
    return await asyncio.to_thread(_run, sql, params, "one")


async def execute(sql, params=()):
    return await asyncio.to_thread(_run, sql, params, "none")


SCHEMA = [
    """CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tg_id BIGINT,
        first_name TEXT,
        username TEXT,
        lang TEXT DEFAULT 'uz',
        page INTEGER DEFAULT 1,
        surah INTEGER DEFAULT 1,
        ayah INTEGER DEFAULT 1,
        pages_read INTEGER DEFAULT 0,
        remind INTEGER DEFAULT 1,
        remind_hour INTEGER DEFAULT 20,
        last_reminded TEXT,
        blocked INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        source TEXT DEFAULT 'web',
        created_at TEXT,
        updated_at TEXT
    )""",
    "CREATE INDEX IF NOT EXISTS idx_users_tg ON users(tg_id)",
    """CREATE TABLE IF NOT EXISTS broadcasts (
        id TEXT PRIMARY KEY,
        text TEXT,
        target TEXT,
        with_button INTEGER DEFAULT 1,
        total INTEGER DEFAULT 0,
        sent INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'queued',
        created_at TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS channels (
        chat_id TEXT PRIMARY KEY,
        title TEXT,
        link TEXT,
        created_at TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS prayer_cache (
        region TEXT,
        ym TEXT,
        data TEXT,
        fetched_at TEXT,
        PRIMARY KEY (region, ym)
    )""",
    """CREATE TABLE IF NOT EXISTS prayer_sent (
        region TEXT,
        day TEXT,
        pkey TEXT,
        PRIMARY KEY (region, day, pkey)
    )""",
    """CREATE TABLE IF NOT EXISTS push_subs (
        endpoint TEXT PRIMARY KEY,
        data TEXT,
        region TEXT,
        lang TEXT,
        prayer INTEGER DEFAULT 1,
        daily INTEGER DEFAULT 1,
        web_id TEXT,
        created_at TEXT
    )""",
    """CREATE TABLE IF NOT EXISTS daily_reads (
        user_id TEXT,
        day TEXT,
        pages INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, day)
    )""",
]


MIGRATIONS = [
    "ALTER TABLE users ADD COLUMN region TEXT DEFAULT 'toshkent-shahri'",
    "ALTER TABLE users ADD COLUMN prayer_notify INTEGER DEFAULT 0",
    "ALTER TABLE broadcasts ADD COLUMN src_chat BIGINT",
    "ALTER TABLE broadcasts ADD COLUMN src_msg BIGINT",
]


def init_sync():
    for stmt in SCHEMA:
        _run(stmt, (), "none")
    for stmt in MIGRATIONS:
        try:
            _run(stmt, (), "none")
        except Exception:
            pass  # ustun allaqachon bor


async def init():
    await asyncio.to_thread(init_sync)


# ---------- foydalanuvchilar ----------

async def get_user(uid: str):
    return await q_one("SELECT * FROM users WHERE id = ?", (uid,))


async def upsert_tg_user(tg_id: int, first_name: str, username: str, lang: str | None, source: str):
    uid = f"tg:{tg_id}"
    now = now_iso()
    existing = await get_user(uid)
    if existing:
        await execute(
            # updated_at faqat o'qish joyi o'zgarganda yangilanadi (sayt bilan birlashtirishda solishtiriladi)
            "UPDATE users SET first_name = ?, username = ?, blocked = 0 WHERE id = ?",
            (first_name, username, uid),
        )
    else:
        await execute(
            "INSERT INTO users (id, tg_id, first_name, username, lang, source, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (uid, tg_id, first_name, username, lang or "uz", source, now, now),
        )
    return await get_user(uid)


async def ensure_web_user(web_id: str, lang: str):
    uid = f"web:{web_id}"
    if not await get_user(uid):
        now = now_iso()
        await execute(
            "INSERT INTO users (id, lang, source, remind, created_at, updated_at) VALUES (?, ?, 'web', 0, ?, ?)",
            (uid, lang, now, now),
        )
    return await get_user(uid)


async def save_progress(uid: str, page: int, surah: int, ayah: int, lang: str | None = None):
    now = now_iso()
    user = await get_user(uid)
    if not user:
        return None
    moved = 1 if int(user.get("page") or 0) != page else 0
    await execute(
        "UPDATE users SET page = ?, surah = ?, ayah = ?, pages_read = pages_read + ?, lang = COALESCE(?, lang), "
        "updated_at = ? WHERE id = ?",
        (page, surah, ayah, moved, lang, now, uid),
    )
    if moved:
        day = now[:10]
        await execute(
            "INSERT INTO daily_reads (user_id, day, pages) VALUES (?, ?, 1) "
            "ON CONFLICT (user_id, day) DO UPDATE SET pages = daily_reads.pages + 1",
            (uid, day),
        )
    return await get_user(uid)


async def set_field(uid: str, field: str, value):
    assert field in {"lang", "remind", "remind_hour", "last_reminded", "blocked", "is_admin", "region", "prayer_notify"}
    await execute(f"UPDATE users SET {field} = ? WHERE id = ?", (value, uid))


async def merge_web_into_tg(web_id: str, tg_uid: str):
    """Saytdagi o'qish joyini Telegram akkauntga ko'chiradi."""
    web = await get_user(f"web:{web_id}")
    tg = await get_user(tg_uid)
    if not web or not tg:
        return False
    tg_fresh = int(tg.get("pages_read") or 0) == 0 and int(tg.get("page") or 1) <= 1
    if int(web.get("page") or 1) > 1 and (tg_fresh or (web.get("updated_at") or "") >= (tg.get("updated_at") or "")):
        await execute(
            "UPDATE users SET page = ?, surah = ?, ayah = ?, pages_read = ?, updated_at = ? WHERE id = ?",
            (web["page"], web["surah"], web["ayah"],
             max(int(web.get("pages_read") or 0), int(tg.get("pages_read") or 0)), now_iso(), tg_uid),
        )
    return True


async def today_pages(uid: str) -> int:
    row = await q_one("SELECT pages FROM daily_reads WHERE user_id = ? AND day = ?", (uid, now_iso()[:10]))
    return int(row["pages"]) if row else 0


async def stats():
    def one(sql, params=()):
        return q_one(sql, params)

    today = now_iso()[:10]
    total = await one("SELECT COUNT(*) AS c FROM users")
    tg = await one("SELECT COUNT(*) AS c FROM users WHERE tg_id IS NOT NULL")
    active = await one("SELECT COUNT(*) AS c FROM users WHERE tg_id IS NOT NULL AND blocked = 0")
    web = await one("SELECT COUNT(*) AS c FROM users WHERE tg_id IS NULL")
    today_active = await one("SELECT COUNT(DISTINCT user_id) AS c FROM daily_reads WHERE day = ?", (today,))
    today_pages_row = await one("SELECT COALESCE(SUM(pages), 0) AS c FROM daily_reads WHERE day = ?", (today,))
    uz = await one("SELECT COUNT(*) AS c FROM users WHERE tg_id IS NOT NULL AND lang = 'uz'")
    ru = await one("SELECT COUNT(*) AS c FROM users WHERE tg_id IS NOT NULL AND lang = 'ru'")
    reminders = await one("SELECT COUNT(*) AS c FROM users WHERE tg_id IS NOT NULL AND remind = 1 AND blocked = 0")
    return {
        "total": total["c"], "telegram": tg["c"], "telegram_active": active["c"], "web": web["c"],
        "today_readers": today_active["c"], "today_pages": int(today_pages_row["c"]),
        "uz": uz["c"], "ru": ru["c"], "reminders": reminders["c"],
    }


# ---------- majburiy obuna kanallari ----------

async def list_channels():
    return await q_all("SELECT * FROM channels ORDER BY created_at")


async def add_channel(chat_id: str, title: str, link: str):
    await execute("DELETE FROM channels WHERE chat_id = ?", (chat_id,))
    await execute("INSERT INTO channels (chat_id, title, link, created_at) VALUES (?, ?, ?, ?)",
                  (chat_id, title, link, now_iso()))


async def remove_channel(chat_id: str):
    await execute("DELETE FROM channels WHERE chat_id = ?", (chat_id,))
