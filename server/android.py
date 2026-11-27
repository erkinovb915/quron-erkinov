"""Android ilova (APK): yuklab olish havolasi, Digital Asset Links va CI uchun shifrlash kaliti.

Imzo kaliti (keystore) repozitoriyda faqat shifrlangan holda (android/release.jks.enc) turadi.
Uni ochadigan kalitni server faqat shu repozitoriyning GitHub Actions ishiga
(OIDC token bilan tasdiqlangan holda) beradi.
"""
import hashlib
import hmac
from pathlib import Path
import base64
import json
import logging
import os
import time
import urllib.request

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from starlette.requests import Request
from starlette.responses import JSONResponse, RedirectResponse

log = logging.getLogger("android")

REPO = "erkinovb915/quron-erkinov"
PACKAGE = "uz.erkinov.quron"
APK_URL = f"https://github.com/{REPO}/releases/download/apk/Quron-Erkinov.apk"
CERT_FILE = Path(__file__).resolve().parent.parent / "android" / "cert-sha256.txt"
OIDC_ISS = "https://token.actions.githubusercontent.com"
OIDC_AUD = "quron-erkinov-apk"
_jwks = {"t": 0.0, "keys": {}}


async def apk(request: Request):
    return RedirectResponse(APK_URL, status_code=302)


async def assetlinks(request: Request):
    try:
        fps = [x.strip() for x in CERT_FILE.read_text().split() if x.strip()]
    except OSError:
        fps = []
    return JSONResponse([{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {"namespace": "android_app", "package_name": PACKAGE, "sha256_cert_fingerprints": fps},
    }])


def _wrap_key() -> str:
    secret = os.environ.get("APK_SECRET") or os.environ.get("BOT_TOKEN", "")
    return hmac.new(secret.encode(), b"quron-apk-keystore-v1", hashlib.sha256).hexdigest() if secret else ""


def _b64url(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _load_jwks():
    if time.time() - _jwks["t"] < 3600 and _jwks["keys"]:
        return _jwks["keys"]
    with urllib.request.urlopen(f"{OIDC_ISS}/.well-known/jwks", timeout=15) as r:
        data = json.loads(r.read().decode())
    keys = {}
    for k in data.get("keys", []):
        if k.get("kty") == "RSA":
            n = int.from_bytes(_b64url(k["n"]), "big")
            e = int.from_bytes(_b64url(k["e"]), "big")
            keys[k["kid"]] = rsa.RSAPublicNumbers(e, n).public_key()
    _jwks.update(t=time.time(), keys=keys)
    return keys


def verify_oidc(token: str):
    """GitHub Actions OIDC tokenini tekshiradi; to'g'ri bo'lsa claims qaytaradi."""
    try:
        h, p, s = token.split(".")
        header = json.loads(_b64url(h))
        claims = json.loads(_b64url(p))
        if header.get("alg") != "RS256":
            return None
        key = _load_jwks().get(header.get("kid"))
        if key is None:
            return None
        key.verify(_b64url(s), f"{h}.{p}".encode(), padding.PKCS1v15(), hashes.SHA256())
    except Exception:
        log.warning("OIDC token tekshiruvi o'tmadi", exc_info=True)
        return None
    now = time.time()
    aud = claims.get("aud")
    ok = (claims.get("iss") == OIDC_ISS
          and (aud == OIDC_AUD or (isinstance(aud, list) and OIDC_AUD in aud))
          and claims.get("exp", 0) > now and claims.get("nbf", 0) <= now + 60
          and claims.get("repository") == REPO
          and claims.get("ref") == "refs/heads/main"
          and claims.get("event_name") in ("push", "workflow_dispatch"))
    return claims if ok else None


async def ci_keystore(request: Request):
    auth = request.headers.get("authorization", "")
    token = auth[7:] if auth.lower().startswith("bearer ") else ""
    import asyncio
    claims = await asyncio.to_thread(verify_oidc, token) if token else None
    if not claims:
        return JSONResponse({"error": "forbidden"}, status_code=403)
    key = _wrap_key()
    if not key:
        return JSONResponse({"error": "not configured"}, status_code=503)
    log.info("APK kaliti berildi: %s run %s", claims.get("workflow"), claims.get("run_id"))
    return JSONResponse({"key": key})
