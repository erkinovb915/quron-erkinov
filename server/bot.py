"""Telegram bot mantiqi: buyruqlar, tugmalar, kundalik eslatma va ommaviy xabar (broadcast)."""
import asyncio
import hmac
import logging
import os
import random
import uuid
from datetime import datetime, timedelta, timezone

from . import db
from . import telegram as tg
from .texts import surah_name, t

log = logging.getLogger("bot")

PUBLIC_URL = os.environ.get("PUBLIC_URL", "").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
TOTAL_PAGES = 604
TASHKENT = timezone(timedelta(hours=5))
REMIND_HOURS = [5, 6, 7, 8, 9, 12, 15, 18, 20, 21, 22, 23]


def app_url(page: int | None = None) -> str:
    base = PUBLIC_URL or "https://example.com"
    return f"{base}/?p={page}" if page else f"{base}/"


def main_menu(user: dict) -> dict:
    lang = user.get("lang") or "uz"
    page = int(user.get("page") or 1)
    open_text = t(lang, "continue", page=page) if page > 1 else t(lang, "open")
    return {"inline_keyboard": [
        [{"text": open_text, "web_app": {"url": app_url(page)}}],
        [{"text": t(lang, "where"), "callback_data": "where"}, {"text": t(lang, "remind"), "callback_data": "remind"}],
        [{"text": t(lang, "lang"), "callback_data": "lang"}],
    ]}


def open_button(user: dict) -> dict:
    lang = user.get("lang") or "uz"
    page = int(user.get("page") or 1)
    return {"inline_keyboard": [[{"text": t(lang, "continue", page=page) if page > 1 else t(lang, "open"),
                                  "web_app": {"url": app_url(page)}}]]}


async def where_text(user: dict) -> str:
    lang = user.get("lang") or "uz"
    if int(user.get("pages_read") or 0) == 0 and int(user.get("page") or 1) <= 1:
        return t(lang, "not_started")
    page = int(user.get("page") or 1)
    return t(lang, "where_text", page=page, surah=surah_name(user.get("surah") or 1, lang),
             ayah=user.get("ayah") or 1, today=await db.today_pages(user["id"]),
             total=user.get("pages_read") or 0, left=max(0, TOTAL_PAGES - page))


def remind_markup(user: dict) -> dict:
    lang = user.get("lang") or "uz"
    cur = int(user.get("remind_hour") or 20)
    hours = [{"text": ("• " if h == cur else "") + f"{h:02d}:00", "callback_data": f"rh:{h}"} for h in REMIND_HOURS]
    rows = [hours[i:i + 4] for i in range(0, len(hours), 4)]
    toggle = t(lang, "turn_off") if user.get("remind") else t(lang, "turn_on")
    rows.append([{"text": toggle, "callback_data": "rt"}])
    return {"inline_keyboard": rows}


def remind_text(user: dict) -> str:
    lang = user.get("lang") or "uz"
    return t(lang, "remind_menu", state=t(lang, "on") if user.get("remind") else t(lang, "off"),
             hour=f"{int(user.get('remind_hour') or 20):02d}")


LANG_MARKUP = {"inline_keyboard": [[{"text": "🇺🇿 O'zbekcha", "callback_data": "setlang:uz"},
                                    {"text": "🇷🇺 Русский", "callback_data": "setlang:ru"}]]}


async def _user_from(frm: dict) -> dict:
    code = (frm.get("language_code") or "").lower()
    lang = "ru" if code in ("ru", "be", "kk", "uk") else "uz"
    return await db.upsert_tg_user(frm["id"], frm.get("first_name") or "", frm.get("username") or "", lang, "bot")


async def handle_update(update: dict):
    try:
        if "message" in update:
            await _on_message(update["message"])
        elif "callback_query" in update:
            await _on_callback(update["callback_query"])
        elif "my_chat_member" in update:
            m = update["my_chat_member"]
            status = m.get("new_chat_member", {}).get("status")
            uid = f"tg:{m['from']['id']}"
            if status in ("kicked", "left"):
                await db.set_field(uid, "blocked", 1)
            elif status == "member":
                await db.set_field(uid, "blocked", 0)
    except Exception:
        log.exception("update xatosi")


