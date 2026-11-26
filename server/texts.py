"""Bot matnlari: o'zbekcha va ruscha."""
import json
import os
import re

_SURAH_FILE = os.path.join(os.path.dirname(__file__), "..", "web", "js", "surahs.js")
with open(_SURAH_FILE, encoding="utf-8") as f:
    SURAHS = json.loads(re.search(r"=\s*(\[.*\]);", f.read(), re.S).group(1))


def surah_name(n: int, lang: str) -> str:
    try:
        uz, ru, _ = SURAHS[int(n) - 1]
    except (IndexError, ValueError, TypeError):
        return str(n)
    return ru if lang == "ru" else uz


T = {
    "uz": {
        "welcome": (
            "Assalomu alaykum, <b>{name}</b>! 🌙\n\n"
            "📖 <b>Qur'oni Karim</b> — 3D varaqlanadigan mushaf.\n"
            "• Arabcha matn, o'zbekcha va ruscha tarjima\n"
            "• Chiroq va tungi rejim\n"
            "• Qayerda qolganingizni eslab qoladi\n"
            "• Har kuni o'qishni eslatib turaman\n"
            "• 🕌 Namoz vaqtlari va har namozda eslatma\n"
            "• 📿 Tasbeh\n\n"
            "Pastdagi tugmani bosib o'qishni boshlang 👇"
        ),
        "open": "📖 Qur'onni ochish",
        "prayer_btn": "🕌 Namoz vaqtlari",
        "tasbih_btn": "📿 Tasbeh",
        "tasbih_open": "📿 Tasbehni ochish uchun tugmani bosing 👇",
        "continue": "📖 {page}-sahifadan davom etish",
        "where": "📍 Qayerda qoldim",
        "remind": "🔔 Eslatma",
        "lang": "🌐 Til / Язык",
        "where_text": (
            "📍 Siz <b>{page}-sahifada</b> to'xtagansiz\n"
            "🕌 <b>{surah}</b> surasi, {ayah}-oyat\n\n"
            "📅 Bugun o'qildi: <b>{today}</b> sahifa\n"
            "📚 Jami: <b>{total}</b> sahifa\n"
            "🎯 Xatmgacha: <b>{left}</b> sahifa qoldi"
        ),
        "not_started": "Siz hali o'qishni boshlamadingiz. Keling, Fotiha surasidan boshlaymiz! 🌱",
        "remind_menu": "🔔 <b>Kundalik eslatma</b>\n\nHozir: {state}\nVaqt (Toshkent): <b>{hour}:00</b>\n\nQaysi soatda eslatay?",
        "on": "✅ yoqilgan",
        "off": "❌ o'chirilgan",
        "turn_on": "✅ Yoqish",
        "turn_off": "❌ O'chirish",
        "saved": "Saqlandi ✅",
        "choose_lang": "Tilni tanlang / Выберите язык:",
        "lang_set": "Til o'zbekchaga o'zgartirildi 🇺🇿",
        "reminders": [
            "🌙 Assalomu alaykum! Bugungi Qur'on tilovatini unutmang.",
            "📖 Kuniga bir sahifa — yil oxirida katta natija. Davom etamizmi?",
            "✨ Qalbga orom — Qur'on. Bugun ham bir necha oyat o'qib olaylik.",
            "🤲 Bugungi o'qishingizni kutib turibman.",
            "🌿 Oz bo'lsa ham, har kuni. Qolgan joyingiz tayyor.",
        ],
        "reminder_tail": "\n\n📍 Siz <b>{page}-sahifada</b> ({surah} surasi) to'xtagansiz.",
        "linked": "🔗 Sayt va Telegram ulandi! Sayt o'qish joyingiz Telegramga ko'chirildi.",
        "admin_ok": "👑 Siz admin bo'ldingiz.\nAdmin panel: {url}",
        "admin_bad": "Parol noto'g'ri.",
        "help": (
            "Buyruqlar:\n/start — bosh menyu\n/davom — qayerda qoldim\n"
            "/namoz — namoz vaqtlari\n/tasbeh — tasbeh\n/eslatma — kundalik eslatma\n/til — tilni o'zgartirish"
        ),
        "stats": "📊 Foydalanuvchilar: {total} (Telegram: {telegram}, sayt: {web})\nBugun o'qiganlar: {today_readers}",
    },
    "ru": {
        "welcome": (
            "Ассаляму алейкум, <b>{name}</b>! 🌙\n\n"
            "📖 <b>Священный Коран</b> — мусхаф с 3D-перелистыванием.\n"
            "• Арабский текст, перевод на узбекский и русский\n"
            "• Лампа и ночной режим\n"
            "• Запоминает, где вы остановились\n"
            "• Каждый день напоминаю о чтении\n"
            "• 🕌 Время намаза и напоминание о каждом намазе\n"
            "• 📿 Тасбих\n\n"
            "Нажмите кнопку ниже, чтобы начать 👇"
        ),
        "open": "📖 Открыть Коран",
        "prayer_btn": "🕌 Время намаза",
        "tasbih_btn": "📿 Тасбих",
        "tasbih_open": "📿 Нажмите кнопку, чтобы открыть тасбих 👇",
        "continue": "📖 Продолжить со стр. {page}",
        "where": "📍 Где я остановился",
        "remind": "🔔 Напоминание",
        "lang": "🌐 Til / Язык",
        "where_text": (
            "📍 Вы остановились на <b>стр. {page}</b>\n"
            "🕌 Сура <b>{surah}</b>, аят {ayah}\n\n"
            "📅 Прочитано сегодня: <b>{today}</b> стр.\n"
            "📚 Всего: <b>{total}</b> стр.\n"
            "🎯 До хатма осталось: <b>{left}</b> стр."
        ),
        "not_started": "Вы ещё не начали чтение. Давайте начнём с суры Аль-Фатиха! 🌱",
        "remind_menu": "🔔 <b>Ежедневное напоминание</b>\n\nСейчас: {state}\nВремя (Ташкент): <b>{hour}:00</b>\n\nВ какое время напоминать?",
        "on": "✅ включено",
        "off": "❌ выключено",
        "turn_on": "✅ Включить",
        "turn_off": "❌ Выключить",
        "saved": "Сохранено ✅",
        "choose_lang": "Tilni tanlang / Выберите язык:",
        "lang_set": "Язык изменён на русский 🇷🇺",
        "reminders": [
            "🌙 Ассаляму алейкум! Не забудьте сегодняшнее чтение Корана.",
            "📖 Страница в день — большой результат к концу года. Продолжим?",
            "✨ Коран — покой для сердца. Прочитаем сегодня несколько аятов.",
            "🤲 Жду вашего сегодняшнего чтения.",
            "🌿 Пусть немного, но каждый день. Ваше место уже открыто.",
        ],
        "reminder_tail": "\n\n📍 Вы остановились на <b>стр. {page}</b> (сура {surah}).",
        "linked": "🔗 Сайт и Telegram связаны! Ваш прогресс с сайта перенесён.",
        "admin_ok": "👑 Вы теперь администратор.\nПанель: {url}",
        "admin_bad": "Неверный пароль.",
        "help": (
            "Команды:\n/start — главное меню\n/davom — где я остановился\n"
            "/namoz — время намаза\n/tasbeh — тасбих\n/eslatma — напоминание\n/til — сменить язык"
        ),
        "stats": "📊 Пользователи: {total} (Telegram: {telegram}, сайт: {web})\nЧитали сегодня: {today_readers}",
    },
}


def t(lang: str, key: str, **kw):
    lang = lang if lang in T else "uz"
    val = T[lang][key]
    return val.format(**kw) if kw and isinstance(val, str) else val
