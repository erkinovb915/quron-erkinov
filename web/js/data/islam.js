// Islom asoslari (Hanafiy mazhabi, O'zbekistonda amal qilinadigan tartib bo'yicha qisqacha).
// Har bir bo'lim: blocks — [{ h: sarlavha, p: [bandlar] }] o'zbekcha va ruscha.
export const ISLAM_TOPICS = [
  {
    id: "iymon", icon: "💎", uz: "Iymon", ru: "Иман (вера)",
    body: {
      uz: [
        { h: "Iymon nima?", p: ["Iymon — Alloh taolo va Payg'ambarimiz sollallohu alayhi vasallam yetkazgan narsalarning barchasini qalb bilan tasdiqlash va til bilan iqror bo'lish."] },
        { h: "Iymonning 6 rukni", p: ["Allohga iymon keltirish", "Farishtalarga iymon", "Muqaddas kitoblarga iymon", "Payg'ambarlarga iymon", "Oxirat kuniga iymon", "Taqdirga — yaxshisi ham, yomoni ham Allohdan ekaniga iymon"] },
        { h: "Kalimai shahodat", p: ["«Ashhadu alla ilaha illallohu va ashhadu anna Muhammadan 'abduhu va rosuluh» — Allohdan o'zga iloh yo'qligiga va Muhammad Uning bandasi va elchisi ekaniga guvohlik beraman."] },
        { h: "Islomning 5 rukni", p: ["Kalimai shahodat", "Namoz o'qish", "Zakot berish", "Ramazon ro'zasini tutish", "Imkoni bo'lganlar uchun haj qilish"] },
      ],
      ru: [
        { h: "Что такое иман?", p: ["Иман — подтверждение сердцем и признание языком всего, что донесли Аллах и Пророк ﷺ."] },
        { h: "6 столпов имана", p: ["Вера в Аллаха", "Вера в ангелов", "Вера в Писания", "Вера в пророков", "Вера в Судный день", "Вера в предопределение — доброе и плохое от Аллаха"] },
        { h: "Шахада", p: ["«Ашхаду алля иляха илляЛлах ва ашхаду анна Мухаммадан 'абдуху ва расулюх» — свидетельствую, что нет божества, кроме Аллаха, и что Мухаммад — Его раб и посланник."] },
        { h: "5 столпов ислама", p: ["Шахада", "Намаз", "Закят", "Пост в Рамадан", "Хадж для тех, кто в состоянии"] },
      ],
    },
  },
  {
    id: "namoz", icon: "🕌", uz: "Namoz", ru: "Намаз",
    body: {
      uz: [
        { h: "Besh vaqt namoz (rakatlar)", p: ["Bomdod: 2 sunnat + 2 farz", "Peshin: 4 sunnat + 4 farz + 2 sunnat", "Asr: 4 farz (oldidan 4 g'ayri muakkada sunnat)", "Shom: 3 farz + 2 sunnat", "Xufton: 4 farz + 2 sunnat + 3 vitr (vojib)"] },
        { h: "Namozning shartlari (namozdan tashqari)", p: ["Badanning hadasdan poklanishi (tahorat/g'usl)", "Badan, kiyim va joyning najosatdan pokligi", "Avratni berkitish", "Qiblaga yuzlanish", "Vaqt kirgan bo'lishi", "Niyat"] },
        { h: "Namozning ruknlari (ichidagi farzlar)", p: ["Iftitoh takbiri («Allohu akbar»)", "Qiyom — tik turish", "Qiroat — Qur'ondan o'qish", "Ruku'", "Ikki sajda", "Qa'dai axira — oxirgi o'tirish (tashahhud miqdori)"] },
        { h: "Tahorat farzlari", p: ["Yuzni yuvish", "Ikki qo'lni tirsaklar bilan yuvish", "Boshning to'rtdan biriga mash tortish", "Ikki oyoqni to'piqlar bilan yuvish"] },
        { h: "Tahoratni buzadigan narsalar", p: ["Ikki yo'ldan biror narsa chiqishi", "Badandan qon, yiring oqib chiqishi", "Og'iz to'la qusish", "Yonboshlab yoki suyanib uxlab qolish", "Hushdan ketish", "Namozda ovoz chiqarib kulish"] },
      ],
      ru: [
        { h: "Пять намазов (ракаты)", p: ["Фаджр: 2 сунна + 2 фард", "Зухр: 4 сунна + 4 фард + 2 сунна", "Аср: 4 фард (до него 4 желательных)", "Магриб: 3 фард + 2 сунна", "Иша: 4 фард + 2 сунна + 3 витр (ваджиб)"] },
        { h: "Условия намаза", p: ["Очищение от осквернения (тахарат/гусль)", "Чистота тела, одежды и места от нечистот", "Покрытие аурата", "Обращение к кибле", "Наступление времени", "Намерение"] },
        { h: "Столпы намаза", p: ["Начальный такбир («Аллаху акбар»)", "Стояние (кыям)", "Чтение Корана", "Поясной поклон (руку')", "Два земных поклона", "Последнее сидение (на время ташаххуда)"] },
        { h: "Обязательное в омовении", p: ["Мыть лицо", "Мыть руки вместе с локтями", "Протереть четверть головы", "Мыть ноги вместе с щиколотками"] },
        { h: "Что нарушает омовение", p: ["Выход чего-либо из двух путей", "Вытекание крови или гноя", "Рвота полным ртом", "Сон лёжа или облокотившись", "Потеря сознания", "Громкий смех в намазе"] },
      ],
    },
  },
  {
    id: "zakot", icon: "💰", uz: "Zakot", ru: "Закят",
    body: {
      uz: [
        { h: "Zakot kimga farz?", p: ["Oqil, balog'atga yetgan, ozod musulmonga", "Asosiy ehtiyojlar va qarzdan ortiqcha mol nisob miqdoriga yetsa", "Shu mol ustidan to'liq bir qamariy yil o'tsa"] },
        { h: "Nisob va miqdor", p: ["Nisob: 85 gramm oltin yoki 595 gramm kumush qiymati (pul, savdo moli shu qiymat bilan hisoblanadi)", "Zakot miqdori — molning 2,5 foizi (qirqdan biri)", "Chorva va ekinlarning o'z nisoblari bor"] },
        { h: "Zakot oluvchilar (Tavba surasi, 60-oyat)", p: ["Faqirlar", "Miskinlar", "Zakot yig'uvchilar", "Qalblari Islomga moyil qilinadiganlar", "Qullarni ozod qilish uchun", "Qarzdorlar", "Alloh yo'lida bo'lganlar", "Yo'lda qolgan musofirlar"] },
        { h: "Zakot berilmaydiganlar", p: ["Ota-ona, bobo-buvilar", "Farzandlar va nevaralar", "Er-xotin bir-biriga", "Boy kishilar"] },
        { h: "Fitr sadaqasi", p: ["Ramazon hayiti namozidan oldin beriladi", "Nisob egasi o'zi va qaramog'idagi yosh bolalar uchun beradi", "Miqdori har yili O'zbekiston musulmonlari idorasi tomonidan e'lon qilinadi"] },
      ],
      ru: [
        { h: "Кому обязателен закят?", p: ["Разумному, совершеннолетнему, свободному мусульманину", "Если имущество сверх основных нужд и долгов достигло нисаба", "И над ним прошёл полный лунный год"] },
        { h: "Нисаб и размер", p: ["Нисаб: стоимость 85 г золота или 595 г серебра", "Размер закята — 2,5 % (одна сороковая)", "Для скота и урожая — свои нормы"] },
        { h: "Получатели (сура Тауба, 60)", p: ["Бедные", "Неимущие", "Сборщики закята", "Те, чьи сердца склоняют к исламу", "Освобождение рабов", "Должники", "На пути Аллаха", "Путники в нужде"] },
        { h: "Кому нельзя давать закят", p: ["Родителям, дедушкам и бабушкам", "Детям и внукам", "Супруги друг другу", "Богатым"] },
        { h: "Закят аль-фитр", p: ["Выплачивается до праздничного намаза Рамадан-хайит", "Обладатель нисаба платит за себя и малолетних детей", "Размер ежегодно объявляет Управление мусульман Узбекистана"] },
      ],
    },
  },
  {
    id: "roza", icon: "🌙", uz: "Ro'za", ru: "Пост (ураза)",
    body: {
      uz: [
        { h: "Ramazon ro'zasi", p: ["Oqil, balog'atga yetgan, sog'lom va muqim musulmonga farz", "Tong (bomdod vaqti kirishi)dan quyosh botgunicha yeyish, ichish va er-xotin yaqinligidan tiyilish", "Har kuni kechasi yoki kunduzi (zavolgacha) niyat qilinadi"] },
        { h: "Ro'zani buzadigan narsalar (qazo vojib)", p: ["Bilib turib yeyish-ichish", "Og'iz to'la qasddan qusish", "Dori-darmonni og'iz yoki burun orqali yutish", "Tish orasidagi no'xatdan katta narsani yutish"] },
        { h: "Ro'zani buzmaydigan narsalar", p: ["Unutib yeyish-ichish", "Beixtiyor qusish", "Tish cho'tkalash (yutmaslik sharti bilan)", "Ko'zga dori tomizish, qon topshirish"] },
        { h: "Kafforat", p: ["Ramazonda uzrsiz, qasddan ro'zani buzganga kafforat vojib: ketma-ket 60 kun ro'za tutish, bunga qodir bo'lmasa 60 miskinni to'ydirish"] },
        { h: "Ro'za tutmaslikka ruxsat berilganlar", p: ["Bemorlar va musofirlar (keyin qazosini tutadi)", "Homilador va emizikli ayollar (zarar xavfi bo'lsa)", "Hayz va nifos holatidagi ayollar (keyin qazo tutadi)", "Ro'za tutishga qodir bo'lmagan keksalar (fidya beradi)"] },
      ],
      ru: [
        { h: "Пост в Рамадан", p: ["Обязателен разумному, совершеннолетнему, здоровому мусульманину, не находящемуся в пути", "Воздержание от еды, питья и близости от рассвета до заката", "Намерение делается ночью или днём (до полудня)"] },
        { h: "Что нарушает пост (нужно восполнить)", p: ["Намеренная еда и питьё", "Намеренная рвота полным ртом", "Лекарство через рот или нос", "Проглатывание застрявшего между зубами больше горошины"] },
        { h: "Что не нарушает пост", p: ["Еда и питьё по забывчивости", "Невольная рвота", "Чистка зубов (не глотая)", "Глазные капли, сдача крови"] },
        { h: "Искупление (каффарат)", p: ["Намеренно нарушивший пост в Рамадан без причины постится 60 дней подряд, а если не может — кормит 60 бедных"] },
        { h: "Кому разрешено не поститься", p: ["Больным и путникам (потом восполняют)", "Беременным и кормящим при опасности вреда", "Женщинам в период менструации и после родов (потом восполняют)", "Немощным старикам (дают фидью)"] },
      ],
    },
  },
  {
    id: "haj", icon: "🕋", uz: "Haj", ru: "Хадж",
    body: {
      uz: [
        { h: "Haj kimga farz?", p: ["Umrida bir marta — musulmon, oqil, balog'atga yetgan, sog'lom, yo'l xarajati va oilasining nafaqasiga qodir kishiga", "Yo'l xavfsiz bo'lishi, ayol uchun mahram hamroh bo'lishi shart"] },
        { h: "Hajning farzlari", p: ["Ehrom — niyat va talbiya", "Arafotda turish (9 Zulhijja)", "Ziyorat tavofi"] },
        { h: "Hajning asosiy vojiblari", p: ["Muzdalifada turish", "Jamaralarga tosh otish", "Safo va Marva orasida sa'y", "Soch oldirish yoki qisqartirish", "Vido (xayrlashuv) tavofi — uzoqdan kelganlar uchun"] },
        { h: "Haj kunlari", p: ["8 Zulhijja — Tarviya kuni, Minoga borish", "9 Zulhijja — Arafa kuni", "10 Zulhijja — Qurbon hayiti, tosh otish, qurbonlik, soch oldirish, ziyorat tavofi", "11–13 Zulhijja — tashriq kunlari, tosh otish"] },
      ],
      ru: [
        { h: "Кому обязателен хадж?", p: ["Раз в жизни — мусульманину, разумному, совершеннолетнему, здоровому, способному оплатить дорогу и обеспечить семью", "При безопасной дороге; женщине — с махрамом"] },
        { h: "Фарды хаджа", p: ["Ихрам — намерение и тальбия", "Стояние на Арафате (9 зуль-хиджжа)", "Таваф аль-ифада"] },
        { h: "Основные ваджибы", p: ["Пребывание в Муздалифе", "Бросание камешков в джамараты", "Са'й между Сафа и Марва", "Бритьё или укорачивание волос", "Прощальный таваф — для приезжих"] },
        { h: "Дни хаджа", p: ["8 зуль-хиджжа — день Тарвия, в Мину", "9 — день Арафа", "10 — Курбан-хайит: камешки, жертва, бритьё, таваф", "11–13 — дни ташрик, бросание камешков"] },
      ],
    },
  },
  {
    id: "umra", icon: "🤍", uz: "Umra", ru: "Умра",
    body: {
      uz: [
        { h: "Umra nima?", p: ["Umra — Ka'bani ziyorat qilish ibodati, «kichik haj». Hanafiy mazhabida umrida bir marta qilish sunnati muakkada. Yilning istalgan vaqtida ado etiladi (Arafa kuni va tashriq kunlaridan tashqari makruh)."] },
        { h: "Umraning tartibi", p: ["Miqotda ehromga kirish: g'usl, ehrom kiyimi, 2 rakat namoz, niyat va talbiya", "Masjidul Haromga kirib, Ka'ba atrofida 7 marta tavof", "Maqomi Ibrohim ortida 2 rakat namoz, Zamzam suvidan ichish", "Safo va Marva orasida 7 marta sa'y (Safodan boshlanadi)", "Sochni oldirish yoki qisqartirish — ehromdan chiqiladi"] },
        { h: "Ehromdagi taqiqlar", p: ["Erkaklar uchun tikilgan kiyim kiyish, boshni yopish", "Atir sepish, soch va tirnoq olish", "Ov qilish", "Er-xotin yaqinligi", "Janjal va behuda so'zlar"] },
      ],
      ru: [
        { h: "Что такое умра?", p: ["Умра — «малый хадж», посещение Каабы. В ханафитском мазхабе раз в жизни — подтверждённая сунна. Совершается в любое время (кроме дня Арафа и дней ташрик — нежелательно)."] },
        { h: "Порядок умры", p: ["Ихрам у миката: гусль, одежда ихрама, 2 раката, намерение и тальбия", "Таваф — 7 кругов вокруг Каабы", "2 раката за Макамом Ибрахима, питьё Замзама", "Са'й — 7 раз между Сафа и Марва (начиная с Сафа)", "Бритьё или укорачивание волос — выход из ихрама"] },
        { h: "Запреты ихрама", p: ["Мужчинам — шитая одежда и покрытие головы", "Благовония, стрижка волос и ногтей", "Охота", "Супружеская близость", "Споры и пустословие"] },
      ],
    },
  },
  {
    id: "harom", icon: "⛔", uz: "Harom amallar", ru: "Запретные деяния",
    body: {
      uz: [
        { h: "Eng katta gunohlar", p: ["Allohga shirk keltirish", "Sehr qilish", "Nohaq odam o'ldirish", "Sudxo'rlik (riba)", "Yetim molini yeyish", "Jang maydonidan qochish", "Pokiza ayollarga tuhmat qilish", "Ota-onaga oq bo'lish"] },
        { h: "Boshqa harom amallar", p: ["Zino va unga olib boruvchi ishlar", "Mast qiluvchi ichimliklar va giyohvandlik", "Qimor va tavakkalchilik o'yinlari", "O'g'irlik, poraxo'rlik, firibgarlik", "Yolg'on, g'iybat va chaqimchilik", "Yolg'on guvohlik", "Cho'chqa go'shti, o'limtik va qon", "Qarindoshlik rishtalarini uzish", "Kibr va hasad"] },
        { h: "Eslatma", p: ["Alloh taolo chin tavbani qabul qiladi: gunohdan to'xtash, pushaymon bo'lish, qaytmaslikka azm qilish va boshqalarning haqqini qaytarish."] },
      ],
      ru: [
        { h: "Величайшие грехи", p: ["Придавать Аллаху сотоварищей (ширк)", "Колдовство", "Убийство без права", "Ростовщичество (риба)", "Присвоение имущества сироты", "Бегство с поля боя", "Клевета на целомудренных женщин", "Непочтение к родителям"] },
        { h: "Другие запретные деяния", p: ["Прелюбодеяние и то, что к нему ведёт", "Опьяняющие напитки и наркотики", "Азартные игры", "Воровство, взяточничество, обман", "Ложь, сплетни и злословие", "Лжесвидетельство", "Свинина, мертвечина и кровь", "Разрыв родственных связей", "Высокомерие и зависть"] },
        { h: "Напоминание", p: ["Аллах принимает искреннее покаяние: оставить грех, сожалеть, решить не возвращаться и вернуть чужие права."] },
      ],
    },
  },
  {
    id: "ayollar", icon: "🌸", uz: "Ayollar sahifasi", ru: "Страница для женщин",
    body: {
      uz: [
        { h: "Islomda ayolning o'rni", p: ["«Jannat onalarning oyoqlari ostidadir» mazmunidagi hadislar onaning yuksak martabasini bildiradi.", "Ilm olish erkak va ayolga birdek farz.", "Ayolning mol-mulkka egalik qilish, meros olish, mahr olish huquqlari Qur'onda belgilangan."] },
        { h: "Avrat va hijob", p: ["Ayolning namozdagi avrati — yuz, ikki kaft va (Hanafiyda) ikki oyoq panjasidan boshqa butun badani.", "Begona erkaklar oldida kiyim keng, badanni ko'rsatmaydigan va yopiq bo'lishi buyurilgan."] },
        { h: "Hayz va nifos holatida", p: ["Namoz o'qilmaydi va qazosi ham o'qilmaydi.", "Ro'za tutilmaydi, keyin qazosi tutiladi.", "Mushafni ushlash, masjidga kirish va tavof qilish mumkin emas.", "Zikr, duo, salovot aytish mumkin va savobli.", "Pok bo'lgach, g'usl qilinadi."] },
        { h: "Oila va tarbiya", p: ["Er-xotin bir-biriga yaxshi muomala qilishi, bir-birining haqqini ado etishi buyurilgan.", "Farzand tarbiyasi — eng katta omonatlardan.", "Payg'ambarimiz: «Sizlarning yaxshilaringiz — ahliga yaxshi bo'lganlaringizdir» (Termiziy)."] },
      ],
      ru: [
        { h: "Место женщины в исламе", p: ["Хадисы о том, что «Рай — под ногами матерей», указывают на высокое положение матери.", "Стремление к знанию обязательно и мужчине, и женщине.", "Право женщины на собственность, наследство и махр установлено Кораном."] },
        { h: "Аурат и хиджаб", p: ["Аурат женщины в намазе — всё тело, кроме лица, кистей рук и (у ханафитов) стоп.", "Перед посторонними мужчинами одежда должна быть свободной и закрытой."] },
        { h: "Во время менструации и после родов", p: ["Намаз не совершается и не восполняется.", "Пост не держат, но потом восполняют.", "Нельзя касаться Мусхафа, входить в мечеть и совершать таваф.", "Зикр, дуа и салават — можно и похвально.", "После очищения совершается гусль."] },
        { h: "Семья и воспитание", p: ["Супругам велено хорошо обращаться друг с другом и исполнять права друг друга.", "Воспитание детей — одно из величайших доверий.", "Пророк ﷺ: «Лучшие из вас — лучшие к своей семье» (Тирмизи)."] },
      ],
    },
  },
  {
    id: "qaytariqlar", icon: "🚫", uz: "Nabaviy qaytariqlar", ru: "Запреты Пророка ﷺ",
    body: {
      uz: [
        { h: "Payg'ambarimiz sollallohu alayhi vasallam qaytargan ishlar", p: [
          "Chap qo'l bilan yeyish va ichishdan (Muslim)",
          "G'azablanishdan — «G'azablanma» deb uch marta takrorlaganlar (Buxoriy)",
          "Bir-biriga hasad qilish, yuz o'girish va aloqani uch kundan ortiq uzishdan (Buxoriy, Muslim)",
          "G'iybat qilish va chaqimchilikdan (Muslim)",
          "Gumon qilish va ayb axtarishdan (Buxoriy, Muslim)",
          "Idishga nafas olish yoki puflashdan (Buxoriy, Abu Dovud)",
          "Yo'llarda va soyalarda hojat qilishdan (Muslim)",
          "Oltin va ipak kiyishdan — erkaklar uchun (Abu Dovud, Nasoiy)",
          "Yolg'on qasam ichish va ko'p qasam ichishdan (Muslim)",
          "Qo'shniga ozor berishdan (Buxoriy)",
          "Musulmonni masxara qilish va kamsitishdan (Muslim)",
          "Ikki kishi uchinchisini qoldirib shivirlashishidan (Buxoriy, Muslim)",
        ] },
      ],
      ru: [
        { h: "Что запретил Пророк ﷺ", p: [
          "Есть и пить левой рукой (Муслим)",
          "Гневаться — «Не гневайся», повторил трижды (Бухари)",
          "Завидовать, отворачиваться и прерывать общение больше трёх дней (Бухари, Муслим)",
          "Злословие и разнос сплетен (Муслим)",
          "Подозрения и выискивание недостатков (Бухари, Муслим)",
          "Дышать или дуть в сосуд (Бухари, Абу Дауд)",
          "Справлять нужду на дорогах и в тени (Муслим)",
          "Носить золото и шёлк — мужчинам (Абу Дауд, Насаи)",
          "Ложные клятвы и частые клятвы (Муслим)",
          "Причинять вред соседу (Бухари)",
          "Насмехаться над мусульманином и унижать его (Муслим)",
          "Шептаться вдвоём, оставив третьего (Бухари, Муслим)",
        ] },
      ],
    },
  },
];

