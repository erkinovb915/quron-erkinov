"""Asosiy server: sayt + Telegram mini ilova (bitta frontend), API, bot webhook va admin panel."""
import asyncio
import contextlib
import hashlib
import hmac
import html
import logging
import os
import re
import time

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import FileResponse, JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

from . import bot, db, subs
from . import telegram as tg

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("app")

WEB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web"))
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
CRON_KEY = os.environ.get("CRON_KEY", "")
WEBHOOK_SECRET = hashlib.sha256(("wh:" + tg.BOT_TOKEN).encode()).hexdigest()[:48]
WEB_ID_RE = re.compile(r"^[a-zA-Z0-9-]{8,64}$")
STATE = {"bot_username": os.environ.get("BOT_USERNAME", "")}


# ---------- yordamchilar ----------

async def body(request: Request) -> dict:
    try:
        data = await request.json()
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


async def identify(data: dict):
    """initData (Telegram) yoki webId (sayt) orqali foydalanuvchini aniqlaydi."""
    lang = data.get("lang") if data.get("lang") in ("uz", "ru") else None
    tg_user = tg.validate_init_data(data.get("initData") or "")
    if tg_user:
        code = (tg_user.get("language_code") or "").lower()
        user = await db.upsert_tg_user(tg_user["id"], tg_user.get("first_name") or "", tg_user.get("username") or "",
                                       lang or ("ru" if code == "ru" else "uz"), "miniapp")
        web_id = data.get("webId")
        if web_id and WEB_ID_RE.match(web_id) and not data.get("_merged"):
            await db.merge_web_into_tg(web_id, user["id"])
            user = await db.get_user(user["id"])
        return user
    web_id = data.get("webId") or ""
    if WEB_ID_RE.match(web_id):
        return await db.ensure_web_user(web_id, lang or "uz")
    return None


async def public_user(user: dict) -> dict:
    return {
        "id": user["id"], "telegram": bool(user.get("tg_id")), "name": user.get("first_name") or "",
        "lang": user.get("lang") or "uz", "page": int(user.get("page") or 1),
        "surah": int(user.get("surah") or 1), "ayah": int(user.get("ayah") or 1),
        "pages_read": int(user.get("pages_read") or 0), "today": await db.today_pages(user["id"]),
        "remind": bool(user.get("remind")), "remind_hour": int(user.get("remind_hour") or 20),
        "updated_at": user.get("updated_at"),
    }


def _int(v, lo, hi, default):
    try:
        return max(lo, min(hi, int(v)))
    except (TypeError, ValueError):
        return default


# ---------- ommaviy API ----------

async def api_config(request: Request):
    return JSONResponse({"bot_username": STATE["bot_username"], "total_pages": 604})


async def api_auth(request: Request):
    data = await body(request)
    user = await identify(data)
    if not user:
        return JSONResponse({"error": "auth"}, status_code=401)
    out = await public_user(user)
    out["admin"] = subs.is_admin_user(user)
    out["subscribe"] = []
    if user.get("tg_id") and not out["admin"] and tg.BOT_TOKEN:
        missing = await subs.missing_channels(int(user["tg_id"]), fresh=bool(data.get("recheck")))
        out["subscribe"] = [{"title": c["title"], "link": c["link"]} for c in missing]
    return JSONResponse(out)


async def api_progress(request: Request):
    data = await body(request)
    user = await identify(data)
    if not user:
        return JSONResponse({"error": "auth"}, status_code=401)
    user = await db.save_progress(user["id"], _int(data.get("page"), 1, 604, 1), _int(data.get("surah"), 1, 114, 1),
                                  _int(data.get("ayah"), 1, 286, 1),
                                  data.get("lang") if data.get("lang") in ("uz", "ru") else None)
    return JSONResponse(await public_user(user))


async def api_settings(request: Request):
    data = await body(request)
    user = await identify(data)
    if not user:
        return JSONResponse({"error": "auth"}, status_code=401)
    if "remind" in data:
        await db.set_field(user["id"], "remind", 1 if data["remind"] else 0)
    if "remind_hour" in data:
        await db.set_field(user["id"], "remind_hour", _int(data["remind_hour"], 0, 23, 20))
    if data.get("lang") in ("uz", "ru"):
        await db.set_field(user["id"], "lang", data["lang"])
    return JSONResponse(await public_user(await db.get_user(user["id"])))


