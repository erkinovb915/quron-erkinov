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
from . import prayer, notify

log = logging.getLogger("bot")

PUBLIC_URL = os.environ.get("PUBLIC_URL", "").rstrip("/")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
TOTAL_PAGES = 604
TASHKENT = timezone(timedelta(hours=5))
REMIND_HOURS = [5, 6, 7, 8, 9, 12, 15, 18, 20, 21, 22, 23]


def app_url(page: int | None = None) -> str:
    base = PUBLIC_URL or "https://example.com"
    return f"{base}/?p={page}" if page else f"{base}/"


def main_menu(user: dict, admin: bool = False) -> dict:
    lang = user.get("lang") or "uz"
    page = int(user.get("page") or 1)
    open_text = t(lang, "continue", page=page) if page > 1 else t(lang, "open")
    rows = [
        [{"text": open_text, "web_app": {"url": app_url(page)}}],
        [{"text": t(lang, "where"), "callback_data": "where"}, {"text": t(lang, "remind"), "callback_data": "remind"}],
        [{"text": t(lang, "prayer_btn"), "callback_data": "pr"}, {"text": t(lang, "tasbih_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=tasbih"}}],
        [{"text": t(lang, "duas_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=duas"}}, {"text": t(lang, "qibla_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=qibla"}}],
        [{"text": t(lang, "calendar_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=calendar"}}, {"text": t(lang, "names_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=names"}}],
        [{"text": t(lang, "islam_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=islam"}}, {"text": t(lang, "donate_btn"), "callback_data": "don"}],
        [{"text": t(lang, "stickers_btn"), "callback_data": "stk"}, {"text": t(lang, "lang"), "callback_data": "lang"}],
    ]
    if admin:
        rows.append([{"text": "👑 Admin menyu", "callback_data": "adm:menu"}])
    return {"inline_keyboard": rows}


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


# ---------- bo'limlar (mini ilova sahifalari) ----------
SECTION_CMDS = {
    "/duolar": ("duas", "duas_btn", "duas_text"), "/duo": ("duas", "duas_btn", "duas_text"),
    "/qibla": ("qibla", "qibla_btn", "qibla_text"), "/taqvim": ("calendar", "calendar_btn", "calendar_text"),
    "/ismlar": ("names", "names_btn", "names_text"), "/islom": ("islam", "islam_btn", "islam_text"),
}
DONATE_CARD = "4448 8444 0951 5858"
DONATE_OWNER = "Dusmatova Maxliyoxon"


def section_markup(lang: str, view: str, btn_key: str) -> dict:
    return {"inline_keyboard": [[{"text": t(lang, btn_key), "web_app": {"url": f"{PUBLIC_URL}/?view={view}"}}]]}


def donate_text(lang: str) -> str:
    return t(lang, "donate_text", card=DONATE_CARD, owner=DONATE_OWNER)


# ---------- namoz vaqtlari ----------

