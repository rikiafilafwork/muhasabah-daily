# Catatan Perubahan

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Belum dirilis]

### Ditambahkan

- **Keuangan:** catat pemasukan dan pengeluaran dalam Rupiah dengan tanggal, kategori, dan catatan. Ringkasan per bulan menampilkan total pemasukan, pengeluaran, selisih, perbandingan dengan bulan lalu, dan rincian per kategori; grafik 12 bulan terakhir; kartu "Keuangan bulan ini" di Beranda. Kategori bawaan (mis. Gaji, Makan, Tagihan, Sedekah & infak, Zakat) dibuat otomatis dan bisa ditambah, diubah, atau diarsipkan. Data contoh `seed:demo` menyertakan transaksi tiga bulan.

## [1.2.0] — 2026-11-15

### Ditambahkan

- **Pengingat lewat notifikasi (Web Push):** notifikasi saat waktu sholat masuk (pilih per sholat di Pengaturan) dan sebelum agenda dimulai (saat mulai sampai 1 hari sebelumnya, diatur per agenda). Kunci VAPID dibuat otomatis di mode Docker; tombol notifikasi tes; perangkat berhenti menerima notifikasi saat keluar akun. Butuh HTTPS atau localhost.
- **Mode offline (baca saja):** aplikasi yang pernah dibuka bisa dibuka lagi tanpa koneksi dengan data terakhir, tanpa login ulang, dengan banner "Sedang offline". Perubahan ditolak dengan pesan jelas sampai tersambung; data tersimpan dihapus saat keluar akun.
- **Landing page** di `/welcome` untuk pengunjung yang belum masuk: hero dengan tangkapan layar, daftar fitur, sorotan jadwal/habit/dzikir, penjelasan privasi, dan perintah instalasi Docker. Membuka `/` tanpa sesi kini diarahkan ke landing page; pengguna yang sudah masuk tetap ke Beranda.

### Diubah

- Server yang sedang mulai ulang (5xx) atau koneksi putus saat memperbarui sesi tidak lagi membuat pengguna keluar.
- **Prisma 7:** generator `prisma-client` (format CommonJS) dengan klien yang dibuat ke `apps/api/src/generated/prisma`, koneksi lewat driver adapter `@prisma/adapter-pg`, dan URL basis data dipindah dari skema ke `apps/api/prisma.config.ts`. Sekaligus menghilangkan kerentanan `deepmerge-ts` yang dibawa Prisma 6.

## [1.1.0] — 2026-11-14

### Diubah

- **Tampilan baru bergaya web personal:** sidebar admin diganti header dengan navigasi pil (desktop) dan tab bar bawah + lembar "Semua fitur" (mobile). Palet krem hangat dengan aksen zamrud dan emas, judul serif Fraunces, kartu dan tombol lebih membulat; font Inter dan Fraunces dibundel sehingga tetap jalan offline.
- **Beranda:** sapaan besar, tanggal Masehi dan Hijriah (Umm al-Qura, bisa selisih sehari dengan penetapan resmi), pintasan cepat, dan kartu hitung mundur sholat yang diperbarui.
- **Halaman masuk/daftar:** tata letak terbelah dengan panel sambutan di layar lebar.
- **Dialog** tampil sebagai lembar dari bawah di layar kecil.
- **Tangkapan layar README** diperbarui ke tampilan baru.
- **Select** diganti listbox kustom yang mengikuti tema (termasuk mode gelap), dengan kolom cari untuk daftar panjang dan dukungan keyboard.

### Ditambahkan

- **Tombol tema di header** (Terang → Gelap → Ikuti sistem), juga di halaman masuk. Pilihan disimpan ke profil sehingga ikut di perangkat lain.

### Dihapus

- Halaman "segera hadir" yang tidak lagi dipakai.

## [1.0.0] — 2026-11-14

