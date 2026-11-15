/**
 * Konten dzikir pagi, petang, dan sebelum tidur.
 *
 * STATUS: PERLU DITINJAU. Teks hadis, latin, terjemah, dan rujukan ditulis dari
 * sumber yang umum dipakai (Hisnul Muslim dan kitab hadis yang dirujuk), tetapi
 * belum diperiksa oleh pengelola. Lihat DATA_SOURCES.md sebelum rilis.
 *
 * Untuk dzikir berupa ayat (`quran`), seeder mengambil teks Arab (rasm Utsmani)
 * dan terjemah Kemenag dari AlQuran Cloud saat online, lalu membandingkannya
 * dengan teks bawaan di sini. Teks bawaan hanya cadangan saat offline.
 */

export interface QuranRef {
  surah: number;
  from: number;
  to: number;
}

export interface DhikrSeed {
  /** Slug stabil tanpa grup; id baris = `${group}-${slug}`. Jangan diubah setelah rilis. */
  slug: string;
  groups: ('pagi' | 'petang' | 'tidur')[];
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  reference: string;
  note?: string;
  repeat: number;
  quran?: QuranRef;
}

const AYAT_KURSI: Omit<DhikrSeed, 'groups' | 'reference' | 'note' | 'repeat' | 'slug'> = {
  title: 'Ayat Kursi',
  quran: { surah: 2, from: 255, to: 255 },
  arabic:
    'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
  latin:
    "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā ta'khużuhū sinatuw wa lā naum, lahū mā fis-samāwāti wa mā fil-arḍ, man żal-lażī yasyfa'u 'indahū illā bi'iżnih, ya'lamu mā baina aidīhim wa mā khalfahum, wa lā yuḥīṭūna bisyai'im min 'ilmihī illā bimā syā', wasi'a kursiyyuhus-samāwāti wal-arḍ, wa lā ya'ūduhū ḥifẓuhumā, wa huwal-'aliyyul-'aẓīm.",
  translation:
    'Allah, tidak ada tuhan selain Dia, Yang Mahahidup lagi terus-menerus mengurus makhluk-Nya. Dia tidak dilanda kantuk dan tidak pula tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan mereka dan apa yang di belakang mereka, dan mereka tidak mengetahui sesuatu pun dari ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi, dan Dia tidak merasa berat memelihara keduanya. Dialah Yang Mahatinggi lagi Mahaagung.',
};

const IKHLAS = {
  title: 'Surah Al-Ikhlas',
  quran: { surah: 112, from: 1, to: 4 },
  arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
  latin:
    'Qul huwallāhu aḥad. Allāhuṣ-ṣamad. Lam yalid wa lam yūlad. Wa lam yakul lahū kufuwan aḥad.',
  translation:
    'Katakanlah, "Dialah Allah, Yang Maha Esa. Allah tempat meminta segala sesuatu. Dia tidak beranak dan tidak pula diperanakkan. Dan tidak ada sesuatu pun yang setara dengan-Nya."',
};

const FALAQ = {
  title: 'Surah Al-Falaq',
  quran: { surah: 113, from: 1, to: 5 },
  arabic:
    'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
  latin:
    "Qul a'ūżu birabbil-falaq. Min syarri mā khalaq. Wa min syarri gāsiqin iżā waqab. Wa min syarrin-naffāṡāti fil-'uqad. Wa min syarri ḥāsidin iżā ḥasad.",
  translation:
    'Katakanlah, "Aku berlindung kepada Tuhan yang menguasai subuh, dari kejahatan makhluk yang Dia ciptakan, dari kejahatan malam apabila telah gelap gulita, dari kejahatan perempuan-perempuan penyihir yang meniup pada buhul-buhul, dan dari kejahatan orang yang dengki apabila dia dengki."',
};