async def prayer_text(user: dict) -> str:
    lang = user.get("lang") or "uz"
    region = prayer.valid_region(user.get("region"))
    now = datetime.now(TASHKENT)
    day = await prayer.get_day(region, now.date())
    names = prayer.NAMES.get(lang, prayer.NAMES["uz"])
    now_min = now.hour * 60 + now.minute
    nxt = None
    for k in prayer.KEYS:
        h, m = day["times"][k].split(":")
        if int(h) * 60 + int(m) > now_min:
            nxt = k
            break
    lines = []
    icons = {"bomdod": "🌅", "quyosh": "☀️", "peshin": "🕛", "asr": "🌤", "shom": "🌇", "xufton": "🌙"}
    for k in prayer.KEYS:
        mark = " ◀️" if k == nxt else ""
        tm = f"<b>{day['times'][k]}</b>" if k == nxt else day["times"][k]
        lines.append(f"{icons[k]} {names[k]}: {tm}{mark}")
    if nxt:
        h, m = day["times"][nxt].split(":")
        left = int(h) * 60 + int(m) - now_min
        left_txt = (f"⏳ До {names[nxt]}: {left // 60} ч {left % 60} мин" if lang == "ru"
                    else f"⏳ {names[nxt]}gacha: {left // 60} soat {left % 60} daqiqa")
    else:
        left_txt = "🌙 Хорошей ночи" if lang == "ru" else "🌙 Xayrli tun"
    date_txt = now.strftime("%d.%m.%Y")
    head = (f"🕌 <b>Время намаза — {prayer.region_name(region, lang)}</b>\n📅 {date_txt}" if lang == "ru"
            else f"🕌 <b>Namoz vaqtlari — {prayer.region_name(region, lang)}</b>\n📅 {date_txt}")
    on = bool(user.get("prayer_notify"))
    rem = (("🔔 Напоминание: включено" if on else "🔕 Напоминание: выключено") if lang == "ru"
           else ("🔔 Eslatma: yoqilgan" if on else "🔕 Eslatma: o'chirilgan"))
    return f"{head}\n\n" + "\n".join(lines) + f"\n\n{left_txt}\n{rem}"


def prayer_markup(user: dict) -> dict:
    lang = user.get("lang") or "uz"
    region = prayer.valid_region(user.get("region"))
    on = bool(user.get("prayer_notify"))
    if lang == "ru":
        toggle = "🔕 Выключить напоминания" if on else "🔔 Включить напоминания"
        reg = f"📍 Город: {prayer.region_name(region, lang)}"
        app = "🕌 Открыть в приложении"
    else:
        toggle = "🔕 Eslatmani o'chirish" if on else "🔔 Har namozda eslatish"
        reg = f"📍 Hudud: {prayer.region_name(region, lang)}"
        app = "🕌 Ilovada ochish"
    return {"inline_keyboard": [
        [{"text": toggle, "callback_data": "prn"}],
        [{"text": reg, "callback_data": "prr"}, {"text": "🔄", "callback_data": "pr:upd"}],
        [{"text": app, "web_app": {"url": f"{PUBLIC_URL}/?view=prayer"}}],
    ]}


def region_markup(lang: str) -> dict:
    btns = [{"text": (ru if lang == "ru" else uz), "callback_data": f"prr:{slug}"} for slug, uz, ru, _, _ in prayer.REGIONS]
    return {"inline_keyboard": [btns[i:i + 3] for i in range(0, len(btns), 3)]}


# Admin "keyingi xabarni kutish" holati: {tg_id: "broadcast" | "channel"}
PENDING: dict[int, str] = {}
# Tasdiqlanishi kutilayotgan ommaviy xabar: {tg_id: (chat_id, message_id, target)}
DRAFTS: dict[int, tuple] = {}


def admin_menu() -> dict:
    return {"inline_keyboard": [
        [{"text": "📊 Statistika", "callback_data": "adm:stats"}, {"text": "📣 Xabar yuborish", "callback_data": "adm:bc"}],
        [{"text": "📢 Majburiy obuna", "callback_data": "adm:subs"}, {"text": "🔔 Eslatma sinovi", "callback_data": "adm:remind"}],
        [{"text": "🖥 Admin panel", "web_app": {"url": f"{PUBLIC_URL}/admin"}}],
    ]}


async def subs_menu_text_markup():
    channels = await db.list_channels()
    lines = ["📢 <b>Majburiy obuna kanallari</b>\n"]
    rows = []
    if not channels:
        lines.append("Hozircha kanal yo'q — majburiy obuna o'chiq.")
    for c in channels:
        lines.append(f"• {_esc(c['title'])} — {c['link']}")
        rows.append([{"text": f"🗑 {c['title']}", "callback_data": f"adm:rm:{c['chat_id']}"}])
    lines.append("\nQo'shish: botni kanalga <b>admin</b> qiling, so'ng «➕ Kanal qo'shish»ni bosing.")
    rows.append([{"text": "➕ Kanal qo'shish", "callback_data": "adm:add"}])
    return "\n".join(lines), {"inline_keyboard": rows}


