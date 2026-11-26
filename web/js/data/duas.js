// Duolar va zikrlar.
// q: "2:201" / "20:25-28" / "112" — Qur'on oyatlari: arabcha matn va tarjima Qur'on manbasidan olinadi (xatosiz).
// Sunnat duolari — sahih manbalardan, manba (src) ko'rsatilgan. n — necha marta aytiladi.
export const DUA_CATEGORIES = [
  {
    id: "morning", icon: "🌅", uz: "Tongi zikrlar", ru: "Утренние азкары",
    items: [
      { q: "2:255", uz: "Oyatal Kursiy", ru: "Аят аль-Курси", src: "Nasoiy" },
      { q: "112", n: 3, uz: "Ixlos surasi", ru: "Сура аль-Ихлас", src: "Abu Dovud, Termiziy" },
      { q: "113", n: 3, uz: "Falaq surasi", ru: "Сура аль-Фаляк", src: "Abu Dovud, Termiziy" },
      { q: "114", n: 3, uz: "Nos surasi", ru: "Сура ан-Нас", src: "Abu Dovud, Termiziy" },
      {
        ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        tr: "Asbahna va asbahal mulku lillah, valhamdu lillah, la ilaha illallohu vahdahu la sharika lah, lahul mulku va lahul hamdu va huva 'ala kulli shay'in qodir",
        uz: "Tongga yetdik, mulk ham Allohniki bo'lib tong ottirdi. Hamd Allohga. Allohdan o'zga iloh yo'q, U yagona, sherigi yo'q. Mulk ham, hamd ham Unikidir, U har narsaga qodir.",
        ru: "Мы встретили утро, и встретило утро царство Аллаха. Хвала Аллаху. Нет божества, кроме одного Аллаха, у Него нет сотоварища. Ему принадлежит власть и хвала, и Он над всем мощен.",
        src: "Muslim",
      },
      {
        ar: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
        tr: "Allohumma bika asbahna, va bika amsayna, va bika nahya, va bika namutu, va ilaykan nushur",
        uz: "Allohim, Sen bilan tongga yetdik, Sen bilan kechga yetdik, Sen bilan yashaymiz, Sen bilan o'lamiz va qayta tirilish Sengadir.",
        ru: "О Аллах, с Тобой мы встретили утро и вечер, с Тобой живём и умираем, и к Тебе воскрешение.",
        src: "Termiziy, Abu Dovud",
      },
      {
        ar: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        tr: "Allohumma anta robbi la ilaha illa ant, xolaqtani va ana 'abduk, va ana 'ala 'ahdika va va'dika mastato't, a'uzu bika min sharri ma sona't, abu'u laka bini'matika 'alayya, va abu'u bizanbi fag'firli, fainnahu la yag'firuz zunuba illa ant",
        uz: "Sayyidul istig'for. Allohim, Sen mening Robbimsan, Sendan o'zga iloh yo'q. Meni yaratding, men Sening bandangman. Qo'limdan kelgancha Senga bergan ahdim va va'dam ustidaman. Qilgan ishlarimning yomonligidan Sendan panoh so'rayman. Menga bergan ne'matingni e'tirof etaman, gunohimni ham e'tirof etaman, meni kechir. Albatta, gunohlarni Sendan boshqa hech kim kechirmaydi.",
        ru: "Господин молений о прощении. О Аллах, Ты — мой Господь, нет божества, кроме Тебя. Ты создал меня, и я — Твой раб, и я верен договору с Тобой, насколько могу. Прибегаю к Тебе от зла того, что я совершил, признаю Твою милость ко мне и признаю свой грех — прости меня, ведь никто не прощает грехи, кроме Тебя.",
        src: "Buxoriy",
      },
      {
        ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        tr: "Bismillahillazi la yazurru ma'asmihi shay'un fil arzi va la fis sama'i va huvas sami'ul 'alim", n: 3,
        uz: "Ismi bilan yerda ham, osmonda ham hech narsa zarar yetkaza olmaydigan Allohning nomi bilan. U eshituvchi va biluvchidir.",
        ru: "С именем Аллаха, с именем Которого ничто не причинит вреда ни на земле, ни на небе. Он — Слышащий, Знающий.",
        src: "Abu Dovud, Termiziy",
      },
      {
        ar: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        tr: "Roziytu billahi robban, va bil islami dinan, va bi Muhammadin sollallohu 'alayhi va sallama nabiyya", n: 3,
        uz: "Allohni Robb, Islomni din va Muhammad sollallohu alayhi vasallamni payg'ambar deb rozi bo'ldim.",
        ru: "Я доволен Аллахом как Господом, исламом как религией и Мухаммадом ﷺ как пророком.",
        src: "Abu Dovud",
      },
      {
        ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", tr: "Subhanallohi va bihamdihi", n: 100,
        uz: "Allohni poklayman va Unga hamd aytaman.", ru: "Пречист Аллах, и хвала Ему.", src: "Muslim",
      },
    ],
  },
  {
    id: "evening", icon: "🌇", uz: "Kechki zikrlar", ru: "Вечерние азкары",
    items: [
      { q: "2:255", uz: "Oyatal Kursiy", ru: "Аят аль-Курси", src: "Nasoiy" },
      { q: "2:285-286", uz: "Baqara surasining oxirgi ikki oyati", ru: "Два последних аята суры аль-Бакара", src: "Buxoriy, Muslim" },
      { q: "112", n: 3, uz: "Ixlos surasi", ru: "Сура аль-Ихлас", src: "Abu Dovud, Termiziy" },
      { q: "113", n: 3, uz: "Falaq surasi", ru: "Сура аль-Фаляк", src: "Abu Dovud, Termiziy" },
      { q: "114", n: 3, uz: "Nos surasi", ru: "Сура ан-Нас", src: "Abu Dovud, Termiziy" },
      {
        ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        tr: "Amsayna va amsal mulku lillah, valhamdu lillah, la ilaha illallohu vahdahu la sharika lah, lahul mulku va lahul hamdu va huva 'ala kulli shay'in qodir",
        uz: "Kechga yetdik, mulk ham Allohniki bo'lib kech kirdi. Hamd Allohga. Allohdan o'zga iloh yo'q, U yagona, sherigi yo'q. Mulk ham, hamd ham Unikidir, U har narsaga qodir.",
        ru: "Мы встретили вечер, и встретило вечер царство Аллаха. Хвала Аллаху. Нет божества, кроме одного Аллаха, у Него нет сотоварища. Ему принадлежит власть и хвала, и Он над всем мощен.",
        src: "Muslim",
      },
      {
        ar: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
        tr: "Allohumma bika amsayna, va bika asbahna, va bika nahya, va bika namutu, va ilaykal masir",
        uz: "Allohim, Sen bilan kechga yetdik, Sen bilan tongga yetdik, Sen bilan yashaymiz, Sen bilan o'lamiz va qaytish Sengadir.",
        ru: "О Аллах, с Тобой мы встретили вечер и утро, с Тобой живём и умираем, и к Тебе возвращение.",
        src: "Termiziy, Abu Dovud",
      },
      {
        ar: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", tr: "A'uzu bikalimatillahit tammati min sharri ma xolaq", n: 3,
        uz: "Allohning mukammal so'zlari bilan U yaratgan narsalarning yomonligidan panoh so'rayman.",
        ru: "Прибегаю к совершенным словам Аллаха от зла того, что Он сотворил.", src: "Muslim",
      },
      {
        ar: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        tr: "Bismillahillazi la yazurru ma'asmihi shay'un fil arzi va la fis sama'i va huvas sami'ul 'alim", n: 3,
        uz: "Ismi bilan yerda ham, osmonda ham hech narsa zarar yetkaza olmaydigan Allohning nomi bilan. U eshituvchi va biluvchidir.",
        ru: "С именем Аллаха, с именем Которого ничто не причинит вреда ни на земле, ни на небе. Он — Слышащий, Знающий.",
        src: "Abu Dovud, Termiziy",
      },
      {
        ar: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", tr: "Bismikallohumma amutu va ahya",
        uz: "Uxlashdan oldin: Allohim, Sening isming bilan o'laman va tirilaman.",
        ru: "Перед сном: С Твоим именем, о Аллах, я умираю и оживаю.", src: "Buxoriy",
      },
    ],
  },
  {
    id: "quran", icon: "📖", uz: "Qur'ondagi duolar", ru: "Мольбы из Корана",
    items: [
      { q: "1", uz: "Fotiha surasi — eng buyuk duo", ru: "Сура аль-Фатиха — величайшая мольба" },
      { q: "2:201", uz: "Dunyo va oxirat yaxshiligi uchun", ru: "О благе этого мира и вечного" },
      { q: "2:127", uz: "Amalni qabul qilish so'rab", ru: "О принятии деяний" },
      { q: "2:286", uz: "Kechirim va yordam so'rab", ru: "О прощении и помощи" },
      { q: "3:8", uz: "Qalb hidoyatda sobit bo'lishi uchun", ru: "О твёрдости сердца на прямом пути" },
      { q: "3:193", uz: "Gunohlar kechirilishi uchun", ru: "О прощении грехов" },
      { q: "7:23", uz: "Odam alayhissalomning tavba duosi", ru: "Мольба Адама о покаянии" },
      { q: "14:40-41", uz: "Namoz va ota-ona uchun (Ibrohim a.s.)", ru: "О намазе и родителях (Ибрахим)" },
      { q: "17:24", uz: "Ota-ona haqqiga duo", ru: "Мольба за родителей" },
      { q: "20:25-28", uz: "Ish oson bo'lishi uchun (Muso a.s.)", ru: "Об облегчении дел (Муса)" },
      { q: "20:114", uz: "Ilm ziyoda bo'lishi uchun", ru: "О приумножении знания" },
      { q: "21:87", uz: "Yunus alayhissalom duosi — qiyinchilikda", ru: "Мольба Юнуса — в трудности" },
      { q: "23:118", uz: "Rahmat va mag'firat so'rab", ru: "О милости и прощении" },
      { q: "25:74", uz: "Oila va farzandlar uchun", ru: "О супругах и детях" },
    ],
  },
  {
    id: "sunnah", icon: "🤲", uz: "Sunnat duolar", ru: "Мольбы из Сунны",
    items: [
      {
        ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى", tr: "Allohumma inni as'alukal huda vat tuqo val 'afafa val g'ina",
        uz: "Allohim, Sendan hidoyat, taqvo, iffat va behojatlik so'rayman.", ru: "О Аллах, прошу у Тебя верного пути, богобоязненности, целомудрия и достатка.", src: "Muslim",
      },
      {
        ar: "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ", tr: "Ya muqollibal qulub, sabbit qolbi 'ala dinik",
        uz: "Ey qalblarni o'zgartiruvchi Zot, qalbimni diningda sobit qil.", ru: "О Изменяющий сердца, укрепи моё сердце в Твоей религии.", src: "Termiziy",
      },
      {
        ar: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", tr: "Allohumma a'inni 'ala zikrika va shukrika va husni 'ibadatik",
        uz: "Allohim, Seni zikr qilishimga, Senga shukr qilishimga va Senga go'zal ibodat qilishimga yordam ber.", ru: "О Аллах, помоги мне поминать Тебя, благодарить Тебя и прекрасно поклоняться Тебе.", src: "Abu Dovud, Nasoiy",
      },
      {
        ar: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", tr: "Robbig'firli va tub 'alayya innaka antat tavvabur rohim",
        uz: "Robbim, meni kechir va tavbamni qabul qil. Albatta, Sen tavbalarni qabul qiluvchi, rahmlisan.", ru: "Господи, прости меня и прими моё покаяние, ведь Ты — Принимающий покаяние, Милосердный.", src: "Abu Dovud, Termiziy",
      },
      {
        ar: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي", tr: "Allohumma innaka 'afuvvun tuhibbul 'afva fa'fu 'anni",
        uz: "Allohim, Sen afv etuvchisan, afvni yaxshi ko'rasan, meni afv et. (Qadr kechasi duosi)", ru: "О Аллах, Ты — Прощающий, любишь прощать, так прости меня. (Мольба ночи Кадр)", src: "Termiziy",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ زَوَالِ نِعْمَتِكَ، وَتَحَوُّلِ عَافِيَتِكَ، وَفُجَاءَةِ نِقْمَتِكَ، وَجَمِيعِ سَخَطِكَ",
        tr: "Allohumma inni a'uzu bika min zavali ni'matik, va tahavvuli 'afiyatik, va fuja'ati niqmatik, va jami'i saxatik",
        uz: "Allohim, ne'mating zavol topishidan, bergan salomatliging o'zgarishidan, to'satdan keladigan jazoingdan va barcha g'azabingdan Sendan panoh so'rayman.",
        ru: "О Аллах, прибегаю к Тебе от исчезновения Твоей милости, перемены Твоего благополучия, внезапности Твоего наказания и всего Твоего гнева.", src: "Muslim",
      },
    ],
  },
  {
    id: "praise", icon: "✨", uz: "Ibodat va Allohni madh etish", ru: "Поклонение и восхваление Аллаха",
    items: [
      {
        ar: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ", tr: "Subhanalloh, valhamdu lillah, va la ilaha illalloh, vallohu akbar",
        uz: "Alloh pokdir, hamd Allohga, Allohdan o'zga iloh yo'q, Alloh buyukdir. (Alloh nazdida eng sevimli so'zlar)", ru: "Пречист Аллах, хвала Аллаху, нет божества, кроме Аллаха, Аллах велик. (Самые любимые Аллахом слова)", src: "Muslim",
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", tr: "La ilaha illallohu vahdahu la sharika lah, lahul mulku va lahul hamd, va huva 'ala kulli shay'in qodir", n: 10,
        uz: "Allohdan o'zga iloh yo'q, U yagona, sherigi yo'q. Mulk ham, hamd ham Unikidir, U har narsaga qodir.", ru: "Нет божества, кроме одного Аллаха, нет у Него сотоварища. Ему власть и хвала, и Он над всем мощен.", src: "Buxoriy, Muslim",
      },
      {
        ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ", tr: "Subhanallohi va bihamdihi, subhanallohil 'azim",
        uz: "Tilda yengil, tarozida og'ir, Rahmonga sevimli ikki kalima: Allohni poklayman va Unga hamd aytaman, ulug' Allohni poklayman.", ru: "Два слова, лёгкие для языка, тяжёлые на весах и любимые Милостивым: Пречист Аллах и хвала Ему, пречист Аллах Великий.", src: "Buxoriy, Muslim",
      },
      {
        ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", tr: "La havla va la quvvata illa billah",
        uz: "Hech bir o'zgarish va kuch-quvvat faqat Alloh bilandir. (Jannat xazinalaridan biri)", ru: "Нет мощи и силы, кроме как у Аллаха. (Одно из сокровищ Рая)", src: "Buxoriy, Muslim",
      },
      {
        ar: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", tr: "Allohumma antas salamu va minkas salam, tabarakta ya zal jalali val ikrom",
        uz: "Namozdan keyin (3 marta \"Astag'firulloh\"dan so'ng): Allohim, Sen Salomsan, tinchlik Sendandir. Ey ulug'lik va ikrom egasi, Sen barakotlisan.", ru: "После намаза (после трёх «Астагфируллах»): О Аллах, Ты — Мир, и от Тебя мир. Благословен Ты, о Обладатель величия и щедрости.", src: "Muslim",
      },
      {
        ar: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
        tr: "Allohumma solli 'ala Muhammadin va 'ala ali Muhammad, kama sollayta 'ala Ibrohima va 'ala ali Ibrohim, innaka hamidum majid. Allohumma barik 'ala Muhammadin va 'ala ali Muhammad, kama barakta 'ala Ibrohima va 'ala ali Ibrohim, innaka hamidum majid",
        uz: "Salovoti Ibrohimiyya: Allohim, Ibrohim va uning oilasiga rahmat yog'dirganingdek, Muhammad va uning oilasiga ham rahmat yog'dir; Ibrohim va uning oilasiga baraka berganingdek, Muhammad va uning oilasiga ham baraka ber. Albatta, Sen maqtovga loyiq va ulug'sen.",
        ru: "Салават Ибрахимийя: О Аллах, благослови Мухаммада и семью Мухаммада, как Ты благословил Ибрахима и семью Ибрахима; ниспошли благодать Мухаммаду и семье Мухаммада, как ниспослал Ибрахиму и семье Ибрахима. Ты — Достойный хвалы, Славный.",
        src: "Buxoriy",
      },
    ],
  },
  {
    id: "hajj", icon: "🕋", uz: "Haj va umra", ru: "Хадж и умра",
    items: [
      {
        ar: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
        tr: "Labbaykallohumma labbayk, labbayka la sharika laka labbayk, innal hamda van ni'mata laka val mulk, la sharika lak",
        uz: "Talbiya: Labbay, Allohim, labbay! Labbay, Sening sheriging yo'q, labbay! Albatta, hamd, ne'mat va mulk Senikidir, Sening sheriging yo'q.",
        ru: "Тальбия: Вот я пред Тобой, о Аллах, вот я! Нет у Тебя сотоварища, вот я! Поистине, хвала, милость и власть — Твои, нет у Тебя сотоварища.", src: "Buxoriy, Muslim",
      },
      {
        ar: "بِسْمِ اللَّهِ، وَاللَّهُ أَكْبَرُ", tr: "Bismillahi vallohu akbar",
        uz: "Tavofda Hajarul Asvadga yetganda aytiladi.", ru: "Произносится у Чёрного камня во время тавафа.", src: "Bayhaqiy",
      },
      { q: "2:201", uz: "Rukni Yamoniy va Hajarul Asvad orasida", ru: "Между Йеменским углом и Чёрным камнем", src: "Abu Dovud" },
      { q: "2:158", uz: "Safo tepaligiga chiqishda", ru: "При подъёме на холм Сафа", src: "Muslim" },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", tr: "La ilaha illallohu vahdahu la sharika lah, lahul mulku va lahul hamd, va huva 'ala kulli shay'in qodir",
        uz: "Arafa kunining eng yaxshi duosi.", ru: "Лучшая мольба дня Арафа.", src: "Termiziy",
      },
    ],
  },
  {
    id: "travel", icon: "✈️", uz: "Safar", ru: "Путешествие",
    items: [
      { q: "43:13-14", uz: "Ulovga minganda (safar duosi)", ru: "Сев в транспорт (мольба путника)", src: "Muslim" },
      {
        ar: "اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ",
        tr: "Allohumma inna nas'aluka fi safarina hazal birro vat taqva, va minal 'amali ma tarzo, Allohumma havvin 'alayna safarana haza vatvi 'anna bu'dah",
        uz: "Allohim, bu safarimizda Sendan yaxshilik, taqvo va O'zing rozi bo'ladigan amalni so'raymiz. Allohim, bu safarimizni bizga oson qil va uzoqligini qisqartir.",
        ru: "О Аллах, просим у Тебя в этом пути благочестия, богобоязненности и угодных Тебе дел. О Аллах, облегчи нам этот путь и сократи его дальность.", src: "Muslim",
      },
      {
        ar: "أَسْتَوْدِعُ اللَّهَ دِينَكَ، وَأَمَانَتَكَ، وَخَوَاتِيمَ عَمَلِكَ", tr: "Astavdi'ullaha dinaka, va amanataka, va xavatima 'amalik",
        uz: "Safarga kuzatayotganda: Diningni, omonatingni va amallaringning oxirini Allohga omonat topshiraman.", ru: "Провожая путника: Вверяю Аллаху твою религию, твою честность и итог твоих дел.", src: "Abu Dovud, Termiziy",
      },
      {
        ar: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", tr: "A'uzu bikalimatillahit tammati min sharri ma xolaq",
        uz: "Biror manzilga tushganda: Allohning mukammal so'zlari bilan U yaratgan narsalarning yomonligidan panoh so'rayman.", ru: "Остановившись в пути: Прибегаю к совершенным словам Аллаха от зла того, что Он сотворил.", src: "Muslim",
      },
      {
        ar: "آيِبُونَ، تَائِبُونَ، عَابِدُونَ، لِرَبِّنَا حَامِدُونَ", tr: "Ayibuna, ta'ibuna, 'abiduna, lirobbina hamidun",
        uz: "Safardan qaytganda: Qaytuvchimiz, tavba qiluvchimiz, ibodat qiluvchimiz, Robbimizga hamd aytuvchimiz.", ru: "Возвращаясь: Мы возвращаемся, каемся, поклоняемся и восхваляем нашего Господа.", src: "Buxoriy, Muslim",
      },
    ],
  },
  {
    id: "feelings", icon: "💚", uz: "Quvonch va qayg'u", ru: "Радость и печаль",
    items: [
      {
        ar: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ", tr: "Alhamdu lillahillazi bini'matihi tatimmus solihat",
        uz: "Xursand bo'lganda: Ne'mati bilan yaxshi ishlar mukammal bo'ladigan Allohga hamd.", ru: "При радости: Хвала Аллаху, по милости Которого свершаются благие дела.", src: "Ibn Moja",
      },
      {
        ar: "الْحَمْدُ لِلَّهِ عَلَى كُلِّ حَالٍ", tr: "Alhamdu lillahi 'ala kulli hal",
        uz: "Yoqmagan narsa yuz berganda: Har qanday holatda ham Allohga hamd.", ru: "При неприятном: Хвала Аллаху в любом положении.", src: "Ibn Moja",
      },
      {
        ar: "لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
        tr: "La ilaha illallohul 'azimul halim, la ilaha illallohu robbul 'arshil 'azim, la ilaha illallohu robbus samavati va robbul arzi va robbul 'arshil karim",
        uz: "G'am-tashvishda: Ulug' va halim Allohdan o'zga iloh yo'q. Buyuk Arshning Robbi Allohdan o'zga iloh yo'q. Osmonlar, yer va karim Arshning Robbi Allohdan o'zga iloh yo'q.",
        ru: "В горе: Нет божества, кроме Аллаха Великого, Кроткого. Нет божества, кроме Аллаха, Господа великого Трона. Нет божества, кроме Аллаха, Господа небес, земли и благородного Трона.", src: "Buxoriy, Muslim",
      },
      {
        ar: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْبُخْلِ وَالْجُبْنِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ",
        tr: "Allohumma inni a'uzu bika minal hammi val hazan, val 'ajzi val kasal, val buxli val jubn, va zola'id dayn, va g'olabatir rijal",
        uz: "Allohim, g'am va qayg'udan, ojizlik va dangasalikdan, baxillik va qo'rqoqlikdan, qarz og'irligidan va odamlar g'olib kelishidan Sendan panoh so'rayman.",
        ru: "О Аллах, прибегаю к Тебе от тревоги и печали, бессилия и лени, скупости и трусости, бремени долга и притеснения людей.", src: "Buxoriy",
      },
      { q: "21:87", uz: "Yunus alayhissalom duosi", ru: "Мольба Юнуса" },
      { q: "3:173", uz: "\"Hasbunallohu va ni'mal vakil\" — qo'rquv va xavfda", ru: "«Хасбуналлах ва ни'маль вакиль» — при страхе" },
    ],
  },
  {
    id: "nature", icon: "🌧", uz: "Tabiat", ru: "Природа",
    items: [
      { ar: "اللَّهُمَّ صَيِّبًا نَافِعًا", tr: "Allohumma soyyiban nafi'a", uz: "Yomg'ir yog'ganda: Allohim, foydali yomg'ir qil.", ru: "Во время дождя: О Аллах, сделай его полезным дождём.", src: "Buxoriy" },
      { ar: "مُطِرْنَا بِفَضْلِ اللَّهِ وَرَحْمَتِهِ", tr: "Mutirna bifazlillahi va rohmatih", uz: "Yomg'irdan keyin: Allohning fazli va rahmati bilan yomg'ir yog'di.", ru: "После дождя: Нам ниспослан дождь по милости и щедрости Аллаха.", src: "Buxoriy, Muslim" },
      { ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّهَا", tr: "Allohumma inni as'aluka xoyroha, va a'uzu bika min sharriha", uz: "Shamol esganda: Allohim, Sendan uning yaxshiligini so'rayman va yomonligidan panoh so'rayman.", ru: "При ветре: О Аллах, прошу у Тебя его блага и прибегаю к Тебе от его зла.", src: "Abu Dovud" },
      { ar: "سُبْحَانَ الَّذِي يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ وَالْمَلَائِكَةُ مِنْ خِيفَتِهِ", tr: "Subhanallazi yusabbihur ro'du bihamdihi val mala'ikatu min xifatih", uz: "Momaqaldiroqda: Momaqaldiroq Unga hamd bilan, farishtalar Undan qo'rqib tasbeh aytadigan Zot pokdir.", ru: "При громе: Пречист Тот, Кого славит гром хвалой, и ангелы — из страха перед Ним.", src: "Imom Molik (Muvatto)" },
      { ar: "اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْيُمْنِ وَالْإِيمَانِ، وَالسَّلَامَةِ وَالْإِسْلَامِ، رَبِّي وَرَبُّكَ اللَّهُ", tr: "Allohumma ahillahu 'alayna bil yumni val iyman, vas salamati val islam, robbi va robbukalloh", uz: "Yangi oyni ko'rganda: Allohim, uni bizga baraka, iymon, salomatlik va Islom bilan chiqar. (Ey oy,) mening Robbim ham, sening Robbing ham Allohdir.", ru: "Увидев новый месяц: О Аллах, яви его нам с благом и верой, с миром и исламом. Мой и твой Господь — Аллах.", src: "Termiziy" },
    ],
  },
  {
    id: "manners", icon: "🌿", uz: "Odob-axloq", ru: "Этика и нравы",
    items: [
      { ar: "الْحَمْدُ لِلَّهِ", tr: "Alhamdu lillah", uz: "Aksirganda: Allohga hamd. Eshitgan kishi \"Yarhamukalloh\" (Alloh senga rahm qilsin) deydi, aksirgan kishi \"Yahdikumullohu va yuslihu balakum\" (Alloh sizni hidoyat qilsin va holingizni isloh qilsin) deb javob beradi.", ru: "Чихнув: Хвала Аллаху. Слышащий говорит «Ярхамукаллах» (да помилует тебя Аллах), а чихнувший отвечает «Яхдикумуллаху ва юслиху балякум» (да наставит вас Аллах и исправит ваше положение).", src: "Buxoriy" },
      { ar: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", tr: "A'uzu billahi minash shaytonir rojim", uz: "G'azablanganda: Quvilgan shaytondan Allohga panoh so'rayman.", ru: "В гневе: Прибегаю к Аллаху от проклятого шайтана.", src: "Buxoriy, Muslim" },
      { ar: "اللَّهُمَّ أَنْتَ حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي", tr: "Allohumma anta hassanta xolqi fahassin xuluqi", uz: "Ko'zguga qaraganda: Allohim, suratimni go'zal qilding, xulqimni ham go'zal qil.", ru: "Глядя в зеркало: О Аллах, Ты сделал прекрасным мой облик — сделай прекрасным и мой нрав.", src: "Imom Ahmad" },
      { ar: "جَزَاكَ اللَّهُ خَيْرًا", tr: "Jazakallohu xoyro", uz: "Yaxshilik qilgan kishiga: Alloh senga yaxshi mukofot bersin.", ru: "Тому, кто сделал добро: Да воздаст тебе Аллах благом.", src: "Termiziy" },
      { ar: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ", tr: "Subhanakallohumma va bihamdik, ashhadu alla ilaha illa ant, astag'firuka va atubu ilayk", uz: "Majlis tugaganda (kafforatul majlis): Allohim, Seni hamding bilan poklayman. Sendan o'zga iloh yo'qligiga guvohlik beraman, Sendan mag'firat so'rayman va Senga tavba qilaman.", ru: "В конце собрания: Пречист Ты, о Аллах, и хвала Тебе. Свидетельствую, что нет божества, кроме Тебя, прошу у Тебя прощения и каюсь пред Тобой.", src: "Termiziy" },
    ],
  },
  {
    id: "family", icon: "🏡", uz: "Uy va oila", ru: "Дом и семья",
    items: [
      { ar: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", tr: "Bismillah, tavakkaltu 'alalloh, va la havla va la quvvata illa billah", uz: "Uydan chiqishda: Allohning nomi bilan, Allohga tavakkal qildim, kuch-quvvat faqat Alloh bilandir.", ru: "Выходя из дома: С именем Аллаха, уповаю на Аллаха, нет мощи и силы, кроме как у Аллаха.", src: "Abu Dovud, Termiziy" },
      { ar: "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى رَبِّنَا تَوَكَّلْنَا", tr: "Bismillahi valajna, va bismillahi xorojna, va 'ala robbina tavakkalna", uz: "Uyga kirishda: Allohning nomi bilan kirdik, Allohning nomi bilan chiqdik va Robbimizga tavakkal qildik. (So'ng oila ahliga salom beriladi)", ru: "Входя в дом: С именем Аллаха мы вошли, с именем Аллаха вышли и на нашего Господа уповаем. (Затем приветствуют домашних)", src: "Abu Dovud" },
      { q: "25:74", uz: "Juft va farzandlar uchun", ru: "За супругов и детей" },
      { q: "17:24", uz: "Ota-ona uchun", ru: "За родителей" },
      { ar: "بَارَكَ اللَّهُ لَكَ، وَبَارَكَ عَلَيْكَ، وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ", tr: "Barokallohu lak, va baroka 'alayk, va jama'a baynakuma fi xoyr", uz: "Yangi oila qurganlarni tabriklash: Alloh senga baraka bersin, senga barakasini yog'dirsin va ikkovingizni yaxshilikda birlashtirsin.", ru: "Поздравление молодожёнов: Да благословит тебя Аллах, да ниспошлёт тебе благодать и да соединит вас в добре.", src: "Abu Dovud, Termiziy" },
      { ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", tr: "Alhamdu lillahillazi ahyana ba'da ma amatana va ilayhin nushur", uz: "Uyqudan uyg'onganda: Bizni o'ldirganidan (uxlatganidan) keyin tiriltirgan Allohga hamd, qaytish Ungadir.", ru: "Проснувшись: Хвала Аллаху, Который оживил нас после того, как умертвил, и к Нему воскрешение.", src: "Buxoriy" },
    ],
  },
  {
    id: "food", icon: "🍽", uz: "Taom va ichimliklar", ru: "Еда и напитки",
    items: [
      { ar: "بِسْمِ اللَّهِ", tr: "Bismillah", uz: "Ovqatdan oldin: Allohning nomi bilan.", ru: "Перед едой: С именем Аллаха.", src: "Abu Dovud, Termiziy" },
      { ar: "بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ", tr: "Bismillahi avvalahu va axirah", uz: "Boshida aytish esdan chiqsa: Avvali ham, oxiri ham Allohning nomi bilan.", ru: "Если забыл в начале: С именем Аллаха — в начале и в конце.", src: "Abu Dovud, Termiziy" },
      { ar: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا، وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", tr: "Alhamdu lillahillazi at'amani haza, va rozaqoniyhi min g'oyri havlin minni va la quvvah", uz: "Ovqatdan keyin: Menga buni yedirgan va mening kuch-quvvatimsiz rizq qilib bergan Allohga hamd.", ru: "После еды: Хвала Аллаху, Который накормил меня этим и наделил этим без моей мощи и силы.", src: "Abu Dovud, Termiziy" },
      { ar: "اللَّهُمَّ بَارِكْ لَهُمْ فِيمَا رَزَقْتَهُمْ، وَاغْفِرْ لَهُمْ وَارْحَمْهُمْ", tr: "Allohumma barik lahum fima rozaqtahum, vag'fir lahum varhamhum", uz: "Mezbon haqqiga: Allohim, ularga bergan rizqingga baraka ber, ularni kechir va ularga rahm qil.", ru: "За хозяев: О Аллах, благослови их в том, чем Ты их наделил, прости их и помилуй.", src: "Muslim" },
      { ar: "ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ", tr: "Zahabaz zoma'u, vabtallatil 'uruqu, va sabatal ajru in sha Alloh", uz: "Iftorda: Tashnalik ketdi, tomirlar namlandi va inshaAlloh ajr sobit bo'ldi.", ru: "При разговении: Ушла жажда, увлажнились жилы, и утвердилась награда, если пожелает Аллах.", src: "Abu Dovud" },
      { ar: "اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَزِدْنَا مِنْهُ", tr: "Allohumma barik lana fihi va zidna minh", uz: "Sut ichganda: Allohim, unda bizga baraka ber va uni ziyoda qil.", ru: "Выпив молока: О Аллах, благослови нас в нём и прибавь нам его.", src: "Termiziy" },
    ],
  },
  {
    id: "illness", icon: "🕊", uz: "Kasallik va o'lim", ru: "Болезнь и смерть",
    items: [
      { ar: "لَا بَأْسَ، طَهُورٌ إِنْ شَاءَ اللَّهُ", tr: "La ba's, tohurun in sha Alloh", uz: "Bemor ziyoratida: Zarari yo'q, inshaAlloh, (gunohlardan) poklanishdir.", ru: "Навещая больного: Ничего страшного, это очищение, если пожелает Аллах.", src: "Buxoriy" },
      { ar: "اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَاسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا", tr: "Allohumma robban nas, azhibil ba's, ishfi antash shafi, la shifa'a illa shifa'uk, shifa'an la yug'odiru saqoma", uz: "Bemorga shifo so'rab: Allohim, ey odamlarning Robbi, dardni ket. Shifo ber, Sen shifo beruvchisan. Sening shifoingdan boshqa shifo yo'q. Hech bir kasallik qoldirmaydigan shifo ber.", ru: "О исцелении больного: О Аллах, Господь людей, устрани недуг, исцели — Ты Исцеляющий, нет исцеления, кроме Твоего, исцеления, не оставляющего болезни.", src: "Buxoriy, Muslim" },
      { ar: "أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ", tr: "A'uzu billahi va qudrotihi min sharri ma ajidu va uhazir", n: 7, uz: "Og'riyotgan joyga qo'l qo'yib, 3 marta \"Bismillah\", so'ng 7 marta: Sezayotgan va qo'rqayotgan narsamning yomonligidan Allohga va Uning qudratiga panoh so'rayman.", ru: "Положив руку на больное место: 3 раза «Бисмиллях», затем 7 раз: Прибегаю к Аллаху и Его могуществу от зла того, что чувствую и чего опасаюсь.", src: "Muslim" },
      { ar: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا", tr: "Inna lillahi va inna ilayhi roji'un, Allohumma'jurni fi musibati va axlif li xoyron minha", uz: "Musibat yetganda: Albatta, biz Allohnikimiz va albatta, Unga qaytuvchimiz. Allohim, musibatimda menga ajr ber va o'rniga undan yaxshirog'ini ber.", ru: "При беде: Поистине, мы принадлежим Аллаху и к Нему вернёмся. О Аллах, вознагради меня в моей беде и замени её лучшим.", src: "Muslim" },
      { ar: "اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ", tr: "Allohummag'fir lahu varhamhu, va 'afihi va'fu 'anh", uz: "Marhum haqqiga: Allohim, uni kechir, unga rahm qil, uni o'z panohingda saqla va uni afv et.", ru: "За покойного: О Аллах, прости его, помилуй, избавь и извини его.", src: "Muslim" },
      { ar: "السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ، وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَاحِقُونَ، نَسْأَلُ اللَّهَ لَنَا وَلَكُمُ الْعَافِيَةَ", tr: "Assalamu 'alaykum ahlad diyari minal mu'minina val muslimin, va inna in sha Allohu bikum lahiqun, nas'alullaha lana va lakumul 'afiyah", uz: "Qabristonga kirganda: Ey bu maskanlarning mo'min va musulmon ahli, sizlarga salom! InshaAlloh, biz ham sizlarga qo'shilguvchimiz. Allohdan o'zimizga va sizlarga omonlik so'raymiz.", ru: "Посещая кладбище: Мир вам, обитатели этих жилищ из верующих и мусульман! Мы, если пожелает Аллах, присоединимся к вам. Просим у Аллаха благополучия для нас и для вас.", src: "Muslim" },
    ],
  },
];
