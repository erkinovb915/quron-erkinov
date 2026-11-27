"""Telegram stiker to'plamlari: animatsion stikerlar, animatsion emoji va oddiy (rasm) stikerlar.

Fayllar web/stickers/ ichida (render qilingan .webm va .png), ro'yxat manifest.json'da.
"""
import asyncio
import json
import logging
from pathlib import Path

from . import telegram as tg

log = logging.getLogger("stickers")
DIR = Path(__file__).resolve().parent.parent / "web" / "stickers"

# (kalit, nom prefiksi, sarlavha, sticker_type, format, manifest bo'limi)
SETS = [
    ("anim", "nurjon", "Nurjon · Erkinov loyihasi", "regular", "video", "anim"),
    ("emoji", "nurjon_emoji", "Nurjon emoji · Erkinov loyihasi", "custom_emoji", "video", "emoji"),
    ("static", "islomiy_kartalar", "Islomiy kartalar · Erkinov loyihasi", "regular", "static", "static"),
]
KEYWORDS = {
    "anim/salom.webm": ["salom", "assalomu alaykum", "привет"],
    "anim/alik.webm": ["alik", "va alaykum"],
    "anim/omin.webm": ["omin", "amin", "аминь"],
    "anim/jazakalloh.webm": ["rahmat", "jazakalloh", "спасибо"],
    "anim/tun.webm": ["xayrli tun", "спокойной ночи"],
    "anim/tong.webm": ["xayrli tong", "доброе утро"],
}
_lock = asyncio.Lock()
_username: str | None = None


async def bot_username() -> str:
    global _username
    if not _username:
        _username = (await tg.call("getMe"))["username"]
    return _username


def manifest() -> dict:
    try:
        return json.loads((DIR / "manifest.json").read_text())
    except Exception:
        return {}


async def set_name(prefix: str) -> str:
    return f"{prefix}_by_{await bot_username()}"


def link(name: str, sticker_type: str) -> str:
    return f"https://t.me/{'addemoji' if sticker_type == 'custom_emoji' else 'addstickers'}/{name}"


async def links() -> list[dict]:
    out = []
    for key, prefix, title, stype, _fmt, _sec in SETS:
        name = await set_name(prefix)
        out.append({"key": key, "name": name, "title": title, "url": link(name, stype)})
    return out


async def _exists(name: str):
    try:
        return await tg.call("getStickerSet", name=name)
    except tg.TgError:
        return None


async def ensure(owner_id: int) -> list[dict]:
    """Yo'q to'plamlarni yaratadi, borlariga yetishmagan stikerlarni qo'shadi."""
    man = manifest()
    report = []
    async with _lock:
        for key, prefix, title, stype, fmt, sec in SETS:
            items = man.get(sec) or []
            name = await set_name(prefix)
            row = {"key": key, "title": title, "url": link(name, stype), "count": len(items)}
            try:
                existing = await _exists(name)
                if existing is None:
                    files, stickers = {}, []
                    for i, it in enumerate(items[:50]):
                        path = DIR / it["file"]
                        files[f"f{i}"] = (path.name, path.read_bytes(), "video/webm" if fmt == "video" else "image/png")
                        st = {"sticker": f"attach://f{i}", "format": fmt, "emoji_list": [it["emoji"]]}
                        if it["file"] in KEYWORDS:
                            st["keywords"] = KEYWORDS[it["file"]]
                        stickers.append(st)
                    fields = {"user_id": str(owner_id), "name": name, "title": title,
                              "sticker_type": stype, "stickers": stickers}
                    await tg.call_multipart("createNewStickerSet", fields, files)
                    row["status"] = "created"
                else:
                    have = len(existing.get("stickers") or [])
                    added = 0
                    for it in items[have:]:
                        path = DIR / it["file"]
                        st = {"sticker": "attach://f0", "format": fmt, "emoji_list": [it["emoji"]]}
                        await tg.call_multipart("addStickerToSet", {"user_id": str(owner_id), "name": name, "sticker": st},
                                                {"f0": (path.name, path.read_bytes(), "video/webm" if fmt == "video" else "image/png")})
                        added += 1
                    row["status"] = f"exists (+{added})" if added else "exists"
            except Exception as e:  # noqa: BLE001
                log.exception("Stiker to'plami %s", name)
                row["status"] = "error"
                row["error"] = str(e)[:200]
            report.append(row)
    return report


async def ensure_on_startup():
    """Server ishga tushganda: to'plamlar yo'q bo'lsa birinchi admin nomidan yaratadi."""
    from .subs import ADMIN_IDS
    if not tg.BOT_TOKEN or not ADMIN_IDS or not manifest():
        return
    try:
        owner = sorted(ADMIN_IDS)[0]
        rep = await ensure(owner)
        log.info("Stikerlar: %s", [(r["key"], r["status"]) for r in rep])
    except Exception:
        log.exception("Stikerlarni tayyorlashda xato")