async def _admin_input(msg: dict, user: dict, chat: int) -> bool:
    """Admin kutilgan narsani yuborgan bo'lsa qayta ishlaydi. True — xabar ishlatildi."""
    uid = msg["from"]["id"]
    mode = PENDING.get(uid)
    if not mode or (msg.get("text") or "").startswith("/"):
        PENDING.pop(uid, None)
        return False
    PENDING.pop(uid, None)
    if mode == "broadcast":
        DRAFTS[uid] = (chat, msg["message_id"], "all")
        total = (await db.stats())["telegram_active"]
        await tg.call("copyMessage", chat_id=chat, from_chat_id=chat, message_id=msg["message_id"])
        await tg.send(chat, f"☝️ Shu xabar <b>{total}</b> foydalanuvchiga yuboriladi. Tasdiqlaysizmi?", {"inline_keyboard": [
            [{"text": "✅ Hammaga", "callback_data": "bc:all"}],
            [{"text": "🇺🇿 Faqat o'zbekcha", "callback_data": "bc:uz"}, {"text": "🇷🇺 Faqat ruscha", "callback_data": "bc:ru"}],
            [{"text": "❌ Bekor qilish", "callback_data": "bc:cancel"}]]})
        return True
    if mode == "channel":
        fwd = msg.get("forward_origin", {}).get("chat") or msg.get("forward_from_chat")
        ref = str(fwd["id"]) if fwd else (msg.get("text") or "").strip()
        from . import subs
        try:
            chat_id, title, link = await subs.resolve_channel(ref)
            await db.add_channel(chat_id, title, link)
            await tg.send(chat, f"✅ <b>{_esc(title)}</b> majburiy obunaga qo'shildi.")
        except tg.TgError as e:
            why = ("Bot bu kanalda admin emas. Avval botni kanalga admin qiling."
                   if e.description == "bot_not_admin" else f"Kanal topilmadi: {_esc(str(e.description))}")
            await tg.send(chat, "❌ " + why)
        text, markup = await subs_menu_text_markup()
        await tg.send(chat, text, markup)
        return True
    return False


