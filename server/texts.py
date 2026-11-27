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
            "• 🤲 Duolar, ✨ 99 ism, 🧭 qibla, 📅 taqvim, 📿 tasbeh\n"
            "• ☪️ Islom asoslari\n\n"
            "Pastdagi tugmani bosib o'qishni boshlang 👇"
        ),
        "open": "📖 Qur'onni ochish",
        "prayer_btn": "🕌 Namoz vaqtlari",
        "tasbih_btn": "📿 Tasbeh",
        "tasbih_open": "📿 Tasbehni ochish uchun tugmani bosing 👇",
        "install_btn": "📲 Telefonga o'rnatish",
        "install_text": "📲 <b>Ilovani telefoningizga o'rnating</b>\n\nBir bosishda ekraningizda Qur'on ilovasi paydo bo'ladi — xuddi oddiy ilovadek ochiladi.\n\n1️⃣ <b>Bosh ekranga qo'shish</b> — Telegram ichidagi ilova ekraningizga belgi bo'lib qo'shiladi (Android va iPhone).\n2️⃣ <b>Brauzer orqali o'rnatish</b> — sayt Chrome yoki Safari'da ochiladi, u yerda «O'rnatish» tugmasini bosing (iPhone: Ulashish ⬆️ → «Ekranga qo'shish»). Internetsiz ham ishlaydi.",
        "inst_tg": "📲 Bosh ekranga qo'shish",
        "inst_web": "🌐 Brauzer orqali o'rnatish",
        "stickers_btn": "🎨 Stikerlar",
        "stickers_text": "🎨 <b>Erkinov loyihasi stikerlari</b>\n\n✨ <b>Animatsion stikerlar</b> — Nurjon bilan salomlashing, tabriklang\n😊 <b>Animatsion emoji</b> — xabar ichida harakatlanadigan emoji\n🕌 <b>Islomiy kartalar</b> — arabcha yozuvli oddiy stikerlar\n\nQo'shish uchun tugmani bosing 👇",
        "stickers_none": "🎨 Stikerlar hali tayyorlanmoqda, birozdan keyin qayta urinib ko'ring.",
        "st_anim": "✨ Animatsion stikerlar",
        "st_emoji": "😊 Animatsion emoji",
        "st_static": "🕌 Islomiy kartalar",
        "duas_btn": "🤲 Duolar", "qibla_btn": "🧭 Qibla", "calendar_btn": "📅 Taqvim", "names_btn": "✨ 99 ism",
        "islam_btn": "☪️ Islom", "donate_btn": "💝 Hissa qo'shish",
        "duas_text": "🤲 <b>Duolar va zikrlar</b>\nTongi va kechki zikrlar, Qur'ondagi va sunnat duolar, safar, taom, oila, kasallik va boshqa holatlar duolari 👇",
        "qibla_text": "🧭 <b>Qibla</b>\nKompas Ka'ba tomonni ko'rsatadi. Telefonni gorizontal ushlang 👇",
        "calendar_text": "📅 <b>Taqvim</b>\nHijriy sana, islomiy bayramlar va oylik namoz taqvimi 👇",
        "names_text": "✨ <b>Allohning 99 go'zal ismi</b>\nArabcha, o'qilishi va ma'nosi bilan 👇",
        "islam_text": "☪️ <b>Islom asoslari</b>\nIymon, namoz, zakot, ro'za, haj, umra, harom amallar, ayollar sahifasi, nabaviy qaytariqlar 👇",
        "donate_text": "💝 <b>Loyihaga hissa qo'shing</b>\n\nIlova bepul va reklamasiz. Loyihaning rivoji uchun hissa qo'shishingiz mumkin — har bir yordam sadaqai joriya!\n\n💳 Karta: <code>{card}</code>\n👤 {owner}\n\nJazakallohu xoyro! 🤲",
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
            "/namoz — namoz vaqtlari\n/duolar — duolar va zikrlar\n/qibla — qibla\n/taqvim — taqvim\n/tasbeh — tasbeh\n/ismlar — 99 ism\n/islom — Islom asoslari\n/hissa — loyihaga hissa\n/eslatma — kundalik eslatma\n/stikerlar — stikerlar\n/ornatish — telefonga o'rnatish\n/til — tilni o'zgartirish"
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
            "• 🤲 Дуа, ✨ 99 имён, 🧭 кибла, 📅 календарь, 📿 тасбих\n"
            "• ☪️ Основы ислама\n\n"
            "Нажмите кнопку ниже, чтобы начать 👇"
        ),
        "open": "📖 Открыть Коран",
        "prayer_btn": "🕌 Время намаза",
        "tasbih_btn": "📿 Тасбих",
        "tasbih_open": "📿 Нажмите кнопку, чтобы открыть тасбих 👇",
        "install_btn": "📲 Установить на телефон",
        "install_text": "📲 <b>Установите приложение на телефон</b>\n\nОдно нажатие — и Коран появится на вашем экране как обычное приложение.\n\n1️⃣ <b>На главный экран</b> — значок мини-приложения Telegram на экране (Android и iPhone).\n2️⃣ <b>Через браузер</b> — сайт откроется в Chrome или Safari, нажмите «Установить» (iPhone: Поделиться ⬆️ → «На экран Домой»). Работает и без интернета.",
        "inst_tg": "📲 На главный экран",
        "inst_web": "🌐 Установить через браузер",
        "stickers_btn": "🎨 Стикеры",
        "stickers_text": "🎨 <b>Стикеры проекта Эркинова</b>\n\n✨ <b>Анимированные стикеры</b> — приветствия и поздравления с Нурджоном\n😊 <b>Анимированные эмодзи</b> — живые эмодзи прямо в тексте\n🕌 <b>Исламские карточки</b> — обычные стикеры с арабской каллиграфией\n\nНажмите, чтобы добавить 👇",
        "stickers_none": "🎨 Стикеры ещё готовятся, попробуйте чуть позже.",
        "st_anim": "✨ Анимированные стикеры",
        "st_emoji": "😊 Анимированные эмодзи",
        "st_static": "🕌 Исламские карточки",
        "duas_btn": "🤲 Дуа", "qibla_btn": "🧭 Кибла", "calendar_btn": "📅 Календарь", "names_btn": "✨ 99 имён",
        "islam_btn": "☪️ Ислам", "donate_btn": "💝 Поддержать",
        "duas_text": "🤲 <b>Дуа и зикры</b>\nУтренние и вечерние азкары, мольбы из Корана и Сунны, в пути, за едой, в семье, при болезни и др. 👇",
        "qibla_text": "🧭 <b>Кибла</b>\nКомпас покажет направление на Каабу. Держите телефон горизонтально 👇",
        "calendar_text": "📅 <b>Календарь</b>\nДата по хиджре, исламские праздники и месячный календарь намаза 👇",
        "names_text": "✨ <b>99 прекрасных имён Аллаха</b>\nНа арабском, с чтением и значением 👇",
        "islam_text": "☪️ <b>Основы ислама</b>\nИман, намаз, закят, пост, хадж, умра, запретное, страница для женщин, запреты Пророка ﷺ 👇",
        "donate_text": "💝 <b>Поддержать проект</b>\n\nПриложение бесплатное и без рекламы. Вы можете поддержать его развитие — каждая помощь это садака джария!\n\n💳 Карта: <code>{card}</code>\n👤 {owner}\n\nДжазакаллаху хайран! 🤲",
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
            "/namoz — время намаза\n/duolar — дуа и зикры\n/qibla — кибла\n/taqvim — календарь\n/tasbeh — тасбих\n/ismlar — 99 имён\n/islom — основы ислама\n/hissa — поддержать\n/eslatma — напоминание\n/stikerlar — стикеры\n/ornatish — установить на телефон\n/til — сменить язык"
        ),
        "stats": "📊 Пользователи: {total} (Telegram: {telegram}, сайт: {web})\nЧитали сегодня: {today_readers}",
    },
}


def t(lang: str, key: str, **kw):
    lang = lang if lang in T else "uz"
    val = T[lang][key]
    return val.format(**kw) if kw and isinstance(val, str) else val
