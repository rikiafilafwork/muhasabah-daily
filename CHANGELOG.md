# Catatan Perubahan

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

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

[0.1.0]: ../../releases/tag/v0.1.0
