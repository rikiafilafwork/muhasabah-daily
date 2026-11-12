# Sumber Data Pihak Ketiga

Repo ini tidak menyimpan konten pihak ketiga. Data diambil saat aplikasi berjalan atau diunduh oleh seeder ke basis data lokalmu, dan tidak di-commit ke Git.

| Data                                 | Sumber                                                                                             | Cara dipakai                                                     | Lisensi / ketentuan                                       | Status           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- | ---------------- |
| Waktu sholat                         | [AlAdhan Prayer Times API](https://aladhan.com/prayer-times-api), metode 20 (Kementerian Agama RI) | Diambil API saat dibutuhkan, di-cache di Redis sampai akhir hari | Layanan gratis publik; ikuti ketentuan penggunaan AlAdhan | Dipakai (fase 1) |
| Teks Arab, latin, terjemah Al-Qur'an | [AlQuran Cloud API](https://alquran.cloud/api) dan/atau data terjemah Kemenag RI                   | Diunduh oleh `seed:quran` ke tabel `Surah`/`Ayah`                | Perlu dikonfirmasi per edisi terjemah sebelum fase 5      | Rencana (fase 5) |
| Audio murottal                       | Sumber audio publik (mis. CDN yang dirujuk AlQuran Cloud)                                          | Di-stream langsung dari sumber; hanya URL yang disimpan          | Perlu dikonfirmasi sebelum fase 5                         | Rencana (fase 5) |
| Teks dzikir pagi, petang, dan tidur  | Kumpulan dzikir dengan rujukan hadis                                                               | Seeder `dhikr_items`; rujukan selalu ditampilkan bersama teks    | Perlu dikonfirmasi sebelum fase 3                         | Rencana (fase 3) |

## Rujukan pada library habit

Template habit ibadah (`apps/api/prisma/seed/habit-templates.ts`) menyertakan rujukan dalil bila sumbernya jelas, mis. Sholat Dhuha (HR. Muslim no. 720), Istighfar 100 kali (HR. Muslim no. 2702), Puasa Senin–Kamis (HR. Tirmidzi no. 747). Nomor hadis mengikuti penomoran yang umum dipakai (Fuad Abdul Baqi untuk Shahih Muslim). Rujukan ditampilkan bersama nama habit. Mohon verifikasi oleh pengelola sebelum rilis, dan kirim koreksi lewat pull request.

Aturan:

- Atribusi sumber selalu ditampilkan di antarmuka di dekat kontennya.
- File hasil unduhan seeder disimpan di `apps/api/prisma/seed/data/` yang di-`.gitignore`.
- Sebelum menambah sumber baru, tambahkan barisnya di sini lengkap dengan lisensinya.
