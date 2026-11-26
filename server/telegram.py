"""Telegram Bot API bilan ishlash (faqat standart kutubxona) va Mini App initData tekshiruvi."""
import asyncio
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

BOT_TOKEN = os.environ.get("BOT_TOKEN", "").strip()
API = f"https://api.telegram.org/bot{BOT_TOKEN}/"


class TgError(Exception):
    def __init__(self, code, description):
        super().__init__(f"{code}: {description}")
        self.code = code
        self.description = description


def _call_sync(method: str, payload: dict):
    if not BOT_TOKEN:
        raise TgError(0, "BOT_TOKEN o'rnatilmagan")
    data = json.dumps(payload).encode()
    req = urllib.request.Request(API + method, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            raise TgError(e.code, str(e))
    if not body.get("ok"):
        raise TgError(body.get("error_code"), body.get("description"))
    return body.get("result")


async def call(method: str, **payload):
    payload = {k: v for k, v in payload.items() if v is not None}
    return await asyncio.to_thread(_call_sync, method, payload)


async def send(chat_id: int, text: str, markup: dict | None = None, **extra):
    return await call(
        "sendMessage", chat_id=chat_id, text=text, parse_mode="HTML",
        reply_markup=markup, link_preview_options={"is_disabled": True}, **extra,
    )


def validate_init_data(init_data: str, max_age: int = 7 * 24 * 3600):
    """Mini App'dan kelgan initData haqiqiyligini tekshiradi. To'g'ri bo'lsa user dict qaytaradi."""
    if not BOT_TOKEN or not init_data:
        return None
    try:
        pairs = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
    except Exception:
        return None
    received = pairs.pop("hash", None)
    if not received:
        return None
    check = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calc = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calc, received):
        return None
    if max_age and time.time() - int(pairs.get("auth_date", "0")) > max_age:
        return None
    try:
        user = json.loads(pairs.get("user", "{}"))
    except Exception:
        return None
    user["start_param"] = pairs.get("start_param")
    return user if user.get("id") else None
