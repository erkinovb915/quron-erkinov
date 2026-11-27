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


def _call_multipart_sync(method: str, fields: dict, files: dict):
    """multipart/form-data so'rov (fayl yuklash uchun). files: {nom: (fayl_nomi, bayt, mime)}"""
    if not BOT_TOKEN:
        raise TgError(0, "BOT_TOKEN o'rnatilmagan")
    import uuid
    bnd = "----erkinov" + uuid.uuid4().hex
    parts = []
    for k, v in fields.items():
        if v is None:
            continue
        if not isinstance(v, str):
            v = json.dumps(v)
        parts.append(f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n'.encode() + v.encode() + b"\r\n")
    for k, (fname, data, mime) in files.items():
        parts.append(f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"; filename="{fname}"\r\n'
                     f'Content-Type: {mime}\r\n\r\n'.encode() + data + b"\r\n")
    body = b"".join(parts) + f"--{bnd}--\r\n".encode()
    req = urllib.request.Request(API + method, data=body, headers={"Content-Type": f"multipart/form-data; boundary={bnd}"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            res = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            res = json.loads(e.read().decode())
        except Exception:
            raise TgError(e.code, str(e))
    if not res.get("ok"):
        raise TgError(res.get("error_code"), res.get("description"))
    return res.get("result")


async def call_multipart(method: str, fields: dict, files: dict):
    return await asyncio.to_thread(_call_multipart_sync, method, fields, files)


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


def validate_login_widget(auth: dict, max_age: int = 24 * 3600):
    """Saytdagi "Telegram orqali kirish" (Login Widget) ma'lumotini tekshiradi."""
    if not BOT_TOKEN or not isinstance(auth, dict) or not auth.get("hash") or not auth.get("id"):
        return None
    received = str(auth["hash"])
    pairs = {k: str(v) for k, v in auth.items() if k != "hash" and v is not None}
    check = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret = hashlib.sha256(BOT_TOKEN.encode()).digest()
    calc = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calc, received):
        return None
    try:
        if max_age and time.time() - int(pairs.get("auth_date", "0")) > max_age:
            return None
    except ValueError:
        return None
    return pairs


def make_session(tg_id: int, days: int = 180) -> str:
    exp = int(time.time()) + days * 86400
    sig = hmac.new(BOT_TOKEN.encode(), f"sess:{tg_id}:{exp}".encode(), hashlib.sha256).hexdigest()[:40]
    return f"{tg_id}.{exp}.{sig}"


def check_session(token: str):
    try:
        tg_id, exp, sig = str(token).split(".")
        if int(exp) < time.time():
            return None
        good = hmac.new(BOT_TOKEN.encode(), f"sess:{tg_id}:{exp}".encode(), hashlib.sha256).hexdigest()[:40]
        return int(tg_id) if hmac.compare_digest(good, sig) else None
    except (ValueError, TypeError):
        return None