async def _on_message(msg: dict):
    from . import subs
    frm = msg.get("from") or {}
    if not frm.get("id") or msg.get("chat", {}).get("type") != "private":
        return
    user = await _user_from(frm)
    chat = msg["chat"]["id"]
    lang = user.get("lang") or "uz"
    text = (msg.get("text") or "").strip()
    cmd, _, arg = text.partition(" ")
    cmd = cmd.split("@")[0].lower()
    admin = subs.is_admin_user(user)

    if admin and await _admin_input(msg, user, chat):
        return

    if cmd == "/start" and arg.startswith("link_"):
        if await db.merge_web_into_tg(arg[5:], user["id"]):
            user = await db.get_user(user["id"])
            await tg.send(chat, t(lang, "linked"))

    if cmd == "/admin":
        if not admin and ADMIN_PASSWORD and hmac.compare_digest(arg.strip(), ADMIN_PASSWORD):
            await db.set_field(user["id"], "is_admin", 1)
            admin = True
        if admin:
            await tg.send(chat, "👑 <b>Admin menyu</b>\nNima qilamiz?", admin_menu())
        else:
            await tg.send(chat, t(lang, "admin_bad"))
        return

    # Majburiy obuna (adminlarga qo'llanmaydi)
    if not admin:
        missing = await subs.missing_channels(frm["id"])
        if missing:
            await tg.send(chat, subs.subscribe_text(lang), subs.subscribe_markup(missing, lang))
            return

    if cmd == "/start":
        await tg.send(chat, t(lang, "welcome", name=_esc(frm.get("first_name") or "do'st")), main_menu(user, admin))
    elif cmd in ("/davom", "/qayerda", "/where"):
        await tg.send(chat, await where_text(user), open_button(user))
    elif cmd in ("/eslatma", "/remind"):
        await tg.send(chat, remind_text(user), remind_markup(user))
    elif cmd in ("/til", "/lang"):
        await tg.send(chat, t(lang, "choose_lang"), LANG_MARKUP)
    elif cmd in ("/namoz", "/prayer"):
        await tg.send(chat, await prayer_text(user), prayer_markup(user))
    elif cmd in SECTION_CMDS:
        view, btn, txt = SECTION_CMDS[cmd]
        await tg.send(chat, t(lang, txt), section_markup(lang, view, btn))
    elif cmd in ("/hissa", "/donate"):
        await tg.send(chat, donate_text(lang), {"inline_keyboard": [[{"text": t(lang, "donate_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=donate"}}]]})
    elif cmd in ("/tasbeh", "/tasbih"):
        await tg.send(chat, t(lang, "tasbih_open"), {"inline_keyboard": [[{"text": t(lang, "tasbih_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=tasbih"}}]]})
    elif cmd in ("/stikerlar", "/stickers", "/stiker"):
        await send_stickers(chat, lang)
    elif cmd == "/stikeryarat" and admin:
        from . import stickers
        await tg.send(chat, "⏳ Stiker to'plamlari tayyorlanmoqda…")
        rep = await stickers.ensure(frm["id"])
        lines = [f"{'✅' if r['status'] != 'error' else '❌'} <b>{_esc(r['title'])}</b> — {r['status']} ({r['count']} ta)\n{r['url']}"
                 + (f"\n<code>{_esc(r.get('error', ''))}</code>" if r.get("error") else "") for r in rep]
        await tg.send(chat, "\n\n".join(lines))
    elif cmd == "/stats" and admin:
        await tg.send(chat, t(lang, "stats", **(await db.stats())))
    elif cmd == "/xabar" and admin:
        PENDING[frm["id"]] = "broadcast"
        await tg.send(chat, "📣 Hammaga yuboriladigan xabarni yuboring (matn, rasm, video, ovoz — istalgani).\nBekor qilish: /admin")
    elif "web_app_data" in msg:
        await tg.send(chat, await where_text(user), open_button(user))
    else:
        await tg.send(chat, t(lang, "help"), main_menu(user, admin))


async def send_stickers(chat: int, lang: str):
    from . import stickers
    rows, sample = [], None
    for item in await stickers.links():
        try:
            st = await tg.call("getStickerSet", name=item["name"])
        except tg.TgError:
            continue
        rows.append([{"text": t(lang, "st_" + item["key"]), "url": item["url"]}])
        if sample is None and item["key"] == "anim" and st.get("stickers"):
            sample = st["stickers"][0]["file_id"]
    if not rows:
        await tg.send(chat, t(lang, "stickers_none"))
        return
    if sample:
        try:
            await tg.call("sendSticker", chat_id=chat, sticker=sample)
        except tg.TgError:
            pass
    await tg.send(chat, t(lang, "stickers_text"), {"inline_keyboard": rows})