const NAS = {
  title: 'Surah An-Nas',
  quran: { surah: 114, from: 1, to: 6 },
  arabic:
    'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
  latin:
    "Qul a'ūżu birabbin-nās. Malikin-nās. Ilāhin-nās. Min syarril-waswāsil-khannās. Allażī yuwaswisu fī ṣudūrin-nās. Minal-jinnati wan-nās.",
  translation:
    'Katakanlah, "Aku berlindung kepada Tuhannya manusia, Raja manusia, sembahan manusia, dari kejahatan bisikan setan yang bersembunyi, yang membisikkan kejahatan ke dalam dada manusia, dari golongan jin dan manusia."',
};

const QULS_PAGI_PETANG = 'HR. Abu Dawud no. 5082 dan At-Tirmidzi no. 3575';
const QULS_TIDUR = 'HR. Al-Bukhari no. 5017';
const QULS_TIDUR_NOTE =
  'Dibaca dengan menangkupkan kedua telapak tangan dan meniupnya, lalu diusapkan ke tubuh yang terjangkau. Diulang tiga kali.';

const SAYYIDUL_ISTIGHFAR = {
  slug: 'sayyidul-istighfar',
  title: 'Sayyidul Istighfar',
  arabic:
    'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  latin:
    "Allāhumma anta rabbī lā ilāha illā ant, khalaqtanī wa ana 'abduk, wa ana 'alā 'ahdika wa wa'dika mastaṭa't, a'ūżu bika min syarri mā ṣana't, abū'u laka bini'matika 'alayy, wa abū'u biżambī fagfir lī, fa innahū lā yagfiruż-żunūba illā ant.",
  translation:
    'Ya Allah, Engkau Tuhanku, tidak ada tuhan selain Engkau. Engkau menciptakanku dan aku adalah hamba-Mu. Aku berada di atas perjanjian dan janji-Mu semampuku. Aku berlindung kepada-Mu dari keburukan perbuatanku. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku, sesungguhnya tidak ada yang mengampuni dosa selain Engkau.',
  reference: 'HR. Al-Bukhari no. 6306',
  repeat: 1,
};

const BISMILLAH_LA_YADHURRU = {
  slug: 'bismillahilladzi',
  title: 'Perlindungan dengan nama Allah',
  arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
  latin:
    "Bismillāhil-lażī lā yaḍurru ma'asmihī syai'un fil-arḍi wa lā fis-samā', wa huwas-samī'ul-'alīm.",
  translation:
    'Dengan nama Allah yang bersama nama-Nya tidak ada sesuatu pun di bumi maupun di langit yang dapat membahayakan, dan Dialah Yang Maha Mendengar lagi Maha Mengetahui.',
  reference: 'HR. Abu Dawud no. 5088 dan At-Tirmidzi no. 3388',
  repeat: 3,
};

const RADHITU = {
  slug: 'radhitu',
  title: 'Ridha kepada Allah, Islam, dan Nabi Muhammad ﷺ',
  arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
  latin:
    "Raḍītu billāhi rabbā, wa bil-islāmi dīnā, wa bi muḥammadin ṣallallāhu 'alaihi wa sallama nabiyyā.",
  translation: 'Aku ridha Allah sebagai Tuhan, Islam sebagai agama, dan Muhammad ﷺ sebagai nabi.',
  reference: 'HR. Abu Dawud no. 5072 dan At-Tirmidzi no. 3389',
  repeat: 3,
};

const HASBIYALLAH = {
  slug: 'hasbiyallah',
  title: 'Cukuplah Allah bagiku',
  arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
  latin: "Ḥasbiyallāhu lā ilāha illā huwa, 'alaihi tawakkaltu, wa huwa rabbul-'arsyil-'aẓīm.",
  translation:
    'Cukuplah Allah bagiku, tidak ada tuhan selain Dia. Kepada-Nya aku bertawakal, dan Dia adalah Tuhan pemilik Arsy yang agung.',
  reference: 'HR. Abu Dawud no. 5081 (QS. At-Taubah: 129)',
  repeat: 7,
};

