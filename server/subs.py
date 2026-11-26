"""Majburiy obuna: kanallarni qo'shish va foydalanuvchi obunasini tekshirish."""
import os
import time

from . import db
from . import telegram as tg

ADMIN_IDS = {int(x) for x in os.environ.get("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip().lstrip("-").isdigit()}
_cache: dict[tuple, tuple[float, bool]] = {}
_bot_id = None


def is_admin_user(user: dict | None) -> bool:
    if not user:
        return False
    return bool(user.get("is_admin")) or (user.get("tg_id") is not None and int(user["tg_id"]) in ADMIN_IDS)


async def bot_id() -> int:
    global _bot_id
    if _bot_id is None:
        _bot_id = (await tg.call("getMe"))["id"]
    return _bot_id


async def is_member(chat_id: str, user_id: int) -> bool:
    key = (chat_id, user_id)
    hit = _cache.get(key)
    if hit and hit[0] > time.time():
        return hit[1]
    try:
        m = await tg.call("getChatMember", chat_id=chat_id, user_id=user_id)
        ok = m.get("status") in ("creator", "administrator", "member") or (m.get("status") == "restricted" and m.get("is_member"))
    except tg.TgError:
        ok = True  # bot kanalda admin bo'lmasa foydalanuvchini to'sib qo'ymaymiz
    _cache[key] = (time.time() + (300 if ok else 20), ok)
    return ok


async def missing_channels(user_id: int, fresh: bool = False) -> list[dict]:
    channels = await db.list_channels()
    if not channels:
        return []
    if fresh:
        for c in channels:
            _cache.pop((c["chat_id"], user_id), None)
    return [c for c in channels if not await is_member(c["chat_id"], user_id)]


async def resolve_channel(ref: str):
    """@username, t.me havola yoki -100... ID bo'yicha kanalni topadi va bot adminligini tekshiradi."""
    ref = ref.strip()
    for prefix in ("https://t.me/", "http://t.me/", "t.me/"):
        if ref.startswith(prefix):
            ref = "@" + ref[len(prefix):].split("/")[0]
    if not ref.startswith("@") and not ref.lstrip("-").isdigit():
        ref = "@" + ref
    chat = await tg.call("getChat", chat_id=ref)
    me = await bot_id()
    member = await tg.call("getChatMember", chat_id=chat["id"], user_id=me)
    if member.get("status") != "administrator":
        raise tg.TgError(400, "bot_not_admin")
    if chat.get("username"):
        link = f"https://t.me/{chat['username']}"
    else:
        link = chat.get("invite_link") or (await tg.call("createChatInviteLink", chat_id=chat["id"], name="Quron bot"))["invite_link"]
    return str(chat["id"]), chat.get("title") or ref, link


def subscribe_markup(channels: list[dict], lang: str) -> dict:
    rows = [[{"text": f"📢 {c['title']}", "url": c["link"]}] for c in channels]
    rows.append([{"text": "✅ Obuna bo'ldim" if lang != "ru" else "✅ Я подписался", "callback_data": "checksub"}])
    return {"inline_keyboard": rows}


def subscribe_text(lang: str) -> str:
    if lang == "ru":
        return "📢 Чтобы пользоваться ботом, подпишитесь на каналы ниже и нажмите «✅ Я подписался»."
    return "📢 Botdan foydalanish uchun quyidagi kanallarga obuna bo'ling va «✅ Obuna bo'ldim» tugmasini bosing."