async def _on_message(msg: dict):
    frm = msg.get("from") or {}
    if not frm.get("id") or msg.get("chat", {}).get("type") != "private":
        return
    user = await _user_from(frm)
    chat = msg["chat"]["id"]
    lang = user.get("lang") or "uz"
    text = (msg.get("text") or "").strip()
    cmd, _, arg = text.partition(" ")
    cmd = cmd.split("@")[0].lower()

    if cmd == "/start":
        if arg.startswith("link_"):
            if await db.merge_web_into_tg(arg[5:], user["id"]):
                user = await db.get_user(user["id"])
                await tg.send(chat, t(lang, "linked"))
        await tg.send(chat, t(lang, "welcome", name=_esc(frm.get("first_name") or "do'st")), main_menu(user))
    elif cmd in ("/davom", "/qayerda", "/where"):
        await tg.send(chat, await where_text(user), open_button(user))
    elif cmd in ("/eslatma", "/remind"):
        await tg.send(chat, remind_text(user), remind_markup(user))
    elif cmd in ("/til", "/lang"):
        await tg.send(chat, t(lang, "choose_lang"), LANG_MARKUP)
    elif cmd == "/admin":
        if ADMIN_PASSWORD and hmac.compare_digest(arg.strip(), ADMIN_PASSWORD):
            await db.set_field(user["id"], "is_admin", 1)
            await tg.send(chat, t(lang, "admin_ok", url=f"{PUBLIC_URL}/admin"))
        else:
            await tg.send(chat, t(lang, "admin_bad"))
    elif cmd == "/stats" and user.get("is_admin"):
        await tg.send(chat, t(lang, "stats", **(await db.stats())))
    elif "web_app_data" in msg:
        await tg.send(chat, await where_text(user), open_button(user))
    else:
        await tg.send(chat, t(lang, "help"), main_menu(user))


async def _on_callback(cq: dict):
    frm = cq["from"]
    user = await _user_from(frm)
    data = cq.get("data") or ""
    chat = cq.get("message", {}).get("chat", {}).get("id", frm["id"])
    mid = cq.get("message", {}).get("message_id")
    lang = user.get("lang") or "uz"
    answer = None

    if data == "where":
        await tg.send(chat, await where_text(user), open_button(user))
    elif data == "remind":
        await tg.send(chat, remind_text(user), remind_markup(user))
    elif data == "lang":
        await tg.send(chat, t(lang, "choose_lang"), LANG_MARKUP)
    elif data.startswith("setlang:"):
        new = data.split(":")[1]
        await db.set_field(user["id"], "lang", new)
        user = await db.get_user(user["id"])
        await tg.send(chat, t(new, "lang_set"), main_menu(user))
        await set_commands_for(frm["id"], new)
    elif data.startswith("rh:") or data == "rt":
        if data == "rt":
            await db.set_field(user["id"], "remind", 0 if user.get("remind") else 1)
        else:
            await db.set_field(user["id"], "remind_hour", int(data[3:]))
            await db.set_field(user["id"], "remind", 1)
        user = await db.get_user(user["id"])
        answer = t(lang, "saved")
        try:
            await tg.call("editMessageText", chat_id=chat, message_id=mid, text=remind_text(user),
                          parse_mode="HTML", reply_markup=remind_markup(user))
        except tg.TgError:
            pass
    try:
        await tg.call("answerCallbackQuery", callback_query_id=cq["id"], text=answer)
    except tg.TgError:
        pass


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------- sozlash ----------

COMMANDS = {
    "uz": [("start", "Bosh menyu"), ("davom", "Qayerda qoldim"), ("eslatma", "Kundalik eslatma"), ("til", "Tilni o'zgartirish")],
    "ru": [("start", "Главное меню"), ("davom", "Где я остановился"), ("eslatma", "Напоминание"), ("til", "Сменить язык")],
}


async def set_commands_for(chat_id: int, lang: str):
    try:
        await tg.call("setMyCommands", commands=[{"command": c, "description": d} for c, d in COMMANDS[lang]],
                      scope={"type": "chat", "chat_id": chat_id})
    except tg.TgError:
        pass