const SUBHANALLAH_WABIHAMDIHI = {
  slug: 'subhanallah-wabihamdihi',
  title: 'Tasbih dan tahmid',
  arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  latin: 'Subḥānallāhi wa biḥamdih.',
  translation: 'Mahasuci Allah dan dengan memuji-Nya.',
  reference: 'HR. Muslim no. 2692',
  repeat: 100,
};

export const DHIKR_CONTENT: DhikrSeed[] = [
  // ---------------------------------------------------------------- Pagi & petang
  {
    ...AYAT_KURSI,
    slug: 'ayat-kursi',
    groups: ['pagi', 'petang'],
    reference: "QS. Al-Baqarah: 255; HR. An-Nasa'i dalam 'Amal al-Yaum wa al-Lailah",
    repeat: 1,
  },
  {
    ...IKHLAS,
    slug: 'al-ikhlas',
    groups: ['pagi', 'petang'],
    reference: QULS_PAGI_PETANG,
    repeat: 3,
  },
  {
    ...FALAQ,
    slug: 'al-falaq',
    groups: ['pagi', 'petang'],
    reference: QULS_PAGI_PETANG,
    repeat: 3,
  },
  { ...NAS, slug: 'an-nas', groups: ['pagi', 'petang'], reference: QULS_PAGI_PETANG, repeat: 3 },
  {
    slug: 'ashbahna',
    groups: ['pagi'],
    title: 'Memasuki pagi',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    latin:
      "Aṣbaḥnā wa aṣbaḥal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli syai'in qadīr. Rabbi as'aluka khaira mā fī hāżal-yaumi wa khaira mā ba'dah, wa a'ūżu bika min syarri mā fī hāżal-yaumi wa syarri mā ba'dah. Rabbi a'ūżu bika minal-kasali wa sū'il-kibar. Rabbi a'ūżu bika min 'ażābin fin-nāri wa 'ażābin fil-qabr.",
    translation:
      'Kami memasuki pagi dan kerajaan milik Allah pun memasuki pagi. Segala puji bagi Allah. Tidak ada tuhan selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu. Wahai Tuhanku, aku memohon kepada-Mu kebaikan hari ini dan kebaikan sesudahnya, dan aku berlindung kepada-Mu dari keburukan hari ini dan keburukan sesudahnya. Wahai Tuhanku, aku berlindung kepada-Mu dari kemalasan dan keburukan masa tua. Wahai Tuhanku, aku berlindung kepada-Mu dari azab neraka dan azab kubur.',
    reference: 'HR. Muslim no. 2723',
    repeat: 1,
  },
  {
    slug: 'amsaina',
    groups: ['petang'],
    title: 'Memasuki petang',
    arabic:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    latin:
      "Amsainā wa amsal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli syai'in qadīr. Rabbi as'aluka khaira mā fī hāżihil-lailati wa khaira mā ba'dahā, wa a'ūżu bika min syarri mā fī hāżihil-lailati wa syarri mā ba'dahā. Rabbi a'ūżu bika minal-kasali wa sū'il-kibar. Rabbi a'ūżu bika min 'ażābin fin-nāri wa 'ażābin fil-qabr.",
    translation:
      'Kami memasuki petang dan kerajaan milik Allah pun memasuki petang. Segala puji bagi Allah. Tidak ada tuhan selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan pujian, dan Dia Mahakuasa atas segala sesuatu. Wahai Tuhanku, aku memohon kepada-Mu kebaikan malam ini dan kebaikan sesudahnya, dan aku berlindung kepada-Mu dari keburukan malam ini dan keburukan sesudahnya. Wahai Tuhanku, aku berlindung kepada-Mu dari kemalasan dan keburukan masa tua. Wahai Tuhanku, aku berlindung kepada-Mu dari azab neraka dan azab kubur.',
    reference: 'HR. Muslim no. 2723',
    repeat: 1,
  },
  {
    slug: 'allahumma-bika-ashbahna',
    groups: ['pagi'],
    title: 'Dengan-Mu kami memasuki pagi',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
    latin:
      'Allāhumma bika aṣbaḥnā, wa bika amsainā, wa bika naḥyā, wa bika namūtu, wa ilaikan-nusyūr.',
    translation:
      'Ya Allah, dengan-Mu kami memasuki pagi, dengan-Mu kami memasuki petang, dengan-Mu kami hidup, dengan-Mu kami mati, dan kepada-Mu kebangkitan.',
    reference: 'HR. At-Tirmidzi no. 3391 dan Abu Dawud no. 5068',
    repeat: 1,
  },
  {
    slug: 'allahumma-bika-amsaina',
    groups: ['petang'],
    title: 'Dengan-Mu kami memasuki petang',
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
    latin:
      'Allāhumma bika amsainā, wa bika aṣbaḥnā, wa bika naḥyā, wa bika namūtu, wa ilaikal-maṣīr.',
    translation:
      'Ya Allah, dengan-Mu kami memasuki petang, dengan-Mu kami memasuki pagi, dengan-Mu kami hidup, dengan-Mu kami mati, dan kepada-Mu tempat kembali.',
    reference: 'HR. At-Tirmidzi no. 3391 dan Abu Dawud no. 5068',
    repeat: 1,
  },
  { ...SAYYIDUL_ISTIGHFAR, groups: ['pagi', 'petang'] },
  { ...RADHITU, groups: ['pagi', 'petang'] },
  { ...BISMILLAH_LA_YADHURRU, groups: ['pagi', 'petang'] },
  { ...HASBIYALLAH, groups: ['pagi', 'petang'] },
  {
    slug: 'audzu-bikalimatillah',
    groups: ['petang'],
    title: 'Berlindung dengan kalimat Allah',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    latin: "A'ūżu bikalimātillāhit-tāmmāti min syarri mā khalaq.",
    translation:
      'Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk yang Dia ciptakan.',
    reference: 'HR. Muslim no. 2709',
    repeat: 3,
  },
  {
    slug: 'tahlil',
    groups: ['pagi'],
    title: 'Tahlil',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    latin:
      "Lā ilāha illallāhu waḥdahū lā syarīka lah, lahul-mulku wa lahul-ḥamd, wa huwa 'alā kulli syai'in qadīr.",
    translation:
      'Tidak ada tuhan selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan milik-Nya pujian, dan Dia Mahakuasa atas segala sesuatu.',
    reference: 'HR. Al-Bukhari no. 3293 dan Muslim no. 2691',
    note: 'Keutamaan dalam hadis ini untuk yang membacanya 100 kali dalam sehari.',
    repeat: 100,
  },
  { ...SUBHANALLAH_WABIHAMDIHI, groups: ['pagi', 'petang'] },

  // ---------------------------------------------------------------- Sebelum tidur
  {
    ...AYAT_KURSI,
    slug: 'ayat-kursi',
    groups: ['tidur'],
    reference: 'QS. Al-Baqarah: 255; HR. Al-Bukhari no. 2311',
    repeat: 1,
  },
  {
    ...IKHLAS,
    slug: 'al-ikhlas',
    groups: ['tidur'],
    reference: QULS_TIDUR,
    note: QULS_TIDUR_NOTE,
    repeat: 3,
  },
  {
    ...FALAQ,
    slug: 'al-falaq',
    groups: ['tidur'],
    reference: QULS_TIDUR,
    note: QULS_TIDUR_NOTE,
    repeat: 3,
  },
  {
    ...NAS,
    slug: 'an-nas',
    groups: ['tidur'],
    reference: QULS_TIDUR,
    note: QULS_TIDUR_NOTE,
    repeat: 3,
  },
  {
    slug: 'akhir-al-baqarah',
    groups: ['tidur'],
    title: 'Dua ayat terakhir Al-Baqarah',
    quran: { surah: 2, from: 285, to: 286 },
    arabic:
      'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ۝ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    latin:
      "Āmanar-rasūlu bimā unzila ilaihi mir rabbihī wal-mu'minūn, kullun āmana billāhi wa malā'ikatihī wa kutubihī wa rusulih, lā nufarriqu baina aḥadim mir rusulih, wa qālū sami'nā wa aṭa'nā gufrānaka rabbanā wa ilaikal-maṣīr. Lā yukallifullāhu nafsan illā wus'ahā, lahā mā kasabat wa 'alaihā maktasabat, rabbanā lā tu'ākhiżnā in nasīnā au akhṭa'nā, rabbanā wa lā taḥmil 'alainā iṣran kamā ḥamaltahū 'alal-lażīna min qablinā, rabbanā wa lā tuḥammilnā mā lā ṭāqata lanā bih, wa'fu 'annā, wagfir lanā, warḥamnā, anta maulānā fanṣurnā 'alal-qaumil-kāfirīn.",
    translation:
      'Rasul beriman kepada apa yang diturunkan kepadanya dari Tuhannya, demikian pula orang-orang mukmin. Semuanya beriman kepada Allah, malaikat-malaikat-Nya, kitab-kitab-Nya, dan rasul-rasul-Nya. (Mereka berkata,) "Kami tidak membeda-bedakan seorang pun dari rasul-rasul-Nya." Dan mereka berkata, "Kami dengar dan kami taat. Ampunilah kami, ya Tuhan kami, dan kepada-Mu tempat kembali." Allah tidak membebani seseorang melainkan sesuai kesanggupannya. Ia mendapat pahala dari kebajikan yang diusahakannya dan mendapat siksa dari kejahatan yang dikerjakannya. "Ya Tuhan kami, janganlah Engkau hukum kami jika kami lupa atau kami salah. Ya Tuhan kami, janganlah Engkau bebani kami dengan beban berat sebagaimana Engkau bebankan kepada orang-orang sebelum kami. Ya Tuhan kami, janganlah Engkau pikulkan kepada kami apa yang tidak sanggup kami memikulnya. Maafkanlah kami, ampunilah kami, dan rahmatilah kami. Engkaulah pelindung kami, maka tolonglah kami menghadapi orang-orang kafir."',
    reference: 'QS. Al-Baqarah: 285–286; HR. Al-Bukhari no. 5009 dan Muslim no. 808',
    repeat: 1,
  },
  {
    slug: 'tasbih-33',
    groups: ['tidur'],
    title: 'Tasbih',
    arabic: 'سُبْحَانَ اللَّهِ',
    latin: 'Subḥānallāh.',
    translation: 'Mahasuci Allah.',
    reference: 'HR. Al-Bukhari no. 3705 dan Muslim no. 2727',
    repeat: 33,
  },
  {
    slug: 'tahmid-33',
    groups: ['tidur'],
    title: 'Tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ',
    latin: 'Al-ḥamdu lillāh.',
    translation: 'Segala puji bagi Allah.',
    reference: 'HR. Al-Bukhari no. 3705 dan Muslim no. 2727',
    repeat: 33,
  },
  {
    slug: 'takbir-34',
    groups: ['tidur'],
    title: 'Takbir',
    arabic: 'اللَّهُ أَكْبَرُ',
    latin: 'Allāhu akbar.',
    translation: 'Allah Mahabesar.',
    reference: 'HR. Al-Bukhari no. 3705 dan Muslim no. 2727',
    repeat: 34,
  },
  {
    slug: 'bismika-allahumma',
    groups: ['tidur'],
    title: 'Doa sebelum tidur',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    latin: 'Bismikallāhumma amūtu wa aḥyā.',
    translation: 'Dengan nama-Mu, ya Allah, aku mati dan aku hidup.',
    reference: 'HR. Al-Bukhari no. 6324',
    repeat: 1,
  },
];