// Islomiy bayramlar va muhim kunlar: [hijriy oy, kun, o'zbekcha, ruscha]
export const ISLAMIC_EVENTS = [
  [1, 1, "Hijriy yangi yil", "Исламский Новый год"],
  [1, 10, "Ashuro kuni", "День Ашура"],
  [3, 12, "Mavlud — Payg'ambarimiz tavalludi", "Мавлид — рождение Пророка ﷺ"],
  [7, 27, "Me'roj kechasi", "Ночь Мирадж"],
  [8, 15, "Barot kechasi", "Ночь Бараат"],
  [9, 1, "Ramazon oyi boshlanishi", "Начало месяца Рамадан"],
  [9, 27, "Qadr kechasi (taxminan)", "Ночь Предопределения (ориентировочно)"],
  [10, 1, "Ramazon hayiti", "Ураза-байрам"],
  [12, 9, "Arafa kuni", "День Арафа"],
  [12, 10, "Qurbon hayiti", "Курбан-байрам"],
];

export const HIJRI_MONTHS = {
  uz: ["Muharram", "Safar", "Rabiul avval", "Rabiul oxir", "Jumodul avval", "Jumodul oxir", "Rajab", "Sha'bon", "Ramazon", "Shavvol", "Zulqa'da", "Zulhijja"],
  ru: ["Мухаррам", "Сафар", "Раби аль-авваль", "Раби ас-сани", "Джумада аль-уля", "Джумада ас-сани", "Раджаб", "Шаабан", "Рамадан", "Шавваль", "Зуль-каада", "Зуль-хиджа"],
};