async def setup(webhook_secret: str):
    """Server ishga tushganda: webhook, buyruqlar va menyu tugmasini o'rnatadi."""
    if not tg.BOT_TOKEN or not PUBLIC_URL:
        log.warning("BOT_TOKEN yoki PUBLIC_URL yo'q — bot sozlanmadi")
        return
    try:
        await tg.call("setWebhook", url=f"{PUBLIC_URL}/tg/webhook", secret_token=webhook_secret,
                      allowed_updates=["message", "callback_query", "my_chat_member"], drop_pending_updates=False)
        await tg.call("setMyCommands", commands=[{"command": c, "description": d} for c, d in COMMANDS["uz"]])
        await tg.call("setMyCommands", commands=[{"command": c, "description": d} for c, d in COMMANDS["ru"]],
                      language_code="ru")
        await tg.call("setChatMenuButton", menu_button={"type": "web_app", "text": "📖 Qur'on",
                                                        "web_app": {"url": app_url()}})
        await tg.call("setMyDescription", description=(
            "📖 Qur'oni Karim — 3D varaqlanadigan mushaf, o'zbekcha va ruscha tarjima, "
            "chiroq, tungi rejim va har kuni eslatma.\n\nErkinov loyihasi"))
        await tg.call("setMyShortDescription", short_description="📖 Qur'on: 3D mushaf, tarjima va kundalik eslatma")
        log.info("Bot sozlandi")
    except Exception:
        log.exception("Bot sozlashda xato")


# ---------- kundalik eslatma ----------

async def send_due_reminders(force_hour: int | None = None) -> int:
    if not tg.BOT_TOKEN:
        return 0
    now = datetime.now(TASHKENT)
    hour = now.hour if force_hour is None else force_hour
    today = now.strftime("%Y-%m-%d")
    users = await db.q_all(
        "SELECT * FROM users WHERE tg_id IS NOT NULL AND blocked = 0 AND remind = 1 AND remind_hour = ? "
        "AND (last_reminded IS NULL OR last_reminded <> ?)", (hour, today))
    count = 0
    for u in users:
        lang = u.get("lang") or "uz"
        text = random.choice(t(lang, "reminders"))
        if int(u.get("page") or 1) > 1:
            text += t(lang, "reminder_tail", page=u["page"], surah=surah_name(u.get("surah") or 1, lang))
        await db.set_field(u["id"], "last_reminded", today)
        try:
            await tg.send(u["tg_id"], text, open_button(u))
            count += 1
        except tg.TgError as e:
            if e.code == 403:
                await db.set_field(u["id"], "blocked", 1)
        await asyncio.sleep(0.05)
    return count


async def reminder_loop():
    while True:
        try:
            n = await send_due_reminders()
            if n:
                log.info("Eslatma yuborildi: %s", n)
        except Exception:
            log.exception("eslatma xatosi")
        await asyncio.sleep(60)


# ---------- ommaviy xabar ----------

async def create_broadcast(text: str, target: str, with_button: bool) -> str:
    bid = uuid.uuid4().hex[:12]
    await db.execute(
        "INSERT INTO broadcasts (id, text, target, with_button, status, created_at) VALUES (?, ?, ?, ?, 'queued', ?)",
        (bid, text, target, 1 if with_button else 0, db.now_iso()))
    asyncio.create_task(run_broadcast(bid))
    return bid


async def run_broadcast(bid: str):
    b = await db.q_one("SELECT * FROM broadcasts WHERE id = ?", (bid,))
    if not b:
        return
    sql = "SELECT * FROM users WHERE tg_id IS NOT NULL AND blocked = 0"
    params: tuple = ()
    if b["target"] in ("uz", "ru"):
        sql += " AND lang = ?"
        params = (b["target"],)
    elif b["target"] == "admins":
        sql += " AND is_admin = 1"
    users = await db.q_all(sql, params)
    await db.execute("UPDATE broadcasts SET total = ?, status = 'sending' WHERE id = ?", (len(users), bid))
    sent = failed = 0
    for i, u in enumerate(users):
        try:
            await tg.send(u["tg_id"], b["text"], open_button(u) if b["with_button"] else None)
            sent += 1
        except tg.TgError as e:
            failed += 1
            if e.code == 403:
                await db.set_field(u["id"], "blocked", 1)
            elif e.code == 429:
                await asyncio.sleep(5)
        except Exception:
            failed += 1
        if i % 10 == 9:
            await db.execute("UPDATE broadcasts SET sent = ?, failed = ? WHERE id = ?", (sent, failed, bid))
        await asyncio.sleep(0.05)  # Telegram limiti: ~20 xabar/soniya
    await db.execute("UPDATE broadcasts SET sent = ?, failed = ?, status = 'done' WHERE id = ?", (sent, failed, bid))
