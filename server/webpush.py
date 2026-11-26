"""Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) — faqat `cryptography` kutubxonasi bilan.

Sayt / o'rnatilgan ilova (PWA) foydalanuvchilariga namoz va o'qish eslatmalarini yuborish uchun.
VAPID kalitlari birinchi ishga tushishda yaratiladi va bazada saqlanadi.
"""
import asyncio
import base64
import json
import os
import struct
import time
import urllib.error
import urllib.parse
import urllib.request

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF, HKDFExpand

from . import db

SUBJECT = os.environ.get("PUBLIC_URL", "https://quron-erkinov.onrender.com").rstrip("/") or "https://example.com"
_keys = {"private": None, "public_b64": None}


def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def b64u_dec(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _pub_bytes(key) -> bytes:
    return key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)


async def init_keys():
    row = await db.q_one("SELECT value FROM settings WHERE key = 'vapid_private'")
    if row:
        priv = serialization.load_pem_private_key(row["value"].encode(), password=None)
    else:
        priv = ec.generate_private_key(ec.SECP256R1())
        pem = priv.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                 serialization.NoEncryption()).decode()
        await db.execute("INSERT INTO settings (key, value) VALUES ('vapid_private', ?)", (pem,))
    _keys["private"] = priv
    _keys["public_b64"] = b64u(_pub_bytes(priv))


def public_key() -> str | None:
    return _keys["public_b64"]


def encrypt(payload: bytes, p256dh_b64: str, auth_b64: str, salt: bytes | None = None, server_key=None) -> bytes:
    """aes128gcm shifrlash (RFC 8291)."""
    ua_public = b64u_dec(p256dh_b64)
    auth_secret = b64u_dec(auth_b64)
    ua_key = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), ua_public)
    as_key = server_key or ec.generate_private_key(ec.SECP256R1())
    as_public = _pub_bytes(as_key)
    shared = as_key.exchange(ec.ECDH(), ua_key)
    ikm = HKDF(algorithm=hashes.SHA256(), length=32, salt=auth_secret,
               info=b"WebPush: info\x00" + ua_public + as_public).derive(shared)
    salt = salt or os.urandom(16)
    cek = HKDF(algorithm=hashes.SHA256(), length=16, salt=salt, info=b"Content-Encoding: aes128gcm\x00").derive(ikm)
    nonce = HKDF(algorithm=hashes.SHA256(), length=12, salt=salt, info=b"Content-Encoding: nonce\x00").derive(ikm)
    ciphertext = AESGCM(cek).encrypt(nonce, payload + b"\x02", None)
    header = salt + struct.pack("!L", 4096) + bytes([len(as_public)]) + as_public
    return header + ciphertext


def vapid_header(endpoint: str) -> str:
    u = urllib.parse.urlparse(endpoint)
    aud = f"{u.scheme}://{u.netloc}"
    header = b64u(json.dumps({"typ": "JWT", "alg": "ES256"}, separators=(",", ":")).encode())
    claims = b64u(json.dumps({"aud": aud, "exp": int(time.time()) + 12 * 3600, "sub": SUBJECT},
                             separators=(",", ":")).encode())
    signing_input = f"{header}.{claims}".encode()
    der = _keys["private"].sign(signing_input, ec.ECDSA(hashes.SHA256()))
    r, s = decode_dss_signature(der)
    sig = b64u(r.to_bytes(32, "big") + s.to_bytes(32, "big"))
    return f"vapid t={header}.{claims}.{sig}, k={_keys['public_b64']}"


def _send_sync(sub: dict, data: dict, ttl: int = 3600) -> int:
    body = encrypt(json.dumps(data, ensure_ascii=False).encode(), sub["keys"]["p256dh"], sub["keys"]["auth"])
    req = urllib.request.Request(sub["endpoint"], data=body, method="POST", headers={
        "Authorization": vapid_header(sub["endpoint"]),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "TTL": str(ttl),
        "Urgency": "high",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


async def send(sub: dict, data: dict, ttl: int = 3600) -> int:
    if not _keys["private"]:
        return 0
    try:
        return await asyncio.to_thread(_send_sync, sub, data, ttl)
    except Exception:
        return 0


# ---------------- obunalar ----------------

async def save_subscription(sub: dict, region: str, lang: str, prayer: bool, daily: bool, web_id: str | None):
    endpoint = sub.get("endpoint", "")
    if not endpoint.startswith("https://") or not sub.get("keys", {}).get("p256dh") or not sub.get("keys", {}).get("auth"):
        raise ValueError("bad subscription")
    await db.execute("DELETE FROM push_subs WHERE endpoint = ?", (endpoint,))
    await db.execute(
        "INSERT INTO push_subs (endpoint, data, region, lang, prayer, daily, web_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (endpoint, json.dumps(sub), region, lang, 1 if prayer else 0, 1 if daily else 0, web_id, db.now_iso()))


async def remove_subscription(endpoint: str):
    await db.execute("DELETE FROM push_subs WHERE endpoint = ?", (endpoint,))


async def send_to(rows: list[dict], make_payload) -> int:
    sent = 0
    for row in rows:
        try:
            sub = json.loads(row["data"])
        except Exception:
            continue
        status = await send(sub, make_payload(row))
        if status in (404, 410):
            await remove_subscription(row["endpoint"])
        elif 200 <= status < 300:
            sent += 1
    return sent