async def tg_webhook(request: Request):
    if request.headers.get("x-telegram-bot-api-secret-token") != WEBHOOK_SECRET:
        return Response(status_code=403)
    update = await body(request)
    asyncio.create_task(bot.handle_update(update))
    return JSONResponse({"ok": True})


async def api_cron(request: Request):
    """Tashqi cron (GitHub Actions) chaqiradi: serverni uyg'otadi va eslatmalarni yuboradi."""
    # Xavfsiz: faqat vaqti kelgan eslatmalarni yuboradi (har kuni bir marta), boshqa hech narsa qilmaydi
    sent = await bot.send_due_reminders()
    return JSONResponse({"ok": True, "reminders_sent": sent})


async def health(request: Request):
    return JSONResponse({"ok": True, "time": int(time.time())})


# ---------- admin ----------

def make_token() -> str:
    exp = str(int(time.time()) + 7 * 24 * 3600)
    sig = hmac.new(ADMIN_PASSWORD.encode(), ("admin:" + exp).encode(), hashlib.sha256).hexdigest()
    return f"{exp}.{sig}"


def is_admin(request: Request) -> bool:
    if not ADMIN_PASSWORD:
        return False
    token = request.headers.get("authorization", "").removeprefix("Bearer ").strip()
    exp, _, sig = token.partition(".")
    if not exp.isdigit() or int(exp) < time.time():
        return False
    good = hmac.new(ADMIN_PASSWORD.encode(), ("admin:" + exp).encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(good, sig)


def deny():
    return JSONResponse({"error": "unauthorized"}, status_code=401)


async def admin_login(request: Request):
    data = await body(request)
    await asyncio.sleep(0.4)  # parol terishni sekinlashtirish
    if ADMIN_PASSWORD and hmac.compare_digest(str(data.get("password", "")), ADMIN_PASSWORD):
        return JSONResponse({"token": make_token()})
    return JSONResponse({"error": "bad_password"}, status_code=401)


async def admin_tg_login(request: Request):
    """Telegram ichida (mini ilova) ochilgan admin panel — parolsiz kirish, faqat adminlar uchun."""
    data = await body(request)
    tg_user = tg.validate_init_data(data.get("initData") or "")
    if tg_user:
        user = await db.get_user(f"tg:{tg_user['id']}")
        if subs.is_admin_user(user or {"tg_id": tg_user["id"]}) and ADMIN_PASSWORD:
            return JSONResponse({"token": make_token()})
    return JSONResponse({"error": "not_admin"}, status_code=401)


async def admin_channels(request: Request):
    if not is_admin(request):
        return deny()
    if request.method == "POST":
        data = await body(request)
        try:
            chat_id, title, link = await subs.resolve_channel(str(data.get("ref") or ""))
        except tg.TgError as e:
            msg = "Bot bu kanalda admin emas" if e.description == "bot_not_admin" else f"Kanal topilmadi: {e.description}"
            return JSONResponse({"error": msg}, status_code=400)
        await db.add_channel(chat_id, title, link)
    elif request.method == "DELETE":
        await db.remove_channel(request.query_params.get("id", ""))
    return JSONResponse({"channels": await db.list_channels()})


async def admin_stats(request: Request):
    if not is_admin(request):
        return deny()
    s = await db.stats()
    s["bot_username"] = STATE["bot_username"]
    s["bot_ok"] = bool(tg.BOT_TOKEN)
    return JSONResponse(s)


async def admin_users(request: Request):
    if not is_admin(request):
        return deny()
    q = (request.query_params.get("q") or "").strip()
    offset = _int(request.query_params.get("offset"), 0, 10 ** 7, 0)
    where, params = "", ()
    if q:
        where = "WHERE first_name LIKE ? OR username LIKE ? OR id LIKE ?"
        params = (f"%{q}%",) * 3
    rows = await db.q_all(
        f"SELECT id, tg_id, first_name, username, lang, page, surah, pages_read, remind, remind_hour, blocked, "
        f"is_admin, source, created_at, updated_at FROM users {where} ORDER BY updated_at DESC LIMIT 50 OFFSET {offset}",
        params)
    return JSONResponse({"users": rows})


def format_message(text: str) -> str:
    """Admin yozgan oddiy matnni xavfsiz HTML ga aylantiradi: **qalin**, __kursiv__."""
    s = html.escape(text.strip(), quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s, flags=re.S)
    s = re.sub(r"__(.+?)__", r"<i>\1</i>", s, flags=re.S)
    return s


async def admin_broadcast(request: Request):
    if not is_admin(request):
        return deny()
    data = await body(request)
    text = str(data.get("text") or "").strip()
    if not text:
        return JSONResponse({"error": "empty"}, status_code=400)
    if len(text) > 4000:
        return JSONResponse({"error": "too_long"}, status_code=400)
    target = data.get("target") if data.get("target") in ("all", "uz", "ru", "admins") else "all"
    bid = await bot.create_broadcast(format_message(text), target, bool(data.get("with_button", True)))
    return JSONResponse({"id": bid})


async def admin_broadcasts(request: Request):
    if not is_admin(request):
        return deny()
    rows = await db.q_all("SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 20")
    return JSONResponse({"broadcasts": rows})


async def admin_remind_now(request: Request):
    if not is_admin(request):
        return deny()
    data = await body(request)
    sent = await bot.send_due_reminders(force_hour=_int(data.get("hour"), 0, 23, 20))
    return JSONResponse({"sent": sent})


async def admin_page(request: Request):
    return FileResponse(os.path.join(WEB_DIR, "admin.html"))


# ---------- ishga tushish ----------

@contextlib.asynccontextmanager
async def lifespan(app):
    await db.init()
    tasks = [asyncio.create_task(bot.reminder_loop())]
    if tg.BOT_TOKEN:
        try:
            me = await tg.call("getMe")
            STATE["bot_username"] = me.get("username", "")
        except Exception:
            log.exception("getMe xatosi")
        await bot.setup(WEBHOOK_SECRET)
    yield
    for task in tasks:
        task.cancel()


class CachedStatic(StaticFiles):
    async def get_response(self, path, scope):
        resp = await super().get_response(path, scope)
        if path.endswith(("sw.js", ".html")) or path in ("", "."):
            resp.headers["Cache-Control"] = "no-cache"
        elif resp.status_code == 200:
            resp.headers["Cache-Control"] = "public, max-age=3600"
        return resp


routes = [
    Route("/health", health),
    Route("/api/config", api_config),
    Route("/api/auth", api_auth, methods=["POST"]),
    Route("/api/progress", api_progress, methods=["POST"]),
    Route("/api/settings", api_settings, methods=["POST"]),
    Route("/api/cron", api_cron, methods=["GET", "POST"]),
    Route("/tg/webhook", tg_webhook, methods=["POST"]),
    Route("/admin", admin_page),
    Route("/api/admin/login", admin_login, methods=["POST"]),
    Route("/api/admin/stats", admin_stats),
    Route("/api/admin/tg-login", admin_tg_login, methods=["POST"]),
    Route("/api/admin/channels", admin_channels, methods=["GET", "POST", "DELETE"]),
    Route("/api/admin/users", admin_users),
    Route("/api/admin/broadcast", admin_broadcast, methods=["POST"]),
    Route("/api/admin/broadcasts", admin_broadcasts),
    Route("/api/admin/remind", admin_remind_now, methods=["POST"]),
    Mount("/", CachedStatic(directory=WEB_DIR, html=True)),
]

CORS_HEADERS = [
    (b"access-control-allow-origin", b"*"),
    (b"access-control-allow-headers", b"Content-Type"),
    (b"access-control-allow-methods", b"GET, POST, OPTIONS"),
]


class PublicCORS:
    """Vercel'dagi sayt nusxasi ham shu API'dan foydalana olishi uchun (admin API bundan mustasno)."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "") if scope["type"] == "http" else ""
        if not path.startswith("/api/") or path.startswith("/api/admin"):
            return await self.app(scope, receive, send)
        if scope.get("method") == "OPTIONS":
            await send({"type": "http.response.start", "status": 204, "headers": CORS_HEADERS})
            await send({"type": "http.response.body", "body": b""})
            return

        async def send_with_cors(message):
            if message["type"] == "http.response.start":
                message["headers"] = list(message.get("headers", [])) + CORS_HEADERS
            await send(message)

        await self.app(scope, receive, send_with_cors)


app = PublicCORS(Starlette(routes=routes, lifespan=lifespan))
