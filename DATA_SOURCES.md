# Sumber Data Pihak Ketiga

Repo ini tidak menyimpan konten pihak ketiga. Data diambil saat aplikasi berjalan atau diunduh oleh seeder ke basis data lokalmu, dan tidak di-commit ke Git.

| Data                                         | Sumber                                                                                                                                                                              | Cara dipakai                                                                                                      | Lisensi / ketentuan                                                                                                                    | Status           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Waktu sholat                                 | [AlAdhan Prayer Times API](https://aladhan.com/prayer-times-api), metode 20 (Kementerian Agama RI)                                                                                  | Diambil API saat dibutuhkan, di-cache di Redis sampai akhir hari                                                  | Layanan gratis publik; ikuti ketentuan penggunaan AlAdhan                                                                              | Dipakai (fase 1) |
| Teks Arab, terjemah, transliterasi Al-Qur'an | [AlQuran Cloud API](https://alquran.cloud/api): `quran-uthmani` (rasm Utsmani), `id.indonesian` (terjemah Kementerian Agama RI), `en.transliteration` (transliterasi ejaan Inggris) | `seed:quran` mengunduh ketiga edisi ke tabel `surahs`/`ayahs` di basis data lokal; tidak disimpan di repo         | Ikuti ketentuan AlQuran Cloud; hak terjemah pada Kemenag RI — konfirmasi izin redistribusi bila aplikasi disebarkan dengan data terisi | Dipakai (fase 5) |
| Audio murottal                               | Mishary Rashid Alafasy, `https://cdn.islamic.network/quran/audio/128/ar.alafasy/{nomor-ayat}.mp3` (CDN yang dirujuk AlQuran Cloud); bisa diganti lewat `QURAN_AUDIO_BASE_URL`       | Di-stream langsung dari sumber oleh pemutar Hafidz; hanya URL yang disimpan                                       | Ikuti ketentuan penyedia CDN                                                                                                           | Dipakai (fase 5) |
| Teks dzikir pagi, petang, dan tidur          | Ayat: AlQuran Cloud (`quran-uthmani`, `id.indonesian`). Dzikir dari hadis: disusun dari sumber umum (Hisnul Muslim dan kitab hadis yang dirujuk)                                    | Seeder `dhikr_items`; ayat diunduh saat seed, teks hadis bawaan di `dhikr-content.ts`; rujukan selalu ditampilkan | Terjemah Kemenag via AlQuran Cloud; teks hadis **perlu ditinjau**                                                                      | Dipakai (fase 3) |

## Penyedia AI (opsional)

AI Polish jurnal mengirim teks jurnal ke penyedia yang dikonfigurasi (`AI_PROVIDER=anthropic` → Anthropic API) **hanya** saat pengguna menekan tombol Poles, memakai kunci API milik pengelola server. Kebijakan data penyedia berlaku untuk teks yang dikirim; antarmuka menampilkan catatan privasi ini.

## Data uji Al-Qur'an

`seed:quran --fixture` (dipakai test dan E2E) menyusun Al-Ikhlas, Al-Falaq, dan An-Nas dari teks yang sudah ada di konten dzikir; terjemah per ayatnya hanya penanda "(Data uji)". Jangan dipakai sebagai data nyata.

## Status tinjauan konten dzikir

Ditulis tanpa tinjauan pengelola, jadi **wajib diperiksa sebelum rilis**: teks Arab, latin, terjemah, jumlah bacaan, dan nomor hadis untuk dzikir berikut (`apps/api/prisma/seed/dhikr-content.ts`):

- Sayyidul Istighfar (HR. Al-Bukhari no. 6306)
- Ashbahna / Amsaina wa ashbahal mulku lillah (HR. Muslim no. 2723)
- Allahumma bika ashbahna / amsaina (HR. At-Tirmidzi no. 3391, Abu Dawud no. 5068)
- Bismillahilladzi la yadhurru (HR. Abu Dawud no. 5088, At-Tirmidzi no. 3388)
- Radhitu billahi rabba (HR. Abu Dawud no. 5072, At-Tirmidzi no. 3389)
- Hasbiyallah, 7 kali (HR. Abu Dawud no. 5081)
- A'udzu bikalimatillahit tammat (HR. Muslim no. 2709)
- Tahlil 100 kali (HR. Al-Bukhari no. 3293, Muslim no. 2691)
- Subhanallah wa bihamdihi 100 kali (HR. Muslim no. 2692)
- Tasbih 33, tahmid 33, takbir 34 sebelum tidur (HR. Al-Bukhari no. 3705, Muslim no. 2727)
- Bismika Allahumma amutu wa ahya (HR. Al-Bukhari no. 6324)
- Rujukan pagi/petang Ayat Kursi (An-Nasa'i, 'Amal al-Yaum wa al-Lailah) dan tidur (HR. Al-Bukhari no. 2311)
- Tiga Qul pagi/petang (HR. Abu Dawud no. 5082, At-Tirmidzi no. 3575) dan tidur (HR. Al-Bukhari no. 5017)

Teks lima bagian ayat (Ayat Kursi, Al-Ikhlas, Al-Falaq, An-Nas, Al-Baqarah 285–286) diambil dari AlQuran Cloud saat seed; teks bawaan cocok dengannya per 12 November 2026 (perbandingan tanpa harakat). Latin dan terjemah dzikir hadis ditulis ulang dan juga perlu ditinjau.

## Rujukan pada library habit

Template habit ibadah (`apps/api/prisma/seed/habit-templates.ts`) menyertakan rujukan dalil bila sumbernya jelas, mis. Sholat Dhuha (HR. Muslim no. 720), Istighfar 100 kali (HR. Muslim no. 2702), Puasa Senin–Kamis (HR. Tirmidzi no. 747). Nomor hadis mengikuti penomoran yang umum dipakai (Fuad Abdul Baqi untuk Shahih Muslim). Rujukan ditampilkan bersama nama habit. Mohon verifikasi oleh pengelola sebelum rilis, dan kirim koreksi lewat pull request.

Aturan:

- Atribusi sumber selalu ditampilkan di antarmuka di dekat kontennya.
- File hasil unduhan seeder disimpan di `apps/api/prisma/seed/data/` yang di-`.gitignore`.
- Sebelum menambah sumber baru, tambahkan barisnya di sini lengkap dengan lisensinya.
