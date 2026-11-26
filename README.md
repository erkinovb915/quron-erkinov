# 📖 Qur'oni Karim — Erkinov loyihasi

Sayt, Telegram bot va Telegram mini ilova — bitta tizim, bitta server.

- 3D muqova va 3D varaq aylantirish (ovoz va tebranish bilan)
- Arabcha matn (Madina mushafi, 604 sahifa) + o'zbekcha (Muhammad Sodiq Muhammad Yusuf) va ruscha (E. Kuliyev) tarjima
- Ko'rinishlar: faqat arabcha · arab + tarjima · faqat tarjima
- 💡 Chiroq (varaqni yoritadi, yorug'lik barmoq/sichqoncha ortidan yuradi) va 🌙 tungi rejim
- Qayerda qolganingizni eslab qoladi, oyatni bosib "shu yerda to'xtadim" deb belgilash, xatcho'plar
- Sura, pora bo'yicha qidiruv
- Android va iPhone'ga ilova bo'lib o'rnatiladi (PWA), oflayn ishlaydi
- Telegram bot: har kuni tanlangan soatda eslatma, "qayerda qoldim", til tanlash
- Sayt ↔ Telegram ulanishi: saytdagi o'qish joyi botga ko'chadi
- Admin panel (`/admin`): statistika, foydalanuvchilar, hammaga xabar yuborish, eslatmani sinash

## Tuzilishi

```
server/   Python (Starlette): API, bot webhook, eslatmalar, admin API
web/      Sayt = mini ilova (HTML/CSS/JS), admin.html, PWA fayllari
render.yaml                Render sozlamasi (web + PostgreSQL)
vercel.json                Saytni Vercel'da ham ochish uchun (API Render'ga yo'naltiriladi)
.github/workflows/eslatma.yml  Har 10 daqiqada serverni uyg'otib, eslatmalarni yuboradi
```

## Muhit o'zgaruvchilari (Render)

| Nomi | Nima |
|---|---|
| `BOT_TOKEN` | @BotFather bergan token |
| `PUBLIC_URL` | Saytning manzili, masalan `https://quron-erkinov.onrender.com` |
| `ADMIN_PASSWORD` | Admin panel paroli |
| `DATABASE_URL` | Render PostgreSQL ulanish manzili |
| `CRON_KEY` | GitHub Actions eslatma chaqiruvi uchun maxfiy kalit |

Server ishga tushganda bot o'zi sozlanadi: webhook, buyruqlar, menyu tugmasi (mini ilova).

## Admin bo'lish

Admin panel: `PUBLIC_URL/admin` (parol — `ADMIN_PASSWORD`).
Botda o'zingizni admin qilish: `/admin PAROL` yozing.

## Lokal ishga tushirish

```bash
pip install -r requirements.txt
ADMIN_PASSWORD=test uvicorn server.app:app --reload
```
