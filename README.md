# Muhasabah Daily

Aplikasi produktivitas Muslim open source yang dijalankan di komputermu sendiri. Jadwal, to-do, habit, goals, fokus, dzikir, hafalan, jurnal, dan catatan kajian disusun di sekitar waktu sholat.

> Status: **fase 3** — autentikasi, profil, waktu sholat dengan hitung mundur, jadwal (hari/minggu/bulan, disisipi waktu sholat), to-do dengan proyek dan fokus hari ini, habit dengan library 46 template dan insight, serta goals yang tertaut ke habit, timer fokus yang tahan muat ulang dengan riwayat mingguan, serta dzikir pagi/petang/tidur dengan penghitung yang tetap berjalan saat offline. Modul lain menyusul sesuai [peta fase](ARCHITECTURE.md#16-pemetaan-ke-fase-pengerjaan).

## Stack

Vue 3 + Vite + Pinia + Tailwind · NestJS 11 + Prisma 6 · PostgreSQL 17 · Redis 7 · TypeScript di seluruh stack, skema validasi bersama dengan Zod. Detail di [ARCHITECTURE.md](ARCHITECTURE.md).

## Menjalankan

Butuh Node 22+ (disarankan 24), pnpm 11, dan Docker.

```bash
cp .env.example .env
# isi JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET, mis. dengan: openssl rand -hex 32

docker compose up -d db redis
pnpm install
pnpm --filter api db:deploy   # migrasi basis data
pnpm --filter api seed        # library habit dan dzikir (aman diulang; tambah -- --offline tanpa internet)
pnpm dev                      # web http://localhost:5173, API http://localhost:3000
```

Dokumentasi API (Swagger): http://localhost:3000/docs

Semua di container sekaligus:

```bash
docker compose --profile full up --build
```

## Skrip

| Perintah                                     | Fungsi                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`                                   | Jalankan shared (watch), API, dan web                                               |
| `pnpm lint` / `pnpm format`                  | ESLint / Prettier                                                                   |
| `pnpm typecheck`                             | Cek tipe semua paket                                                                |
| `pnpm test`                                  | Test unit dan integrasi (butuh `db` dan `redis` berjalan)                           |
| `pnpm test:e2e`                              | E2E Playwright (pertama kali: `pnpm --filter web exec playwright install chromium`) |
| `pnpm build`                                 | Build produksi API dan web                                                          |
| `pnpm --filter api db:migrate --name <nama>` | Buat migrasi baru                                                                   |

## Struktur

```
apps/api         NestJS: auth, users, prayer-times, events, tasks, habits, goals, focus, dhikr, health
apps/web         Vue 3 SPA
packages/shared  Tipe, kode error, dan skema zod yang dipakai web dan api
```

## Data pihak ketiga

Waktu sholat diambil dari [AlAdhan](https://aladhan.com) (metode Kemenag RI). Teks Al-Qur'an, terjemah, dan audio tidak disimpan di repo. Lihat [DATA_SOURCES.md](DATA_SOURCES.md).

## Kontribusi

Lihat [CONTRIBUTING.md](CONTRIBUTING.md).

## Lisensi

[MIT](LICENSE)