async def _on_callback(cq: dict):
    from . import subs
    frm = cq["from"]
    user = await _user_from(frm)
    data = cq.get("data") or ""
    chat = cq.get("message", {}).get("chat", {}).get("id", frm["id"])
    mid = cq.get("message", {}).get("message_id")
    lang = user.get("lang") or "uz"
    admin = subs.is_admin_user(user)
    answer = None
    alert = False

    if data == "checksub":
        missing = await subs.missing_channels(frm["id"], fresh=True)
        if missing:
            answer, alert = ("Hali hamma kanallarga obuna bo'lmadingiz" if lang != "ru" else "Вы ещё не подписались на все каналы"), True
        else:
            try:
                await tg.call("deleteMessage", chat_id=chat, message_id=mid)
            except tg.TgError:
                pass
            await tg.send(chat, t(lang, "welcome", name=_esc(frm.get("first_name") or "do'st")), main_menu(user, admin))
    elif not admin and data not in ("lang",) and not data.startswith("setlang:") and await subs.missing_channels(frm["id"]):
        missing = await subs.missing_channels(frm["id"])
        await tg.send(chat, subs.subscribe_text(lang), subs.subscribe_markup(missing, lang))
    elif data == "where":
        await tg.send(chat, await where_text(user), open_button(user))
    elif data == "stk":
        await send_stickers(chat, lang)
    elif data == "don":
        await tg.send(chat, donate_text(lang), {"inline_keyboard": [[{"text": t(lang, "donate_btn"), "web_app": {"url": f"{PUBLIC_URL}/?view=donate"}}]]})
    elif data in ("pr", "pr:upd"):
        if data == "pr":
            await tg.send(chat, await prayer_text(user), prayer_markup(user))
        else:
            answer = "🔄"
            try:
                await tg.call("editMessageText", chat_id=chat, message_id=mid, text=await prayer_text(user),
                              parse_mode="HTML", reply_markup=prayer_markup(user))
            except tg.TgError:
                pass
    elif data == "prn":
        await db.set_field(user["id"], "prayer_notify", 0 if user.get("prayer_notify") else 1)
        user = await db.get_user(user["id"])
        answer = ("🔔 Har namoz vaqtida eslataman" if user.get("prayer_notify") else "🔕 O'chirildi") if lang != "ru" else \
                 ("🔔 Буду напоминать о каждом намазе" if user.get("prayer_notify") else "🔕 Выключено")
        alert = True
        try:
            await tg.call("editMessageText", chat_id=chat, message_id=mid, text=await prayer_text(user),
                          parse_mode="HTML", reply_markup=prayer_markup(user))
        except tg.TgError:
            pass
    elif data == "prr":
        await tg.send(chat, "📍 Hududingizni tanlang:" if lang != "ru" else "📍 Выберите город:", region_markup(lang))
    elif data.startswith("prr:"):
        await db.set_field(user["id"], "region", prayer.valid_region(data[4:]))
        if not user.get("prayer_notify"):
            await db.set_field(user["id"], "prayer_notify", 1)
        user = await db.get_user(user["id"])
        answer = "✅"
        try:
            await tg.call("editMessageText", chat_id=chat, message_id=mid, text=await prayer_text(user),
                          parse_mode="HTML", reply_markup=prayer_markup(user))
        except tg.TgError:
            await tg.send(chat, await prayer_text(user), prayer_markup(user))
    elif data == "remind":
        await tg.send(chat, remind_text(user), remind_markup(user))
    elif data == "lang":
        await tg.send(chat, t(lang, "choose_lang"), LANG_MARKUP)
    elif data.startswith("setlang:"):
        new = data.split(":")[1]
        await db.set_field(user["id"], "lang", new)
        user = await db.get_user(user["id"])
        await tg.send(chat, t(new, "lang_set"), main_menu(user, admin))
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
    elif admin and data.startswith("adm:"):
        action = data[4:]
        if action == "menu":
            await tg.send(chat, "👑 <b>Admin menyu</b>", admin_menu())
        elif action == "stats":
            s = await db.stats()
            await tg.send(chat, (
                f"📊 <b>Statistika</b>\n\n👥 Jami: <b>{s['total']}</b>\n✈️ Telegram: <b>{s['telegram']}</b> "
                f"(faol: {s['telegram_active']})\n🌐 Sayt: <b>{s['web']}</b>\n📖 Bugun o'qiganlar: <b>{s['today_readers']}</b> "
                f"({s['today_pages']} sahifa)\n🇺🇿 {s['uz']} · 🇷🇺 {s['ru']}\n🔔 Eslatma yoqilgan: {s['reminders']}"),
                {"inline_keyboard": [[{"text": "⬅️ Admin menyu", "callback_data": "adm:menu"}]]})
        elif action == "bc":
            PENDING[frm["id"]] = "broadcast"
            await tg.send(chat, "📣 Hammaga yuboriladigan xabarni yuboring (matn, rasm, video, ovoz — istalgani).\nBekor qilish: /admin")
        elif action == "subs":
            text, markup = await subs_menu_text_markup()
            await tg.send(chat, text, markup)
        elif action == "add":
            PENDING[frm["id"]] = "channel"
            await tg.send(chat, "➕ Kanal @username'ini yozing yoki kanaldan istalgan postni shu yerga forward qiling.\n"
                                "⚠️ Bot o'sha kanalda admin bo'lishi shart.")
        elif action.startswith("rm:"):
            await db.remove_channel(action[3:])
            answer = "O'chirildi"
            text, markup = await subs_menu_text_markup()
            try:
                await tg.call("editMessageText", chat_id=chat, message_id=mid, text=text, parse_mode="HTML",
                              reply_markup=markup, link_preview_options={"is_disabled": True})
            except tg.TgError:
                pass
        elif action == "remind":
            n = await send_due_reminders(force_hour=datetime.now(TASHKENT).hour)
            answer, alert = f"Eslatma yuborildi: {n}", True
    elif admin and data.startswith("bc:"):
        draft = DRAFTS.pop(frm["id"], None)
        if data == "bc:cancel" or not draft:
            answer = "Bekor qilindi"
        else:
            src_chat, src_msg, _ = draft
            await create_broadcast("", data[3:], True, src_chat=src_chat, src_msg=src_msg)
            answer = "Yuborish boshlandi ✅"
            await tg.send(chat, "📤 Yuborilmoqda... Natijani admin panelda ko'rasiz.", admin_menu())
        try:
            await tg.call("deleteMessage", chat_id=chat, message_id=mid)
        except tg.TgError:
            pass
    try:
        await tg.call("answerCallbackQuery", callback_query_id=cq["id"], text=answer, show_alert=alert)
    except tg.TgError:
        pass


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------- sozlash ----------