Rilis pertama yang lengkap: fase 5 dan 6 dari [peta fase](ARCHITECTURE.md#16-pemetaan-ke-fase-pengerjaan).

### Ditambahkan (fase 6)

- **Satu perintah:** `docker compose up -d` menjalankan semuanya. Container API membuat secret JWT bila kosong (disimpan di volume), menjalankan migrasi, seed dasar, dan impor Al-Qur'an otomatis; web produksi disajikan nginx yang meneruskan `/api`.
- **PWA:** manifest, ikon, dan service worker; aplikasi bisa dipasang dan kerangkanya tersedia offline.
- **Panduan self-hosting** (`docs/self-hosting.md`): konfigurasi, akses dari ponsel, HTTPS lewat reverse proxy, pencadangan, pembaruan.
- Template issue (bug, usulan, koreksi konten keagamaan) dan PR, `SECURITY.md`, `CODE_OF_CONDUCT.md`, Dependabot, dan job CI yang membangun image Docker.
- Klien AlAdhan mencoba ulang sekali saat galat jaringan atau 5xx.

### Diubah (fase 6)

- Cookie refresh memakai `COOKIE_SECURE=auto` (Secure hanya lewat HTTPS) dan `TRUST_PROXY` mempercayai jaringan lokal/Docker, agar login berfungsi lewat `http://IP-lokal`.
- Port PostgreSQL dan Redis hanya dibuka ke `127.0.0.1`; port API tidak lagi dibuka ke host.

### Ditambahkan (fase 5)

- **Al-Qur'an:** impor 114 surah dan 6.236 ayat dari AlQuran Cloud (teks Utsmani, terjemah Kemenag, transliterasi) lewat antrean BullMQ `seed` (`seed:quran`, atau `--direct`), dengan URL audio murottal; endpoint surah dan ayat.
- **Hafidz:** rencana hafalan dengan tahapan tikrar otomatis yang bisa disesuaikan, pemutar audio per ayat (state machine) dengan penanganan audio gagal, dan progres per tahap.
- **Jurnal:** jurnal harian dengan simpan otomatis dan riwayat 30 hari; **AI Polish** opsional lewat antrean `ai` dengan penyedia Anthropic (Claude), batas harian per pengguna, penanganan penolakan model, dan teks asli yang tidak pernah ditimpa.
- **Catatan Kajian:** editor TipTap dengan rujukan ayat (teks Arab dan terjemah), tag, pencarian, dan paginasi.
- Data contoh, audit aksesibilitas, cek tata letak ponsel, dan tangkapan layar mencakup modul baru.

### Diubah (fase 5)

- Batas body JSON API naik dari 100 kB ke 300 kB untuk dokumen catatan kajian.
- Error domain 5xx (mis. `AI_DISABLED`, `PRAYER_TIMES_UNAVAILABLE`) tidak lagi dicatat sebagai galat dengan stack trace.

## [0.1.0] — 2026-11-13

Rilis pertama: fase 0–4 dari [peta fase](ARCHITECTURE.md#16-pemetaan-ke-fase-pengerjaan).

### Ditambahkan

- **Fondasi:** monorepo pnpm (`apps/api` NestJS 11 + Prisma 6, `apps/web` Vue 3 + Vite, `packages/shared` skema Zod), Docker Compose, CI GitHub Actions.
- **Akun:** daftar, masuk, keluar; Argon2id; access token 15 menit; refresh token di cookie httpOnly dengan rotasi dan pencabutan keluarga saat dipakai ulang; hapus akun beserta seluruh data.
- **Profil:** lokasi (pilih kota, GPS, atau koordinat), zona waktu, tema terang/gelap/sistem.
- **Waktu sholat:** AlAdhan metode Kemenag RI, cache Redis sampai akhir hari, data terakhir sebagai cadangan, hitung mundur di klien.
- **Jadwal:** agenda dengan tampilan hari/minggu/bulan, agenda sepanjang hari dan lintas hari, waktu sholat di tampilan hari.
- **To-Do:** proyek berwarna, prioritas, tenggat, fokus hari ini, tambah cepat, paginasi kursor.
- **Habit:** library 46 template dengan rujukan, grid mingguan, insight (check-in, streak terbaik dan berjalan, konsistensi, proyeksi minggu depan).
- **Goals:** target dengan satuan dan tenggat, habit tertaut berbobot, progres manual dan dari habit ditampilkan terpisah.
- **Fokus:** timer berbasis selisih jam yang tahan muat ulang, riwayat sesi, grafik 7 hari, pengingat waktu sholat.
- **Dzikir:** pagi, petang, sebelum tidur; ayat dari AlQuran Cloud; penghitung dengan sinkron debounce dan antrean offline.
- **Data contoh:** `seed:demo` membuat akun demo dengan riwayat empat minggu.
- **Kualitas:** test unit, integrasi (termasuk kepemilikan data per modul), E2E Playwright, audit aksesibilitas axe (WCAG 2.1 AA) di semua halaman dan dialog dalam mode terang dan gelap, cek tata letak 390 px.

### Catatan

- Teks dzikir dari hadis dan rujukan library habit perlu ditinjau pengelola; lihat [DATA_SOURCES.md](DATA_SOURCES.md).

[1.2.0]: ../../releases/tag/v1.2.0
[1.1.0]: ../../releases/tag/v1.1.0
[1.0.0]: ../../releases/tag/v1.0.0
[0.1.0]: ../../releases/tag/v0.1.0