COMMANDS = {
    "uz": [("start", "Bosh menyu"), ("namoz", "🕌 Namoz vaqtlari"), ("davom", "📖 Qayerda qoldim"), ("duolar", "🤲 Duolar va zikrlar"),
           ("qibla", "🧭 Qibla"), ("taqvim", "📅 Taqvim"), ("tasbeh", "📿 Tasbeh"), ("ismlar", "✨ Allohning 99 ismi"),
           ("islom", "☪️ Islom asoslari"), ("hissa", "💝 Loyihaga hissa qo'shish"), ("eslatma", "🔔 Kundalik eslatma"),
           ("stikerlar", "🎨 Stikerlar"), ("til", "🌐 Tilni o'zgartirish")],
    "ru": [("start", "Главное меню"), ("namoz", "🕌 Время намаза"), ("davom", "📖 Где я остановился"), ("duolar", "🤲 Дуа и зикры"),
           ("qibla", "🧭 Кибла"), ("taqvim", "📅 Календарь"), ("tasbeh", "📿 Тасбих"), ("ismlar", "✨ 99 имён Аллаха"),
           ("islom", "☪️ Основы ислама"), ("hissa", "💝 Поддержать проект"), ("eslatma", "🔔 Напоминание"),
           ("stikerlar", "🎨 Стикеры"), ("til", "🌐 Сменить язык")],
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
        from .subs import ADMIN_IDS
        admin_cmds = COMMANDS["uz"] + [("admin", "👑 Admin menyu"), ("xabar", "📣 Hammaga xabar"), ("stats", "📊 Statistika"), ("stikeryarat", "🎨 Stikerlarni yangilash")]
        for aid in ADMIN_IDS:
            try:
                await tg.call("setMyCommands", commands=[{"command": c, "description": d} for c, d in admin_cmds],
                              scope={"type": "chat", "chat_id": aid})
            except tg.TgError:
                log.warning("Admin %s uchun buyruqlar o'rnatilmadi (botga /start bosmagan bo'lishi mumkin)", aid)
        await tg.call("setChatMenuButton", menu_button={"type": "web_app", "text": "📖 Qur'on",
                                                        "web_app": {"url": app_url()}})
        await tg.call("setMyDescription", description=(
            "📖 Qur'oni Karim — 3D varaqlanadigan mushaf, o'zbekcha va ruscha tarjima\n"
            "🕌 Namoz vaqtlari va har namozda eslatma\n"
            "🤲 Duolar va zikrlar · ✨ Allohning 99 ismi\n"
            "🧭 Qibla · 📅 Hijriy taqvim · 📿 Tasbeh\n"
            "☪️ Islom asoslari\n\nErkinov loyihasi"))
        await tg.call("setMyDescription", language_code="ru", description=(
            "📖 Священный Коран — мусхаф с 3D-перелистыванием, перевод на узбекский и русский\n"
            "🕌 Время намаза и напоминания\n"
            "🤲 Дуа и зикры · ✨ 99 имён Аллаха\n"
            "🧭 Кибла · 📅 Календарь хиджры · 📿 Тасбих\n"
            "☪️ Основы ислама\n\nПроект Эркинова"))
        await tg.call("setMyShortDescription", short_description="📖 Qur'on, 🕌 namoz vaqtlari, 🤲 duolar, 🧭 qibla, 📿 tasbeh — Erkinov loyihasi")
        await tg.call("setMyShortDescription", language_code="ru", short_description="📖 Коран, 🕌 время намаза, 🤲 дуа, 🧭 кибла, 📿 тасбих")
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
    last_prefetch = 0.0
    while True:
        try:
            n = await send_due_reminders()
            if n:
                log.info("Eslatma yuborildi: %s", n)
        except Exception:
            log.exception("eslatma xatosi")
        try:
            await notify.prayer_tick(open_button=open_button)
            await notify.daily_push_tick()
        except Exception:
            log.exception("namoz eslatmasi xatosi")
        # Namoz jadvalini har 6 soatda yangilab turamiz (yangi oy boshlanishi uchun ham)
        if asyncio.get_running_loop().time() - last_prefetch > 6 * 3600:
            last_prefetch = asyncio.get_running_loop().time()
            asyncio.create_task(_safe_prefetch())
        await asyncio.sleep(30)


def _ping_self_sync():
    import urllib.request
    try:
        urllib.request.urlopen(f"{PUBLIC_URL}/health", timeout=20).read()
    except Exception:
        pass


async def keep_awake_loop():
    """Render bepul serveri 15 daqiqa so'rovsiz qolsa uxlab qoladi — namoz eslatmalari kechikmasligi uchun
    har 8 daqiqada o'zining ommaviy manziliga so'rov yuboradi."""
    if not PUBLIC_URL:
        return
    while True:
        await asyncio.sleep(8 * 60)
        await asyncio.to_thread(_ping_self_sync)


async def _safe_prefetch():
    try:
        await prayer.prefetch_all()
    except Exception:
        log.exception("namoz jadvali yuklanmadi")


# ---------- ommaviy xabar ----------

async def create_broadcast(text: str, target: str, with_button: bool, src_chat=None, src_msg=None) -> str:
    bid = uuid.uuid4().hex[:12]
    await db.execute(
        "INSERT INTO broadcasts (id, text, target, with_button, status, created_at, src_chat, src_msg) "
        "VALUES (?, ?, ?, ?, 'queued', ?, ?, ?)",
        (bid, text or "[Telegram xabari: rasm/video/matn]", target, 1 if with_button else 0, db.now_iso(), src_chat, src_msg))
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
            markup = open_button(u) if b["with_button"] else None
            if b.get("src_msg"):
                await tg.call("copyMessage", chat_id=u["tg_id"], from_chat_id=b["src_chat"],
                              message_id=b["src_msg"], reply_markup=markup)
            else:
                await tg.send(u["tg_id"], b["text"], markup)
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
